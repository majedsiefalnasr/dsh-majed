/**
 * Deterministic approval classifier for shell commands (no LLM, no network).
 *
 * Verdicts:
 *   'allow' — every part is positively recognised as non-destructive and contained
 *   'ask'   — unknown / ambiguous: a human decides (the default for anything not recognised)
 *   'deny'  — matches a hard rule (destroys data, rewrites shared history, leaks secrets, escalates the
 *             machine); never auto-approved, even in "aggressive" mode's sibling "safe" mode.
 *
 * Principles (from Claude Code auto mode, Codex `is_safe_command`, anumati, Qwen auto-mode docs):
 *  - judge real effect, not surface text: a chain is safe only if EVERY segment is safe;
 *  - allow-list by shape (program + sub-command + flags), never "anything except X";
 *  - command substitution, eval, process substitution, here-docs and unknown redirects => not provable => ask;
 *  - hard-deny the irreversible / shared-state / secret / persistence classes regardless of intent.
 *
 * The module is plain ES5-ish JS so it can be inlined into the browser client and unit-tested in Node.
 */

/* ─────────────────────────── tokenizer ─────────────────────────── */

/** Split a command line into top-level segments + words. Returns null when the line is not statically analysable. */
function parse(line) {
  const segments = [];       // { words: string[], op: string|null (operator that FOLLOWS), redirects: string[] }
  let words = [], cur = '', has = false, quote = null, i = 0;
  let redirects = [];
  const pushWord = () => { if (has) { words.push(cur); cur = ''; has = false; } };
  const pushSeg = (op) => { pushWord(); if (words.length || redirects.length || op) segments.push({ words, op, redirects }); words = []; redirects = []; };
  const n = line.length;
  while (i < n) {
    const c = line[i];
    if (quote === "'") { if (c === "'") quote = null; else { cur += c; has = true; } i++; continue; }
    if (quote === '"') {
      if (c === '"') { quote = null; i++; continue; }
      if (c === '\\' && i + 1 < n) { cur += line[i + 1]; has = true; i += 2; continue; }
      if (c === '$' && (line[i + 1] === '(' || line[i + 1] === '{')) return null;   // substitution / expansion with code
      if (c === '`') return null;
      cur += c; has = true; i++; continue;
    }
    if (c === "'" || c === '"') { quote = c; has = true; i++; continue; }
    if (c === '\\') { if (i + 1 < n) { cur += line[i + 1]; has = true; i += 2; continue; } return null; }
    if (c === '`') return null;
    if (c === '$' && (line[i + 1] === '(' || line[i + 1] === '{')) return null;
    if ((c === '<' || c === '>') && line[i + 1] === '(') return null;               // process substitution
    if (c === '<' && line[i + 1] === '<') return null;                              // here-doc / here-string
    if (c === '\n' || c === ';') { pushSeg(c === ';' ? ';' : '\n'); i++; continue; }
    if (c === '&') {
      if (line[i + 1] === '&') { pushSeg('&&'); i += 2; continue; }
      if (line[i - 1] === '>' || line[i + 1] === '>') { cur += c; has = true; i++; continue; }  // 2>&1, &>
      pushSeg('&'); i++; continue;
    }
    if (c === '|') {
      if (line[i + 1] === '|') { pushSeg('||'); i += 2; continue; }
      pushSeg('|'); i++; continue;
    }
    if (c === ' ' || c === '\t') { pushWord(); i++; continue; }
    if (c === '>' || c === '<') {
      // redirection: capture target word
      pushWord();
      let op = c; i++;
      if (line[i] === '>') { op += '>'; i++; }
      if (line[i] === '&') { op += '&'; i++; }
      while (line[i] === ' ') i++;
      let target = '';
      while (i < n && !/[\s;&|<>]/.test(line[i])) { target += line[i]; i++; }
      redirects.push(op + target);
      continue;
    }
    cur += c; has = true; i++;
  }
  if (quote) return null;
  pushSeg(null);
  return segments.filter((s) => s.words.length || s.redirects.length);
}

/* ─────────────────────────── helpers ─────────────────────────── */

const SECRET_PATH = /(^|\/)(\.ssh|\.aws|\.gnupg|\.kube|\.docker\/config\.json|\.netrc|\.npmrc|\.pypirc|id_(rsa|ed25519|ecdsa|dsa)|\.env(\.[\w.-]+)?|credentials(\.json)?|secrets?(\.[\w]+)?|[\w.-]*\.(pem|key|p12|pfx|keystore))$/i;
const SECRET_CONTAINS = /(\.ssh\/|\.aws\/|\.gnupg\/|Library\/Keychains|\/etc\/(shadow|sudoers)|keychain)/i;
function touchesSecret(w) { return SECRET_PATH.test(w) || SECRET_CONTAINS.test(w); }

function basename(p) { const m = /([^/]+)$/.exec(p); return m ? m[1] : p; }

