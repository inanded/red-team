#!/usr/bin/env sh
# Detect a Supabase + Stripe + Next.js stack.
set -eu

test -f package.json || exit 1
grep -q '"@supabase/supabase-js"' package.json || exit 1
grep -q '"stripe"' package.json || exit 1
grep -q '"next"' package.json || exit 1
test -d supabase/migrations || exit 1

echo "adapter: supabase-stripe-nextjs — matched"
exit 0
