#!/usr/bin/env node
// Scan a generated red-team report for unsafe-remediation text before the
// user pipes it into a downstream AI coding assistant. Uses the same pattern
// library as the CI validator (scripts/lib/unsafe-remediation-patterns.mjs)
// so rules stay in sync.
//
// Addresses rt2-02: CI alone scans only committed pack text; a persona that
// emits unsafe phrasing at runtime ships an unscrubbed report unless the
// coordinator (an LLM) catches it. This script is the programmatic tripwire.
//
// Usage:
//   node scripts/check-report-safety.mjs <report-path>
//   npx inanded/red-team --check-safety <report-path>
//
// Exit codes:
//   0  — no unsafe patterns found (safe to hand to another AI after human review)
//   1  — one or more patterns matched; review before piping to any AI
//   2  — usage error, unreadable file, or unexpected failure

import { readFile } from "node:fs/promises";
import process from "node:process";
import { scanText } from "./lib/unsafe-remediation-patterns.mjs";

const REPORT_PATH = process.argv[2];

if (!REPORT_PATH) {
  console.error("usage: check-report-safety.mjs <report-path>");
  process.exit(2);
}

async function main() {
  let text;
  try {
    text = await readFile(REPORT_PATH, "utf8");
  } catch (err) {
    console.error(`cannot read report: ${err.message}`);
    process.exit(2);
  }

  const violations = scanText(text);

  if (violations.length === 0) {
    console.log(`Report ${REPORT_PATH} passes the unsafe-remediation scan.`);
    console.log("(This is a pattern-based check. A human must still review every Fix");
    console.log(" before piping the report into another coding assistant.)");
    process.exit(0);
  }

  console.error(`Report ${REPORT_PATH} FAILED the unsafe-remediation scan.\n`);
  console.error("The following phrases in this report match patterns a downstream");
  console.error("coding AI could execute literally and cause the original incident");
  console.error("class (e.g., public/debug-account.html shipped to Vercel).\n");
  for (const v of violations) {
    console.error(`${REPORT_PATH}:${v.line}: ${v.why}\n  > ${v.preview}`);
  }
  console.error(`\n${violations.length} violation(s). Do not pipe this report to another AI`);
  console.error("without a human reviewing and rewriting the flagged lines.");
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
