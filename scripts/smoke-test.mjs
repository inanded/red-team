#!/usr/bin/env node
// Smoke-test harness for the red-team pack. Addresses rt2-06.
//
// The full headless Claude Code run (spawn `claude` + coordinator + parse the
// consolidated report) is still a TODO — that requires a CI runner with
// Claude Code installed and API credits, and is tracked as a follow-up. But
// the "every new persona needs a fixture vuln" invariant that CLAUDE.md
// promises was entirely unenforced until now. This harness closes the gap
// it can close without a live LLM run:
//
//   1. Parse examples/vulnerable-fixture/EXPECTED_FINDINGS.md.
//   2. Every persona listed in bin/red-team.mjs PERSONAS must have at least
//      one row in the oracle (adding a persona without a planted fixture
//      defect fails CI right here).
//   3. Every anchor file named in the oracle must exist on disk in the
//      fixture (a typo or a deleted fixture file fails CI right here).
//
// Exit 0 if coverage is intact; exit 1 with a specific message otherwise.
//
// TODO for a future commit: implement the full headless harness.
//   1. spawn `claude` CLI in headless mode against examples/vulnerable-fixture/
//   2. wait for docs/red-team-<date>/ to appear
//   3. parse the ranked-findings table
//   4. match each oracle row (persona + title substring + severity)
//   5. exit non-zero on any unmatched row

import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURE_DIR = path.join(REPO_ROOT, "examples", "vulnerable-fixture");
const EXPECTED = path.join(FIXTURE_DIR, "EXPECTED_FINDINGS.md");
const INSTALLER = path.join(REPO_ROOT, "bin", "red-team.mjs");

async function readFileOrExit(abs, label) {
  try {
    return await readFile(abs, "utf8");
  } catch (err) {
    console.error(`smoke-test: cannot read ${label} (${err.message})`);
    process.exit(1);
  }
}

function parseInstallerPersonas(installerText) {
  // Extract the PERSONAS array from bin/red-team.mjs. Regex-based because we
  // don't want to shell out to `node -e`; the list lives in a predictable
  // const PERSONAS = [ ... ]; block.
  const m = installerText.match(/const PERSONAS = \[([\s\S]*?)\];/);
  if (!m) {
    console.error("smoke-test: could not find PERSONAS array in bin/red-team.mjs");
    process.exit(1);
  }
  return [...m[1].matchAll(/"([a-z0-9-]+)"/g)].map((x) => x[1]);
}

function parseOracleRows(oracleText) {
  // Parse the Markdown table rows (skip header and alignment row).
  const lines = oracleText.split(/\r?\n/);
  const rows = [];
  let inTable = false;
  for (const line of lines) {
    if (!line.startsWith("|")) {
      if (inTable) break;
      continue;
    }
    if (line.match(/^\|\s*-+\s*\|/)) {
      inTable = true;
      continue;
    }
    if (!inTable) continue;
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length < 4) continue;
    const [persona, title, anchor, severity] = cells;
    if (persona === "Persona") continue; // header
    rows.push({ persona, title, anchor, severity });
  }
  return rows;
}

async function main() {
  const [installerText, expectedText] = await Promise.all([
    readFileOrExit(INSTALLER, "bin/red-team.mjs"),
    readFileOrExit(EXPECTED, "examples/vulnerable-fixture/EXPECTED_FINDINGS.md"),
  ]);

  const personas = parseInstallerPersonas(installerText);
  const rows = parseOracleRows(expectedText);

  if (personas.length === 0) {
    console.error("smoke-test: no personas parsed from installer. Is bin/red-team.mjs intact?");
    process.exit(1);
  }
  if (rows.length === 0) {
    console.error("smoke-test: no rows parsed from oracle. Is EXPECTED_FINDINGS.md intact?");
    process.exit(1);
  }

  const errors = [];

  // Coverage check: every installer persona must have at least one oracle row.
  const personasWithRows = new Set(rows.map((r) => r.persona));
  for (const p of personas) {
    if (!personasWithRows.has(p)) {
      errors.push(`coverage: persona "${p}" is installed by bin/red-team.mjs but has no row in EXPECTED_FINDINGS.md — plant a fixture defect for it`);
    }
  }

  // Anchor check: every anchor file (except literal "(absence)") must exist.
  for (const r of rows) {
    if (r.anchor === "(absence)") continue;
    const abs = path.join(FIXTURE_DIR, r.anchor);
    try {
      await stat(abs);
    } catch {
      errors.push(`oracle: row "${r.persona} / ${r.title}" anchors to ${r.anchor} which does not exist under examples/vulnerable-fixture/`);
    }
  }

  // Reverse check: every oracle persona must be in the installer list.
  for (const r of rows) {
    if (!personas.includes(r.persona)) {
      errors.push(`oracle: row "${r.persona} / ${r.title}" names a persona that is not in the installer PERSONAS list`);
    }
  }

  if (errors.length > 0) {
    console.error("smoke-test: fixture-coverage check FAILED.\n");
    for (const e of errors) console.error(`  ${e}`);
    console.error(`\n${errors.length} error(s). See CLAUDE.md for the "every new persona needs a fixture vuln" rule.`);
    process.exit(1);
  }

  console.log(`smoke-test: fixture coverage intact.`);
  console.log(`  ${personas.length} personas installed, ${rows.length} oracle rows, ${personasWithRows.size} personas covered.`);
  console.log(`  (The full headless-run harness — spawn Claude Code, parse the consolidated report,`);
  console.log(`   match each row's severity — remains a TODO. See top-of-file comment.)`);
  process.exit(0);
}

main().catch((err) => {
  console.error("smoke-test: unexpected failure:", err);
  process.exit(1);
});
