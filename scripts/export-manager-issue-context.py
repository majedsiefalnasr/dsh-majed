#!/usr/bin/env python3
"""Export read-only GitHub issue context for manager-ticket reconciliation.

Uses the existing gh login; never prints or exports authentication credentials.
No GitHub mutation, login, git operation, or operational DSH access is performed.
"""

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import subprocess
import tempfile


REPO = "majedsiefalnasr/dsh-majed"


def pages(endpoint):
    result = subprocess.run(
        ["gh", "api", "--method", "GET", "--paginate", "--slurp", endpoint],
        capture_output=True, text=True, timeout=90, check=False,
    )
    if result.returncode:
        # Keep failure diagnostics free of credentials or arbitrary remote text.
        raise RuntimeError(f"gh GET failed (exit {result.returncode}): {endpoint}")
    values = json.loads(result.stdout)
    if not isinstance(values, list) or any(not isinstance(page, list) for page in values):
        raise RuntimeError(f"Expected paginated arrays from {endpoint}")
    return [item for page in values for item in page]


def detail(issue):
    number = issue["number"]
    base = f"repos/{REPO}/issues/{number}"
    record = {"issue": issue, "errors": []}
    for field, endpoint in (
        ("comments", base + "/comments?per_page=100"),
        ("blocked_by", base + "/dependencies/blocked_by?per_page=100"),
    ):
        try:
            record[field] = pages(endpoint)
        except (RuntimeError, subprocess.TimeoutExpired, json.JSONDecodeError) as error:
            record[field] = None
            record["errors"].append(f"{field}: {type(error).__name__}")
    if number in (1, 2):
        try:
            record["sub_issues"] = pages(base + "/sub_issues?per_page=100")
        except (RuntimeError, subprocess.TimeoutExpired, json.JSONDecodeError) as error:
            record["sub_issues"] = None
            record["errors"].append(f"sub_issues: {type(error).__name__}")
    return record


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=Path("/tmp/dsh-majed-github-context.json"))
    args = parser.parse_args()
    started = datetime.now(timezone.utc).isoformat()
    issues = pages(f"repos/{REPO}/issues?state=all&per_page=100")
    issues = [issue for issue in issues if "pull_request" not in issue]
    records = []
    with ThreadPoolExecutor(max_workers=4) as pool:
        pending = [pool.submit(detail, issue) for issue in issues]
        for future in as_completed(pending):
            record = future.result()
            records.append(record)
            print(f"Read issue #{record['issue']['number']} ({len(records)}/{len(issues)})", flush=True)
    records.sort(key=lambda record: record["issue"]["number"])
    errors = sum(len(record["errors"]) for record in records)
    snapshot = {
        "repo": REPO, "started_at": started,
        "finished_at": datetime.now(timezone.utc).isoformat(),
        "complete": errors == 0, "error_count": errors, "records": records,
    }
    destination = args.output.expanduser().resolve()
    destination.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary = tempfile.mkstemp(prefix=".github-context-", dir=destination.parent)
    try:
        with os.fdopen(descriptor, "w") as handle:
            json.dump(snapshot, handle, indent=2)
            handle.write("\n")
        os.replace(temporary, destination)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)
    print(f"Saved {len(records)} issues to {destination}; incomplete reads: {errors}")
    return 0 if errors == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