/** Strip leading env assignments (FOO=bar cmd) and harmless wrappers. Returns { env, words } or null if env sets code-affecting vars. */
const DANGEROUS_ENV = /^(LD_PRELOAD|LD_LIBRARY_PATH|DYLD_[A-Z_]+|PATH|NODE_OPTIONS|PYTHONPATH|PYTHONSTARTUP|BASH_ENV|ENV|PROMPT_COMMAND|GIT_SSH_COMMAND|GIT_EXTERNAL_DIFF|GIT_PAGER|GIT_ASKPASS|SSH_ASKPASS|EDITOR|VISUAL|PAGER|SHELL|HOME)$/;
function stripPrefix(words) {
  let i = 0;
  while (i < words.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(words[i])) {
    if (DANGEROUS_ENV.test(words[i].split('=')[0])) return null;
    i++;
  }
  let w = words.slice(i);
  for (;;) {
    if (w[0] === 'time' || w[0] === 'command' || w[0] === 'builtin' || w[0] === 'nohup') { w = w.slice(1); continue; }
    if (w[0] === 'env') { // env with no assignments/options only
      if (w.length > 1 && !/^-/.test(w[1]) && !/=/.test(w[1])) { w = w.slice(1); continue; }
      return null;
    }
    if (w[0] === 'timeout' && w.length > 2 && /^[\d.]+[smhd]?$/.test(w[1])) { w = w.slice(2); continue; }
    break;
  }
  return w;
}

function hasAny(words, set) { return words.some((x) => set.has(x)); }
const setOf = (...a) => new Set(a);

/* ─────────────────────────── hard-deny rules ─────────────────────────── */

