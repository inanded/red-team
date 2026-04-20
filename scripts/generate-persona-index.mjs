#!/usr/bin/env node
// Regenerates the persona-index table inside README.md between the markers:
//
//   <!-- generated: scripts/generate-persona-index.mjs -->
//   ...table...
//   <!-- /generated -->
//
// Idempotent: running with no persona changes leaves the file byte-identical.

import { readFile, writeFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";
import { glob } from "glob";
import matter from "gray-matter";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const README = path.join(REPO_ROOT, "README.md");
const START_MARKER = "<!-- generated: scripts/generate-persona-index.mjs -->";
const END_MARKER = "<!-- /generated -->";

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function loadPersonas() {
  const files = await glob("agents/red-team/*.md", { cwd: REPO_ROOT, nodir: true });
  const rows = [];
  for (const rel of files) {
    const base = path.basename(rel);
    if (base.toLowerCase() === "readme.md") continue;
    const raw = await readFile(path.join(REPO_ROOT, rel), "utf8");
    const parsed = matter(raw);
    const name = parsed.data?.name ?? path.basename(base, ".md");
    const description = (parsed.data?.description ?? "")
      .replace(/\\/g, "\\\\")
      .replace(/\|/g, "\\|")
      .replace(/\r?\n/g, " ")
      .trim();
    rows.push({ name, description, rel });
  }
  rows.sort((a, b) => a.name.localeCompare(b.name));
  return rows;
}

function renderTable(rows) {
  const header = [
    "| Persona | Description |",
    "| --- | --- |",
  ];
  const body = rows.map(
    (r) => `| [\`${r.name}\`](./${r.rel.split(path.sep).join("/")}) | ${r.description} |`
  );
  return [START_MARKER, ...header, ...body, END_MARKER].join("\n");
}

async function main() {
  if (!(await exists(README))) {
    console.error(`README.md not found at ${README}`);
    process.exit(1);
  }
  const rows = await loadPersonas();
  const table = renderTable(rows);
  const raw = await readFile(README, "utf8");

  const startIdx = raw.indexOf(START_MARKER);
  const endIdx = raw.indexOf(END_MARKER);
  let next;
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    console.error(
      `README.md is missing the generated-block markers. Add the following placeholder and rerun:\n\n${START_MARKER}\n${END_MARKER}`
    );
    process.exit(1);
  }
  next = raw.slice(0, startIdx) + table + raw.slice(endIdx + END_MARKER.length);

  if (next === raw) {
    console.log("Persona index already up to date.");
    return;
  }
  await writeFile(README, next, "utf8");
  console.log(`Regenerated persona index (${rows.length} personas).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
