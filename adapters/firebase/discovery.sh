#!/usr/bin/env sh
set -eu
test -f package.json || exit 1
grep -Eq '"firebase"|"firebase-admin"|"firebase-functions"' package.json || exit 1
[ -f firestore.rules ] || [ -f database.rules.json ] || [ -f storage.rules ] || exit 1
echo "adapter: firebase — matched"
exit 0
