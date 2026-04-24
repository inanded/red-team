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

async function main() {
  let text;
  try {
    text = await readFile(REPORT_PATH, "utf8");
  } catch (err) {
    console.error(`cannot read report: ${err.message}`);
    process.exit(3);
  }

  const bannerLine = text.match(
    /Valid against commit `([a-f0-9]{7,40})` on branch `([^`]+)`, captured `([^`]+)` \(tree: `([^`]+)`\)/
  );

  if (!bannerLine) {
    console.error(
      "report has no freshness banner (pre-1.0.2 format). Treat as stale and re-run the pack."
    );
    process.exit(2);
  }

  const [, reportSha, reportBranch, reportDate, reportDirty] = bannerLine;

  const head = currentHead();
  if (!head.isGit) {
    console.log(
      `report captured at commit ${reportSha} on ${reportBranch} (${reportDate}).`
    );
    console.log("current directory is not a git repo — cannot compare. Proceed with caution.");
    process.exit(0);
  }

  const shaMatches = head.sha.startsWith(reportSha) || reportSha.startsWith(head.sha);
  const branchMatches = head.branch === reportBranch;

  if (shaMatches && branchMatches && !head.dirty) {
    console.log(`report matches HEAD (${head.sha.slice(0, 12)} on ${head.branch}).`);
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
