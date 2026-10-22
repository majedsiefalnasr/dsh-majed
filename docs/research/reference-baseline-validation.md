# T04 inactive reference validation record

Date: 2026-10-22. Scope: [T04 / #9](https://github.com/majedsiefalnasr/dsh-majed/issues/9).
This record separates inspected reference bytes from Majed implementation and live acceptance.

## Inputs and independent checks

The machine-readable [manifest](<../reference-artifacts.json>) identifies the public repositories,
full commit IDs, obtained registry archives, file digests, licenses and verification limitations.
The inspection workspace was temporary and outside the accepted build; no upstream module was imported,
no upstream test or install script was run, and no operational account/configuration store was inspected.

A separate parent-agent Python check using `hashlib`, `tarfile` and Git read commands verified:

- All 636 recorded source/archive file SHA-256 digests across the five reference components, with
  source-tree/archive inventory set equality (Pouch includes the explicitly recorded shared root evidence).
- SHA-1, SHA-256, SHA-512 and SRI SHA-512 for each of the five downloaded reference archives.
- The four recorded dependency archives against their SHA-1/SHA-256/SHA-512/SRI and all 10 recorded
  license/notice/metadata file digests. This is the manifest's bounded dependency scope, not all peer,
  development or build dependencies or an embedded-code authorship audit.
- Every recorded source file against `git show <commit>:<path>`, the checked-out repository HEAD against
  the pinned commit, and the five source package names/versions and archive URLs/digests against obtained
  registry metadata. The archive digests match registry metadata, not an independently trusted signature.
- Each recorded archive/source comparison category (`identical`, `different`, `artifactOnly`) directly
  against the pinned Git tree and archive bytes; Restart's separate release-tag comparison also matches
  all 13 archive files. This does not validate its advertised unavailable registry `gitHead`.

| Reference | Source files | Archive files | Pinned source commit |
| --- | ---: | ---: | --- |
| Subscriptions 0.9.9 | 155 | 139 | `9930c5ee5e3fa239db9031f47a0f6f30f7ffc443` |
| Skills 1.2.11 | 129 | 49 | `b4d385b10ee49c6e09d244863a06c9d3a9b43a9d` |
| Hooks 2.1.0 | 36 | 22 | `e9c2aa153b4ac223eee187d730e4877ec5feb16d` |
| MCP console 0.3.10 | 42 | 19 | `e9c2aa153b4ac223eee187d730e4877ec5feb16d` |
| Restart 0.4.4 | 32 | 13 | `e9c2aa153b4ac223eee187d730e4877ec5feb16d` |

The source license/provenance report records separate release-tag and registry `gitHead` identities,
including Restart's unavailable advertised registry commit. A successful digest check must not erase
that discrepancy. Compiled subscription artifact files have not been reproduced from source.

## Accepted baseline regression result

`npm test` completed with exit code 0: **45/45 Node tests pass**, no skips or failures, including the
classifier's **166/166** cases. The accepted packaging tests performed a real temporary `npm pack`,
parsed its JSON, rebuilt the extracted package's client through `prepare`, and checked that historical
Manager/provider prototypes are excluded. This result covers existing baseline behavior and package
boundaries only; it is not an upstream test result, Manager integration test or exact-host proof.

The accepted host/client/package entry points are unchanged by T04 documentation. The existing
[baseline limitations](<../BASELINE.md#L43-L77>) continue to apply. No installation, restart,
account access, provider/judge call, reference activation/removal or release was performed.

## Completion boundary

T04 must not be closed merely because source hashes or baseline regressions pass. Its granular Parity
list must map every reference surface to an execution ticket or an **explicit Owner-reviewed** deferral.
The [Parity ledger](<../PARITY.md>) contains 159 stable acceptance rows: 104 subscriptions, 18 Skills,
10 MCP, 17 Hooks and 10 deferred-register rows. All implementation/live results remain pending. Three
rows have unresolved Owner scope/disposition: OPS-03 (process-global connection timing), SK-17 (local
directory import/browse) and HK-04 (profile-only Hook definitions). **T04 remains partial and open**
until its mapping criterion is resolved; no dependent gate is bypassed. Unresolved scope decisions
also block affected Cutover/removal. No reference capability is claimed implemented by a source citation. Original local/remote Command-hook Approval provenance
remains a separate [unsupported public-seam gate](<management-approval-provenance.md#L58-L66>), not a
reason to silently relabel requests or to stop independent source review.
