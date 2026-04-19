#!/usr/bin/env bash
# Project-scoped installer for the red-team pack.
#
# Copies agents and skills into ./.claude/ so the pack is available only in
# this project, not at user level. Optionally copies one stack adapter.
#
# Usage:
#   cd your-project
#   bash <(curl -fsSL https://raw.githubusercontent.com/inanded/red-team/main/scripts/install.sh)
#
# Or, after cloning:
#   bash /path/to/red-team/scripts/install.sh [--adapter <slug>] [--source <path-or-url>]
#
# The script never writes outside the current directory's .claude/ tree.

set -euo pipefail

REPO_URL="${RED_TEAM_REPO_URL:-https://github.com/inanded/red-team}"
REF="${RED_TEAM_REF:-main}"
ADAPTER=""
SOURCE_DIR=""

usage() {
  cat <<EOF
Project-scoped installer for the red-team pack.

Options:
  --adapter <slug>   Also copy one adapter into .claude/red-team-adapters/<slug>/
                     Slugs: supabase-stripe-nextjs, auth0-postgres, clerk-prisma,
                            firebase, aws-cognito-dynamodb, paddle, mongodb-mongoose
  --source <path>    Install from a local clone of the repo instead of fetching.
  --ref <gitref>     Branch or tag to install from (default: main).
  --help             Show this message.
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --adapter) ADAPTER="${2:-}"; shift 2 ;;
    --source)  SOURCE_DIR="${2:-}"; shift 2 ;;
    --ref)     REF="${2:-main}"; shift 2 ;;
    --help|-h) usage; exit 0 ;;
    *)         echo "unknown argument: $1" >&2; usage; exit 1 ;;
  esac
done

if [ ! -w "." ]; then
  echo "error: current directory is not writable" >&2
  exit 1
fi

# Acquire a source tree.
CLEANUP_TMP=""
if [ -n "$SOURCE_DIR" ]; then
  if [ ! -d "$SOURCE_DIR/agents/red-team" ] || [ ! -d "$SOURCE_DIR/skills" ]; then
    echo "error: --source ${SOURCE_DIR} does not look like a red-team clone" >&2
    exit 1
  fi
  SRC="$SOURCE_DIR"
else
  TMP="$(mktemp -d)"
  CLEANUP_TMP="$TMP"
  echo "fetching red-team@${REF} from ${REPO_URL}..."
  if command -v git >/dev/null 2>&1; then
    git clone --depth 1 --branch "$REF" "$REPO_URL" "$TMP/red-team" >/dev/null 2>&1
    SRC="$TMP/red-team"
  else
    TARBALL="${REPO_URL}/archive/${REF}.tar.gz"
    (cd "$TMP" && curl -fsSL "$TARBALL" | tar xz)
    SRC="$(find "$TMP" -maxdepth 2 -type d -name 'red-team-*' | head -n 1)"
  fi
fi

# Confirm destination.
mkdir -p .claude/agents .claude/agents/red-team .claude/skills

echo "copying agents -> .claude/agents/"
cp -f "$SRC/agents/red-team-coordinator.md"  .claude/agents/
cp -f "$SRC/agents/recon-scout.md"           .claude/agents/
cp -rf "$SRC/agents/red-team/." .claude/agents/red-team/

echo "copying skills -> .claude/skills/"
for skill in attack-hypothesis severity-scoring effort-estimation \
             confirmed-safe-tracking threat-modeling exploit-chain-mapping \
             attack-surface-discovery; do
  mkdir -p ".claude/skills/${skill}"
  cp -f "$SRC/skills/${skill}/SKILL.md" ".claude/skills/${skill}/SKILL.md"
done

# Optional adapter.
if [ -n "$ADAPTER" ]; then
  if [ ! -d "$SRC/adapters/${ADAPTER}" ]; then
    echo "warning: adapter '${ADAPTER}' not found in the pack; skipping" >&2
  else
    echo "copying adapter '${ADAPTER}' -> .claude/red-team-adapters/${ADAPTER}/"
    mkdir -p ".claude/red-team-adapters"
    rm -rf ".claude/red-team-adapters/${ADAPTER}"
    cp -r "$SRC/adapters/${ADAPTER}" ".claude/red-team-adapters/${ADAPTER}"
  fi
fi

# Clean up tempdir.
if [ -n "$CLEANUP_TMP" ]; then
  rm -rf "$CLEANUP_TMP"
fi

cat <<EOF

installed. project-scoped — nothing written outside $(pwd)/.claude/

next steps:
  1. open this project in claude code
  2. run the coordinator:

       > run the red-team-coordinator against this project

  the consolidated report will be written to docs/red-team-<date>.md
  and per-persona reports under docs/red-team-<date>/.

uninstall: rm -rf .claude/agents/red-team-coordinator.md .claude/agents/recon-scout.md .claude/agents/red-team .claude/skills .claude/red-team-adapters
EOF