/** @returns reason string when the SEGMENT (already prefix-stripped) is a hard-deny, else null */
function hardDenySegment(w, ctx) {
  const cmd = basename(w[0]);
  const args = w.slice(1);
  const joined = w.join(' ');

  // privilege / system
  if (['sudo', 'su', 'doas', 'pkexec', 'launchctl', 'systemctl', 'service', 'crontab', 'at', 'passwd', 'chown', 'chgrp', 'mount', 'umount', 'diskutil', 'fdisk', 'mkfs', 'dd', 'shutdown', 'reboot', 'halt', 'killall', 'pkill', 'kill', 'csrutil', 'spctl', 'defaults', 'scutil', 'networksetup', 'pmset', 'sysctl', 'visudo', 'useradd', 'userdel', 'dscl', 'security', 'osascript'].includes(cmd)) return `system/privilege command: ${cmd}`;
  if (cmd === 'chmod' && (args.includes('-R') || args.some((a) => /^[0-7]*7[0-7]*7$/.test(a) || a === 'u+s' || a === 'g+s' || a === '+s' || a === 'a+rwx' || a === '777'))) return 'dangerous chmod';
  // destructive filesystem
  if (cmd === 'rm' || cmd === 'rmdir' || cmd === 'unlink' || cmd === 'shred' || cmd === 'srm' || cmd === 'trash') {
    // recursive or force deletes, or anything pointing outside the project / at home, root, or wildcards at top level
    const rec = args.some((a) => /^-[a-zA-Z]*[rRf][a-zA-Z]*$/.test(a) || a === '--recursive' || a === '--force');
    const targets = args.filter((a) => !a.startsWith('-'));
    const outside = targets.some((t) => t === '/' || t === '~' || t.startsWith('~/') || t.startsWith('/') || t === '.' || t === '..' || t.startsWith('../') || /^\*+$/.test(t) || t === './*' || /\$/.test(t));
    if (rec || outside || cmd !== 'rm') return `destructive delete (${cmd})`;
  }
  if (cmd === 'find' && args.some((a) => ['-delete', '-exec', '-execdir', '-ok', '-okdir', '-fprint', '-fprint0', '-fprintf', '-fls'].includes(a))) return 'find with delete/exec';
  if (cmd === 'truncate' || cmd === 'mv' && targetsOutside(args)) return `${cmd} touching paths outside the project`;
  // git: history rewrite, shared state, secrets
  if (cmd === 'git') {
    const sub = gitSub(args);
    if (sub) {
      const rest = sub.rest;
      if (sub.name === 'push') {
        const force = rest.some((a) => a === '-f' || a === '--force' || a.startsWith('--force-with-lease') || a === '--mirror' || a === '--delete' || a === '-d' || /^\+/.test(a) || /^:/.test(a));
        const toProtected = rest.some((a) => /(^|[:/ ])(main|master|develop|trunk|release[\w/.-]*|production|prod)$/i.test(a));
        if (force) return 'git push with force/delete';
        if (toProtected) return 'git push to a protected branch';
        return null; // plain push is "ask", not hard-deny
      }
      if (sub.name === 'reset' && rest.includes('--hard')) return 'git reset --hard (discards work)';
      if (sub.name === 'clean' && rest.some((a) => /^-[a-z]*[fdx][a-z]*$/i.test(a))) return 'git clean (deletes untracked files)';
      if (sub.name === 'checkout' && (rest.includes('--') && rest.includes('.') || rest.includes('-f') || rest.includes('--force'))) return 'git checkout discarding changes';
      if (sub.name === 'restore' && !rest.includes('--staged')) return 'git restore discarding changes';
      if (sub.name === 'stash' && ['drop', 'clear'].includes(rest[0])) return 'git stash drop/clear';
      if (sub.name === 'branch' && rest.some((a) => a === '-D' || a === '--delete' && rest.includes('--force'))) return 'git branch -D';
      if (['filter-branch', 'filter-repo', 'update-ref', 'reflog'].includes(sub.name) && (sub.name !== 'reflog' || ['expire', 'delete'].includes(rest[0]))) return `git ${sub.name} (history rewrite)`;
      if (sub.name === 'gc' && rest.some((a) => a.startsWith('--prune'))) return 'git gc --prune';
      if (sub.name === 'config' && rest.some((a) => /^(--global|--system)$/.test(a))) return 'git config global/system';
      if (rest.some((a) => a === '--no-verify' || a === '--no-gpg-sign' || a === '-n' && sub.name === 'commit')) return 'bypasses git hooks/signing';
    }
  }
  // GitHub CLI: shared-state & destructive
  if (cmd === 'gh') {
    const a = args.filter((x) => !x.startsWith('-'));
    if (a[0] === 'repo' && ['delete', 'archive', 'rename', 'edit', 'transfer'].includes(a[1])) return `gh repo ${a[1]}`;
    if (a[0] === 'secret' || a[0] === 'auth' && ['logout', 'token', 'refresh', 'login'].includes(a[1]) || a[0] === 'ssh-key' || a[0] === 'gpg-key' || a[0] === 'codespace' && a[1] === 'delete') return `gh ${a[0]} ${a[1] || ''}`.trim();
    if (a[0] === 'pr' && ['merge', 'close'].includes(a[1]) || a[0] === 'release' && ['create', 'delete'].includes(a[1]) || a[0] === 'workflow' && ['run', 'enable', 'disable'].includes(a[1]) || a[0] === 'run' && ['cancel', 'delete', 'rerun'].includes(a[1])) return `gh ${a[0]} ${a[1]} (affects shared state)`;
    if (a[0] === 'api') {
      const m = /(?:^|\s)(-X|--method)[ =]?(\w+)/i.exec(joined);
      if (m && m[2].toUpperCase() !== 'GET') return 'gh api non-GET';
      if (args.some((x) => x === '-f' || x === '-F' || x === '--field' || x === '--raw-field' || x === '--input')) return 'gh api with request body (implies POST)';
    }
  }
  // package publication / registry
  if (['npm', 'pnpm', 'yarn', 'bun'].includes(cmd) && args.some((a) => ['publish', 'unpublish', 'deprecate', 'login', 'adduser', 'token', 'owner', 'access', 'dist-tag'].includes(a))) return `${cmd} registry action`;
  if (cmd === 'twine' || cmd === 'cargo' && args[0] === 'publish' || cmd === 'gem' && args[0] === 'push') return 'package publish';
  // infra & containers & cloud
  if (['terraform', 'tofu', 'pulumi'].includes(cmd) && args.some((a) => ['apply', 'destroy', 'import', 'state', 'taint', 'untaint', 'up', 'refresh'].includes(a))) return `${cmd} mutating`;
  if (cmd === 'kubectl' && args.some((a) => ['delete', 'apply', 'replace', 'patch', 'drain', 'cordon', 'scale', 'rollout', 'exec', 'cp', 'edit', 'create', 'run', 'annotate', 'label', 'set'].includes(a))) return 'kubectl mutating';
  if (cmd === 'helm' && args.some((a) => ['install', 'upgrade', 'uninstall', 'rollback', 'delete'].includes(a))) return 'helm mutating';
  if (['aws', 'gcloud', 'az', 'doctl', 'heroku', 'vercel', 'netlify', 'flyctl', 'fly', 'wrangler', 'firebase', 'supabase', 'railway', 'stripe'].includes(cmd) && !args.some((a) => ['--version', '--help', 'help', 'version'].includes(a))) return `cloud CLI (${cmd})`;
  if (cmd === 'docker' || cmd === 'podman') {
    const a = args.filter((x) => !x.startsWith('-'));
    if (['rm', 'rmi', 'system', 'volume', 'network', 'prune', 'kill', 'push', 'login', 'logout', 'exec', 'cp', 'commit', 'run', 'compose', 'stop', 'restart'].includes(a[0]) || args.includes('--privileged') || args.some((x) => x.startsWith('-v') || x === '--volume' || x === '--mount')) return `${cmd} mutating`;
  }
  // databases
  if (['psql', 'mysql', 'mysqldump', 'mongosh', 'mongo', 'redis-cli', 'sqlite3', 'mariadb', 'pg_dump', 'pg_restore', 'dropdb', 'createdb'].includes(cmd) && /DROP|DELETE|TRUNCATE|UPDATE|INSERT|ALTER|GRANT|FLUSH|--eval|-c\s/i.test(joined)) return 'database write';
  // exfiltration / downloads executed / raw network
  if (['nc', 'ncat', 'netcat', 'socat', 'telnet', 'ssh', 'scp', 'sftp', 'rsync', 'ftp', 'tftp', 'sshpass', 'ngrok', 'cloudflared', 'tailscale', 'wg', 'openssl', 'nmap', 'masscan', 'tcpdump', 'dig', 'nslookup', 'whois', 'ping', 'traceroute', 'mitmproxy'].includes(cmd) && !['ping'].includes(cmd)) return `network/remote tool: ${cmd}`;
  if (['curl', 'wget', 'http', 'https', 'httpie', 'aria2c', 'xh'].includes(cmd) && !(cmd === 'wget' && !args.some((a) => /^(--post|--body|--header|--user|--password|--load-cookies|--certificate|--private-key)/.test(a) || a === '-U' && false))) {
    const upload = args.some((a) => ['-d', '--data', '--data-binary', '--data-raw', '--data-urlencode', '-F', '--form', '-T', '--upload-file', '-X', '--request', '--post-data', '--post-file', '--method', '-u', '--user', '-H', '--header', '--cookie', '-b', '--output', '-o', '-O', '--remote-name'].includes(a) || /^-(?:[a-zA-Z]*[dFTXuHbo])$/.test(a) || a.startsWith('--data') || a.startsWith('--form') || a.startsWith('--post'));
    if (upload) return `${cmd} with body/auth/output (possible exfiltration or download)`;
    // plain GET without options is classed in `allow` rules (read-only fetch of a URL), not here
  }
  // secrets read or modified
  if (w.some((x) => touchesSecret(x)) && !['ls', 'stat', 'file', 'test', '[', 'git'].includes(cmd)) return 'touches secrets or credentials';
  if (['security', 'op', 'gpg', 'pass', 'vault', 'doppler', 'sops', 'age', 'keychain', 'ssh-add', 'ssh-keygen', 'ssh-agent'].includes(cmd)) return `credential tool: ${cmd}`;
  // shell indirection that hides what runs
  if (['eval', 'exec', 'source', '.', 'xargs', 'parallel', 'watch', 'script', 'expect', 'screen', 'tmux', 'disown', 'setsid', 'trap', 'alias', 'unalias', 'export', 'unset', 'umask', 'ulimit', 'complete', 'hash'].includes(cmd) && !(cmd === 'export' && false)) return `shell indirection/state change: ${cmd}`;
  const SHELLS = ['sh', 'bash', 'zsh', 'fish', 'dash', 'ksh', 'csh', 'tcsh'];
  if (SHELLS.includes(cmd) && args.some((a) => /^-[a-zA-Z]*c$/.test(a) || a === '--command' || a === '-')) return 'nested shell -c';
  // `... | sh` / `... | python`: code arriving on stdin is executed without being inspected
  if ((SHELLS.includes(cmd) || ['python', 'python3', 'node', 'ruby', 'perl', 'php', 'deno', 'bun'].includes(cmd)) && args.every((a) => a.startsWith('-')) && ctx && ctx.piped) return `pipes data into ${cmd} (executes it)`;
  if (['python', 'python3', 'python2', 'node', 'nodejs', 'deno', 'bun', 'ruby', 'perl', 'php', 'lua', 'osascript', 'pwsh', 'powershell', 'Rscript', 'julia', 'swift', 'go'].includes(cmd) && args.some((a) => /^(-c|-e|-E|-r|--eval|-p|--print|-x)$/.test(a) || a === 'run' && cmd === 'go' || a === '-')) return `inline code via ${cmd}`;
  // launching / mac side effects
  if (['open', 'xdg-open', 'pbcopy', 'pbpaste', 'say', 'afplay', 'screencapture', 'caffeinate', 'ditto', 'hdiutil', 'installer', 'pkgutil', 'brew', 'port', 'apt', 'apt-get', 'yum', 'dnf', 'pacman', 'snap', 'pip', 'pip3', 'pipx', 'conda', 'gem', 'cpan', 'cargo'].includes(cmd) && !(cmd === 'cargo' && ['build', 'check', 'test', 'fmt', 'clippy', 'doc', 'tree', 'metadata', 'bench'].includes(args[0])) && !(cmd === 'brew' && ['list', 'info', 'search', 'outdated', 'deps', 'config', '--version'].includes(args[0])) && !(['pip', 'pip3'].includes(cmd) && ['list', 'show', 'freeze', 'check', '--version', 'index'].includes(args[0]))) return `system/package manager: ${cmd}`;
  // writing outside project via tee / sed -i / dd of=
  if (cmd === 'tee' && args.some((a) => !a.startsWith('-') && (a.startsWith('/') || a.startsWith('~') || a.startsWith('..')))) return 'tee outside project';
  return null;
}

