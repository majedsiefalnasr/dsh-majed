// Shared controlled fixtures for the repository subscription tests (#153).
// Everything is local: temp directories, local git repositories and 127.0.0.1 servers.
// No test here ever contacts the public internet.
import { execFileSync, spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { zipSync } from 'fflate';

export const skillDoc = (name, description = `About ${name}`, body = 'Body') =>
  `---\nname: ${name}\ndescription: ${description}\n---\n${body}`;

const gitEnv = (home) => ({
  PATH: process.env.PATH,
  HOME: home,
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_SYSTEM: '/dev/null',
  GIT_AUTHOR_NAME: 'Fixture',
  GIT_AUTHOR_EMAIL: 'fixture@example.test',
  GIT_COMMITTER_NAME: 'Fixture',
  GIT_COMMITTER_EMAIL: 'fixture@example.test',
});
export const git = (cwd, ...args) =>
  execFileSync('git', args, { cwd, env: gitEnv(cwd), encoding: 'utf8' }).trim();

export async function writeFiles(root, files) {
  for (const [path, data] of Object.entries(files)) {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), data);
  }
}
/** Creates a real local git repository with one commit on `main`; returns the commit id. */
export async function gitRepo(root, files, { tag } = {}) {
  await mkdir(root, { recursive: true });
  git(root, 'init', '-q', '-b', 'main');
  await writeFiles(root, files);
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', 'fixture');
  if (tag) git(root, 'tag', tag);
  return git(root, 'rev-parse', 'HEAD');
}
export async function gitCommit(root, files, message = 'next') {
  await writeFiles(root, files);
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', message);
  return git(root, 'rev-parse', 'HEAD');
}

/** Smart-HTTP git server on 127.0.0.1 backed by the real `git http-backend`. */
export async function gitHttpServer(projectRoot, { redirect } = {}) {
  const hits = [];
  const server = createServer((request, response) => {
    hits.push(request.url);
    if (redirect) {
      response.writeHead(302, { location: `${redirect}${request.url}` });
      response.end();
      return;
    }
    const url = new URL(request.url, 'http://127.0.0.1');
    const child = spawn('git', ['-c', 'http.uploadpack=true', 'http-backend'], {
      env: {
        ...gitEnv(projectRoot),
        GIT_PROJECT_ROOT: projectRoot,
        GIT_HTTP_EXPORT_ALL: '1',
        REQUEST_METHOD: request.method,
        PATH_INFO: url.pathname,
        QUERY_STRING: url.search.slice(1),
        CONTENT_TYPE: request.headers['content-type'] ?? '',
        CONTENT_LENGTH: request.headers['content-length'] ?? '',
        HTTP_CONTENT_ENCODING: request.headers['content-encoding'] ?? '',
        HTTP_GIT_PROTOCOL: request.headers['git-protocol'] ?? '',
        REMOTE_ADDR: '127.0.0.1',
      },
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    request.pipe(child.stdin);
    const chunks = [];
    child.stdout.on('data', (chunk) => chunks.push(chunk));
    child.on('close', () => {
      const out = Buffer.concat(chunks);
      const split = out.indexOf('\r\n\r\n');
      const head = out.subarray(0, split).toString().split('\r\n');
      const headers = {};
      let status = 200;
      for (const line of head) {
        const [key, ...rest] = line.split(': ');
        if (key.toLowerCase() === 'status') status = Number.parseInt(rest[0]);
        else headers[key] = rest.join(': ');
      }
      response.writeHead(status, headers);
      response.end(out.subarray(split + 4));
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    hits,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

/** GitHub codeload stand-in; `handler(request, response, hits)` can override any response. */
export async function archiveServer(handler) {
  const hits = [];
  const server = createServer((request, response) => {
    hits.push(request.url);
    handler(request, response, hits);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    hits,
    close: () =>
      new Promise((resolve) => {
        server.closeAllConnections?.();
        server.close(resolve);
      }),
  };
}
/** Zip with the single `<repo>-<ref>/` root folder GitHub archives carry. */
export const githubZip = (files, root = 'repo-main') =>
  Buffer.from(
    zipSync(
      Object.fromEntries(
        Object.entries(files).map(([path, data]) => [
          `${root}/${path}`,
          typeof data === 'string' ? Buffer.from(data) : data,
        ]),
      ),
    ),
  );
