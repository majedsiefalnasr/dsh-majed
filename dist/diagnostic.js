/**
 * Credential-safe rendering of arbitrary exception text for RPC responses and logs.
 *
 * Authored for this plugin (not ported from the reference). The text is untrusted: it can come from a
 * proxy, an upstream server or a library, in any format. The sanitizer therefore (1) bounds the input
 * before any expensive work, (2) removes every secret the host KNOWS (stored/draft password in raw,
 * URL-encoded, JSON-escaped and base64 forms, plus `user:password` and its Basic encoding), (3) removes
 * well-known secret SHAPES structurally or by linear scanners, and (4) falls back to a generic message
 * when the text is too complex to process within a fixed work budget.
 *
 * Honest limits: arbitrary unknown secrets in free text cannot be recognised in general. Only the shapes
 * listed above are removed; a bare secret with no key, scheme or userinfo around it is not detectable.
 * Every pass is linear in the (bounded) input, so there is no quadratic backtracking.
 */
/** Input is cut to this many characters before any other work. */
export const DIAGNOSTIC_INPUT_LIMIT = 16_384;
/** Rendered diagnostics never exceed this many characters. */
export const DIAGNOSTIC_OUTPUT_LIMIT = 1024;
/** Shown instead of the text when it cannot be sanitized within the work budget. */
export const DIAGNOSTIC_WITHHELD = 'diagnostic withheld: the error text was too large or complex to sanitize safely';
/** Internal redaction marker (private-use code point); mapped to `[redacted]` once at the end. */
const MARK = '\uE000';
const OUT_MARK = '[redacted]';
const MAX_JSON_DEPTH = 32;
const MAX_SCRUB_DEPTH = 3;
/** Work budget per sanitize call, in characters examined by the JSON parser (8x the input limit). */
const JSON_BUDGET = DIAGNOSTIC_INPUT_LIMIT * 8;
/** Sensitive key words. Text keys must END a token with one of these; JSON keys must END with one. */
const WORDS = String.raw `pass(?:word|wd|phrase)|pwd|tokens?|secrets?|(?:api|access|private|client|secret|signing)[_-]?key|credentials?|cookies?|authorization`;
const JSON_KEY = new RegExp(`(?:${WORDS}|auth)$`, 'i');
const TEXT_KEY = new RegExp(`(?:${WORDS})(?![\\w.-])`, 'gi');
const URL_USERINFO = /((?:\b[a-z][a-z0-9+.-]{0,31}:)?)\/\/[^\s/?#"'<>\\]{0,512}@/gi;
const BEARER = /\b(Bearer|Basic|Negotiate|NTLM)[ \t]{1,8}([A-Za-z0-9._~+/=-]+)/gi;
const DIGEST = /\bDigest\s+\w+=[^\r\n]*/gi;
const STOP_WORDS = new Set(['authentication', 'authorization', 'credentials', 'credential', 'scheme', 'realm', 'challenge', 'header', 'required', 'failed', 'missing', 'invalid', 'token', 'auth']);
const isQuote = (c) => c === '"' || c === "'";
/** Variants of `value` as it might appear in an error: raw, URI, form, JSON-escaped and base64 encodings. */
function secretForms(value) {
    const asciiJson = JSON.stringify(value).slice(1, -1).replace(/[\u0080-\uffff]/g, c => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
    const percent = encodeURIComponent(value);
    const b64 = (text) => {
        const buffer = Buffer.from(text, 'utf8');
        const plain = buffer.toString('base64');
        const url = buffer.toString('base64url');
        return [plain, plain.replace(/=+$/, ''), url];
    };
    return [value, percent, percent.toLowerCase(), percent.replace(/%20/g, '+'), (() => { try {
            return encodeURI(value);
        }
        catch {
            return value;
        } })(),
        JSON.stringify(value).slice(1, -1), asciiJson, ...b64(value), ...b64(`:${value}`)];
}
/**
 * Every spelling of the known secrets to remove, longest first. A username that is known adds the
 * combined `user:password` text/URI forms and its Basic-credential base64 encodings.
 */
export function knownSecretForms(passwords, usernames = []) {
    const names = usernames.filter((name) => typeof name === 'string' && name !== '');
    const forms = new Set();
    for (const password of passwords) {
        if (typeof password !== 'string' || password === '')
            continue;
        for (const form of secretForms(password))
            forms.add(form);
        for (const name of names) {
            forms.add(`${name}:${password}`);
            forms.add(`${encodeURIComponent(name)}:${encodeURIComponent(password)}`);
            const buffer = Buffer.from(`${name}:${password}`, 'utf8');
            const plain = buffer.toString('base64');
            forms.add(plain);
            forms.add(plain.replace(/=+$/, ''));
            forms.add(buffer.toString('base64url'));
        }
    }
    forms.delete('');
    return [...forms].sort((a, b) => b.length - a.length);
}
class Complexity extends Error {
}
/** Minimal bounded JSON parser that records the edits needed to redact sensitive members in place. */
class JsonScan {
    text;
    known;
    budget;
    depth;
    edits = [];
    constructor(text, known, budget, depth) {
        this.text = text;
        this.known = known;
        this.budget = budget;
        this.depth = depth;
    }
    charge(count) {
        this.budget.left -= count;
        if (this.budget.left < 0)
            throw new Complexity();
    }
    skipSpace(i) {
        const t = this.text;
        let j = i;
        while (j < t.length && (t[j] === ' ' || t[j] === '\t' || t[j] === '\n' || t[j] === '\r'))
            j += 1;
        this.charge(j - i + 1);
        return j;
    }
    /** End index (exclusive) of the string literal starting at `i`, or -1 when unterminated. */
    stringEnd(i) {
        const t = this.text;
        let j = i + 1;
        while (j < t.length) {
            const c = t[j];
            if (c === '\\')
                j += 2;
            else if (c === '"') {
                this.charge(j - i + 1);
                return j + 1;
            }
            else if (c === '\n')
                break;
            else
                j += 1;
        }
        this.charge(Math.min(j, t.length) - i + 1);
        return -1;
    }
    decode(literal) {
        if (!literal.includes('\\'))
            return literal.slice(1, -1);
        try {
            return JSON.parse(literal);
        }
        catch {
            return undefined;
        }
    }
    /** Parse one value at `i`; returns its exclusive end, or -1 when this is not valid JSON. */
    value(i, level) {
        if (level > MAX_JSON_DEPTH)
            return -1;
        const t = this.text;
        const c = t[i];
        if (c === '"') {
            const end = this.stringEnd(i);
            if (end < 0)
                return -1;
            if (end - i > 7) {
                const literal = t.slice(i, end);
                const content = this.decode(literal);
                if (content !== undefined) {
                    const clean = scrub(content, this.known, this.budget, this.depth + 1);
                    if (clean !== content)
                        this.edits.push({ start: i, end, text: JSON.stringify(clean) });
                }
            }
            return end;
        }
        if (c === '{')
            return this.object(i, level);
        if (c === '[')
            return this.array(i, level);
        const match = /^(?:-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null)/.exec(t.slice(i, i + 40));
        if (match === null)
            return -1;
        this.charge(match[0].length);
        return i + match[0].length;
    }
    array(i, level) {
        let j = this.skipSpace(i + 1);
        if (this.text[j] === ']')
            return j + 1;
        for (;;) {
            j = this.value(j, level + 1);
            if (j < 0)
                return -1;
            j = this.skipSpace(j);
            if (this.text[j] === ',') {
                j = this.skipSpace(j + 1);
                continue;
            }
            return this.text[j] === ']' ? j + 1 : -1;
        }
    }
    object(i, level) {
        let j = this.skipSpace(i + 1);
        if (this.text[j] === '}')
            return j + 1;
        for (;;) {
            if (this.text[j] !== '"')
                return -1;
            const keyEnd = this.stringEnd(j);
            if (keyEnd < 0)
                return -1;
            const key = this.decode(this.text.slice(j, keyEnd));
            j = this.skipSpace(keyEnd);
            if (this.text[j] !== ':')
                return -1;
            j = this.skipSpace(j + 1);
            const mark = this.edits.length;
            const end = this.value(j, level + 1);
            if (end < 0)
                return -1;
            if (key !== undefined && JSON_KEY.test(key)) {
                this.edits.length = mark; // the whole value goes; edits inside it are moot
                this.edits.push({ start: j, end, text: `"${MARK}"` });
            }
            j = this.skipSpace(end);
            if (this.text[j] === ',') {
                j = this.skipSpace(j + 1);
                continue;
            }
            return this.text[j] === '}' ? j + 1 : -1;
        }
    }
}
/** Structural pass: redact sensitive members of every parsable embedded JSON object/array. */
function redactJson(text, known, budget, depth) {
    if (!/[{[]/.test(text))
        return text;
    const edits = [];
    const starts = /[{[]/g;
    let from = 0;
    for (;;) {
        starts.lastIndex = from;
        const found = starts.exec(text);
        if (found === null)
            break;
        const scan = new JsonScan(text, known, budget, depth);
        const end = scan.value(found.index, 0);
        if (end > 0) {
            edits.push(...scan.edits);
            from = end;
        }
        else
            from = found.index + 1;
    }
    if (edits.length === 0)
        return text;
    let out = '', last = 0;
    for (const edit of edits.sort((a, b) => a.start - b.start)) {
        if (edit.start < last)
            continue;
        out += text.slice(last, edit.start) + edit.text;
        last = edit.end;
    }
    return out + text.slice(last);
}
/** End (exclusive) of the quoted value whose opening quote char sits at `v`; `text.length` when unterminated. */
function quotedEnd(text, v, escaped) {
    const q = text[escaped ? v + 1 : v];
    if (escaped) {
        const close = text.indexOf(`\\${q}`, v + 2);
        return close < 0 ? { end: text.length, closed: false } : { end: close + 2, closed: true };
    }
    let j = v + 1;
    while (j < text.length) {
        if (text[j] === '\\')
            j += 2;
        else if (text[j] === q)
            return { end: j + 1, closed: true };
        else
            j += 1;
    }
    return { end: text.length, closed: false };
}
/** End (exclusive) of the bracketed value starting at `v` (string-aware); `text.length` when unbalanced. */
function bracketEnd(text, v) {
    let depth = 0;
    for (let j = v; j < text.length; j += 1) {
        const c = text[j];
        if (c === '"' || c === "'") {
            j = quotedEnd(text, j, false).end - 1;
            continue;
        }
        if (c === '{' || c === '[')
            depth += 1;
        else if ((c === '}' || c === ']') && (depth -= 1) <= 0)
            return j + 1;
    }
    return text.length;
}
function skipSpace(text, i) {
    let j = i;
    while (j < text.length && j - i < 16 && (text[j] === ' ' || text[j] === '\t' || text[j] === '\n' || text[j] === '\r'))
        j += 1;
    return j;
}
/** Linear scanner: `key: value` / `key=value` pairs with a sensitive key, in any quoting, nesting or truncation. */
function redactPairs(text) {
    TEXT_KEY.lastIndex = 0;
    let out = '', last = 0;
    for (let m = TEXT_KEY.exec(text); m !== null; m = TEXT_KEY.exec(text)) {
        let i = m.index + m[0].length;
        if (text[i] === '\\' && isQuote(text[i + 1]))
            i += 2;
        else if (isQuote(text[i]))
            i += 1;
        i = skipSpace(text, i);
        if (text[i] !== ':' && text[i] !== '=')
            continue;
        const v = skipSpace(text, i + 1);
        const c = text[v];
        if (c === undefined)
            continue;
        const isAuth = /^authorization$/i.test(m[0]);
        const lineValue = /^cookies?$/i.test(m[0]);
        let end, open = '', close = '';
        if (c === '\\' && isQuote(text[v + 1])) {
            const q = quotedEnd(text, v, true);
            end = q.end;
            open = `\\${text[v + 1]}`;
            close = q.closed ? open : '';
        }
        else if (isQuote(c)) {
            const q = quotedEnd(text, v, false);
            end = q.end;
            open = c;
            close = q.closed ? c : '';
        }
        else if (c === '[' || c === '{') {
            end = bracketEnd(text, v);
        }
        else if (lineValue || (isAuth && /^digest\b/i.test(text.slice(v, v + 8)))) {
            end = v;
            while (end < text.length && text[end] !== '\n' && text[end] !== '\r')
                end += 1;
        }
        else if (isAuth) {
            // `Scheme credentials` (Bearer/Basic/Token/Negotiate/...) or a bare credential; stop at the next separator.
            end = v;
            while (end < text.length && !/[\s,;|"'}\]]/.test(text[end]))
                end += 1;
            if (/^[A-Za-z]+$/.test(text.slice(v, end))) {
                let next = end;
                while (next < text.length && (text[next] === ' ' || text[next] === '\t') && next - end < 8)
                    next += 1;
                let stop = next;
                while (stop < text.length && !/[\s,;|"'}\]]/.test(text[stop]))
                    stop += 1;
                if (stop > next)
                    end = stop;
            }
        }
        else {
            end = v;
            while (end < text.length && !/[\s,;}\]"']/.test(text[end]))
                end += 1;
        }
        if (end === v)
            continue;
        out += text.slice(last, v) + open + MARK + close;
        last = end;
        TEXT_KEY.lastIndex = end;
    }
    return out + text.slice(last);
}
function redactSchemes(text) {
    return text
        .replace(DIGEST, `Digest ${MARK}`)
        .replace(BEARER, (whole, scheme, token) => {
        const strong = /[\d+/=._~-]/.test(token) || /.[A-Z]/.test(token);
        const capitalized = scheme[0] === scheme[0].toUpperCase();
        if (STOP_WORDS.has(token.toLowerCase()))
            return whole;
        if (token === MARK)
            return whole;
        return (capitalized && token.length >= 6) || (strong && token.length >= 8) ? `${scheme} ${MARK}` : whole;
    });
}
function scrub(input, known, budget, depth) {
    let text = input.replaceAll(MARK, '');
    for (const form of known)
        if (text.includes(form))
            text = text.split(form).join(MARK);
    if (depth < MAX_SCRUB_DEPTH)
        text = redactJson(text, known, budget, depth);
    text = text.replace(URL_USERINFO, (_whole, scheme) => `${scheme}//${MARK}@`);
    text = redactPairs(text);
    return redactSchemes(text);
}
/**
 * Sanitize arbitrary text for display.
 * @param raw - the untrusted text.
 * @param passwords - known passwords (stored, draft, caller supplied); every spelling is removed.
 * @param usernames - known usernames; adds the `user:password` forms and their Basic encodings.
 * @param limit - maximum output length.
 */
export function sanitizeDiagnostic(raw, passwords = [], usernames = [], limit = DIAGNOSTIC_OUTPUT_LIMIT) {
    const known = knownSecretForms(passwords, usernames);
    const longest = known.reduce((max, form) => Math.max(max, form.length), 0);
    const truncated = raw.length > DIAGNOSTIC_INPUT_LIMIT;
    let text;
    try {
        text = scrub(raw.slice(0, DIAGNOSTIC_INPUT_LIMIT), known, { left: JSON_BUDGET }, 0);
    }
    catch (error) {
        if (error instanceof Complexity)
            return DIAGNOSTIC_WITHHELD;
        throw error;
    }
    // A secret cut by the input bound could survive as a prefix at the tail; drop the tail it could occupy.
    if (truncated)
        text = `${text.slice(0, Math.max(0, text.length - Math.max(0, longest - 1)))}…[truncated]`;
    return text.replaceAll(MARK, OUT_MARK).slice(0, limit);
}
