#!/usr/bin/env node
// Defence-in-depth against the "debug-account.html" class of incident.
//
// A persona's report can tell a downstream coding AI to create a file in a
// public-serving directory; the coding AI will often implement that literally.
// The pack mitigates this with (a) an explicit Downstream-AI safety section in
// skills/attack-hypothesis/SKILL.md, (b) a scrub step in the coordinator, and
// (c) a mandatory report header banner. This script is the fourth layer —
// it fails CI if any committed persona, skill, adapter override, or worked
// example contains a remediation pattern that would seed that behaviour.
//
// What it scans:
//   agents/**/*.md, skills/**/SKILL.md, adapters/**/*.md
//
// What it flags:
//   - Phrases that instruct a reader to create/add/scaffold a new file, page,
//     route, endpoint, script, or "proof-of-concept" artifact.
//   - Paths under public/, static/, pages/, app/, dist/, www/, wwwroot/,
//     htdocs/ when paired with a create/add verb.
//   - "To verify, create/run/add ..." constructions.
//
// Allow-listed files (they legitimately describe the bad pattern as
// a counter-example):
//   - skills/attack-hypothesis/SKILL.md
//   - agents/red-team-coordinator.md
//   - AGENTS.md
//   - CLAUDE.md
//   - CHANGELOG.md
//   - README.md
//   - scripts/validate-safe-remediation.mjs
//
// Exits non-zero with file:line messages.

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";
import { glob } from "glob";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const ALLOWLIST = new Set([
  "skills/attack-hypothesis/SKILL.md",
  "agents/red-team-coordinator.md",
  "AGENTS.md",
  "CLAUDE.md",
  "CHANGELOG.md",
  "README.md",
  "scripts/validate-safe-remediation.mjs",
]);

const SCAN_GLOBS = [
  "agents/**/*.md",
  "skills/**/SKILL.md",
  "adapters/**/*.md",
];

