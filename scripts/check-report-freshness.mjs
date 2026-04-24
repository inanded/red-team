#!/usr/bin/env node
// Compare a red-team report's captured commit SHA against the current HEAD.
// A stale report applied blindly causes line-number drift — fixes land in the
// wrong place and silently break something. This script warns loudly if the
// report is out of date.
//
// Usage:
//   node scripts/check-report-freshness.mjs <report-path>
//   npx inanded/red-team --check-freshness <report-path>
//
// Exit codes:
//   0  — report matches HEAD (or target is not a git repo)
//   1  — report is stale (HEAD has moved since the report was captured)
//   2  — report lacks a SHA line (old format, pre-1.0.2)
//   3  — usage error or unexpected failure

import { readFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import process from "node:process";

const REPORT_PATH = process.argv[2];

if (!REPORT_PATH) {
  console.error("usage: check-report-freshness.mjs <report-path>");
  process.exit(3);
}

function currentHead() {
  try {
    const sha = execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
    const branch = execSync("git rev-parse --abbrev-ref HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
    const dirty =
      execSync("git status --porcelain", { stdio: ["ignore", "pipe", "ignore"] })
        .toString()
        .trim().length > 0;
    return { sha, branch, dirty, isGit: true };
  } catch {
    return { isGit: false };
  }
}

// Tamper-evidence: given a SHA from the report banner, return the commit date
// that git remembers for that SHA. If the SHA doesn't exist (fabricated banner)
// or the date in the banner disagrees with git's record (hand-edited banner),
// the caller can flag tampering. Not cryptographic — an attacker with commit
// access can still forge — but catches accidental or casual tampering.
function gitCommitDate(sha) {
  try {
    const date = execSync(`git log -1 --format=%cI ${sha}`, {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    return date || null;
  } catch {
    return null;
  }
}

async function main() {
  let text;
  try {
    text = await readFile(REPORT_PATH, "utf8");
  } catch (err) {
    console.error(`cannot read report: ${err.message}`);
    process.exit(3);
  }

  const bannerLine = text.match(
    /Valid against commit `([a-f0-9]{7,40}|unknown)` on branch `([^`]+)`, captured `([^`]+)` \(tree: `([^`]+)`\)/
  );

  if (!bannerLine) {
    console.error(
      "report has no freshness banner (pre-1.0.2 format). Treat as stale and re-run the pack."
    );
    process.exit(2);
  }

  const [, reportSha, reportBranch, reportDate, reportDirty] = bannerLine;

  // rt3-06: a persona in direct-invoke mode may have been unable to read the
  // current SHA (no CODEBASE_PROFILE.md and no Bash tool) and filled the
  // banner with the literal "unknown". Treat that as not-yet-verified — the
  // banner's tamper-evidence story does not apply when the SHA is unknown.
  if (reportSha === "unknown") {
    console.error("report banner records commit SHA as `unknown` — freshness cannot be verified.");
    console.error("the persona was likely invoked directly without a recon-scout profile.");
    console.error("re-run via the coordinator (which produces CODEBASE_PROFILE.md) to get a stamped banner.");
    process.exit(2);
  }

  const head = currentHead();
  if (!head.isGit) {
    // rt3-07: exit fail-closed (2) so CI pipelines checking $? don't treat the
    // non-git case as a pass. The previous exit 0 was fail-open.
    console.error(
      `report captured at commit ${reportSha} on ${reportBranch} (${reportDate}).`
    );
    console.error("current directory is not a git repo — cannot verify freshness.");
    console.error("treat as not-yet-verified; do not rely on path:line references without a manual check.");
    process.exit(2);
  }

  // Tamper-evidence: does git remember a commit with this SHA, and does its
  // recorded commit date match the banner's capture date (to the day)?
  const gitDate = gitCommitDate(reportSha);
  if (!gitDate) {
    console.log("report banner references a commit SHA that does not exist in this repo:");
    console.log(`  report captured at : ${reportSha} on ${reportBranch} (${reportDate})`);
    console.log("the SHA may be from a different repo, a deleted branch, or a forged banner.");
    console.log("treat as STALE and re-run the pack.");
    process.exit(1);
  }
  if (reportDate !== "unknown" && !gitDate.startsWith(reportDate)) {
    console.log("report banner date disagrees with git's record for the captured SHA:");
    console.log(`  banner says captured : ${reportDate}`);
    console.log(`  git log -1 %cI ${reportSha.slice(0, 12)} : ${gitDate}`);
    console.log("the banner has likely been hand-edited or the report is from a different tree.");
    console.log("treat as STALE and re-run the pack.");
    process.exit(1);
  }

  const shaMatches = head.sha.startsWith(reportSha) || reportSha.startsWith(head.sha);
  const branchMatches = head.branch === reportBranch;

  if (shaMatches && branchMatches && !head.dirty) {
    console.log(`report matches HEAD (${head.sha.slice(0, 12)} on ${head.branch}).`);
    console.log(`banner date ${reportDate} matches git's record for this commit.`);
    console.log("safe to review — path:line references are current.");
    process.exit(0);
  }

  console.log("report is STALE relative to the current tree:");
  console.log("");
  console.log(`  report captured at : ${reportSha} on ${reportBranch} (${reportDate}, tree: ${reportDirty})`);
  console.log(`  current HEAD       : ${head.sha} on ${head.branch} (tree: ${head.dirty ? "dirty" : "clean"})`);
  console.log("");
  console.log("the path:line references in this report may point at unrelated code.");
  console.log("re-run the pack against the current commit before applying any Fix:");
  console.log("");
  console.log("  claude");
  console.log("  > run the red-team-coordinator against this project");
  console.log("");
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(3);
});
