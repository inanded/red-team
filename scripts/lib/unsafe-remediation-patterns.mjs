// Shared pattern library for unsafe-remediation detection.
//
// Two consumers:
//   - scripts/validate-safe-remediation.mjs — CI validator, scans committed
//     pack text (agents/, skills/, adapters/) and fails the build if any
//     committed text matches an unsafe-remediation pattern.
//   - scripts/check-report-safety.mjs — runtime helper that applies the same
//     patterns to a generated report under docs/red-team-*/ before a user
//     pipes it into a downstream coding assistant. Addresses rt2-02: CI
//     alone scans only committed text; generated reports need their own pass.
//
// If you add a new pattern: add it here, re-run both scripts, and update the
// acceptance-test suite in scripts/validate-safe-remediation.mjs. See
// skills/attack-hypothesis/SKILL.md for the contract these patterns enforce.

// Patterns that indicate an unsafe remediation seed. `why` is shown to the
// contributor when a match hits. `multiline: true` patterns are handled in a
// whole-text pass; default patterns are line-based.
export const PATTERNS = [
  // ------ Creation class ------
  {
    // Determiner is REQUIRED. Making it optional caused false positives on
    // noun-phrase references like "trust-school create route" or "on generate
    // endpoint" where a creation verb acts as an adjective. Path-based
    // pattern below catches the "create files in public/" plural variant.
    re: /\b(create|add|scaffold|drop\s+in|write|spin\s+up|stand\s+up|instantiate|provision|materialize|bootstrap|generate|build|make|construct|stub(?:\s+out)?|author|compose|produce|whip\s+up|put\s+together|throw\s+together|place|put|set\s+up|deploy|implement|emit|publish|touch)\s+(a|an|another|new|the|some|any)\s+(new\s+)?(files?|pages?|routes?|endpoints?|scripts?|HTML\s+documents?|test\s+pages?|test\s+files?|debug\s+pages?|debug\s+files?|debug\s+endpoints?|helper\s+scripts?|helper\s+class(?:es)?|demo\s+pages?|sample\s+pages?|poc|proof.of.concept|artifacts?)\b/i,
    why: "instructs the reader to create a new artifact — a downstream coding AI will implement this literally",
  },
  {
    re: /\b(to\s+verify|to\s+test|to\s+prove|to\s+demonstrate|to\s+confirm)\b[^.\n]{0,80}\b(create|add|scaffold|run|execute|call|fetch|curl|wget|spin\s+up|stand\s+up|instantiate|provision|materialize|bootstrap|generate|build|make|construct|stub|author|compose|produce|place|put|set\s+up|deploy|implement|publish|touch)\b/i,
    why: "'to verify, create/run ...' construction — verification must be read-only",
  },
  {
    // Multi-line: a verify verb on one line, a creation verb on a later line.
    re: /\b(to\s+verify|to\s+test|to\s+prove|to\s+demonstrate|to\s+confirm)\b[\s\S]{0,200}?\b(create|add|scaffold|spin\s+up|stand\s+up|instantiate|provision|materialize|bootstrap|generate|build|make|construct|stub|author|compose|produce|place|put|set\s+up|deploy|implement|publish|touch)\s+(a|an|another|new|the|some)\b/is,
    why: "'to verify ... create/scaffold ...' construction spanning multiple lines — verification must be read-only",
    multiline: true,
  },
  {
    // Path-based trigger for public-serving directories. ANY create/add verb
    // paired with a path under public/ static/ pages/ app/ dist/ www/ is a
    // red flag, including Next.js route/page/layout files. rt3-04: the old
    // rt2-10 whitelist for route.ts/page.tsx filenames was hiding true
    // positives — "Create app/admin/page.tsx" is the exact debug-account.html
    // class of incident (a new public-serving route shipped). Edit fixes
    // use edit verbs (replace / tighten / add-check) that don't appear in
    // this verb list, so the whitelist was never needed to let them through.
    re: /\b(create|add|drop|write|scaffold|generate|build|make|place|put|deploy|publish|touch)\b[^\n]{0,80}\b(public|static|pages|app|dist|www|wwwroot|htdocs)\/[A-Za-z0-9._()\[\]@/-]+/i,
    why: "targets a public-serving directory with a create/add verb — any such file could be shipped to production",
  },
  {
    re: /\b(proof.of.concept|PoC)\b[^\n]{0,60}\b(files?|pages?|endpoints?|routes?|html|artifacts?|scripts?)\b/i,
    why: "'PoC file/page/endpoint' — PoCs must stay in a throwaway sandbox, never in the project tree",
  },
  {
    re: /\bdebug[- ]?(account|page|file|html|endpoint|route)\.html\b/i,
    why: "references a debug-artifact filename — exactly the pattern that caused the key-exposure incident",
  },

  // ------ Destruction class ------
  // Scope matters: line-level / literal-level / argument-level deletes are
  // fine ("remove the hardcoded key", "delete line 42") but module-level and
  // above are not. The noun list excludes "line", "literal", "argument",
  // "import", "call", "value", "clause", "block", "mode", "flag",
  // "parameter" — all of which pair legitimately with remove/delete.
  // `{0,120}?` allows long qualifier phrases ("the entire legacy admin
  // webhook handler module"). Determiner is optional so "remove legacy auth
  // middleware" trips (rt2-08).
  {
    re: /\b(delete|remove|rip\s+out|tear\s+out|deprecate|retire|archive|sunset|decommission|obsolete|kill|nuke)\s+(?:(?:the|this|that|an|a|any|all|some)\s+)?[^\n.]{0,120}?\b(files?|modules?|directories|directory|folders?|packages?|routes?|endpoints?|middlewares?|middleware|handlers?|controllers?|services?|components?)\b/i,
    why: "scope-unsafe destructive remediation — caller enumeration required; use line-level or literal-level scope instead",
  },
  {
    re: /\bdrop\s+(the|this|that|an|a)\s+[^\n.]{0,120}?\b(table|column|schema|database|collection)\b/i,
    why: "schema-level destructive remediation without a migration plan — must use a migration file, not a raw drop",
  },
  {
    // Direct file-path delete: verb immediately followed by a path.ext.
    re: /\b(delete|remove|rm|unlink|archive|sunset)\s+[a-z0-9_./~-]+\.(ts|tsx|js|jsx|mjs|cjs|py|rb|go|rs|php|html|yml|yaml|json|sh|sql|toml|ini|env|md|xml|lock)\b/i,
    why: "whole-file deletion by path — enumerate callers first or demote to NEEDS-VERIFY",
  },
  {
    re: /(^|\s)(rm\s+-rf|rm\s+-r|rm\s+-f|rm\s+-fr|git\s+rm|unlink)\s+[^\s]+/,
    why: "destructive shell command in the Fix prose — a downstream AI will execute it",
  },

  // ------ Rotation class ------
  // Rotation mentions must be accompanied by ordering guidance. Specific
  // referent (the|your) excludes enumerative "rotate an API key" noun-phrase
  // lists. Requires a well-formed Fix with ordering/verify/environment markers
  // somewhere in the same paragraph (not necessarily the same line — that was
  // rt2-07).
  {
    // Paragraph-scoped: if Rotate appears, require an ordering marker
    // somewhere within ~600 chars (or until a blank-line paragraph break).
    re: /\bRotate\s+(the|your)\b[^\n.]*?\b(key|secret|token|credential|password|api\s+key|service\s+account|service\s+role|access\s+key|signing\s+secret)\b(?![\s\S]{0,600}?\b(before|after|first|then|environment|env|production|staging|preview|grace\s+window|verify|confirm\s+that|coordinate\s+(a\s+)?maintenance|revoke)\b)/i,
    why: "rotation instruction missing ordering guidance within paragraph — name environments, grace window, and verification step",
    multiline: true,
  },
];

