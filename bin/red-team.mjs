#!/usr/bin/env node
// red-team — project-scoped installer for the Claude Code red-team pack.
//
// Default behaviour: copies every agent (coordinator + recon-scout + 12 personas)
// and every skill (7 shared skills) into the current directory's .claude/ tree.
// Optionally copies one stack adapter.
//
// Usage:
//   npx inanded/red-team                          install everything
//   npx inanded/red-team --adapter <slug>         also copy one adapter
//   npx inanded/red-team --personas a,b,c         only the named personas
//   npx inanded/red-team --skills a,b             only the named skills
//   npx inanded/red-team --list                   list available agents, skills, adapters
//   npx inanded/red-team --help                   show usage
//
// Runs anywhere Node 18+ runs. Zero dependencies.

import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PACK_ROOT  = path.resolve(SCRIPT_DIR, "..");
const CWD        = process.cwd();

const AGENTS_TOP = ["red-team-coordinator.md", "recon-scout.md"];
const PERSONAS = [
  "external-attacker", "malicious-user", "malicious-insider", "payment-abuser",
  "social-supply-chain", "crypto-secrets-auditor", "compliance-auditor",
  "cloud-infra-attacker", "ai-llm-attacker", "race-condition-hunter",
  "api-versioning-attacker", "observability-attacker",
  "third-party-trust-auditor",
];
const SKILLS = [
  "attack-hypothesis", "severity-scoring", "effort-estimation",
  "confirmed-safe-tracking", "threat-modeling", "exploit-chain-mapping",
  "attack-surface-discovery",
];
const ADAPTERS = [
  "supabase-stripe-nextjs", "auth0-postgres", "clerk-prisma", "firebase",
  "aws-cognito-dynamodb", "paddle", "mongodb-mongoose",
];

function printHelp() {
  console.log(`red-team — project-scoped installer

Usage
  npx inanded/red-team [options]

Options
  --adapter <slug>           also copy a stack adapter
  --personas <a,b,c>         install only the named personas (comma-separated)
  --skills <a,b>             install only the named skills (comma-separated)
  --only-agents              skip skills
  --only-skills              skip agents (equivalent to npx skills behaviour)
  --check-freshness <path>   check whether a report is stale relative to HEAD
  --check-safety <path>      scan a report for unsafe-remediation patterns
                             before piping it into another coding assistant
  --list                     print available agents, skills, and adapters
  --help, -h                 show this message

Default: installs every agent and every skill into ./.claude/

Examples
  npx inanded/red-team
  npx inanded/red-team --adapter supabase-stripe-nextjs
  npx inanded/red-team --personas external-attacker,malicious-user
  npx inanded/red-team --only-skills
`);
}

function printList() {
  console.log("Agents (15 total):");
  AGENTS_TOP.forEach((f) => console.log("  " + f.replace(/\.md$/, "")));
  PERSONAS.forEach((p) => console.log("  " + p));
  console.log("\nSkills (7 total):");
  SKILLS.forEach((s) => console.log("  " + s));
  console.log("\nAdapters (7 total):");
  ADAPTERS.forEach((a) => console.log("  " + a));
}

function parseArgs(argv) {
  const out = {
    adapter: null, personas: null, skills: null,
    onlyAgents: false, onlySkills: false,
    checkFreshness: null, checkSafety: null,
    list: false, help: false,
  };
  // Every flag below requires a following argument. Without this check,
  // `npx ... --check-safety` with no path silently fell through to a full
  // install (rt3-02) and could clobber .claude/agents/.
  const flagsRequiringValue = new Set([
    "--check-freshness", "--check-safety", "--adapter", "--personas", "--skills",
  ]);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (flagsRequiringValue.has(a) && (i + 1 >= argv.length || argv[i + 1].startsWith("--"))) {
      console.error(`argument ${a} requires a value`);
      console.error("run `npx inanded/red-team --help` for usage");
      process.exit(1);
    }
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--list") out.list = true;
    else if (a === "--only-agents") out.onlyAgents = true;
    else if (a === "--only-skills") out.onlySkills = true;
    else if (a === "--check-freshness") out.checkFreshness = argv[++i];
    else if (a === "--check-safety") out.checkSafety = argv[++i];
    else if (a === "--adapter") out.adapter = argv[++i];
    else if (a === "--personas") out.personas = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    else if (a === "--skills") out.skills = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    else if (a === "add") continue;
    else {
      console.error("unknown argument: " + a);
      console.error("run `npx inanded/red-team --help` for usage");
      process.exit(1);
    }
  }
  return out;
}

