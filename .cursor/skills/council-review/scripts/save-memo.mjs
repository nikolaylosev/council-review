#!/usr/bin/env node
// Usage: node save-memo.mjs <repo-root> <memo.md> <files.txt>
// Writes the memo outside the repo and prints the path. files.txt is one path per line.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const [repoRoot, memoPath, filesPath] = process.argv.slice(2);
if (!repoRoot || !memoPath || !filesPath) {
  console.error("usage: node save-memo.mjs <repo-root> <memo.md> <files.txt>");
  process.exit(2);
}

const memo = fs.readFileSync(memoPath, "utf8").trim();
const files = fs
  .readFileSync(filesPath, "utf8")
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

const rev = spawnSync("git", ["-C", repoRoot, "rev-parse", "HEAD"], { encoding: "utf8" });
const commit = rev.status === 0 ? rev.stdout.trim() : "nogit";
const short = commit === "nogit" ? "nogit" : commit.slice(0, 7);
const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
const dir = process.env.COUNCIL_REVIEW_DIR || path.join(os.homedir(), ".local", "share", "council-review");
fs.mkdirSync(dir, { recursive: true });
const out = path.join(dir, `${stamp}-${short}.md`);
const body = [
  "# Council memo",
  "",
  `- Date: ${new Date().toISOString()}`,
  `- Repo: ${path.resolve(repoRoot)}`,
  `- Commit: ${commit}`,
  "- Files:",
  ...files.map((file) => `  - ${file}`),
  "",
  "## Memo",
  "",
  memo,
  "",
].join("\n");
fs.writeFileSync(out, body);
console.log(JSON.stringify({ path: out, commit }));
