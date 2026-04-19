#!/usr/bin/env sh
# Template discovery script.
# Returns 0 when the project on disk matches this adapter's stack, 1 otherwise.
# Runs against the current working directory.
#
# Guidelines:
#   - Only read files. Do not run network calls.
#   - Keep checks short; a handful of greps against manifest files is enough.
#   - If multiple signals are required, combine with && and exit 1 if any miss.

set -eu

# Example: require a package manifest that references the provider SDK.
# test -f package.json && grep -q '"@example/provider-sdk"' package.json || exit 1

echo "adapter: _template — replace this script with real detection"
exit 1
