#!/usr/bin/env sh
set -eu
test -f package.json || exit 1
grep -Eq '"firebase"|"firebase-admin"|"firebase-functions"' package.json || exit 1
ls firestore.rules database.rules.json storage.rules 2>/dev/null | head -1 | grep -q . || exit 1
echo "adapter: firebase — matched"
exit 0