function targetsOutside(args) {
  return args.filter((a) => !a.startsWith('-')).some((t) => t.startsWith('/') || t.startsWith('~') || t.startsWith('..') || /\$/.test(t));
}

/** Locate the git sub-command skipping global options (-C <dir>, -c k=v, --git-dir=…, --no-pager …). */
function gitSub(args) {
  let i = 0;
  while (i < args.length) {
    const a = args[i];
    if (a === '-C' || a === '-c' || a === '--git-dir' || a === '--work-tree' || a === '--namespace' || a === '--exec-path') { i += 2; continue; }
    if (a.startsWith('--git-dir=') || a.startsWith('--work-tree=') || a.startsWith('--exec-path=') || a.startsWith('--namespace=')) { i++; continue; }
    if (a.startsWith('-')) { i++; continue; }
    return { name: a, rest: args.slice(i + 1), globals: args.slice(0, i) };
  }
  return null;
}
function gitHasUnsafeGlobals(globals) {
  for (let i = 0; i < globals.length; i++) {
    const a = globals[i];
    if (a === '-c') { const v = globals[i + 1] || ''; if (/^(core\.(pager|editor|sshcommand|fsmonitor|hookspath|askpass)|alias\.|credential\.|protocol\.|http\.|url\.|diff\.external|filter\.|include|receive\.|uploadpack\.)/i.test(v)) return true; i++; continue; }
    if (a === '--exec-path' || a.startsWith('--exec-path') || a === '--git-dir' || a.startsWith('--git-dir=') || a === '--work-tree' || a.startsWith('--work-tree=')) return true;
  }
  return false;
}

/* ─────────────────────────── allow rules ─────────────────────────── */

