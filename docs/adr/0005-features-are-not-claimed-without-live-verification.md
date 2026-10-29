---
status: accepted
---
# A feature is not claimed working until verified live

A feature is listed as working in `CHANGELOG.md` or a release only after passing automated tests, a live check in the desktop app after a full restart, and a live check through the remote GUI, with recorded evidence. Anything failing the live checks stays under Known issues. The managers passed offline tests while failing on every live save, so offline tests alone are not trusted.
