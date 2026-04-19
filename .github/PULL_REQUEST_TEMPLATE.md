## Summary

<!-- 1-3 sentences describing what this PR changes and why. -->

## Type of change

- [ ] New persona
- [ ] New skill
- [ ] New adapter
- [ ] Bug fix / docs / CI / other

## PR checklist

- [ ] `npm run validate:all` passes
- [ ] If this touches personas/skills: `npm run test:smoke` passes
- [ ] `CHANGELOG.md` updated under `## [Unreleased]`
- [ ] If adding a new persona: added to coordinator filename mapping, `agents/red-team/README.md`, fixture has at least one planted vuln, `EXPECTED_FINDINGS.md` has at least one row
- [ ] If adding a new adapter: copied from `_template/`, every override file present (even if empty), `discovery.sh` runs without error, added to coordinator detection heuristics

## Notes for reviewers

<!-- Any context reviewers need. Screenshots, trade-offs, follow-ups. -->