const READ_ONLY = setOf('ls', 'll', 'la', 'dir', 'pwd', 'cat', 'bat', 'head', 'tail', 'less', 'more', 'wc', 'nl', 'tac', 'rev', 'cut', 'sort', 'uniq', 'tr', 'fold', 'fmt', 'column', 'paste', 'comm', 'join', 'diff', 'cmp', 'basename', 'dirname', 'realpath', 'readlink', 'stat', 'file', 'du', 'df', 'tree', 'which', 'whereis', 'type', 'whoami', 'id', 'hostname', 'uname', 'date', 'uptime', 'arch', 'nproc', 'echo', 'printf', 'true', 'false', 'test', '[', 'sleep', 'seq', 'expr', 'md5', 'md5sum', 'shasum', 'sha1sum', 'sha256sum', 'cksum', 'b2sum', 'strings', 'hexdump', 'od', 'xxd', 'jq', 'yq', 'rg', 'ag', 'fd', 'fdfind', 'locate', 'grep', 'egrep', 'fgrep', 'zgrep', 'wc', 'env', 'printenv', 'ps', 'lsof', 'top', 'cd', 'pushd', 'popd', 'dirs', 'man', 'help', 'info', 'tldr', 'cal', 'bc', 'dc', 'tput', 'clear', 'lscpu', 'free', 'vm_stat', 'sw_vers', 'ioreg', 'system_profiler');
// printenv/env/ps/lsof may print secrets in env; keep but they are read-only to the machine. Output is local only.

