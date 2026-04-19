#!/usr/bin/env node
// Validates YAML frontmatter for every agent, skill, and adapter override markdown file.
//
// Rules:
//   - agents/**/*.md (excluding README.md files): require name, description, tools, model
//   - skills/** /SKILL.md: require name, description; name must match parent directory
//   - adapters/**/*.md (excluding ADAPTER.md and README.md): require name, description
//   - name must match filename stem (for personas and adapter overrides) or parent dir (for skills)
//   - names must be unique across the pack
//   - tools must be a subset of the allowed list
//
// Exits non-zero with line-numbered errors. Missing directories are skipped gracefully.

import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";
import { glob } from "glob";
import matter from "gray-matter";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ALLOWED_TOOLS = new Set([
  "Read",
  "Write",
  "Edit",
  "Grep",
  "Glob",
  "Bash",
  "WebFetch",
  "Agent",
  "AskUserQuestion",
]);

const errors = [];

function recordError(file, line, message) {
  errors.push(`${path.relative(REPO_ROOT, file)}:${line}: ${message}`);
}

async function dirExists(dir) {
  try {
    const s = await stat(dir);
    return s.isDirectory();
  } catch {
    return false;
  }
}

function isReadmeLike(file) {
  const base = path.basename(file).toLowerCase();
  return base === "readme.md" || base === "adapter.md" || base === "examples.md";
}

function isOverride(file) {
  return path.basename(file).toLowerCase().endsWith(".overrides.md");
}

function kebabStem(file) {
  return path.basename(file, path.extname(file));
}

function lineOfKey(raw, key) {
  const lines = raw.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (new RegExp(`^${key}\\s*:`).test(lines[i])) return i + 1;
  }
  return 1;
}

async function readParsed(file) {
  const raw = await readFile(file, "utf8");
  let parsed;
  try {
    parsed = matter(raw);
  } catch (err) {
    recordError(file, 1, `frontmatter parse error: ${err.message}`);
    return null;
  }
  if (!parsed.data || Object.keys(parsed.data).length === 0) {
    recordError(file, 1, "missing YAML frontmatter");
    return null;
  }
  return { data: parsed.data, raw };
}

function requireField(file, raw, data, field) {
  if (data[field] === undefined || data[field] === null || data[field] === "") {
    recordError(file, 1, `missing required frontmatter field: ${field}`);
    return false;
  }
  return true;
}

async function validateAgents(nameRegistry) {
  const agentsDir = path.join(REPO_ROOT, "agents");
  if (!(await dirExists(agentsDir))) return;
  const files = await glob("agents/**/*.md", { cwd: REPO_ROOT, nodir: true });
  for (const rel of files) {
    const file = path.join(REPO_ROOT, rel);
    if (isReadmeLike(file)) continue;
    const parsed = await readParsed(file);
    if (!parsed) continue;
    const { data, raw } = parsed;
    const required = ["name", "description", "tools", "model"];
    let ok = true;
    for (const f of required) {
      if (!requireField(file, raw, data, f)) ok = false;
    }
    if (!ok) continue;

    const stem = kebabStem(file);
    if (data.name !== stem) {
      recordError(
        file,
        lineOfKey(raw, "name"),
        `name "${data.name}" does not match filename stem "${stem}"`
      );
    }

    const tools = Array.isArray(data.tools)
      ? data.tools
      : String(data.tools).split(/[,\s]+/).filter(Boolean);
    for (const t of tools) {
      if (!ALLOWED_TOOLS.has(t)) {
        recordError(
          file,
          lineOfKey(raw, "tools"),
          `tool "${t}" not in allowed list {${[...ALLOWED_TOOLS].join(", ")}}`
        );
      }
    }

    if (nameRegistry.has(data.name)) {
      recordError(
        file,
        lineOfKey(raw, "name"),
        `duplicate name "${data.name}" (also in ${path.relative(REPO_ROOT, nameRegistry.get(data.name))})`
      );
    } else {
      nameRegistry.set(data.name, file);
    }
  }
}

async function validateSkills(nameRegistry) {
  const skillsDir = path.join(REPO_ROOT, "skills");
  if (!(await dirExists(skillsDir))) return;
  const files = await glob("skills/*/SKILL.md", { cwd: REPO_ROOT, nodir: true });
  for (const rel of files) {
    const file = path.join(REPO_ROOT, rel);
    const parsed = await readParsed(file);
    if (!parsed) continue;
    const { data, raw } = parsed;
    let ok = true;
    for (const f of ["name", "description"]) {
      if (!requireField(file, raw, data, f)) ok = false;
    }
    if (!ok) continue;

    const parentDir = path.basename(path.dirname(file));
    if (data.name !== parentDir) {
      recordError(
        file,
        lineOfKey(raw, "name"),
        `skill name "${data.name}" does not match parent directory "${parentDir}"`
      );
    }

    if (nameRegistry.has(data.name)) {
      recordError(
        file,
        lineOfKey(raw, "name"),
        `duplicate name "${data.name}" (also in ${path.relative(REPO_ROOT, nameRegistry.get(data.name))})`
      );
    } else {
      nameRegistry.set(data.name, file);
    }
  }
}

async function validateAdapters(_nameRegistry) {
  const adaptersDir = path.join(REPO_ROOT, "adapters");
  if (!(await dirExists(adaptersDir))) return;
  const files = await glob("adapters/**/*.md", { cwd: REPO_ROOT, nodir: true });
  for (const rel of files) {
    const file = path.join(REPO_ROOT, rel);
    if (isReadmeLike(file)) continue;
    const parsed = await readParsed(file);
    if (!parsed) continue;
    const { data, raw } = parsed;

    if (isOverride(file)) {
      // Override files declare which persona and which adapter they extend.
      for (const f of ["persona", "adapter"]) {
        requireField(file, raw, data, f);
      }
      const stem = kebabStem(file).replace(/\.overrides$/, "");
      if (data.persona && data.persona !== stem) {
        recordError(
          file,
          lineOfKey(raw, "persona"),
          `persona "${data.persona}" does not match filename stem "${stem}"`
        );
      }
      continue;
    }

    // Any other non-readme adapter markdown still needs name and description.
    for (const f of ["name", "description"]) {
      requireField(file, raw, data, f);
    }
  }
}

async function main() {
  const nameRegistry = new Map();
  await validateAgents(nameRegistry);
  await validateSkills(nameRegistry);
  await validateAdapters(nameRegistry);

  if (errors.length > 0) {
    console.error("Frontmatter validation failed:");
    for (const e of errors) console.error(`  ${e}`);
    process.exit(1);
  }
  console.log("Frontmatter validation passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