// Patterns that indicate an unsafe remediation seed. Each entry is tested
// line-by-line against the file content. `why` is shown to the contributor.
const PATTERNS = [
  // ------ Creation class ------
  {
    // Require a determiner (a/an/another/new/the) so that noun-phrase mentions like
    // "create route" or "generate endpoint" describing the target app's existing
    // structure don't trip the pattern. The incident phrasing was
    // "create a test file ..." which has "a".
    re: /\b(create|add|scaffold|drop\s+in|write)\s+(a|an|another|new|the)\s+(new\s+)?(file|page|route|endpoint|script|HTML\s+document|test\s+page|test\s+file|debug\s+page|debug\s+file|debug\s+endpoint|helper\s+script|demo\s+page|sample\s+page|poc|proof.of.concept)\b/i,
    why: "instructs the reader to create a new artifact — a downstream coding AI will implement this literally",
  },
  {
    re: /\b(to\s+verify|to\s+test|to\s+prove|to\s+demonstrate|to\s+confirm)\b[^.\n]{0,80}\b(create|add|scaffold|run|execute|call|fetch|curl|wget)\b/i,
    why: "'to verify, create/run ...' construction — verification must be read-only",
  },
  {
    re: /\b(create|add|drop|write|scaffold|generate)\b[^\n]{0,80}\b(public|static|pages|app|dist|www|wwwroot|htdocs)\/[A-Za-z0-9._-]+/i,
    why: "targets a public-serving directory with a create/add verb — any such file could be shipped to production",
  },
  {
    re: /\b(proof.of.concept|PoC)\b[^\n]{0,60}\b(file|page|endpoint|route|html|artifact|script)\b/i,
    why: "'PoC file/page/endpoint' — PoCs must stay in a throwaway sandbox, never in the project tree",
  },
  {
    re: /\bdebug[- ]?(account|page|file|html|endpoint|route)\.html\b/i,
    why: "references a debug-artifact filename — exactly the pattern that caused the key-exposure incident",
  },

  // ------ Destruction class ------
  // Scope matters: line-level / literal-level / argument-level deletes are fine
  // ("remove the hardcoded key", "delete line 42"), but module-level and above
  // are not. The allowed noun list below intentionally excludes "line",
  // "literal", "argument", "import", "call", "value", "clause", "block", "mode",
  // "flag", "parameter" — all of which pair legitimately with remove/delete.
  // `[^\n.]{0,40}?` allows qualifier words like "legacy admin" or "/api/debug".
  {
    re: /\b(delete|remove|rip\s+out|tear\s+out)\s+(the|this|that|an|a)\s+[^\n.]{0,40}?\b(file|module|directory|folder|package|route|endpoint|middleware|handler|controller|service|component)\b/i,
    why: "scope-unsafe destructive remediation — caller enumeration required; use line-level or literal-level scope instead",
  },
  {
    re: /\bdrop\s+(the|this|that|an|a)\s+[^\n.]{0,40}?\b(table|column|schema|database|collection)\b/i,
    why: "schema-level destructive remediation without a migration plan — must use a migration file, not a raw drop",
  },
  {
    // Direct file-path delete: verb immediately followed by a path.ext.
    re: /\b(delete|remove|rm|unlink)\s+[a-z0-9_./~-]+\.(ts|tsx|js|jsx|mjs|cjs|py|rb|go|rs|php|html|yml|yaml|json|sh|sql|toml|ini|env|md|xml|lock)\b/i,
    why: "whole-file deletion by path — enumerate callers first or demote to NEEDS-VERIFY",
  },
  {
    re: /(^|\s)(rm\s+-rf|rm\s+-r|rm\s+-f|rm\s+-fr|git\s+rm|unlink)\s+[^\s]+/,
    why: "destructive shell command in the Fix prose — a downstream AI will execute it",
  },

  // ------ Rotation class ------
  // Rotation mentions must be accompanied by ordering guidance. Only flagged
  // when "Rotate" starts a sentence or bullet (an imperative aimed at the
  // reader), not when it's inside a noun-phrase list of what the target app's
  // routes do (e.g. "the privileged actions include rotate / revoke / ...").
  // Requires "the"/"your" (specific referent) — excludes "an"/"a"
  // (enumerative). Allows arbitrary qualifier text between determiner and
  // the final noun. Negation markers are strict ordering/verification
  // indicators — "dashboard" alone is not one. This lints committed text;
  // runtime prose is handled by the coordinator's scrub.
  {
    re: /^(\s*[-*>]\s*|\s*\d+\.\s*)?Rotate\s+(the|your)\b[^\n.]*?\b(key|secret|token|credential|password|api\s+key|service\s+account|service\s+role|access\s+key|signing\s+secret)\b(?![^\n]*\b(before|after|first|then|environment|env|production|staging|preview|grace\s+window|verify|confirm\s+that|coordinate\s+(a\s+)?maintenance)\b)/im,
    why: "rotation instruction missing ordering guidance — name environments, grace window, and verification step",
  },
];

// If a line contains any of these negation markers, the pattern is almost
// certainly an anti-instruction ("never write a Fix that tells the reader
// to create a file"), not an instruction. Skip the line.
const NEGATION_MARKERS = [
  /\bnever\b/i,
  /\bmust not\b/i,
  /\bmustn'?t\b/i,
  /\bdo not\b/i,
  /\bdon'?t\b/i,
  /\bcannot\b/i,
  /\bcan'?t\b/i,
  /\bforbidden\b/i,
  /\bprohibit(ed|ion)?\b/i,
  /\bavoid\b/i,
  /\banti-?pattern\b/i,
  /\bbad fix\b/i,
  /\bpack defect\b/i,
  /\bunsafe\b/i,
  /\bREAD-FIRST\b/i,
  /\bDO NOT AUTO-IMPLEMENT\b/i,
];

function isAntiInstruction(line) {
  return NEGATION_MARKERS.some((re) => re.test(line));
}

const errors = [];

async function scanFile(relPath) {
  if (ALLOWLIST.has(relPath.split(path.sep).join("/"))) return;

  const abs = path.join(REPO_ROOT, relPath);
  let text;
  try {
    text = await readFile(abs, "utf8");
  } catch (err) {
    errors.push(`${relPath}: unreadable (${err.message})`);
    return;
  }

  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isAntiInstruction(line)) continue;
    for (const { re, why } of PATTERNS) {
      if (re.test(line)) {
        errors.push(
          `${relPath}:${i + 1}: unsafe-remediation pattern — ${why}\n  > ${line.trim()}`
        );
      }
    }
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
