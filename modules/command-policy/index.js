// E11 deterministic local action policy (#91). Pure and dependency-free (Node built-ins only).
//
// decide({ mode, request, settings }) judges a native COMMAND permission request by its
// effects, targets, paths and known script contents. It never trusts a wrapper or command
// name on its own, never reads approval flags from the request, and never widens beyond what
// the Owner's trusted settings declare. Judgment (E12) is out of scope: anything the rules
// cannot establish becomes a request-specific checkpoint for a person.
//
// Limits (documented in docs/research/e11-action-policies-2026-10-29.md): best-effort lexical
// analysis of a documented POSIX shell subset (no symlink resolution, no filesystem access).
// Anything outside the subset checkpoints; the subset is not proven exhaustive. The native
// approval flow does not consume decisions yet (gate G2).
import { posix as path } from 'node:path';
import { createHmac, randomBytes } from 'node:crypto';

export const POLICY_MODES = ['safe', 'aggressive'];
export const HISTORY_LIMIT = 100;
const MAX_COMMAND = 4096;
const MAX_WORDS = 256;
const MAX_SEGMENTS = 128;
const MAX_DEPTH = 4;
const MAX_SCRIPT = 16384;
const MAX_SCRIPTS_TOTAL = 65536;
export const RESOLVED_LIMIT = 1000;
const identifier = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
const isRecord = value => !!value && typeof value === 'object' && !Array.isArray(value);
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const REASONS = {
  mode_ask: 'Ask me mode: a person decides every request.',
  not_command_request: 'Only native command permission requests are answered by the session mode.',
  session_not_live: 'The session is not live, so it has no automatic authority.',
  invalid_request: 'The request is malformed and cannot be judged.',
  invalid_command: 'The command is empty or not text.',
  routine_known_effect: 'Routine work with a known effect inside the project.',
  regenerable_cleanup: 'Cleanup of regenerable build output inside the project.',
  temp_cleanup: 'Cleanup inside a temporary directory.',
  task_authorized_target: 'Destructive action on a known target the task authorized.',
  owner_declared_effect: 'The Owner declared the effect of this command.',
  destructive_checkpoint: 'Destructive or hard-to-reverse action: a person must confirm this request.',
  target_not_authorized: 'Destructive action whose target the task did not authorize.',
  untrusted_push: 'Remote synchronisation in a project the Owner has not trusted.',
  outside_project: 'A target is outside the project.',
  unresolved_target: 'A target could not be resolved to a known path.',
  unknown_effect: 'The effect of this command is not known.',
  unknown_script: 'The contents of the script or wrapped command are not known.',
  script_recursion: 'The script includes itself or nests too deeply.',
  too_complex: 'The command is too large or complex to judge.',
  unparseable_construct: 'The command uses a shell construct that cannot be judged.',
  unsafe_environment: 'The command changes its environment in a way that cannot be judged.',
  network_effect: 'The command reaches the network or a remote host.',
  process_effect: 'The command signals or manages processes.',
  publish_effect: 'The command publishes to a remote registry.',
  privileged_effect: 'The command runs with elevated privileges.',
  sensitive_data: 'The command touches credentials, keys or other sensitive data.',
  catastrophic_target: 'The command targets the filesystem root, the home folder or the project root itself.',
  task_prohibition: 'The task explicitly prohibits this action.',
  owner_deny: 'Owner settings deny this action.',
  owner_checkpoint: 'Owner settings require a checkpoint for this action.',
  settings_invalid: 'Owner tightening settings are malformed, so a person must confirm this request.',
  protected_path: 'The command writes to protected version-control internals.',
  analysis_failed: 'The command could not be analysed.',
};
const result = (decision, reasonCode, effects = []) => ({ decision, reasonCode, effects: [...effects], origin: 'local-policy', reason: REASONS[reasonCode] || REASONS.analysis_failed });

// ---------------------------------------------------------------- settings
const EFFECTS = new Set(['read-project', 'read-outside', 'write-project', 'write-temp', 'outside-write', 'vcs-local', 'remote-sync', 'build', 'test', 'dependency', 'regen-cleanup', 'temp-cleanup',
  'delete-project', 'delete-outside', 'delete-branch', 'db-destroy', 'discard-changes', 'push-destructive', 'network', 'process', 'privileged', 'publish', 'sensitive', 'catastrophic', 'unknown']);
