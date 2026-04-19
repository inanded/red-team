#!/usr/bin/env node
// Verifies every relative markdown link resolves to an existing file.
// Additionally:
//   - parses the coordinator's filename-mapping table and asserts it matches files under agents/red-team/
//   - parses adapter override filenames and asserts they match the persona list
//
// Missing directories are skipped gracefully. Exits non-zero on any error.

import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";
import { glob } from "glob";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const errors = [];

function recordError(file, line, message) {
  errors.push(`${path.relative(REPO_ROOT, file)}:${line}: ${message}`);
}

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function dirExists(dir) {
  try {
    const s = await stat(dir);
    return s.isDirectory();
  } catch {
    return false;
  }
}

const LINK_RE = /\[([^\]]*)\]\(([^)]+)\)/g;

function stripAnchor(href) {
  const hashIdx = href.indexOf("#");
  return hashIdx === -1 ? href : href.slice(0, hashIdx);
}

function isExternal(href) {
  return /^(https?:|mailto:|tel:|ftp:)/i.test(href);
}

async function checkLinksIn(file) {
  const raw = await readFile(file, "utf8");
  const lines = raw.split(/\r?\n/);
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Track fenced code blocks so template paths inside them do not generate errors.
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    LINK_RE.lastIndex = 0;
    let m;
    while ((m = LINK_RE.exec(line)) !== null) {
      const href = m[2].trim();
      if (!href) continue;
      if (isExternal(href)) continue;
      if (href.startsWith("#")) continue;
      // Skip template placeholders like "red-team-<date>/foo.md".
      if (/[<>]/.test(href)) continue;
      const target = stripAnchor(href);
      if (!target) continue;
      const resolved = path.resolve(path.dirname(file), target);
      if (!(await exists(resolved))) {
        recordError(
          file,
          i + 1,
          `broken link: "${href}" -> ${path.relative(REPO_ROOT, resolved)}`
        );
      }
    }
  }
}

async function collectLinkTargets() {
  const dirs = ["agents", "skills", "adapters"];
  const files = [];
  for (const d of dirs) {
    if (await dirExists(path.join(REPO_ROOT, d))) {
      const matched = await glob(`${d}/**/*.md`, { cwd: REPO_ROOT, nodir: true });
      for (const rel of matched) files.push(path.join(REPO_ROOT, rel));
    }
  }
  for (const root of ["README.md", "CONTRIBUTING.md"]) {
    const full = path.join(REPO_ROOT, root);
    if (await exists(full)) files.push(full);
  }
  return files;
}

async function listPersonas() {
  const dir = path.join(REPO_ROOT, "agents", "red-team");
  if (!(await dirExists(dir))) return [];
  const files = await glob("agents/red-team/*.md", { cwd: REPO_ROOT, nodir: true });
  return files
    .map((rel) => path.basename(rel))
    .filter((b) => b.toLowerCase() !== "readme.md")
    .map((b) => b.replace(/\.md$/, ""))
    .sort();
}

async function checkCoordinatorMapping(personas) {
  const coord = path.join(REPO_ROOT, "agents", "red-team-coordinator.md");
  if (!(await exists(coord))) return;
  const raw = await readFile(coord, "utf8");
  // Look for persona names in table rows or bulleted lists referencing agents/red-team/<name>.md
  const mentioned = new Set();
  const pattern = /agents\/red-team\/([a-z0-9-]+)\.md/g;
  let m;
  while ((m = pattern.exec(raw)) !== null) {
    mentioned.add(m[1]);
  }
  if (mentioned.size === 0) {
    // Fall back to bare persona-name mentions — informational only, no error.
    return;
  }
  const personaSet = new Set(personas);
  for (const name of mentioned) {
    if (!personaSet.has(name)) {
      recordError(
        coord,
        1,
        `coordinator references persona "${name}" but no agents/red-team/${name}.md exists`
      );
    }
  }
  for (const name of personas) {
    if (!mentioned.has(name)) {
      recordError(
        coord,
        1,
        `persona "${name}" exists under agents/red-team/ but is not referenced in the coordinator`
      );
    }
  }
}

async function checkAdapterOverrides(personas) {
  const adaptersDir = path.join(REPO_ROOT, "adapters");
  if (!(await dirExists(adaptersDir))) return;
  const overrideFiles = await glob("adapters/*/overrides/*.md", {
    cwd: REPO_ROOT,
    nodir: true,
  });
  const personaSet = new Set(personas);
  for (const rel of overrideFiles) {
    const base = path.basename(rel).replace(/\.md$/, "").replace(/\.overrides$/, "");
    if (personas.length > 0 && !personaSet.has(base)) {
      recordError(
        path.join(REPO_ROOT, rel),
        1,
        `override filename "${base}" does not match any persona under agents/red-team/`
      );
    }
  }
}

async function main() {
  const files = await collectLinkTargets();
  for (const f of files) await checkLinksIn(f);

  const personas = await listPersonas();
  await checkCoordinatorMapping(personas);
  await checkAdapterOverrides(personas);

  if (errors.length > 0) {
    console.error("Cross-reference validation failed:");
    for (const e of errors) console.error(`  ${e}`);
    process.exit(1);
  }
  console.log("Cross-reference validation passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
