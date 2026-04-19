#!/usr/bin/env sh
set -eu
test -f package.json || exit 1
grep -Eq '"@aws-sdk/client-cognito-identity-provider"|"amazon-cognito-identity-js"' package.json || exit 1
grep -Eq '"@aws-sdk/client-dynamodb"|"@aws-sdk/lib-dynamodb"' package.json || exit 1
echo "adapter: aws-cognito-dynamodb — matched"
exit 0
