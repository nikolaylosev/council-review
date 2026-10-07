import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "save-memo.mjs");

test("writes the memo, commit, and file list outside the repo", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "council-memo-"));
  const repo = path.join(dir, "repo");
  const out = path.join(dir, "out");
  fs.mkdirSync(repo);
  fs.writeFileSync(path.join(dir, "memo.md"), "Must-fix\n\nNone.\n");
  fs.writeFileSync(path.join(dir, "files.txt"), "README.md\ndocs/ARCHITECTURE.md\n");
  const result = spawnSync(process.execPath, [script, repo, path.join(dir, "memo.md"), path.join(dir, "files.txt")], {
    encoding: "utf8",
    env: { ...process.env, COUNCIL_REVIEW_DIR: out },
  });
  assert.equal(result.status, 0, result.stderr);
  const saved = JSON.parse(result.stdout);
  assert.equal(saved.commit, "nogit");
  const text = fs.readFileSync(saved.path, "utf8");
  assert.match(text, /Commit: nogit/);
  assert.match(text, /README.md/);
  assert.match(text, /Must-fix/);
  assert.equal(path.dirname(saved.path), out);
});
