#!/usr/bin/env node
// Defence-in-depth against the "debug-account.html" class of incident.
//
// This script scans committed pack text (agents/, skills/, adapters/) and
// fails CI if any file contains an unsafe-remediation pattern — a phrase a
// downstream AI might execute verbatim, e.g. "create a test file in your
// public directory".
//
// Patterns and negation-marker logic live in scripts/lib/unsafe-remediation-
// patterns.mjs so the same rules can be applied to generated reports at
// runtime (see scripts/check-report-safety.mjs, rt2-02).
//
// Allow-listed files (they legitimately describe the bad pattern as
// a counter-example):
//   - skills/attack-hypothesis/SKILL.md
//   - agents/red-team-coordinator.md
//   - AGENTS.md, CLAUDE.md, CHANGELOG.md, README.md
//   - scripts/validate-safe-remediation.mjs (this file)
//   - scripts/lib/unsafe-remediation-patterns.mjs (the pattern definitions)
//
// Exits non-zero with file:line messages.

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";
import { glob } from "glob";
import { scanText } from "./lib/unsafe-remediation-patterns.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const ALLOWLIST = new Set([
  "skills/attack-hypothesis/SKILL.md",
  "agents/red-team-coordinator.md",
  "AGENTS.md",
  "CLAUDE.md",
  "CHANGELOG.md",
  "README.md",
  "scripts/validate-safe-remediation.mjs",
  "scripts/lib/unsafe-remediation-patterns.mjs",
  "scripts/check-report-safety.mjs",
]);

const SCAN_GLOBS = [
  "agents/**/*.md",
  "skills/**/SKILL.md",
  "adapters/**/*.md",
];

const errors = [];

async function scanFile(relPath) {
  const normalized = relPath.split(path.sep).join("/");
  if (ALLOWLIST.has(normalized)) return;

  const abs = path.join(REPO_ROOT, relPath);
  let text;
  try {
    text = await readFile(abs, "utf8");
  } catch (err) {
    errors.push(`${normalized}: unreadable (${err.message})`);
    return;
  }

  for (const v of scanText(text)) {
    errors.push(
      `${normalized}:${v.line}: unsafe-remediation pattern — ${v.why}\n  > ${v.preview}`
    );
  }
}

async function main() {
  const files = new Set();
  for (const pattern of SCAN_GLOBS) {
    const matches = await glob(pattern, { cwd: REPO_ROOT, nodir: true });
    for (const m of matches) files.add(m);
  }

  await Promise.all([...files].map((f) => scanFile(f)));

  if (errors.length) {
    console.error("Unsafe-remediation validation FAILED.\n");
    console.error(
      "Persona, skill, and adapter text must never instruct the reader to"
    );
    console.error(
      "create a new file, endpoint, or proof-of-concept artifact — a downstream"
    );
    console.error(
      "coding AI will execute those instructions literally. See the"
    );
    console.error("Downstream-AI safety section of skills/attack-hypothesis/SKILL.md.\n");
    for (const e of errors) console.error(e);
    console.error(`\n${errors.length} violation(s) across ${files.size} file(s).`);
    process.exit(1);
  }

  console.log(`Safe-remediation validation passed (${files.size} files scanned).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
