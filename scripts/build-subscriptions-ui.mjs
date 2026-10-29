// Offline generation of the attributed v0.9.11 UI; no reference plugin dependency.
// Requires esbuild 0.25.x, supplied explicitly (e.g. /tmp/esb/node_modules/.bin/esbuild).
import { execFileSync } from 'node:child_process';
const executable = process.env.ESBUILD || '/tmp/esb/node_modules/.bin/esbuild';
const version = execFileSync(executable, ['--version'], { encoding: 'utf8' }).trim();
if (!/^0\.25\./.test(version)) throw new Error('esbuild 0.25.x required');
execFileSync(executable, ['modules/subscriptions/ui/entry.ts', '--bundle', '--format=iife', '--global-name=MajedSubscriptionsUI', '--jsx=transform', '--jsx-factory=React.createElement', '--banner:js=// Generated from attributed v0.9.11 UI; see modules/subscriptions/ui/PROVENANCE.md.\nconst React = require("react");', '--external:react', '--external:@deepseek-ai/*', '--outfile=modules/subscriptions/ui/bundle.js'], { stdio: 'inherit' });
