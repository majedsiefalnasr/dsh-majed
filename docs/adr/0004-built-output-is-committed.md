# Built output is committed to the repository

The Owner installs dsh-majed straight from GitHub (`github:majedsiefalnasr/dsh-majed`) into a pnpm profile whose `allowBuilds` list does not let it run install scripts, so the TypeScript source ported for Subscriptions cannot be built on install. The build output is therefore committed in its own directory, and a test fails when it does not match a fresh build of the source. This keeps the current install method unchanged.

## Considered Options
- Publish to npm and build at publish time, as most DSH plugins do: needs an npm account, a publish step per release and a different install specifier; can be adopted later as its own ticket.
- Build on install through `prepare`: depends on the profile allowing install scripts and downloading build tools, and can fail silently.