function copyFile(src, dst) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
}

function copyDirRecursive(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDirRecursive(s, d);
    else if (entry.isFile()) fs.copyFileSync(s, d);
  }
}

function installAgents(selectedPersonas) {
  const agentsDst = path.join(CWD, ".claude", "agents");
  const rtDst = path.join(agentsDst, "red-team");
  fs.mkdirSync(rtDst, { recursive: true });

  for (const name of AGENTS_TOP) {
    const src = path.join(PACK_ROOT, "agents", name);
    const dst = path.join(agentsDst, name);
    if (fs.existsSync(src)) copyFile(src, dst);
    else console.warn("skip (missing): " + src);
  }

  const personasToInstall = selectedPersonas ?? PERSONAS;
  for (const p of personasToInstall) {
    const src = path.join(PACK_ROOT, "agents", "red-team", p + ".md");
    const dst = path.join(rtDst, p + ".md");
    if (fs.existsSync(src)) copyFile(src, dst);
    else console.warn("skip (missing persona): " + p);
  }
  // always ship the persona README so users see the index
  const readmeSrc = path.join(PACK_ROOT, "agents", "red-team", "README.md");
  if (fs.existsSync(readmeSrc)) copyFile(readmeSrc, path.join(rtDst, "README.md"));
}

function installSkills(selectedSkills) {
  const skillsToInstall = selectedSkills ?? SKILLS;
  for (const s of skillsToInstall) {
    const src = path.join(PACK_ROOT, "skills", s, "SKILL.md");
    const dst = path.join(CWD, ".claude", "skills", s, "SKILL.md");
    if (fs.existsSync(src)) copyFile(src, dst);
    else console.warn("skip (missing skill): " + s);
  }
}

function installAdapter(slug) {
  const src = path.join(PACK_ROOT, "adapters", slug);
  if (!fs.existsSync(src)) {
    console.warn("adapter not found: " + slug);
    return false;
  }
  const dst = path.join(CWD, ".claude", "red-team-adapters", slug);
  if (fs.existsSync(dst)) fs.rmSync(dst, { recursive: true, force: true });
  copyDirRecursive(src, dst);
  return true;
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help)  { printHelp(); return; }
  if (args.list)  { printList(); return; }
  if (args.checkFreshness) {
    const script = path.join(PACK_ROOT, "scripts", "check-report-freshness.mjs");
    const result = spawnSync("node", [script, args.checkFreshness], { stdio: "inherit" });
    process.exit(result.status ?? 1);
  }
  if (args.checkSafety) {
    const script = path.join(PACK_ROOT, "scripts", "check-report-safety.mjs");
    const result = spawnSync("node", [script, args.checkSafety], { stdio: "inherit" });
    process.exit(result.status ?? 1);
  }

  if (args.onlyAgents && args.onlySkills) {
    console.error("--only-agents and --only-skills are mutually exclusive");
    process.exit(1);
  }

  if (args.personas) {
    const unknown = args.personas.filter((p) => !PERSONAS.includes(p));
    if (unknown.length) {
      console.error("unknown personas: " + unknown.join(", "));
      console.error("run `npx inanded/red-team --list` to see valid names");
      process.exit(1);
    }
  }
  if (args.skills) {
    const unknown = args.skills.filter((s) => !SKILLS.includes(s));
    if (unknown.length) {
      console.error("unknown skills: " + unknown.join(", "));
      console.error("run `npx inanded/red-team --list` to see valid names");
      process.exit(1);
    }
  }

  console.log("installing the red-team pack into " + CWD);

  if (!args.onlySkills) {
    console.log("  agents -> ./.claude/agents/");
    installAgents(args.personas);
  }
  if (!args.onlyAgents) {
    console.log("  skills -> ./.claude/skills/");
    installSkills(args.skills);
  }
  if (args.adapter) {
    if (installAdapter(args.adapter)) {
      console.log("  adapter -> ./.claude/red-team-adapters/" + args.adapter + "/");
    }
  }

  console.log("");
  console.log("done. project-scoped — nothing written outside " + CWD + "/.claude/");
  console.log("");
  console.log("next steps");
  console.log("  1. open this project in claude code");
  console.log("  2. run the coordinator with a natural-language prompt, e.g.");
  console.log("");
  console.log("     > run the red-team-coordinator against this project");
  console.log("");
  console.log("  the consolidated report will be written to docs/red-team-<date>.md");
  console.log("  and per-persona reports under docs/red-team-<date>/.");
}

try { main(); }
catch (err) {
  console.error("error: " + (err && err.message ? err.message : err));
  process.exit(1);
}
