#!/usr/bin/env node
// Asserts the project's directory-structure invariants.
//
//   - Every directory under adapters/ contains ADAPTER.md, discovery.sh, and an overrides/ directory.
//     The _template directory is treated as a template (same checks apply; stub content is fine).
//   - If examples/vulnerable-fixture/ exists, examples/vulnerable-fixture/EXPECTED_FINDINGS.md must exist.
//   - If shellcheck is on PATH, run it on every adapters/*/discovery.sh.
//   - Missing directories are skipped gracefully.

import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

const errors = [];

function recordError(file, message) {
  errors.push(`${path.relative(REPO_ROOT, file)}: ${message}`);
}

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function dirExists(p) {
  try {
    const s = await stat(p);
    return s.isDirectory();
  } catch {
    return false;
  }
}

async function validateAdapters() {
  const adaptersDir = path.join(REPO_ROOT, "adapters");
  if (!(await dirExists(adaptersDir))) return;
  const entries = await readdir(adaptersDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(adaptersDir, entry.name);
    const adapterMd = path.join(dir, "ADAPTER.md");
    const discovery = path.join(dir, "discovery.sh");
    const overrides = path.join(dir, "overrides");
    if (!(await exists(adapterMd))) recordError(adapterMd, "missing ADAPTER.md");
    if (!(await exists(discovery))) recordError(discovery, "missing discovery.sh");
    if (!(await dirExists(overrides))) recordError(overrides, "missing overrides/ directory");
  }
}

async function validateFixture() {
  const fixtureDir = path.join(REPO_ROOT, "examples", "vulnerable-fixture");
  if (!(await dirExists(fixtureDir))) return;
  const expected = path.join(fixtureDir, "EXPECTED_FINDINGS.md");
  if (!(await exists(expected))) {
    recordError(expected, "missing EXPECTED_FINDINGS.md in examples/vulnerable-fixture/");
  }
}

function hasShellcheck() {
  const probe = spawnSync(process.platform === "win32" ? "where" : "which", ["shellcheck"], {
    stdio: "ignore",
  });
  return probe.status === 0;
}

async function runShellcheck() {
  const adaptersDir = path.join(REPO_ROOT, "adapters");
  if (!(await dirExists(adaptersDir))) return;
  if (!hasShellcheck()) {
    console.warn("shellcheck not on PATH; skipping discovery.sh lint.");
    return;
  }
  const entries = await readdir(adaptersDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const discovery = path.join(adaptersDir, entry.name, "discovery.sh");
    if (!(await exists(discovery))) continue;
    const result = spawnSync("shellcheck", [discovery], { encoding: "utf8" });
    if (result.status !== 0) {
      const out = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
      recordError(discovery, `shellcheck failed:\n${out}`);
    }
  }
}

async function main() {
  await validateAdapters();
  await validateFixture();
  await runShellcheck();

  if (errors.length > 0) {
    console.error("Structure validation failed:");
    for (const e of errors) console.error(`  ${e}`);
    process.exit(1);
  }
  console.log("Structure validation passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