// If a line (or any line within a multi-line match's span) contains any of
// these negation markers, the pattern is almost certainly an anti-instruction
// ("never write a Fix that tells the reader to create a file"), not an
// instruction. Skip the match.
export const NEGATION_MARKERS = [
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
  /\bdisallowed\b/i,
];

// Known report tokens that look like negation markers but aren't — the
// rt2-05 per-Fix advisory mandates `[DO NOT AUTO-IMPLEMENT]` on every Fix,
// which contains the substring "DO NOT". Without stripping this first, the
// `\bdo not\b` marker above would match every Fix line and disable the
// single-line scanner on exactly the lines it must scan. rt3-01 was the
// silent bypass this strip-pass closes.
const REPORT_TOKENS_TO_STRIP = [
  /\[DO NOT AUTO-IMPLEMENT\]/gi,
  /\bREAD-FIRST\b/gi,
];

export function isAntiInstruction(line) {
  let stripped = line;
  for (const re of REPORT_TOKENS_TO_STRIP) {
    stripped = stripped.replace(re, "");
  }
  return NEGATION_MARKERS.some((re) => re.test(stripped));
}

// Scan arbitrary text (a persona's report, a committed markdown file,
// anything) and return an array of violations.
// Each violation: { line, why, preview }.
export function scanText(text) {
  const violations = [];
  const lines = text.split(/\r?\n/);

  // Line-based pass for single-line patterns.
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isAntiInstruction(line)) continue;
    for (const { re, why, multiline } of PATTERNS) {
      if (multiline) continue;
      if (re.test(line)) {
        violations.push({
          line: i + 1,
          why,
          preview: line.trim(),
        });
      }
    }
  }

  // Whole-text pass for multi-line patterns.
  for (const { re, why, multiline } of PATTERNS) {
    if (!multiline) continue;
    const globalRe = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
    let m;
    while ((m = globalRe.exec(text)) !== null) {
      const start = m.index;
      const end = m.index + m[0].length;
      const before = text.slice(0, start);
      const startLine = before.split(/\r?\n/).length;
      const spannedLines = text.slice(0, end).split(/\r?\n/).slice(startLine - 1);
      if (spannedLines.some((l) => isAntiInstruction(l))) {
        if (m[0].length === 0) globalRe.lastIndex++;
        continue;
      }
      const preview = m[0].replace(/\s+/g, " ").trim().slice(0, 160);
      violations.push({
        line: startLine,
        why,
        preview,
      });
      if (m[0].length === 0) globalRe.lastIndex++;
    }
  }

  return violations;
}
