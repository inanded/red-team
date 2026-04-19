#!/usr/bin/env sh
set -eu
test -f package.json || exit 1
grep -Eq '"mongoose"|"mongodb"' package.json || exit 1
echo "adapter: mongodb-mongoose — matched"
exit 0
