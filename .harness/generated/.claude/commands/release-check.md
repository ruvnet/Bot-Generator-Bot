---
description: Run the release-readiness umbrella + draft a tweet-length announcement.
---

Run the release-readiness check.

1. `harness validate` — umbrella check, must be green.
2. `harness sbom` — emit the SBOM artifact.
3. `harness score` — the scorecard must be >= 70 (B grade).
4. If any gate is red, REFUSE to draft and name the specific blocker.
5. Otherwise: draft the GitHub release body from the conventional-commit log since the last tag, grouped by feat/fix/docs/chore.

Never push or tag in this command; the operator decides when to ship.
