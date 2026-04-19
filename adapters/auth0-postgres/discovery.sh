#!/usr/bin/env sh
set -eu
test -f package.json || exit 1
grep -Eq '"@auth0/|"auth0"' package.json || exit 1
grep -Eq '"pg"|"prisma"|"drizzle-orm"|"knex"' package.json || exit 1
echo "adapter: auth0-postgres — matched"
exit 0