const DECLARABLE = new Set(['read-project', 'write-project', 'vcs-local', 'build', 'test', 'dependency']);
const absolute = value => typeof value === 'string' && value.length <= 512 && value.startsWith('/') && !value.includes('\0') ? path.normalize(value).replace(/(.)\/$/, '$1') : null;
const boundedList = (settings, key, accept, max = 64) => {
  if (!own(settings, key) || !Array.isArray(settings[key]) || settings[key].length > max) return [];
  return settings[key].map(accept).filter(item => item != null);
};
/** Tightening lists must never shrink silently: a present but malformed or oversized list marks the settings invalid. */
const tightList = (settings, key, accept, out, max = 64) => {
  if (!own(settings, key)) return [];
  const value = settings[key];
  if (!Array.isArray(value) || value.length > max) { out.settingsInvalid = true; return []; }
  const kept = value.map(accept);
  if (kept.some(item => item == null)) out.settingsInvalid = true;
  return kept.filter(item => item != null);
};
/** Owner settings may only extend (trusted projects, safe known effects) or tighten (checkpoint/deny lists, switch off Aggressive destructive actions). Malformed tightening input is reported as `settingsInvalid` and fails closed. */
export function normalizeSettings(settings) {
  const out = { trustedProjects: [], knownEffects: [], checkpointEffects: [], denyEffects: [], checkpointPaths: [], denyPaths: [], aggressiveDestructive: true, settingsInvalid: false };
  if (settings === undefined || settings === null) { out.ownerContext = {}; return out; }
  if (!isRecord(settings)) { out.settingsInvalid = true; return out; }
  if (own(settings, 'settingsInvalid') && settings.settingsInvalid === true) out.settingsInvalid = true;
  out.trustedProjects = boundedList(settings, 'trustedProjects', absolute);
  out.knownEffects = boundedList(settings, 'knownEffects', item => {
    if (!isRecord(item) || !own(item, 'argv') || !own(item, 'effect') || !Array.isArray(item.argv) || item.argv.length < 1 || item.argv.length > 4) return null;
    if (!item.argv.every(a => typeof a === 'string' && a.length > 0 && a.length <= 64 && !/\s/.test(a)) || !DECLARABLE.has(item.effect)) return null;
    return { argv: [...item.argv], effect: item.effect };
  });
  const effect = item => typeof item === 'string' && EFFECTS.has(item) ? item : null;
  const spot = item => typeof item === 'string' && item.length > 0 && item.length <= 256 && !/[\0*?[{$~]/.test(item) ? item : null;
  out.checkpointEffects = tightList(settings, 'checkpointEffects', effect, out);
  out.denyEffects = tightList(settings, 'denyEffects', effect, out);
  out.checkpointPaths = tightList(settings, 'checkpointPaths', spot, out);
  out.denyPaths = tightList(settings, 'denyPaths', spot, out);
  if (own(settings, 'aggressiveDestructive')) {
    if (settings.aggressiveDestructive === false) out.aggressiveDestructive = false;
    else if (settings.aggressiveDestructive !== true) out.settingsInvalid = true;
  }
  // Task/script/temp context is trusted only when supplied as an own Owner Settings record.
  const context = own(settings, 'ownerContext') && isRecord(settings.ownerContext) ? settings.ownerContext : {};
  out.ownerContext = {
    ...(own(context, 'task') && isRecord(context.task) ? { task: Object.fromEntries(Object.entries(context.task).filter(([key]) => ['authorizedTargets', 'prohibitions'].includes(key))) } : {}),
    ...(own(context, 'knownScripts') && isRecord(context.knownScripts) ? { knownScripts: context.knownScripts } : {}),
    ...(own(context, 'sessionTempDirs') && Array.isArray(context.sessionTempDirs) ? { sessionTempDirs: context.sessionTempDirs } : {}),
  };
  return out;
}

// ---------------------------------------------------------------- task context
const SENSITIVE_SEGMENTS = new Set(['.ssh', '.aws', '.gnupg', '.kube', '.azure', '.netrc', '.npmrc', '.pypirc', '.pgpass', '.git-credentials', '.password-store', 'keychains']);
const SENSITIVE_NAMES = /^(credentials(\.json)?|secrets?\.(json|ya?ml|key)|service-account.*\.json|id_(rsa|dsa|ecdsa|ed25519)|.*\.(pem|key|p12|pfx|jks|kdbx|keychain|keychain-db))$/;
/** Case-insensitive: file systems that fold case must not turn `.ENV` into a bypass. */
export function isSensitivePath(text) {
  if (typeof text !== 'string' || text.length > 512) return false;
  if (/[*?[]/.test(text) && !/^\*\.(?:js|md|txt|json|ts|tsx|jsx|css|html|yml|yaml)$/i.test(text)) return false;
  const lower = text.toLowerCase();
  const segments = lower.split('/').filter(Boolean);
  if (segments.some(s => SENSITIVE_SEGMENTS.has(s) || s.endsWith('.keychain-db'))) return true;
  if (segments.some(s => /[*?[]/.test(s)) && safeReadGlob(text)) return false;
  const last = segments.at(-1) || '';
  if (/^\.env(\..+)?$/.test(last) && !/\.(example|sample|template|dist)$/.test(last)) return true;
  if (SENSITIVE_NAMES.test(last)) return true;
  return /(^|\/)\.config\/(gcloud|gh)(\/|$)/.test(lower) || /(^|\/)\.docker\/config\.json$/.test(lower) || /^\/etc\/(shadow|sudoers|master\.passwd)$/.test(lower);
}
// Representative sensitive names: an unquoted glob that could expand to one of them is judged as touching it.
const SENSITIVE_FILE_PROBES = ['.env', '.env.local', '.env.production', '.env.development', 'credentials', 'credentials.json', 'secret.json', 'secrets.yml', 'secrets.key', 'service-account.json', 'service-account-prod.json',
  'id_rsa', 'id_dsa', 'id_ecdsa', 'id_ed25519', 'a.pem', 'a.key', 'a.p12', 'a.pfx', 'a.jks', 'a.kdbx', 'a.keychain', 'a.keychain-db'];
const SENSITIVE_DIR_PROBES = [...SENSITIVE_SEGMENTS];
function globRegex(segment) {
  let source = segment[0] === '.' ? '' : '(?!\\.)';
  for (let i = 0; i < segment.length; i++) {
    const ch = segment[i];
    if (ch === '*') source += '[^/]*';
    else if (ch === '?') source += '[^/]';
    else if (ch === '[') {
      const close = segment.indexOf(']', i + 2);
      if (close < 0) { source += '\\['; continue; }
      let body = segment.slice(i + 1, close);
      if (body[0] === '!') body = '^' + body.slice(1);
      source += '[' + body.replace(/\\/g, '\\\\') + ']';
      i = close;
    } else source += ch.replace(/[.+^${}()|\\\]]/g, '\\$&');
  }
  try { return new RegExp('^' + source + '$', 'i'); } catch { return null; }
}
/** True when a glob word could expand to a sensitive file or directory name. */
export function globMaySensitive(text) {
  if (text.split('/').some((segment, index, all) => segment === '..' && all.slice(0, index).some(part => /[*?[]/.test(part)))) return false;
  const segments = text.split('/').filter(Boolean);
  return segments.some((segment, index) => {
    if (!/[*?[]/.test(segment)) return false;
    const re = globRegex(segment);
    if (!re) return true;
    if (!/[^*?[\]!^-]/.test(segment.replace(/\[[^\]]*\]/g, ''))) return false; // bare glob is handled as a checkpoint, not a sensitive-name match
    return (index === segments.length - 1 ? [...SENSITIVE_FILE_PROBES, ...SENSITIVE_DIR_PROBES] : SENSITIVE_DIR_PROBES).some(name => re.test(name));
  });
}
const GLOB = /[*?[{$~\0]/;
function parseTarget(entry, project) {
  if (typeof entry !== 'string' || entry.length === 0 || entry.length > 256) return null;
  const at = entry.indexOf(':');
  if (at < 1) return null;
  const kind = entry.slice(0, at), value = entry.slice(at + 1);
  if (kind === 'path') {
    if (!value || GLOB.test(value) || !project) return null;
    const abs = path.resolve(project, value);
    return { kind, abs };
  }
  if (kind === 'effect') return EFFECTS.has(value) ? { kind, effect: value } : null;
  if (kind === 'branch' && /^[A-Za-z0-9._/-]{1,100}$/.test(value) && !value.includes('..')) return { kind, desc: entry };
  if (kind === 'db' && /^[A-Za-z0-9_.-]{1,64}$/.test(value)) return { kind, desc: entry };
  if (kind === 'push' && /^[A-Za-z0-9._-]+\/[A-Za-z0-9._/-]{1,100}$/.test(value) && !value.includes('..')) return { kind, desc: entry };
  if (entry === 'rollback:worktree') return { kind, desc: entry };
  return null;
}
function normalizeTask(task, project) {
  const out = { authorizedPaths: [], authorizedDescs: new Set(), prohibitedPaths: [], prohibitedEffects: new Set(), prohibitedDescs: new Set(), prohibitionsInvalid: false };
  if (!isRecord(task)) return out;
  if (own(task, 'authorizedTargets') && Array.isArray(task.authorizedTargets) && task.authorizedTargets.length <= 64) {
    for (const entry of task.authorizedTargets) {
      const target = parseTarget(entry, project);
      if (!target || target.kind === 'effect') continue;
      if (target.kind === 'path') {
        // Strictly inside the project, never the root, an ancestor, or sensitive material.
        if (project && target.abs.startsWith(project + '/') && !isSensitivePath(target.abs)) out.authorizedPaths.push(target.abs);
      } else out.authorizedDescs.add(target.desc);
    }
  }
  if (own(task, 'prohibitions')) {
    if (!Array.isArray(task.prohibitions) || task.prohibitions.length > 64) out.prohibitionsInvalid = true;
    else for (const entry of task.prohibitions) {
      const target = parseTarget(entry, project);
      if (!target) out.prohibitionsInvalid = true; // fail closed: a malformed prohibition disables every task authorization
      else if (target.kind === 'path') out.prohibitedPaths.push(target.abs);
      else if (target.kind === 'effect') out.prohibitedEffects.add(target.effect);
      else out.prohibitedDescs.add(target.desc);
    }
  }
  return out;
}

// ---------------------------------------------------------------- tokenizer (bounded POSIX shell subset)
const PH = { $: '\u0001', '*': '\u0002', '?': '\u0003', '[': '\u0004', '{': '\u0005', '~': '\u0006' };
const UNPH = Object.fromEntries(Object.entries(PH).map(([k, v]) => [v, k]));
const lit = ch => PH[ch] ?? ch;
const restore = text => text.replace(/[\u0001-\u0006]/g, c => UNPH[c]);
function tokenize(src) {
  const segments = [], flags = new Set();
  let words = [], redirs = [], cur = null, pending = null, pipePrev = false;
  const add = ch => { cur ??= { text: '' }; cur.text += ch; };
  const endWord = () => {
    if (!cur) return;
    const word = cur; cur = null;
    if (pending) { pending.word = word; redirs.push(pending); pending = null; } else words.push(word);
  };
  const endSegment = pipeAfter => {
    endWord();
    if (pending) { flags.add('syntax'); pending = null; }
    if (words.length || redirs.length) segments.push({ words, redirs, pipe: pipePrev || pipeAfter });
    words = []; redirs = []; pipePrev = pipeAfter;
  };
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '\\') {
      const next = src[i + 1];
      if (next === undefined) { i++; continue; }
      if (next !== '\n') add(lit(next)); // line continuation joins lines
      i += 2; continue;
    }
    if (c === "'") {
      const end = src.indexOf("'", i + 1);
      if (end < 0) { flags.add('syntax'); i = src.length; break; }
      add(''); for (const ch of src.slice(i + 1, end)) add(lit(ch));
      i = end + 1; continue;
    }
    if (c === '$' && src[i + 1] === "'") {
      // ANSI-C quoting: decode the common escapes so `$'\x2eenv'` is judged as `.env`.
      add(''); let j = i + 2, closed = false;
      while (j < src.length) {
        const d = src[j];
        if (d === "'") { closed = true; j++; break; }
        if (d !== '\\' || j + 1 >= src.length) { add(lit(d)); j++; continue; }
        const n = src[j + 1];
        const simple = { n: '\n', t: '\t', r: '\r', a: '\x07', b: '\b', e: '\x1b', E: '\x1b', f: '\f', v: '\v', '\\': '\\', "'": "'", '"': '"', '?': '?' };
        let m;
        if (own(simple, n)) { add(lit(simple[n])); j += 2; }
        else if (n === 'x' && (m = /^[0-9a-fA-F]{1,2}/.exec(src.slice(j + 2, j + 4)))) { add(lit(String.fromCharCode(parseInt(m[0], 16)))); j += 2 + m[0].length; }
        else if ((m = /^[0-7]{1,3}/.exec(src.slice(j + 1, j + 4)))) { add(lit(String.fromCharCode(parseInt(m[0], 8) & 255))); j += 1 + m[0].length; }
        else if ((n === 'u' || n === 'U') && (m = new RegExp(`^[0-9a-fA-F]{1,${n === 'u' ? 4 : 8}}`).exec(src.slice(j + 2, j + 10)))) { try { add(lit(String.fromCodePoint(parseInt(m[0], 16)))); } catch { flags.add('syntax'); } j += 2 + m[0].length; }
        else { add('\\'); add(lit(n)); j += 2; }
      }
      if (!closed) flags.add('syntax');
      i = j; continue;
    }
    if (c === '$' && src[i + 1] === '"') { i++; continue; } // locale quoting: judged as an ordinary double-quoted string
    if (c === '"') {
      add(''); i++;
      let closed = false;
      while (i < src.length) {
        const d = src[i];
        if (d === '"') { closed = true; i++; break; }
        if (d === '\\' && i + 1 < src.length) {
          const n = src[i + 1];
          if ('$`"\\'.includes(n)) add(lit(n)); else if (n !== '\n') { add('\\'); add(lit(n)); }
          i += 2; continue;
        }
        if (d === '`' || (d === '$' && src[i + 1] === '(')) flags.add('subst');
        add(d === '$' ? '$' : lit(d)); i++;
      }
      if (!closed) flags.add('syntax');
      continue;
    }
    if (c === '\n') { endSegment(false); i++; continue; }
    if (c === ' ' || c === '\t' || c === '\r') { endWord(); i++; continue; }
    if (c === '#' && !cur) { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '`') { flags.add('subst'); endWord(); i++; continue; }
    if (c === '$' && src[i + 1] === '(') { flags.add('subst'); endWord(); i += 2; continue; }
    if (c === '(' || c === ')') {
      if (src.slice(i, i + 7) === ':(glob)') { add(':(glob)'); i += 7; continue; }
      flags.add('group'); endSegment(false); i++; continue;
    }
    if (c === ';') { endSegment(false); i += src[i + 1] === ';' ? 2 : 1; continue; }
    if (c === '&') {
      if (src[i + 1] === '&') { endSegment(false); i += 2; continue; }
      if (src[i + 1] === '>') { endWord(); pending = { op: '>', word: null }; i += src[i + 2] === '>' ? 3 : 2; continue; }
      endSegment(false); i++; continue;
    }
    if (c === '|') {
      if (src[i + 1] === '|') { endSegment(false); i += 2; continue; }
      endSegment(true); i += src[i + 1] === '&' ? 2 : 1; continue;
    }
    if (c === '<' || c === '>') {
      if (src[i + 1] === '(') { flags.add('subst'); endWord(); i += 2; continue; }
      if (c === '<' && src[i + 1] === '<') { flags.add('heredoc'); endWord(); i += src[i + 2] === '<' ? 3 : 2; continue; }
      if (cur && /^\d+$/.test(cur.text)) cur = null; else endWord();
      i++;
      if (c === '>' && src[i] === '>') i++;
      if (src[i] === '&') {
        let j = i + 1; while (j < src.length && /[0-9-]/.test(src[j])) j++;
        if (j > i + 1) { i = j; continue; }
        i++;
      }
      if (c === '>' && src[i] === '|') i++;
      pending = { op: c, word: null };
      continue;
    }
    add(c); i++;
  }
  endSegment(false);
  return { segments, flags };
}
function finalize(word, home) {
  let text = word.text, unresolvedHome = false;
  if (text === '~' || text.startsWith('~/')) { if (home) text = home + text.slice(1); else unresolvedHome = true; } else if (text.startsWith('~')) unresolvedHome = true;
  if (home) text = text.replace(/\$HOME(?![A-Za-z0-9_])|\$\{HOME\}/g, home);
  return {
    text: restore(text),
    sensGlob: /[*?[]/.test(text) && globMaySensitive(text),
    var: unresolvedHome || /\$(?=[A-Za-z_{0-9@*#?!$-])/.test(text),
    glob: /[*?[]/.test(text),
    brace: /\{[^{}]*(,|\.\.)[^{}]*\}/.test(text),
  };
}

// ---------------------------------------------------------------- findings
const F = (lvl, effect, code, extra = {}) => ({ lvl, effect, code, ...extra });
const LEVEL = { allow: 0, checkpoint: 1, deny: 2 };
const SYSTEM_DIRS = new Set(['/bin', '/boot', '/dev', '/etc', '/lib', '/opt', '/proc', '/sbin', '/sys', '/usr', '/var', '/System', '/Library', '/Applications', '/Users', '/home', '/private', '/root']);
const SYSTEM_BIN = new Set(['/bin', '/usr/bin', '/usr/local/bin', '/opt/homebrew/bin', '/sbin', '/usr/sbin']);
const SOURCE_SEGMENTS = new Set(['src', 'lib', 'source', 'sources', 'app', 'apps', 'packages', 'test', 'tests', 'spec']);
const CONFIG_FILE = /^(package(-lock)?\.json|npm-shrinkwrap\.json|tsconfig.*\.json|jsconfig.*\.json|.*\.config\.([cm]?[jt]s|json)|go\.(mod|sum)|Cargo\.(toml|lock)|pyproject\.toml|setup\.(py|cfg)|requirements.*\.txt|Pipfile.*|.*\.ya?ml|.*\.toml|.*\.lock|.*rc\.[a-z]+)$/;
const fileLike = base => !base.startsWith('.') && /\.[A-Za-z0-9]{1,8}$/.test(base) && !CONFIG_FILE.test(base);
const REGENERABLE = new Set(['node_modules', 'dist', 'build', 'out', 'coverage', '.cache', '.next', '.nuxt', '.turbo', '.parcel-cache', '__pycache__', '.pytest_cache', '.mypy_cache', '.tox']);
const TEMP_ROOT = /^(\/tmp|\/private\/tmp|\/var\/tmp|\/private\/var\/folders\/[^/]+\/[^/]+\/T|\/var\/folders\/[^/]+\/[^/]+\/T)\/.+/;
const ENV_ALLOWED = new Set(['CI', 'DEBUG', 'NODE_ENV', 'FORCE_COLOR', 'NO_COLOR', 'TERM', 'LANG', 'LC_ALL', 'TZ']);
const isAssignment = text => /^[A-Za-z_][A-Za-z0-9_]*=/.test(text);

function scopeOf(abs, st) {
  if (abs == null) return 'unknown';
  if (st.project && (abs === st.project || abs.startsWith(st.project + '/'))) return 'project';
  return TEMP_ROOT.test(abs) ? 'temp' : 'outside';
}
function resolveWord(word, cwd) {
  if (word.var || word.brace) return { unresolved: true };
  let text = word.text;
  if (!text.startsWith('/') && cwd == null) return { unresolved: true };
  if (word.glob) {
    const segs = text.split('/'), at = segs.findIndex(s => /[*?[]/.test(s));
    if (segs.slice(at + 1).includes('..')) return { unresolved: true }; // a glob match followed by `..` can climb out of any prefix
    text = segs.slice(0, at).join('/');
    if (text === '' ) text = word.text.startsWith('/') ? '/' : '.';
  }
  return { abs: path.resolve(cwd ?? '/', text), glob: word.glob };
}
function useCwd(st, cwd) {
  if (cwd == null) st.add(F('checkpoint', 'unknown', 'unresolved_target'));
  else if (scopeOf(cwd, st) !== 'project') st.add(F('checkpoint', 'read-outside', 'outside_project'));
  else st.add(F('allow', 'read-project', 'routine_known_effect'));
}
function readPath(word, st, cwd) {
  if (word.glob && sensitiveReadGlob(word.text)) st.add(globMaySensitive(word.text) ? F('deny', 'sensitive', 'sensitive_data') : F('checkpoint', 'sensitive', 'sensitive_data'));
  const r = resolveWord(word, cwd);
  if (r.unresolved) return st.add(F('checkpoint', 'unknown', 'unresolved_target'));
  st.touched.push(r.abs);
  const scope = scopeOf(r.abs, st);
  if (scope === 'outside') st.add(F('checkpoint', 'read-outside', 'outside_project'));
  else st.add(F('allow', 'read-project', 'routine_known_effect'));
}
const isProtectedPath = (abs, st) => !!st.project && abs.startsWith(st.project + '/') && path.relative(st.project, abs).split('/').some(s => s.toLowerCase() === '.git');
function touch(word, st, cwd) {
  const r = resolveWord(word, cwd);
  if (!r.unresolved) st.touched.push(r.abs);
}
function writePath(word, st, cwd) {
  const r = resolveWord(word, cwd);
  if (r.unresolved) return st.add(F('checkpoint', 'unknown', 'unresolved_target'));
  st.touched.push(r.abs);
  if (isProtectedPath(r.abs, st)) return st.add(F('checkpoint', 'unknown', 'protected_path'));
  const scope = scopeOf(r.abs, st);
  if (scope === 'project') st.add(F('allow', 'write-project', 'routine_known_effect'));
  else if (scope === 'temp') st.add(F('allow', 'write-temp', 'routine_known_effect'));
  else st.add(F('checkpoint', 'outside-write', 'outside_project'));
}
function isCatastrophic(abs, glob, st) {
  if (abs === '/' || abs === st.home || SYSTEM_DIRS.has(abs)) return true;
  if (!st.project) return false;
  const ancestor = abs === '/' || st.project.startsWith(abs + '/');
  return glob ? ancestor : ancestor || abs === st.project;
}
function removal(word, st, cwd, recursive, forceGlob = false) {
  if (/^(~|\$HOME|\$\{HOME\})(\/\*?)?$/.test(word.text)) return st.add(F('deny', 'catastrophic', 'catastrophic_target'));
  const r = resolveWord(forceGlob ? { ...word, glob: true } : word, cwd);
  if (r.unresolved) return st.add(F('checkpoint', 'unknown', 'unresolved_target'));
  if (isCatastrophic(r.abs, !!r.glob, st)) return st.add(F('deny', 'catastrophic', 'catastrophic_target'));
  st.touched.push(r.abs);
  if (isProtectedPath(r.abs, st)) return st.add(F('checkpoint', 'unknown', 'protected_path'));
  const scope = scopeOf(r.abs, st);
  const dirLike = recursive || !!r.glob || word.text.endsWith('/');
  if (scope === 'project') {
    const rel = path.relative(st.project, r.abs).split('/');
    // Regenerable only when the FIRST segment under the project root is regenerable and no source-like segment follows.
    if (REGENERABLE.has(rel[0]) && !rel.slice(1).some(s => SOURCE_SEGMENTS.has(s))) st.add(F('allow', 'regen-cleanup', 'regenerable_cleanup'));
    else if (!dirLike && fileLike(rel.at(-1))) st.add(F('allow', 'write-project', 'routine_known_effect'));
    else st.add(F('checkpoint', 'delete-project', 'destructive_checkpoint', { authz: { path: r.abs } }));
  } else if (scope === 'temp') {
    // Recursive deletes in a temporary directory are cleanup only inside a directory this session created (host-attached).
    if (!dirLike || st.sessionTemp.some(d => r.abs === d || r.abs.startsWith(d + '/'))) st.add(F('allow', 'temp-cleanup', 'temp_cleanup'));
    else st.add(F('checkpoint', 'delete-outside', 'outside_project'));
  } else st.add(F('checkpoint', 'delete-outside', 'outside_project'));
}
function split(args) {
  const flags = [], pos = [];
  let dd = false;
  for (const w of args) {
    if (!dd && w.text === '--') { dd = true; flags.push(w); continue; }
    if (!dd && w.text.length > 1 && w.text.startsWith('-')) flags.push(w); else pos.push(w);
  }
  return { flags, pos, dd };
}
const hasFlag = (flags, ...names) => flags.some(f => names.includes(f.text));
const cluster = (flags, letter) => flags.some(f => new RegExp(`^-[a-zA-Z]*${letter}[a-zA-Z]*$`).test(f.text));
function gitPathOperand(text) {
  const magic = text.match(/^:\([^)]*\)(.*)$/);
  if (magic) return magic[1].replace(/^\//, '');
  if (text.startsWith(':')) return text.slice(1);
  const colon = text.indexOf(':');
  if (colon === 0) return text.slice(1); // `:` pathspecs name paths relative to the index.
  return colon > 0 && !text.includes('://') ? text.slice(colon + 1) : text;
}
function pathLikeScan(args, st, cwd) {
  for (const w of args) {
    const m = /^-{1,2}[A-Za-z][\w-]*=(.+)$/.exec(w.text);
    const target = m ? { ...w, text: m[1] } : w;
    if (/^(\/|\.\.?(\/|$))/.test(target.text)) readPath(target, st, cwd);
  }
}
const flagName = text => text.split('=')[0];
// Flags that run or load code, or redirect output/config, in both "--opt value" and "--opt=value" forms.
const UNSAFE_TOOL_FLAGS = new Set(['-exec', '-toolexec', '-vettool', '--exec', '--require', '--eval', '--import', '--loader', '--experimental-loader', '--config', '--userconfig', '--globalconfig', '--outputFile', '--outDir',
  '--outFile', '--out-dir', '--manifest-path', '--target-dir', '--prefix', '--global', '-g', '--target', '--basetemp', '--cache-dir', '--cwd', '--output', '--outdir', '--coverageDirectory', '-o']);
const toolFlagUnsafe = (name, args) => args.some(a => UNSAFE_TOOL_FLAGS.has(flagName(a.text)) || (TEST_TOOLS.has(name) && /^-[pc]/.test(a.text)));
const shortOk = (text, allowed, valued) => {
  for (let i = 1; i < text.length; i++) { if (valued.has(text[i])) return true; if (!allowed.has(text[i])) return false; }
  return true;
};
const SORT_SHORT = new Set('bdfghiMnrRsuVcCzm'.split('')), SORT_VALUE = new Set(['k', 't', 'S']);
const SORT_LONG = /^--(unique|reverse|numeric-sort|ignore-case|ignore-leading-blanks|dictionary-order|ignore-nonprinting|general-numeric-sort|human-numeric-sort|month-sort|version-sort|random-sort|stable|check|merge|zero-terminated|key|field-separator)$/;
const sortFlagsSafe = flags => flags.every(f => f.text === '--' || (f.text.startsWith('--') ? SORT_LONG.test(flagName(f.text)) : shortOk(f.text, SORT_SHORT, SORT_VALUE)));
const RG_SHORT = new Set('iIsSnNHhwxvcloqFLuUpabP0123456789'.split('')), RG_VALUE = new Set('efgmABCjtTEMrd'.split(''));
const RG_LONG = /^--(ignore-case|case-sensitive|smart-case|line-number|no-line-number|with-filename|no-filename|word-regexp|line-regexp|invert-match|count|count-matches|files-with-matches|files-without-match|only-matching|quiet|fixed-strings|hidden|no-ignore|no-ignore-vcs|follow|text|binary|multiline|max-count|context|before-context|after-context|glob|iglob|type|type-not|type-list|files|regexp|file|json|heading|no-heading|column|color|colors|max-depth|stats|sort|sortr|threads|replace|trim|pcre2|null|vimgrep|pretty|unrestricted|max-filesize|no-messages|glob-case-insensitive|one-file-system|max-columns|max-columns-preview|line-buffered|block-buffered|passthru|auto-hybrid-regex|engine)$/;
const rgFlagsSafe = flags => flags.every(f => f.text === '--' || (f.text.startsWith('--') ? RG_LONG.test(flagName(f.text)) : shortOk(f.text, RG_SHORT, RG_VALUE)));
function unknown(st, code = 'unknown_effect') { st.add(F('checkpoint', 'unknown', code)); }
function declaredEffect(name, args, st) {
  const texts = [name, ...args.map(w => w.text)];
  const match = st.settings.knownEffects.find(d => d.argv.every((a, i) => texts[i] === a));
  return match ? match.effect : null;
}
function tryDeclared(name, args, st, cwd) {
  const effect = declaredEffect(name, args, st);
  if (!effect) return false;
  useCwd(st, cwd); pathLikeScan(args, st, cwd);
  st.add(F('allow', effect, 'owner_declared_effect'));
  return true;
}

// ---------------------------------------------------------------- scripts
function normalizeScripts(value) {
  const map = new Map();
  if (!isRecord(value)) return map;
  const keys = Object.keys(value);
  if (keys.length > 32) return map;
  let total = 0;
  for (const key of keys) {
    const content = value[key];
    if (typeof content !== 'string' || content.length > MAX_SCRIPT || key.length > 256) continue;
    total += content.length;
    if (total > MAX_SCRIPTS_TOTAL) return new Map(); // an oversized set is ignored entirely: wrappers then have unknown contents
    map.set(/^(run|make):/.test(key) ? key : path.normalize(key.replace(/^\.\//, '')), content);
  }
  return map;
}
function runScriptContent(key, content, st, cwd) {
  if (st.stack.includes(key) || st.stack.length >= MAX_DEPTH) return st.add(F('checkpoint', 'unknown', 'script_recursion'));
  st.stack.push(key);
  try { analyze(content, st, cwd); } finally { st.stack.pop(); }
}
function namedScript(key, st, cwd) {
  const content = st.scripts.get(key);
  if (content === undefined) return false;
  runScriptContent(key, content, st, cwd);
  return true;
}
function scriptFile(word, st, cwd, forceShell) {
  const r = resolveWord(word, cwd);
  if (r.unresolved || r.glob || scopeOf(r.abs, st) !== 'project') return unknown(st, 'unknown_script');
  const key = path.relative(st.project, r.abs);
  const content = st.scripts.get(key);
  if (content === undefined) return unknown(st, 'unknown_script');
  if (!forceShell && !/\.(sh|bash)$/.test(key) && !/^#!\s*(\/usr\/bin\/env\s+)?\/?(\w+\/)*(ba|z|da|k)?sh\b/.test(content)) return unknown(st, 'unknown_script');
  st.touched.push(r.abs);
  runScriptContent(key, content, st, cwd);
}

// ---------------------------------------------------------------- command handlers
const READ_PURE = new Set('true false pwd date whoami uname hostname seq sleep test [ basename dirname tr id : which type df pgrep'.split(' '));
const READ_PATHS = new Set('ls cat head tail wc sort uniq cut diff cmp file stat du tree less more od xxd sha256sum shasum md5sum md5 nl realpath readlink comm paste fold column rev tac jq'.split(' '));
const GREP = new Set(['grep', 'egrep', 'fgrep', 'rg', 'ag']);
const WRITE_ALL = new Set(['mkdir', 'touch', 'tee', 'ln']);
const NETWORK = new Set('curl wget ssh scp rsync sftp ftp nc ncat telnet ping dig nslookup nmap gh'.split(' '));
const PROCESS = new Set('kill pkill killall launchctl systemctl service'.split(' '));
const OUTSIDE_INSTALL = new Set('brew apt apt-get yum dnf pacman port snap'.split(' '));
const SHELLS = new Set(['sh', 'bash', 'zsh', 'dash', 'ksh']);
const SQL_CLIENTS = new Set(['psql', 'mysql', 'sqlite3', 'mongosh']);
const TEST_TOOLS = new Set('pytest py.test jest vitest mocha ava'.split(' '));
const BUILD_TOOLS = new Set('tsc eslint prettier ruff mypy black gofmt'.split(' '));
const PKG_DEP = new Set('install i ci add remove uninstall update up ls list outdated audit why'.split(' '));
const dependencySafe = (pos, flags, st) => {
  if (flags.some(f => /^(-g|--global|--prefix|--location|--target|-t|--root)(=.*)?$/.test(f.text))) return st.add(F('checkpoint', 'outside-write', 'outside_project'));
  if (flags.some(f => /^(-i|--index-url|--extra-index-url|--registry)(=.*)?$/.test(f.text)) || pos.some(w => /:\/\/|^git\+|^github:/.test(w.text))) return st.add(F('checkpoint', 'network', 'network_effect'));
  st.add(F('allow', 'dependency', 'routine_known_effect'));
};

function sqlHandler(name, args, st) {
  const text = args.map(w => w.text).join(' ');
  let found = false;
  const database = /\bdrop\s+database\s+(?:if\s+exists\s+)?["`]?([A-Za-z0-9_.-]+)/i.exec(text);
  if (database) { st.add(F('checkpoint', 'db-destroy', 'destructive_checkpoint', { authz: 'db:' + database[1] })); found = true; }
  if (/\b(drop\s+(table|schema|view|index|user|role)|truncate)\b/i.test(text)) { st.add(F('checkpoint', 'db-destroy', 'destructive_checkpoint', { authz: 'db:?' })); found = true; }
  if (!found) unknown(st);
}
const GIT_READ_SUBS = new Set(['status', 'diff', 'log', 'show', 'blame', 'rev-parse', 'ls-files', 'ls-tree', 'describe', 'shortlog', 'cat-file', 'grep', 'rev-list', 'for-each-ref', 'show-ref', 'merge-base', 'diff-tree', 'name-rev', 'whatchanged', 'version']);
// Flags of git read commands that write files, run programs or leave the repository (deny-list; only `git grep` has a full allow-list).
const GIT_READ_BAD = /^(--no-index|--output(-indicator-.*)?|--ext-diff|--open-files-in-pager|--exec|--upload-pack|--receive-pack|--paginate|--textconv|--git-dir|--work-tree|--exec-path)(=|$)/;
function broadGlob(text) {
  return text.split('/').some(segment => /[*?[]/.test(segment) && !/^[^*?[\]!^-]*\.(?:js|md|txt|json|ts|tsx|jsx|css|html|yml|yaml)$/.test(segment));
}
function broadReadArgument(words, word) {
  return ['cat', 'head', 'tail', 'wc', 'ls', 'tree', 'file', 'stat', 'du', 'less', 'more', 'od', 'xxd', 'sha256sum', 'shasum', 'md5sum', 'md5', 'nl', 'realpath', 'readlink'].includes(words[0]?.text) && words.indexOf(word) > 0;
}
function sensitiveReadGlob(text) {
  return globMaySensitive(text) || !safeReadGlob(text);
}
function safeReadGlob(text) {
  return text.split('/').filter(segment => /[*?[]/.test(segment)).every(segment => /^.*\.(?:js|md|txt|json|ts|tsx|jsx|css|html|yml|yaml)$/i.test(segment));
}
function safeGitPathGlob(text) {
  const operand = text.match(/^:\([^)]*\)(.*)$/)?.[1].replace(/^\//, '') ?? gitPathOperand(text);
  return safeReadGlob(operand);
}
const GIT_GREP_SHORT = new Set('aIivwhHEGFPnclLopWzq'.split('')), GIT_GREP_VALUE = new Set('ABCef'.split(''));
const GIT_GREP_LONG = /^--(cached|untracked|ignore-case|invert-match|word-regexp|line-number|column|count|files-with-matches|files-without-match|only-matching|extended-regexp|fixed-strings|basic-regexp|perl-regexp|text|recurse-submodules|full-name|heading|break|null|show-function|function-context|max-depth|no-color|color|quiet|all-match|and|or|not|no-recursive|threads|max-count|context|after-context|before-context|no-ignore-case|recursive)$/;
/** Only `s/re/repl/[gpI0-9]`, `Np`, `N,Mp`, `/re/p`, `Nd`, `/re/d`, `$d`, `p`, `d`, `q` style commands are accepted; `w`, `e`, `r`, `R`, `W` and flags `w`/`e` are not. */
function sedScriptSafe(text) {
  if (text.length > 512) return false;
  const addr = '(?:\\d+|\\$|/(?:[^/\\\\\\n]|\\\\.)*/)';
  const command = `(?:${addr}(?:,${addr})?!?)?(?:[pdq]|s(.)(?:(?!\\1)[^\\\\\\n]|\\\\.)*\\1(?:(?!\\1)[^\\\\\\n]|\\\\.)*\\1[gpIi0-9]*)`;
  return new RegExp(`^${command}(?:;${command})*$`).test(text);
}
const gitGrepFlagsSafe = flags => flags.every(f => f.text === '--' || (f.text.startsWith('--') ? GIT_GREP_LONG.test(flagName(f.text)) : /^-\d+$/.test(f.text) || shortOk(f.text, GIT_GREP_SHORT, GIT_GREP_VALUE)));
const FETCH_FLAGS = new Set(['-q', '--quiet', '-v', '--verbose', '--all', '--tags', '--no-tags', '--prune', '-p', '--dry-run', '--ff', '--no-ff', '--ff-only', '--no-rebase', '--no-edit', '--no-progress']);
function gitHandler(args, st, cwd) {
  let i = 0, gcwd = cwd;
  while (i < args.length && args[i].text.startsWith('-')) {
    const t = args[i].text;
    if (t === '-C') {
      const r = args[i + 1] ? resolveWord(args[i + 1], cwd) : { unresolved: true };
      if (r.unresolved) { unknown(st, 'unresolved_target'); gcwd = null; } else gcwd = r.abs;
      i += 2; continue;
    }
    if (['--no-pager', '-P', '--no-optional-locks', '--literal-pathspecs'].includes(t)) { i++; continue; }
    return unknown(st, 'unsafe_environment');
  }
  const sub = args[i]?.text, rest = args.slice(i + 1);
  const { flags, pos } = split(rest);
  const ft = flags.map(f => f.text);
  useCwd(st, gcwd);
  const local = () => st.add(F('allow', 'vcs-local', 'routine_known_effect'));
  const discard = () => st.add(F('checkpoint', 'discard-changes', 'destructive_checkpoint', { authz: 'rollback:worktree' }));
  const rewrite = () => st.add(F('checkpoint', 'discard-changes', 'destructive_checkpoint')); // history/ref rewrite: never lifted by a task authorization
  const noVerify = ft.includes('--no-verify');
  switch (sub) {
    case 'grep':
      if (!gitGrepFlagsSafe(flags)) return unknown(st);
      for (const p of pos) {
        const text = gitPathOperand(p.text);
        if (/(?:^|\/)(?:\.env(?:\..*)?|credentials(?:\.json)?|id_(?:rsa|dsa|ecdsa|ed25519)|[^/]+\.(?:pem|key))$/i.test(text.replace(/\*\*\//g, '')) || globMaySensitive(text) && !safeGitPathGlob(p.text)) st.add(F('deny', 'sensitive', 'sensitive_data'));
        if (isSensitivePath(text.replace(/\*\*\//g, '')) || /(?:^|\/)\.env(?:\.|$)|(?:^|\/)(?:credentials|id_(?:rsa|dsa|ecdsa|ed25519)|[^/]+\.(?:pem|key))(?:$|\/)/i.test(text) || sensitiveWord(p.text)) st.add(F('deny', 'sensitive', 'sensitive_data'));
        if (/[/]|^\.|^~/.test(text)) touch({ ...p, text }, st, gcwd);
      }
      return st.add(F('allow', 'read-project', 'routine_known_effect'));
    case 'status': case 'diff': case 'log': case 'show': case 'blame': case 'rev-parse': case 'ls-files': case 'ls-tree': case 'describe': case 'shortlog':
    case 'cat-file': case 'rev-list': case 'for-each-ref': case 'show-ref': case 'merge-base': case 'diff-tree': case 'name-rev': case 'whatchanged': case 'version':
      if (ft.some(f => GIT_READ_BAD.test(f))) return unknown(st);
      for (const p of pos) {
        const text = gitPathOperand(p.text);
        if (isSensitivePath(text.replace(/\*\*\//g, '')) || globMaySensitive(text) && !safeGitPathGlob(p.text)) st.add(F('deny', 'sensitive', 'sensitive_data'));
        if (sensitiveWord(p.text)) st.add(F('deny', 'sensitive', 'sensitive_data'));
        if (/[/]|^\.|^~/.test(text)) touch({ ...p, text }, st, gcwd);
      }
      return st.add(F('allow', 'read-project', 'routine_known_effect'));
    case 'reflog': return pos.length === 0 || pos[0].text === 'show' ? st.add(F('allow', 'read-project', 'routine_known_effect')) : unknown(st);
    case 'remote': return pos.length === 0 || ['show', 'get-url'].includes(pos[0].text) ? st.add(F('allow', 'read-project', 'routine_known_effect')) : unknown(st);
    case 'config': return ft.some(f => ['--get', '--get-all', '--get-regexp', '--list', '-l'].includes(f)) ? st.add(F('allow', 'read-project', 'routine_known_effect')) : unknown(st);
    case 'commit': return noVerify || cluster(flags, 'n') || ft.includes('--amend') ? rewrite() : local();
    case 'merge': return noVerify ? rewrite() : local();
    case 'add': case 'cherry-pick': case 'revert': case 'init': case 'mv': return local();
    case 'tag': return cluster(flags, 'd') || cluster(flags, 'f') || ft.includes('--delete') || ft.includes('--force') ? rewrite() : local();
    case 'rebase': return rewrite();
    case 'stash': return ['drop', 'clear'].includes(pos[0]?.text) ? discard() : ['push', 'pop', 'apply', 'list', 'show', 'save', 'branch', undefined].includes(pos[0]?.text) ? local() : unknown(st);
    case 'branch': {
      const forceDelete = cluster(flags, 'D'), del = cluster(flags, 'd') || ft.includes('--delete'), force = ft.includes('--force') || cluster(flags, 'f');
      if (forceDelete || (del && force)) {
        if (pos.length === 0) return st.add(F('checkpoint', 'delete-branch', 'destructive_checkpoint'));
        for (const w of pos) {
          if (w.var) st.add(F('checkpoint', 'unknown', 'unresolved_target'));
          else st.add(F('checkpoint', 'delete-branch', 'destructive_checkpoint', { authz: 'branch:' + w.text }));
        }
        return;
      }
      return force || cluster(flags, 'M') || cluster(flags, 'C') ? rewrite() : local();
    }
    case 'checkout': {
      if (cluster(flags, 'B') || cluster(flags, 'C')) return rewrite();
      if (rest.some(w => w.text === '--') || pos.some(w => w.text === '.') || ft.some(f => f === '-f' || f === '--force')) return discard();
      if (cluster(flags, 'b') || ft.includes('--orphan')) return local();
      // `git checkout <rev> <path>` and `git checkout <path>` overwrite files; a lone ref name is a branch switch.
      if (pos.length >= 2 || (pos.length === 1 && /(^[./~-])|\.[A-Za-z0-9]{1,6}$/.test(pos[0].text))) return discard();
      return local();
    }
    case 'switch': return ft.some(f => f === '-f' || f === '--force' || f === '--discard-changes') ? discard() : cluster(flags, 'C') || ft.includes('--force-create') ? rewrite() : local();
    case 'restore': return ft.includes('--staged') && !ft.includes('--worktree') && !ft.includes('-W') && !ft.some(f => f.startsWith('--source')) ? local() : discard();
    case 'reset':
      if (ft.includes('--hard')) return discard();
      if (ft.some(f => ['--keep', '--merge', '--soft', '--mixed'].includes(f))) return rewrite();
      // `git reset` / `git reset -- <paths>` / `git reset HEAD` only unstage; any other revision or bare path moves the branch.
      if (flags.some(f => f.text === '--') || pos.every(w => w.text === 'HEAD')) return local();
      return rewrite();
    case 'clean': return ft.some(f => f === '-n' || f === '--dry-run') ? st.add(F('allow', 'read-project', 'routine_known_effect')) : discard();
    case 'rm':
      if (ft.includes('--cached')) return local();
      for (const w of pos) removal(w, st, gcwd, cluster(flags, 'r') || cluster(flags, 'R'));
      return;
    case 'push': return pushHandler(rest, st);
    case 'fetch': case 'pull':
      if (rest.some(w => /::|:\/\/|@|\s/.test(w.text) || /^[./]/.test(w.text) && !w.text.startsWith('-') || w.var)) return st.add(F('checkpoint', 'network', 'network_effect'));
      if (flags.some(f => !FETCH_FLAGS.has(f.text))) return unknown(st);
      return st.add(st.trusted ? F('allow', 'remote-sync', 'routine_known_effect') : F('checkpoint', 'remote-sync', 'untrusted_push'));
    case 'credential': return st.add(F('deny', 'sensitive', 'sensitive_data'));
    default: return unknown(st);
  }
}
function pushHandler(rest, st) {
  let force = false, del = false, other = false;
  const refs = [];
  for (const w of rest) {
    const t = w.text;
    if (t.startsWith('-')) {
      if (/^(--force(-with-lease(=.*)?|-if-includes)?|--mirror|--prune)$/.test(t) || /^-[a-zA-Z]*f[a-zA-Z]*$/.test(t)) force = true;
      else if (t === '--delete' || t === '-d') del = true;
      else if (!['-u', '--set-upstream', '--tags', '--follow-tags', '-v', '--verbose', '--dry-run', '-n'].includes(t)) other = true;
    } else refs.push(w);
  }
  const remote = refs[0]?.text;
  if (refs.some(w => w.var || /:\/\/|@|^\//.test(w.text))) return st.add(F('checkpoint', 'network', 'network_effect'));
  const specs = refs.slice(1).map(w => w.text);
  const rename = specs.some(s => { const m = /^\+?([^:]*):(.+)$/.exec(s); return !!m && m[1] !== '' && m[1] !== m[2]; }); // pushing one name to another ref
  const destructive = force || del || rename || specs.some(s => s.startsWith(':') || s.startsWith('+'));
  if (destructive) {
    const names = specs.map(s => s.replace(/^\+/, '')).map(s => s.includes(':') ? s.split(':').pop() : s).filter(Boolean);
    if (!remote || names.length === 0) return st.add(F('checkpoint', 'push-destructive', 'destructive_checkpoint'));
    for (const name of names) st.add(F('checkpoint', 'push-destructive', 'destructive_checkpoint', { authz: `push:${remote}/${name}` }));
    return;
  }
  if (other) return unknown(st);
  st.add(st.trusted ? F('allow', 'remote-sync', 'routine_known_effect') : F('checkpoint', 'remote-sync', 'untrusted_push'));
}
const INSTALL_HOOKS = ['preinstall', 'install', 'postinstall', 'prepublish', 'preprepare', 'prepare', 'postprepare'];
const PKG_INSTALL = new Set(['install', 'i', 'ci', 'add', 'update', 'up']);
const PKG_OUTSIDE_FLAG = /^(-g|--global|--prefix|--location|--target|-t|--root)(=.*)?$/;
const PKG_EXEC_FLAG = /^(--exec|-c|--call|--script-shell|--shell|--userconfig|--globalconfig|--node-options)(=.*)?$/;
/** Runs pre<name>, <name>, post<name> from the known scripts; false when the main script is not known. */
function runWithHooks(script, st, cwd) {
  if (!st.scripts.has('run:' + script)) return false;
  for (const key of ['pre' + script, script, 'post' + script]) namedScript('run:' + key, st, cwd);
  return true;
}
function pkgHandler(name, args, st, cwd) {
  const { flags, pos, dd } = split(args);
  const sub = pos[0]?.text;
  useCwd(st, cwd);
  if (sub === 'publish') return st.add(F('checkpoint', 'publish', 'publish_effect'));
  if (dd || flags.some(f => PKG_EXEC_FLAG.test(f.text))) return unknown(st); // arguments after `--` and exec flags reach unknown programs
  if (flags.some(f => PKG_OUTSIDE_FLAG.test(f.text))) return st.add(F('checkpoint', 'outside-write', 'outside_project'));
  if (sub === 'test' || sub === 't' || sub === 'tst') return pos.length > 1 ? st.add(F('checkpoint', 'unknown', 'unknown_script')) : runWithHooks('test', st, cwd) || unknownScript(name, args, st, cwd);
  if (sub === 'start') return pos.length > 1 ? st.add(F('checkpoint', 'unknown', 'unknown_script')) : runWithHooks('start', st, cwd) || unknownScript(name, args, st, cwd);
  if (sub === 'run' || sub === 'run-script') return pos.length > 2 ? st.add(F('checkpoint', 'unknown', 'unknown_script')) : pos[1] && !pos[1].var && runWithHooks(pos[1].text, st, cwd) || unknownScript(name, args, st, cwd);
  if (PKG_DEP.has(sub)) {
    if (PKG_INSTALL.has(sub)) for (const key of INSTALL_HOOKS) if (st.scripts.has('run:' + key)) namedScript('run:' + key, st, cwd);
    return dependencySafe(pos.slice(1), flags, st);
  }
  unknown(st);
}
function unknownScript(name, args, st, cwd) {
  if (declaredEffect(name, args, st)) return void tryDeclared(name, args, st, cwd);
  st.add(F('checkpoint', 'unknown', 'unknown_script'));
}
function toolHandler(name, args, st, cwd) {
  const { flags, pos } = split(args);
  const sub = pos[0]?.text;
  useCwd(st, cwd);
  pathLikeScan(args, st, cwd);
  if (toolFlagUnsafe(name, args)) return unknown(st); // flags that run programs, load config/plugins or redirect output
  const ok = effect => st.add(F('allow', effect, 'routine_known_effect'));
  if (name === 'cargo') {
    if (['build', 'check', 'fmt', 'clippy', 'doc', 'fetch', 'update', 'add', 'remove', 'tree', 'metadata'].includes(sub)) return ok(sub === 'fetch' || sub === 'update' || sub === 'add' || sub === 'remove' ? 'dependency' : 'build');
    if (['test', 'bench'].includes(sub)) return ok('test');
    if (sub === 'clean') return st.add(F('allow', 'regen-cleanup', 'regenerable_cleanup'));
    if (sub === 'install') return st.add(F('checkpoint', 'outside-write', 'outside_project'));
    if (sub === 'publish') return st.add(F('checkpoint', 'publish', 'publish_effect'));
    return unknown(st);
  }
  if (name === 'go') {
    if (sub === 'test') return ok('test');
    if (['build', 'vet', 'fmt', 'list'].includes(sub)) return ok('build');
    if (sub === 'mod' && ['tidy', 'download', 'verify', 'vendor', 'graph', 'why'].includes(pos[1]?.text)) return ok('dependency');
    if (sub === 'get') return dependencySafe(pos.slice(1), flags, st);
    if (sub === 'install') return st.add(F('checkpoint', 'outside-write', 'outside_project'));
    return unknown(st);
  }
  if (name === 'pip' || name === 'pip3') {
    if (['install', 'uninstall'].includes(sub)) return dependencySafe(pos.slice(1), flags, st);
    if (['list', 'freeze', 'show', 'check'].includes(sub)) return st.add(F('allow', 'read-project', 'routine_known_effect'));
    return unknown(st);
  }
  if (TEST_TOOLS.has(name)) return ok('test');
  if (BUILD_TOOLS.has(name)) return ok('build');
  unknown(st);
}
const NODE_UNSAFE_LONG = /^--(eval|print|require|import|loader|experimental-loader|input-type|env-file|test-reporter(-destination)?|redirect-warnings|cpu-prof-dir|heap-prof-dir|diagnostic-dir|report-directory|title|inspect(-brk)?|watch-path)(=.*)?$/;
/** `node --test` is a test run only when --test is among the leading options (before the first non-option argument) and nothing loads or evaluates code. */
function nodeTestSafe(args) {
  let first = args.findIndex(a => !a.text.startsWith('-'));
  const test = args.findIndex(a => a.text === '--test');
  if (test < 0 || (first >= 0 && first < test)) return false;
  return !args.some(a => (/^-[A-Za-z]/.test(a.text) && !a.text.startsWith('--')) || NODE_UNSAFE_LONG.test(a.text));
}
/** sed: a flag allow-list plus a script allow-list (substitute / print / delete without the `w` and `e` features). */
function sedHandler(args, st, cwd) {
  const scripts = [], files = [];
  let hasExpression = false;
  let inPlace = false, dd = false;
  for (let i = 0; i < args.length; i++) {
    const t = args[i].text;
    if (dd || !t.startsWith('-') || t === '-') { (scripts.length === 0 && !files.length && !hasExpression ? scripts : files).push(args[i]); continue; }
    if (t === '--') { dd = true; continue; }
    if (t === '-e') { if (!args[++i]) return unknown(st); scripts.push(args[i]); hasExpression = true; continue; }
    if (/^--expression=/.test(t)) { scripts.push({ ...args[i], text: t.slice(13) }); hasExpression = true; continue; }
    if (/^(-n|-E|-r|-s|-z|--quiet|--silent|--regexp-extended|--separate|--null-data|--posix)$/.test(t) || /^-[nEr]+$/.test(t)) continue;
    if (t === '-i' || /^-i[^-]/.test(t) || /^--in-place(=.*)?$/.test(t)) { if (/^-i.*[efw]/.test(t) && t !== '-i') return unknown(st); inPlace = true; continue; }
    return unknown(st); // -f, --file, -l, unknown flags
  }
  if (scripts.length === 0 || scripts.some(w => w.var || w.brace || !sedScriptSafe(w.text))) return unknown(st);
  if (files.length === 0) useCwd(st, cwd); else files.forEach(f => (inPlace ? writePath : readPath)(f, st, cwd));
}
function shellHandler(args, st, cwd) {
  let i = 0;
  while (i < args.length && args[i].text.startsWith('-')) {
    const t = args[i].text;
    if (t === '-s') return unknown(st, 'unknown_script');
    if (/^-[a-zA-Z]*c[a-zA-Z]*$/.test(t)) {
      const cmd = args[i + 1];
      if (!cmd || cmd.var) return unknown(st, 'unresolved_target');
      return analyze(cmd.text, st, cwd, true);
    }
    i += t === '-o' ? 2 : 1;
  }
  if (!args[i]) return unknown(st, 'unknown_script'); // a shell reading standard input runs unknown code
  scriptFile(args[i], st, cwd, true);
}
const MAKE_FLAG = /^-([jksBwOq]\d*|-silent|-keep-going|-no-print-directory)$/;
function makeHandler(args, st, cwd) {
  useCwd(st, cwd);
  const targets = [];
  for (const a of args) {
    if (a.var || a.brace || a.glob || isAssignment(a.text) || a.text === '--' || (a.text.startsWith('-') && !MAKE_FLAG.test(a.text))) return unknown(st); // variables, -f/-C/-e and the like change what runs
    if (!a.text.startsWith('-')) targets.push(a.text);
  }
  if (targets.length === 0) targets.push('default');
  if (!targets.every(t => st.scripts.has('make:' + t))) return unknownScript('make', args, st, cwd);
  for (const t of targets) namedScript('make:' + t, st, cwd);
}

function runCommand(words, st, cwd, pipe) {
  let w = words;
  for (let guard = 0; guard < 8; guard++) {
    if (w.length === 0) return cwd;
    if (w[0].var || w[0].brace || w[0].glob) { unknown(st, 'unresolved_target'); return cwd; }
    const raw = w[0].text;
    let name = null;
    if (raw.includes('/')) { if (SYSTEM_BIN.has(path.dirname(raw))) name = path.basename(raw); } else name = raw;
    if (name === null) { scriptFile(w[0], st, cwd, false); return cwd; }
    if (name === 'env') {
      let i = 1;
      while (i < w.length && isAssignment(w[i].text)) { checkAssignment(w[i], st); i++; }
      if (i >= w.length) { st.add(F('deny', 'sensitive', 'sensitive_data')); return cwd; }
      w = w.slice(i); continue;
    }
    if (name === 'nohup' || name === 'time') { w = w.slice(1); while (w[0]?.text.startsWith('-')) w = w.slice(1); continue; }
    if (name === 'command') { if (w[1]?.text.startsWith('-')) { unknown(st); return cwd; } w = w.slice(1); continue; }
    if (name === 'nice') {
      let i = 1;
      if (w[i]?.text === '-n') i += 2; else if (w[i]?.text.startsWith('-')) i += 1;
      w = w.slice(i); continue;
    }
    if (name === 'timeout') {
      let i = 1;
      while (w[i]?.text.startsWith('-')) i += 1;
      w = w.slice(i + 1); continue;
    }
    if (name === 'sudo' || name === 'doas') {
      st.add(F('checkpoint', 'privileged', 'privileged_effect'));
      if (w[1]?.text.startsWith('-')) return cwd;
      w = w.slice(1); continue;
    }
    const next = dispatch(name, w.slice(1), st, cwd, pipe);
    return next === undefined ? cwd : next; // null means the working directory became unknown
  }
  unknown(st, 'too_complex');
  return cwd;
}
function checkAssignment(word, st) {
  const [name, ...rest] = word.text.split('=');
  const value = rest.join('=');
  if (!ENV_ALLOWED.has(name) || word.var || !/^[A-Za-z0-9_.:-]{0,64}$/.test(value)) st.add(F('checkpoint', 'unknown', 'unsafe_environment'));
}
function dispatch(name, args, st, cwd, pipe) {
  if (name === 'cd') {
    st.add(F('allow', 'read-project', 'routine_known_effect'));
    if (pipe) return cwd;
    if (args.length === 0) return st.home ?? null;
    const w = args.find(a => !a.text.startsWith('-'));
    const r = w ? resolveWord(w, cwd) : { unresolved: true };
    return r.unresolved ? null : r.abs;
  }
  if (SHELLS.has(name)) return void shellHandler(args, st, cwd);
  if (name === 'set') {
    if (args.length === 0) return void st.add(F('deny', 'sensitive', 'sensitive_data'));
    return args.every(a => /^([-+][euxo]+|pipefail|errexit|nounset|xtrace)$/.test(a.text)) ? void st.add(F('allow', 'read-project', 'routine_known_effect')) : void unknown(st);
  }
  if (name === 'export' && args.length === 0) return void st.add(F('deny', 'sensitive', 'sensitive_data'));
  if (name === 'printenv') return void st.add(F('deny', 'sensitive', 'sensitive_data'));
  if (name === 'security') return void (args.some(a => /^(find-|dump-keychain|export|show-keychain-info|list-keychains|import|delete-)/.test(a.text)) ? st.add(F('deny', 'sensitive', 'sensitive_data')) : unknown(st));
  if (name === 'gpg') return void (args.some(a => a.text.startsWith('--export-secret') || a.text === '--export-ownertrust') ? st.add(F('deny', 'sensitive', 'sensitive_data')) : unknown(st));
  if (name === 'gh' && args[0]?.text === 'auth' && args[1]?.text === 'token') return void st.add(F('deny', 'sensitive', 'sensitive_data'));
  if (name === 'echo' || name === 'printf') {
    // Expanding a variable can print a secret, so any unresolved expansion is a checkpoint.
    if (args.some(a => a.var || a.brace)) return void st.add(F('checkpoint', 'sensitive', 'sensitive_data'));
    return void st.add(F('allow', 'read-project', 'routine_known_effect'));
  }
  if (name === 'ps') {
    // BSD-style words containing `e`/`E` and any dashed `E` append the environment of each process.
    const env = args.some(a => (a.text.startsWith('-') ? /^-[A-Za-z]*E/.test(a.text) : /[eE]/.test(a.text)));
    return void st.add(env ? F('deny', 'sensitive', 'sensitive_data') : F('allow', 'read-project', 'routine_known_effect'));
  }
  if (READ_PURE.has(name)) return void st.add(F('allow', 'read-project', 'routine_known_effect'));
  if (name === 'jq') {
    const { flags, pos } = split(args);
    // jq can read the environment (`env`, `$ENV`), other inputs and files; only a literal filter without those is routine.
    if (flags.some(f => /^(-f|--from-file|--rawfile|--slurpfile|-L|--library-path)/.test(f.text)) || !pos[0]) return void unknown(st);
    const filter = pos[0];
    if (filter.var || filter.brace || filter.glob) return void unknown(st);
    if (/\benv\b|\$ENV/.test(filter.text)) return void st.add(F('deny', 'sensitive', 'sensitive_data'));
    if (/\b(input|inputs|debug|input_filename|stderr|halt_error|include|import|getpath|get_search_list)\b|\$__/.test(filter.text)) return void unknown(st);
    const files = pos.slice(1);
    if (files.length === 0) useCwd(st, cwd); else files.forEach(p => readPath(p, st, cwd));
    return;
  }
  if (name === 'sort') {
    const { flags, pos } = split(args);
    if (!sortFlagsSafe(flags)) return void unknown(st);
    if (pos.length === 0) useCwd(st, cwd); else pos.forEach(p => readPath(p, st, cwd));
    return;
  }
  if (READ_PATHS.has(name)) {
    const { flags, pos } = split(args);
    if (name === 'tree' && flags.some(f => /^-[a-zA-Z]*o/.test(f.text) || f.text.startsWith('--output'))) return void unknown(st);
    if (pos.length === 0) useCwd(st, cwd); else pos.forEach(p => readPath(p, st, cwd));
    return;
  }
  if (GREP.has(name)) {
    const { flags, pos } = split(args);
    if (name === 'rg' && !rgFlagsSafe(flags)) return void unknown(st);
    if (name !== 'rg' && flags.some(f => /^--(exclude-from|include-from)/.test(f.text))) return void unknown(st);
    const paths = cluster(flags, 'e') || cluster(flags, 'f') || flags.some(f => /^--(regexp|file)/.test(f.text)) ? pos : pos.slice(1);
    if (paths.length === 0) useCwd(st, cwd); else paths.forEach(p => readPath(p, st, cwd));
    return;
  }
  if (name === 'find') {
    let i = 0;
    while (args[i] && /^-[LHP]$/.test(args[i].text)) i++;
    const roots = [];
    while (args[i] && !/^[-!(]/.test(args[i].text)) roots.push(args[i++]);
    const expression = args.slice(i).map(a => a.text);
    if (roots.length === 0) roots.push({ text: '.', var: false, glob: false, brace: false });
    if (expression.some(e => /^-(exec|execdir|ok|okdir|fprint0?|fprintf|fls)$/.test(e))) return void unknown(st);
    if (expression.includes('-delete')) return void roots.forEach(r => removal(r, st, cwd, true, true));
    return void roots.forEach(r => readPath(r, st, cwd));
  }
  if (name === 'sed') return void sedHandler(args, st, cwd);
  if (name === 'cp') {
    const { flags, pos } = split(args);
    if (flags.some(f => /^(-t|--target-directory|-T)/.test(f.text) || /^-[a-zA-Z]*t/.test(f.text))) return void unknown(st);
    pos.forEach((p, i) => (i === pos.length - 1 ? writePath : readPath)(p, st, cwd));
    return;
  }
  if (name === 'chmod' || name === 'chown' || name === 'chgrp') {
    const { flags, pos } = split(args);
    if (cluster(flags, 'R') || hasFlag(flags, '--recursive')) return void st.add(F('checkpoint', 'delete-project', 'destructive_checkpoint')); // recursive permission change: always a person's call
    pos.slice(1).forEach(p => writePath(p, st, cwd));
    return;
  }
  if (name === 'mv') {
    const { flags, pos } = split(args);
    if (flags.some(f => /^(-t|--target-directory|-T)/.test(f.text) || /^-[a-zA-Z]*t/.test(f.text))) return void unknown(st);
    // Every source is removed from its place (judged like a deletion); the destination is a write.
    pos.forEach((p, i) => (i === pos.length - 1 ? writePath(p, st, cwd) : removal(p, st, cwd, false)));
    return;
  }
  if (WRITE_ALL.has(name)) { split(args).pos.forEach(p => writePath(p, st, cwd)); return; }
  if (name === 'rm' || name === 'rmdir' || name === 'unlink') {
    const { flags, pos } = split(args);
    if (flags.some(f => f.text === '--no-preserve-root')) st.add(F('deny', 'catastrophic', 'catastrophic_target'));
    // Directory removal (rmdir, rm -d/--dir) and unlink are judged as recursive deletes: they are not routine file edits.
    const recursive = name !== 'rm' || cluster(flags, 'r') || cluster(flags, 'R') || cluster(flags, 'd') || hasFlag(flags, '--recursive', '--dir');
    pos.forEach(p => removal(p, st, cwd, recursive));
    return;
  }
  if (name === 'git') return void gitHandler(args, st, cwd);
  if (['npm', 'pnpm', 'yarn'].includes(name)) return void pkgHandler(name, args, st, cwd);
  if (['cargo', 'go', 'pip', 'pip3'].includes(name) || TEST_TOOLS.has(name) || BUILD_TOOLS.has(name)) return void toolHandler(name, args, st, cwd);
  if (name === 'node' && nodeTestSafe(args)) { useCwd(st, cwd); pathLikeScan(args, st, cwd); return void st.add(F('allow', 'test', 'routine_known_effect')); }
  if ((name === 'python' || name === 'python3') && args[0]?.text === '-m' && args[1]?.text === 'pytest' && !toolFlagUnsafe('pytest', args.slice(2))) { useCwd(st, cwd); pathLikeScan(args, st, cwd); return void st.add(F('allow', 'test', 'routine_known_effect')); }
  if (name === 'make') return void makeHandler(args, st, cwd);
  if (name === 'dropdb') {
    const pos = split(args).pos;
    const db = pos.at(-1);
    return void st.add(db && !db.var ? F('checkpoint', 'db-destroy', 'destructive_checkpoint', { authz: 'db:' + db.text }) : F('checkpoint', 'db-destroy', 'destructive_checkpoint'));
  }
  if (SQL_CLIENTS.has(name)) return void sqlHandler(name, args, st);
  if (NETWORK.has(name)) return void st.add(F('checkpoint', 'network', 'network_effect'));
  if (PROCESS.has(name)) return void st.add(F('checkpoint', 'process', 'process_effect'));
  if (OUTSIDE_INSTALL.has(name)) return void st.add(F('checkpoint', 'outside-write', 'outside_project'));
  if (tryDeclared(name, args, st, cwd)) return undefined;
  unknown(st);
}

function analyze(src, st, cwd, nested = false) {
  if (nested) {
    if (st.stack.length >= MAX_DEPTH) return void st.add(F('checkpoint', 'unknown', 'too_complex'));
    st.stack.push('-c');
  }
  try {
    const tk = tokenize(src);
    for (const flag of tk.flags) st.add(F('checkpoint', 'unknown', flag === 'syntax' ? 'unparseable_construct' : 'unparseable_construct'));
    for (const seg of tk.segments) {
      if (++st.segments > MAX_SEGMENTS) { st.add(F('checkpoint', 'unknown', 'too_complex')); break; }
      cwd = analyzeSegment(seg, st, cwd);
    }
  } finally { if (nested) st.stack.pop(); }
  return cwd;
}
function analyzeSegment(seg, st, cwd) {
  const words = seg.words.map(w => finalize(w, st.home));
  const redirs = seg.redirs.map(r => ({ op: r.op, word: r.word && finalize(r.word, st.home) }));
  st.words += words.length + redirs.length;
  if (st.words > MAX_WORDS) { st.add(F('checkpoint', 'unknown', 'too_complex')); return cwd; }
  const all = [...words, ...redirs.map(r => r.word).filter(Boolean)];
  const isGit = words.some(w => w.text === 'git');
  for (const w of all) {
    if (w.text.includes(' ') || w.text.includes('\t')) {
      const normalized = finalize({ ...w, glob: false }, st.home).text;
      if (sensitiveWord(normalized)) st.add(F('deny', 'sensitive', 'sensitive_data'));
      const possiblePath = isGit ? gitPathOperand(w.text) : normalized;
      const { abs } = resolveWord({ ...w, text: possiblePath, glob: false }, cwd);
      if ((isGit || /[/]|^\.|^~/.test(normalized)) && relates(abs, st.project ?? '/') === false) st.add(F('checkpoint', 'read-outside', 'outside_project'));
      if (isGit && /^(?:HEAD|[A-Za-z0-9._/-]+):/.test(w.text)) {
        const pathText = gitPathOperand(w.text);
        if (isSensitivePath(pathText)) st.add(F('deny', 'sensitive', 'sensitive_data'));
        touch({ ...w, text: pathText, glob: false }, st, cwd);
      }
      continue;
    }
    const sensitiveLiteral = /^\*\.(?:js|md|txt|json|ts|tsx|jsx|css|html|yml|yaml)$/i.test(w.text);
    if (sensitiveWord(w.text)) st.add(F('deny', 'sensitive', 'sensitive_data'));
    else if (w.glob && !sensitiveLiteral && broadReadArgument(words, w) && sensitiveReadGlob(w.text) && !w.text.split('/').some((segment, index, all) => segment === '..' && all.slice(0, index).some(part => /[*?[]/.test(part)))) st.add(F('checkpoint', 'sensitive', 'sensitive_data'));
    else if (w.sensGlob && !w.glob) st.add(F('checkpoint', 'sensitive', 'sensitive_data')); // dynamic or unresolved sensitive-looking argument
  }
  // Task prohibitions apply to any path-like argument, whatever the command: git pathspecs get no special model.
  for (const w of words.slice(1)) {
    if (w.text.startsWith(':(')) {
      const pathText = gitPathOperand(w.text);
      if (isSensitivePath(pathText)) st.add(F('deny', 'sensitive', 'sensitive_data'));
      const target = { ...w, text: pathText, glob: /[*?[]/.test(pathText) };
      touch(target, st, cwd);
      continue;
    }
    const m = /^--?[A-Za-z][\w-]*=(.+)$/.exec(w.text), text = m ? m[1] : w.text;
    if (w.var || (text.startsWith('-') && !m)) continue;
    if (isGit || /[/]|^\.|^~/.test(text)) {
      const pathText = isGit ? gitPathOperand(text) : text;
      const target = { ...w, text: pathText, glob: /[*?[]/.test(pathText) };
      if (pathText !== text || /[/]|^\.|^~/.test(pathText)) touch(target, st, cwd);
    }
  }
  for (const r of redirs) {
    if (!r.word || r.word.text === '/dev/null') continue;
    (r.op === '<' ? readPath : writePath)(r.word, st, cwd);
  }
  let i = 0;
  while (i < words.length && isAssignment(words[i].text)) { checkAssignment(words[i], st); i++; }
  if (i >= words.length) return cwd;
  return runCommand(words.slice(i), st, cwd, seg.pipe);
}
function sensitiveWord(text) {
  if (text.length > 512) return false;
  if (/[*?[]/.test(text) && !/^\.env\*$/i.test(text) && !safeReadGlob(text) && !text.includes('..')) return false;
  if (isSensitivePath(text)) return true;
  const eq = text.indexOf('=');
  if (text.startsWith('-') && eq > 0 && isSensitivePath(text.slice(eq + 1))) return true;
  const pathText = gitPathOperand(text);
  const magicPath = text.match(/^:\([^)]*\)(.*)$/)?.[1];
  return ((pathText !== text || text.startsWith(':')) && isSensitivePath(pathText)) || (magicPath !== undefined && isSensitivePath(pathText));
}

// ---------------------------------------------------------------- decision
const unique = list => [...new Set(list)];
const reduceEffects = list => { const all = unique(list); return all.length > 1 ? all.filter(e => e !== 'read-project') : all; };
const relates = (a, b) => a === b || a.startsWith(b + '/') || b.startsWith(a + '/');

/** Host-attached directories this session created under a temporary root; anything else is not session cleanup. */
function sessionTempDirs(value) {
  if (!Array.isArray(value) || value.length > 16) return [];
  return value.map(absolute).filter(dir => dir != null && TEMP_ROOT.test(dir) && !GLOB.test(dir));
}
function evaluateCommand(mode, request, settings) {
  const command = request.command;
  if (typeof command !== 'string' || command.trim() === '') return result('checkpoint', 'invalid_command', ['unknown']);
  if (command.length > MAX_COMMAND) return result('checkpoint', 'too_complex', ['unknown']);
  const project = absolute(request.projectRoot);
  const st = {
    sessionTemp: sessionTempDirs(request.sessionTempDirs),
    findings: [], touched: [], stack: [], segments: 0, words: 0, settings, project,
    home: absolute(request.home), scripts: normalizeScripts(request.knownScripts),
    trusted: !!project && settings.trustedProjects.includes(project),
    add(finding) { this.findings.push(finding); },
  };
  const task = normalizeTask(request.task, project);
  analyze(command, st, absolute(request.cwd));
  if (st.findings.length === 0) st.add(F('allow', 'read-project', 'routine_known_effect'));
  const findings = st.findings;
  if (settings.settingsInvalid) findings.push(F('checkpoint', 'unknown', 'settings_invalid'));
  // Security, explicit task prohibitions and Owner denials come first and are never lifted.
  const effects = new Set(findings.map(f => f.effect));
  for (const abs of st.touched) {
    for (const p of settings.denyPaths) if (project && relates(abs, path.resolve(project, p))) findings.push(F('deny', 'sensitive', 'owner_deny'));
    for (const p of task.prohibitedPaths) if (relates(abs, p)) findings.push(F('deny', 'unknown', 'task_prohibition'));
    for (const p of settings.checkpointPaths) if (project && relates(abs, path.resolve(project, p))) findings.push(F('checkpoint', 'unknown', 'owner_checkpoint'));
  }
  for (const effect of effects) {
    if (settings.denyEffects.includes(effect)) findings.push(F('deny', effect, 'owner_deny'));
    if (task.prohibitedEffects.has(effect)) findings.push(F('deny', effect, 'task_prohibition'));
    if (settings.checkpointEffects.includes(effect)) findings.push(F('checkpoint', effect, 'owner_checkpoint'));
  }
  for (const f of findings) if (typeof f.authz === 'string' && task.prohibitedDescs.has(f.authz)) findings.push(F('deny', f.effect, 'task_prohibition'));
  // Aggressive only: known-target, task-authorized destructive project actions. Safe and Ask never lift.
  let lifted = false;
  const canLift = mode === 'aggressive' && settings.aggressiveDestructive && !task.prohibitionsInvalid;
  for (const f of findings) {
    if (f.lvl !== 'checkpoint' || f.authz === undefined || f.code !== 'destructive_checkpoint') continue;
    if (mode === 'aggressive') f.code = 'target_not_authorized';
    const authorized = typeof f.authz === 'string' ? task.authorizedDescs.has(f.authz) : task.authorizedPaths.some(p => f.authz.path === p || f.authz.path.startsWith(p + '/'));
    if (canLift && authorized) { f.lvl = 'allow'; f.code = 'task_authorized_target'; lifted = true; }
  }
  const top = findings.reduce((max, f) => Math.max(max, LEVEL[f.lvl]), 0);
  const level = Object.keys(LEVEL).find(key => LEVEL[key] === top);
  const chosen = findings.find(f => f.lvl === level && (level !== 'allow' || f.effect !== 'read-project')) || findings.find(f => f.lvl === level);
  const code = level === 'allow' && lifted ? 'task_authorized_target' : chosen.code;
  return result(level, code, reduceEffects(findings.map(f => f.effect)));
}

/** Pure decision. Task authorization, scripts and temp directories come only from normalized Owner settings; request approval flags and policy fields are ignored. */
export function decide({ mode, request, settings } = {}) {
  if (!POLICY_MODES.includes(mode)) return result('defer', 'mode_ask');
  if (!isRecord(request) || request.kind !== 'command') return result('defer', 'not_command_request');
  try {
    const normalized = normalizeSettings(settings);
    request = { ...request, task: normalized.ownerContext.task, knownScripts: normalized.ownerContext.knownScripts, sessionTempDirs: normalized.ownerContext.sessionTempDirs };
    if (request.task === undefined) delete request.task;
    if (request.knownScripts === undefined) delete request.knownScripts;
    if (request.sessionTempDirs === undefined) delete request.sessionTempDirs;
    return evaluateCommand(mode, request, normalized);
  } catch { return result('checkpoint', 'analysis_failed', ['unknown']); }
}

// ---------------------------------------------------------------- bounded in-memory ledger
const stable = value => { try { return JSON.stringify(value, (key, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map(k => [k, x[k]])) : x)) ?? 'null'; } catch { return 'unserializable'; } };

/**
 * Per-session decision history and stale/cancel fencing. Entries keep only redacted reason codes,
 * effect classes, timestamps and counts; the raw request is represented by a keyed hash that is
 * never exposed. Everything lives in host memory and is dropped on session closure or clear().
 */
export function createPolicyLedger({ getMode, getEpoch = () => 0, isLive = () => true, settings, now = Date.now, limit = HISTORY_LIMIT, resolvedLimit = RESOLVED_LIMIT } = {}) {
  const key = randomBytes(16);
  const sessions = new Map();
  const mac = value => createHmac('sha256', key).update(stable(value)).digest('hex').slice(0, 32);
  const currentSettings = () => typeof settings === 'function' ? settings() : settings;
  const fingerprint = request => mac([request.command, request.cwd, request.projectRoot, request.home, request.knownScripts, request.task, request.sessionTempDirs]);
  const live = id => identifier(id) && isLive(id);
  const store = (id, create = false) => {
    if (sessions.has(id) && !live(id)) sessions.delete(id);
    if (!sessions.has(id) && create) sessions.set(id, { entries: [], counts: { total: 0, allow: 0, checkpoint: 0, deny: 0, defer: 0 }, reasons: {}, seq: 0, resolved: new Map() });
    return sessions.get(id);
  };
  const prune = () => { for (const id of [...sessions.keys()]) if (!live(id)) sessions.delete(id); };
  // Replay fence: ids only (id -> final state and decision kind), bounded and separate from the 100-entry history.
  // Ids evicted beyond `resolvedLimit` can no longer be recognised: ids are host-chosen and unordered, so there is nothing to compare a floor against.
  const markResolved = (id, entry) => {
    const s = sessions.get(id);
    if (!s) return;
    s.resolved.delete(entry.requestId);
    s.resolved.set(entry.requestId, { state: entry.state, decision: entry.decision });
    while (s.resolved.size > resolvedLimit) s.resolved.delete(s.resolved.keys().next().value);
  };
  const find = (id, requestId) => {
    if (!live(id)) { sessions.delete(id); return { error: 'session_not_live' }; }
    const s = sessions.get(id);
    const entry = s?.entries.findLast(e => e.requestId === requestId);
    if (entry) return { entry };
    const gone = s?.resolved.get(requestId);
    return gone ? { entry: { requestId, ...gone }, evicted: true } : { error: 'unknown_decision' };
  };
  const stale = (entry, reasonCode) => { entry.state = 'stale'; entry.staleReason = reasonCode; return { accepted: false, reasonCode }; };
  const revalidate = (id, entry, request) => {
    if (getMode(id) !== entry.mode || getEpoch(id) !== entry.epoch) return stale(entry, 'stale_mode_changed');
    if (mac(normalizeSettings(currentSettings())) !== entry.policy) return stale(entry, 'stale_policy_changed');
    if (request !== undefined && fingerprint(request) !== entry.fp) return stale(entry, 'stale_request_changed');
    return null;
  };
  const pub = e => ({ seq: e.seq, requestId: e.requestId, at: e.at, mode: e.mode, decision: e.decision, reasonCode: e.reasonCode, effects: [...e.effects], state: e.state });
  return {
    evaluate(sessionId, request) {
      if (!live(sessionId)) { sessions.delete(sessionId); return result('defer', 'session_not_live'); }
      if (!isRecord(request) || request.kind !== 'command') return result('defer', 'not_command_request');
      if (!identifier(request.id)) return result('defer', 'invalid_request');
      prune(); // sessions that closed meanwhile are dropped without being read again
      const s = store(sessionId, true);
      if (s.resolved.has(request.id)) return { ...result('defer', 'invalid_request'), reasonCode: 'request_id_reused', reason: 'The request id was already resolved or executed.' };
      const prior = s.entries.findLast(e => e.requestId === request.id);
      if (prior && ['claimed', 'cancelled', 'rejected'].includes(prior.state)) return { ...result('defer', 'invalid_request'), reasonCode: 'request_id_reused', reason: 'The request id was already resolved or executed.' };
      if (prior && prior.state !== 'superseded') prior.state = 'superseded';
      const mode = getMode(sessionId) ?? 'ask';
      const policySettings = currentSettings();
      const decision = decide({ mode, request, settings: policySettings });
      const entry = { seq: ++s.seq, requestId: request.id, at: now(), mode, decision: decision.decision, reasonCode: decision.reasonCode, effects: [...decision.effects],
        state: decision.decision === 'allow' || decision.decision === 'checkpoint' ? 'pending' : 'final', epoch: getEpoch(sessionId), fp: fingerprint(request), policy: mac(normalizeSettings(policySettings)) };
      s.entries.push(entry); s.counts.total++; s.counts[entry.decision]++;
      s.reasons[entry.reasonCode] = (s.reasons[entry.reasonCode] || 0) + 1;
      while (s.entries.length > limit) s.entries.shift();
      return decision;
    },
    authorize(sessionId, requestId, { request } = {}) {
      const found = find(sessionId, requestId);
      if (found.error) return { accepted: false, reasonCode: found.error };
      const e = found.entry;
      const closed = { cancelled: 'cancelled', claimed: 'already_claimed', rejected: 'rejected', superseded: 'superseded' }[e.state];
      if (closed) return { accepted: false, reasonCode: closed };
      if (e.state === 'stale') return { accepted: false, reasonCode: e.staleReason };
      if (e.state === 'final') return { accepted: false, reasonCode: e.decision === 'deny' ? 'denied' : 'deferred' };
      if (!isRecord(request)) return { accepted: false, reasonCode: 'invalid_request' };
      const stalled = revalidate(sessionId, e, request);
      if (stalled) return stalled;
      if (e.decision === 'checkpoint' && e.state !== 'approved') return { accepted: false, reasonCode: 'checkpoint_unresolved' };
      e.state = 'claimed'; markResolved(sessionId, e);
      return { accepted: true, reasonCode: 'claimed' };
    },
    resolveCheckpoint(sessionId, requestId, { approved } = {}) {
      const found = find(sessionId, requestId);
      if (found.error) return { accepted: false, reasonCode: found.error };
      const e = found.entry;
      if (e.state === 'cancelled') return { accepted: false, reasonCode: 'cancelled' };
      if (e.decision !== 'checkpoint') return { accepted: false, reasonCode: 'not_a_checkpoint' };
      if (['approved', 'rejected', 'claimed'].includes(e.state)) return { accepted: false, reasonCode: 'already_resolved' };
      if (e.state === 'superseded') return { accepted: false, reasonCode: 'superseded' };
      if (e.state === 'stale') return { accepted: false, reasonCode: e.staleReason };
      if (typeof approved !== 'boolean') return { accepted: false, reasonCode: 'invalid_approval' };
      const stalled = revalidate(sessionId, e);
      if (stalled) return stalled;
      e.state = approved ? 'approved' : 'rejected'; // affects only this request: nothing persistent changes
      if (!approved) markResolved(sessionId, e);
      return { accepted: true, reasonCode: e.state };
    },
    cancel(sessionId, requestId) {
      const found = find(sessionId, requestId);
      if (found.error) return { accepted: false, reasonCode: found.error };
      const e = found.entry;
      if (e.state === 'cancelled') return { accepted: true, reasonCode: 'cancelled' };
      if (e.state === 'claimed') return { accepted: false, reasonCode: 'already_claimed' };
      if (e.state !== 'pending' && e.state !== 'approved') return { accepted: false, reasonCode: 'not_pending' };
      e.state = 'cancelled'; markResolved(sessionId, e);
      return { accepted: true, reasonCode: 'cancelled' };
    },
    redacted(id) {
      const s = store(id);
      return { counts: { ...s?.reasons }, entries: (s?.entries ?? []).slice(-100).map(e => ({ at: e.at, mode: e.mode, decision: e.decision, reasonCode: e.reasonCode, fingerprint: e.fp })) };
    },
    history: id => store(id)?.entries.map(pub) ?? [],
    counts: id => ({ ...(store(id)?.counts ?? { total: 0, allow: 0, checkpoint: 0, deny: 0, defer: 0 }) }),
    /** Drops history, counts and pending decisions but keeps the ids-only replay fence (an explicit mode reset must not reopen resolved ids). */
    reset: id => { const s = sessions.get(id); if (s) { s.entries = []; s.reasons = {}; s.counts = { total: 0, allow: 0, checkpoint: 0, deny: 0, defer: 0 }; } },
    closeSession: id => { sessions.delete(id); },
    clear: () => sessions.clear(),
    resolvedCount: id => sessions.get(id)?.resolved.size ?? 0,
    sessionCount: () => sessions.size,
  };
}
