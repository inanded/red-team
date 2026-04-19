# Security policy

## Reporting an issue with the pack

If you find a defect in this pack's prompts, scripts, or fixtures (for example, a validator that misses a class of error, a buggy script, or a fixture that accidentally leaks real data), please email matthewwemyss17@gmail.com with `[red-team-pack]` in the subject line. You can expect an acknowledgement within 5 business days. Do not open a public issue for the initial report.

## Scope

- Prompts under `agents/` and `skills/`
- Scripts under `scripts/`
- CI workflows under `.github/workflows/`
- The intentionally-vulnerable fixture under `examples/vulnerable-fixture/`, only if a real vulnerability leaks beyond the planted ones

## Out of scope

- Findings the pack produces when a user runs it against their own codebase; those belong to the user's own project, not this repo
- The intentionally-planted defects inside the fixture
- Feature requests
- Questions about how to configure Claude Code

## Supported versions

Only the latest tagged release is supported.

## Coordinated disclosure

The maintainer will agree a public-disclosure date with the reporter, targeting 30 days from triage. The reporter will be credited in the changelog unless they ask otherwise.
