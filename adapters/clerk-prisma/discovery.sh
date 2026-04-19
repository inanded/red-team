#!/usr/bin/env sh
set -eu
test -f package.json || exit 1
grep -q '"@clerk/' package.json || exit 1
grep -q '"@prisma/client"' package.json || exit 1
test -f prisma/schema.prisma || exit 1
echo "adapter: clerk-prisma — matched"
exit 0