/** programs whose output could be redirected harmfully are handled by redirect rules below. */
function safeFind(args) { return !args.some((a) => ['-delete', '-exec', '-execdir', '-ok', '-okdir', '-fprint', '-fprint0', '-fprintf', '-fls'].includes(a)); }
function safeSed(args) { return !args.some((a) => a === '-i' || a.startsWith('-i') || a === '--in-place' || a === '-f' || a === '--file' || a === 'w' || /(^|;|\s)[wWeE]\s/.test(a) || /\/[gI]*[we]\b/.test(a) && /s\//.test(a)); }
function safeAwk(args) { return !args.some((a) => /system\s*\(|getline\s*<|>\s*"|print\s*>|\|\s*"|-f\b/.test(a)) && !args.includes('-f'); }
function safeSort(args) { return !args.some((a) => a === '-o' || a.startsWith('--output') || a.startsWith('-o')); }
function safeTree(args) { return !args.some((a) => a === '-o'); }

const GIT_READ = setOf('status', 'log', 'diff', 'show', 'blame', 'shortlog', 'describe', 'rev-parse', 'rev-list', 'ls-files', 'ls-tree', 'ls-remote', 'cat-file', 'grep', 'remote', 'config', 'branch', 'tag', 'stash', 'reflog', 'for-each-ref', 'show-ref', 'name-rev', 'merge-base', 'whatchanged', 'count-objects', 'fsck', 'check-ignore', 'check-attr', 'var', 'version', 'help', 'diff-tree', 'diff-index', 'diff-files', 'ls-remote', 'show-branch', 'verify-commit', 'verify-tag', 'worktree', 'submodule', 'fetch', 'add', 'restore', 'commit', 'switch', 'checkout', 'pull', 'merge', 'rebase', 'cherry-pick', 'mv', 'apply', 'format-patch', 'archive', 'bisect', 'revert', 'notes', 'sparse-checkout', 'maintenance', 'gc', 'prune', 'rm', 'init', 'clone', 'push');
// Which git sub-commands are acceptable without a human, and under which flags:
function gitAllowed(sub) {
  const s = sub.name, r = sub.rest;
  const noFlags = (allowed) => r.every((a) => !a.startsWith('-') || allowed.test(a));
  switch (s) {
    case 'status': case 'log': case 'diff': case 'show': case 'blame': case 'shortlog': case 'describe': case 'rev-parse': case 'rev-list': case 'ls-files': case 'ls-tree': case 'cat-file': case 'grep': case 'for-each-ref': case 'show-ref': case 'name-rev': case 'merge-base': case 'whatchanged': case 'count-objects': case 'check-ignore': case 'check-attr': case 'var': case 'version': case 'help': case 'diff-tree': case 'diff-index': case 'diff-files': case 'show-branch': case 'verify-commit': case 'verify-tag':
      return !r.some((a) => a === '--output' || a.startsWith('--output=') || a === '--ext-diff' || a === '--textconv' && false || a === '--open-files-in-pager' || a.startsWith('--open-files-in-pager'));
    case 'ls-remote': return r.every((a) => !a.startsWith('-') || /^(--heads|--tags|--refs|-h|-t|--symref|--get-url)$/.test(a));
    case 'fsck': return r.every((a) => !a.startsWith('-') || /^(--no-progress|--connectivity-only|--full|--strict|--unreachable|--lost-found)$/.test(a)) && !r.includes('--lost-found');
    case 'remote': return r.length === 0 || r[0] === '-v' || r[0] === 'show' || r[0] === 'get-url';
    case 'config': return r.some((a) => a === '--get' || a === '--get-all' || a === '--list' || a === '-l' || a === '--get-regexp') && !r.some((a) => ['--global', '--system', '--unset', '--add', '--replace-all', '--edit', '-e', '--file', '-f'].includes(a));
    case 'branch': return r.length === 0 || r.every((a) => ['--list', '-l', '--show-current', '-a', '--all', '-r', '--remotes', '-v', '-vv', '--verbose', '--contains', '--merged', '--no-merged'].includes(a) || a.startsWith('--format=') || a.startsWith('--sort='));
    case 'tag': return r.length === 0 || r.every((a) => ['-l', '--list', '-n'].includes(a) || a.startsWith('--sort=') || a.startsWith('--format=') || a === '--contains' || a === '--merged') || (r[0] === '-l' || r[0] === '--list');
    case 'stash': return r[0] === 'list' || r[0] === 'show';
    case 'reflog': return r.length === 0 || r[0] === 'show' || r[0] === 'list' || (r[0].startsWith('-') ) && !['expire', 'delete'].includes(r[0]);
    case 'worktree': return r[0] === 'list';
    case 'submodule': return r[0] === 'status' || r[0] === 'summary' || r[0] === 'foreach' && false;
    case 'notes': return r[0] === 'list' || r[0] === 'show';
    case 'bisect': return r[0] === 'log' || r[0] === 'visualize' && false;
    // local, reversible, contained repo mutations (no remote effect, nothing is destroyed; git keeps the objects)
    case 'add': return !r.some((a) => a === '-f' || a === '--force' || a === '--ignore-errors') && !r.some((a) => touchesSecret(a));
    case 'commit': return !r.some((a) => a === '--no-verify' || a === '-n' || a === '--no-gpg-sign' || a === '--amend' || a === '--allow-empty-message' || a === '-C' && false) && !r.some((a) => touchesSecret(a));
    case 'fetch': return !r.some((a) => a === '--prune' || a === '-p' || a === '--force' || a === '-f' || a === '--update-head-ok' || a === '--upload-pack' || a.startsWith('--upload-pack='));
    case 'switch': case 'checkout': return !r.some((a) => a === '-f' || a === '--force' || a === '--discard-changes' || a === '--' || a === '--orphan' || a === '-B' && false) && !r.includes('.') ;
    case 'restore': return r.includes('--staged') && !r.includes('--worktree') && !r.includes('-W');
    case 'merge': return r.includes('--no-commit') || r.includes('--ff-only') || r.includes('--abort') || r.includes('--no-ff') && false;
    case 'cherry-pick': case 'revert': return r.includes('--no-commit') || r.includes('-n') || r.includes('--abort') || r.includes('--quit');
    case 'rebase': return r.includes('--abort') || r.includes('--continue') && false || r.includes('--quit');
    case 'format-patch': return !r.some((a) => a === '-o' || a.startsWith('--output-directory') || a === '--stdout' && false) || true;
    case 'archive': return !r.some((a) => a === '-o' || a.startsWith('--output') || a.startsWith('--remote'));
    case 'mv': return !targetsOutside(r);
    case 'rm': return r.includes('--cached') && !r.some((a) => a === '-f' || a === '--force' || a === '-r' || a === '-R' || a === '--') ;
    case 'init': return !r.some((a) => a.startsWith('--template') || a.startsWith('--separate-git-dir')) && !targetsOutside(r);
    case 'clone': return false;   // network + arbitrary hooks/code from elsewhere => ask
    case 'pull': return false;    // merges remote code into the working tree => ask
    case 'push': return false;    // shared state => ask (force/protected are hard-denied earlier)
    case 'apply': return r.includes('--check') || r.includes('--stat') || r.includes('--numstat') || r.includes('--summary');
    case 'gc': case 'prune': case 'maintenance': case 'sparse-checkout': return false;
    default: return false;
  }
}

/** Package scripts and toolchains: contained to the project; run project code but that is what the user asked to do. */
const SAFE_NPM_SCRIPTS = setOf('test', 'lint', 'typecheck', 'type-check', 'build', 'check', 'format', 'fmt', 'format:check', 'lint:fix', 'coverage', 'test:unit', 'test:coverage', 'test:e2e', 'tsc', 'compile', 'validate', 'verify', 'docs', 'dev:check');
function nodeAllowed(cmd, args) {
  const a = args.filter((x) => !x.startsWith('-'));
  if (['npm', 'pnpm', 'yarn', 'bun'].includes(cmd)) {
    const sub = a[0];
    if (['ls', 'list', 'll', 'why', 'outdated', 'view', 'info', 'show', 'explain', 'audit', 'root', 'bin', 'prefix', 'config', 'pack'].includes(sub)) return sub !== 'config' || args.includes('get') || args.includes('list');
    if (['test', 't', 'tst'].includes(sub)) return true;
    if (sub === 'run' || sub === 'run-script') return SAFE_NPM_SCRIPTS.has(a[1]) || /^(test|lint|build|typecheck|check|format)(:|$)/.test(a[1] || '');
    if (cmd !== 'npm' && SAFE_NPM_SCRIPTS.has(sub)) return true;    // pnpm test, yarn build, bun test …
    if (sub === 'install' || sub === 'i' || sub === 'ci') return false; // downloads + runs install scripts => ask
    return false;
  }
  if (cmd === 'npx' || cmd === 'pnpx') return ['tsc', 'eslint', 'prettier', 'vitest', 'jest', 'biome', 'tsx' && false, 'markdownlint', 'stylelint', 'knip', 'depcheck'].includes(a[0]) && !args.some((x) => ['--fix' , '-w', '--write'].includes(x) && false);
  if (['tsc', 'eslint', 'prettier', 'vitest', 'jest', 'biome', 'playwright', 'cypress', 'mocha', 'ava', 'tap', 'stylelint', 'markdownlint', 'knip'].includes(cmd)) return !args.some((x) => ['--init', 'install', '--install'].includes(x));
  if (['node', 'deno', 'bun'].includes(cmd)) return ['--version', '-v', '--help', '-h'].includes(args[0]);
  if (['python', 'python3'].includes(cmd)) return ['--version', '-V', '--help', '-h'].includes(args[0]) || (args[0] === '-m' && ['pytest', 'unittest', 'mypy', 'ruff', 'black', 'flake8', 'pylint', 'pyright', 'compileall', 'json.tool'].includes(args[1]));
  if (['pytest', 'mypy', 'ruff', 'black', 'flake8', 'pylint', 'pyright', 'isort', 'tox', 'nox', 'coverage'].includes(cmd)) return true;
  if (cmd === 'cargo') return ['build', 'check', 'test', 'fmt', 'clippy', 'doc', 'tree', 'metadata', 'bench', 'version', '--version'].includes(args[0]);
  if (cmd === 'go') return ['build', 'test', 'vet', 'fmt', 'list', 'version', 'env', 'mod'].includes(args[0]) && !(args[0] === 'mod' && !['tidy', 'verify', 'graph', 'why'].includes(args[1]));
  if (['make', 'just', 'task', 'gradle', 'gradlew', 'mvn', 'mvnw', 'ant'].includes(cmd)) return args.some((x) => ['test', 'check', 'lint', 'build', 'compile', 'verify', 'typecheck', 'fmt', 'format'].includes(x)) && !args.some((x) => ['install', 'deploy', 'publish', 'release', 'clean', 'upload', 'push'].includes(x));
  if (cmd === 'composer') return ['validate', 'show', 'outdated', 'test', 'lint', 'check-platform-reqs'].includes(args[0]);
  if (cmd === 'php' && args[0] === 'artisan') return ['test', 'about', 'route:list', 'config:show', 'list', '--version', 'env', 'model:show', 'migrate:status', 'schedule:list'].includes(args[1]);
  if (cmd === 'php' || cmd === 'ruby' || cmd === 'perl') return ['--version', '-v'].includes(args[0]);
  if (cmd === 'artisan' || basename(cmd) === 'artisan') return ['test', 'about', 'route:list', 'config:show', 'list', '--version'].includes(args[0]);
  return false;
}

/** HTTP reads: GET with no body/auth/cookies/output to a file, to a public https URL (never localhost/metadata/private). */
function safeFetch(cmd, args) {
  if (!['curl', 'wget'].includes(cmd)) return false;
  const urls = args.filter((a) => /^https?:\/\//i.test(a));
  if (urls.length !== 1) return false;
  const flags = args.filter((a) => a.startsWith('-'));
  const allowed = cmd === 'curl' ? /^(-s|-S|-L|-I|--head|-f|--fail|--silent|--show-error|--location|--compressed|--max-time|-m|--connect-timeout|--retry|-sS|-sSL|-fsSL|-sL|-fsS|-4|-6|--no-progress-meter)$/ : /^(-q|--quiet|-O-|-qO-|--spider|--no-verbose|-nv|--timeout|-T|--tries|-t)$/;
  if (!flags.every((f) => allowed.test(f) || /^--(max-time|connect-timeout|retry|timeout|tries)=\d+$/.test(f))) return false;
  if (cmd === 'wget' && !args.some((a) => a === '-O-' || a === '-qO-' || a === '--spider')) return false; // wget writes files by default
  const host = (/^https?:\/\/([^/:?#]+)/i.exec(urls[0]) || [])[1] || '';
  if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.0\.0\.0|\[?::1|.*\.local$|.*\.internal$|metadata\.google\.internal)/i.test(host)) return false;
  if (!/^https:/i.test(urls[0])) return false;
  return true;
}

/** sed/awk/etc. need arguments checked; other read-only commands need output-redirect control (handled by caller). */
function segmentAllowed(w) {
  const cmd = basename(w[0]);
  const args = w.slice(1);
  if (cmd === 'git') {
    const sub = gitSub(args);
    if (!sub || gitHasUnsafeGlobals(sub.globals)) return false;
    return gitAllowed(sub);
  }
  if (cmd === 'find') return safeFind(args);
  if (cmd === 'sed') return safeSed(args);
  if (cmd === 'awk' || cmd === 'gawk' || cmd === 'mawk') return safeAwk(args);
  if (cmd === 'sort') return safeSort(args);
  if (cmd === 'tree') return safeTree(args);
  if (cmd === 'xargs') return false;
  if (cmd === 'gh') {
    const a = args.filter((x) => !x.startsWith('-'));
    const verb = a[1];
    if (a[0] === 'api') { return !args.some((x) => ['-X', '--method', '-f', '-F', '--field', '--raw-field', '--input'].includes(x)) && !/(-X|--method)[ =]?(?!GET)/i.test(args.join(' ')); }
    if (['pr', 'issue', 'run', 'repo', 'release', 'workflow', 'gist', 'label', 'cache', 'project', 'ruleset', 'variable', 'search', 'status', 'browse'].includes(a[0])) return ['view', 'list', 'status', 'diff', 'checks', 'download', 'watch', 'search'].includes(verb) && !(a[0] === 'run' && verb === 'download' && false) || a[0] === 'search' || a[0] === 'status';
    if (a[0] === 'auth' && a[1] === 'status') return true;
    return ['--version', 'version'].includes(a[0]);
  }
  if (READ_ONLY.has(cmd)) {
    if ((cmd === 'env' || cmd === 'printenv') && args.length === 0) return false; // dumps every secret in env into the transcript
    if (cmd === 'cd' || cmd === 'pushd') return !targetsOutside(args.slice(0, 1)) || true;
    if (cmd === 'cat' || cmd === 'head' || cmd === 'tail' || cmd === 'less' || cmd === 'more' || cmd === 'bat' || cmd === 'strings' || cmd === 'xxd' || cmd === 'hexdump' || cmd === 'od') return !args.some(touchesSecret);
    if (cmd === 'grep' || cmd === 'rg' || cmd === 'ag' || cmd === 'egrep' || cmd === 'fgrep') return !args.some(touchesSecret) && !args.some((a) => a === '--pre' || a.startsWith('--pre=') || a === '--exec');
    if (cmd === 'ps' || cmd === 'lsof' || cmd === 'top') return !args.some((a) => a === 'e' || a === 'eww' || /e/.test(a) && /^-?[a-z]*ww/.test(a));
    return true;
  }
  if (nodeAllowed(cmd, args)) return true;
  if (safeFetch(cmd, args)) return true;
  if (cmd === 'mkdir' || cmd === 'touch') return !targetsOutside(args) && !args.some(touchesSecret);          // contained, reversible
  if (cmd === 'cp') return !targetsOutside(args) && !args.some(touchesSecret) && !args.some((a) => a === '-f' && false);
  if (cmd === 'mv') return !targetsOutside(args) && !args.some(touchesSecret);
  if (cmd === 'ln') return false;
  if (cmd === 'tee') return args.every((a) => a.startsWith('-') || (!targetsOutside([a]) && !touchesSecret(a)));
  if (cmd === 'jq' || cmd === 'yq') return !args.some((a) => a === '-i' || a === '--in-place');
  return false;
}

/** Where may a redirect write? Only inside the project (relative path, no ..), never a secret path, never a device. */
function redirectAllowed(r) {
  const m = /^(\d?)(>>?|<|>&|<&)(.*)$/.exec(r) || /^(>>?|<|>&|<&)(.*)$/.exec(r);
  if (!m) return false;
  const op = m.length === 4 ? m[2] : m[1];
  const target = (m.length === 4 ? m[3] : m[2]) || '';
  if (op === '<' || op === '<&') return !touchesSecret(target);
  if (op === '>&') return /^\d$/.test(target) || target === '-';          // 2>&1
  if (target === '/dev/null') return true;
  if (!target || target.startsWith('/') || target.startsWith('~') || target.includes('..') || target.startsWith('/dev/') || /\$/.test(target)) return false;
  return !touchesSecret(target);
}

/* ─────────────────────────── public API ─────────────────────────── */

/**
 * Classify one shell command line.
 * @param {string} line
 * @returns {{ verdict: 'allow'|'ask'|'deny', reason: string }}
 */
function classifyCommand(line) {
  if (typeof line !== 'string' || !line.trim()) return { verdict: 'ask', reason: 'empty or unreadable command' };
  if (line.length > 4000) return { verdict: 'ask', reason: 'command too long to analyse' };
  const segs = parse(line);
  if (!segs) return { verdict: 'ask', reason: 'uses substitution, here-doc or escaping that cannot be statically checked' };
  if (!segs.length) return { verdict: 'ask', reason: 'no command' };
  let askReason = null;
  for (let si = 0; si < segs.length; si++) {
    const seg = segs[si];
    const piped = si > 0 && segs[si - 1].op === '|';
    if (seg.op === '&') { askReason = askReason || 'background job'; }
    const stripped = stripPrefix(seg.words);
    if (stripped === null) return { verdict: 'ask', reason: 'sets an environment variable that changes how programs load/run' };
    if (!stripped.length) { // pure variable assignment e.g. FOO=bar
      continue;
    }
    const deny = hardDenySegment(stripped, { piped });
    if (deny) return { verdict: 'deny', reason: deny };
    for (const r of seg.redirects) {
      if (/^[\d]*>/.test(r) && !redirectAllowed(r)) {
        const target = r.replace(/^\d?>>?&?/, '');
        if (touchesSecret(target) || target.startsWith('/') || target.startsWith('~') || target.includes('..')) return { verdict: 'deny', reason: `writes outside the project or to a protected path (${target})` };
        askReason = askReason || `unusual redirect (${r})`;
      } else if (r.startsWith('<') && !redirectAllowed(r)) return { verdict: 'deny', reason: 'reads a secret/credential file' };
    }
    if (!segmentAllowed(stripped)) askReason = askReason || `not a known-safe command: ${basename(stripped[0])}`;
  }
  if (askReason) return { verdict: 'ask', reason: askReason };
  return { verdict: 'allow', reason: 'all parts are read-only or contained in the project' };
}

/** Escalation reason handling: what the model asks for in `sandbox_permissions`. */
function classifyEscalation(reason, command) {
  const esc = /escalate sandbox to ([\w-]+)/i.exec(String(reason || ''));
  const requested = esc ? esc[1] : null;
  const net = /network|approval required|\[network:/i.test(String(reason || ''));
  return { requested, network: net };
}

const api = { classifyCommand, classifyEscalation, parse };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof globalThis !== 'undefined') globalThis.__majedClassify = api;
