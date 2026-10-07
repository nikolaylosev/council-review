import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "check-quotes.mjs");

function run(packet, findings, lane) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "council-quotes-"));
  const packetPath = path.join(dir, "packet.txt");
  const findingsPath = path.join(dir, "findings.md");
  fs.writeFileSync(packetPath, packet);
  fs.writeFileSync(findingsPath, findings);
  const args = [script, packetPath, findingsPath];
  if (lane) args.push(lane);
  const result = spawnSync(process.execPath, args, { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

const packet = "===== FILE docs/a.md =====\nAPI keys live in SecretStorage.\nThe page never sees a key.\n";

test("keeps a complete finding and drops a rewritten quote", () => {
  const findings = `--- finding ---
id: F1
severity: high
kind: fact
rubric: D1
where: docs/a.md:1
claim: Keys stay in the host.
quote: |
  API keys live in SecretStorage.
suggestion: Keep the sentence.
--- end ---
--- finding ---
id: F2
severity: low
kind: judgment
rubric: D1
where: docs/a.md:2
claim: The wording is vague.
quote: |
  The page never sees the key.
suggestion: none
--- end ---
`;
  const report = run(packet, findings, "docs");
  assert.deepEqual(
    report.findings.map((item) => [item.id, item.ok, item.quoteInPacket]),
    [
      ["F1", true, true],
      ["F2", false, false],
    ],
  );
  assert.deepEqual(report.findings[1].reasons, ["quote"]);
});

test("drops a finding with no rubric item or a missing path", () => {
  const findings = `--- finding ---
id: F1
severity: high
kind: fact
where: docs/missing.md:4
claim: The path is not in the packet.
quote: |
  API keys live in SecretStorage.
suggestion: none
--- end ---
--- finding ---
id: F2
severity: high
kind: fact
rubric: T1
where: docs/a.md:1
claim: A test rubric on a docs lane.
quote: |
  API keys live in SecretStorage.
suggestion: none
--- end ---
`;
  const report = run(packet, findings, "docs");
  assert.equal(report.findings[0].ok, false);
  assert.ok(report.findings[0].reasons.includes("rubric"));
  assert.ok(report.findings[0].reasons.includes("path"));
  assert.equal(report.findings[1].ok, false);
  assert.deepEqual(report.findings[1].reasons, ["rubric"]);
});
