---
description: "Maintainer triage: what changed, what is risky, what to review first."
---

Triage the current repo state.

1. `git status` to see what is uncommitted.
2. `git log --oneline -20` to see the recent history.
3. `git diff HEAD~1` for the latest commit.
4. Report:
   - headline risk
   - files most likely to regress
   - smallest test the team should run before merging
   - any permissions widened in the diff

Do not auto-fix; surface findings only.
