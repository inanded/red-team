#!/usr/bin/env sh
set -eu
test -f package.json || exit 1
grep -Eq '"@paddle/paddle-node-sdk"|"@paddle/paddle-js"|"paddle-sdk"' package.json || exit 1
echo "adapter: paddle — matched"
exit 0
