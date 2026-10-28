---
status: accepted
---
# Allow unknown Command hook Approval origin

On 2026-10-25 the Owner accepted this interim amendment to ADR 0008: authenticated Owner admission and explicit Approval of the exact reviewed command remain mandatory, while independently verified original local/remote origin is no longer a prerequisite for Approval or execution. Record origin as `unknown` whenever the supported transport cannot establish it; use `local` or `remote` only with trustworthy server-side evidence. This preserves truthful auditing while allowing implementation despite the information loss identified at the inspected paired-proxy Fetch seam.

Keep server receipt time, single-use expiring nonce, server-checked typed confirmation, normalized content and watched-file fingerprint, canonical scope/cwd binding, queued-work revalidation and native guard precedence. Client labels, Origin headers and a loopback proxy hop cannot establish original locality. Unknown origin never substitutes for authentication or valid Approval; failed admission or Approval validation must still reject.

T02E remains a proof prerequisite for T10, now covering authenticated Approval admission and truthful origin handling, including `unknown`, rather than requiring a new transport attestation. Its earlier unsupported finding remains evidence about original locality, not a passing result for the amended gate. Preserve T09/T02E → T10 dependencies until the amended contracts are verified. Revisit this interim decision when a supported authenticated origin contract becomes available or the Owner changes the requirement.

This changes documentation requirements only. It does not implement or enable Hooks, complete a ticket, change published GitHub issues, grant operational access or authorize Cutover. All other ADR 0008 requirements remain in force.
