import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "check-quotes.mjs");

function run(packet, findings) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "council-quotes-"));
  const packetPath = path.join(dir, "packet.txt");
  const findingsPath = path.join(dir, "findings.md");
  fs.writeFileSync(packetPath, packet);
  fs.writeFileSync(findingsPath, findings);
  const result = spawnSync(process.execPath, [script, packetPath, findingsPath], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test("keeps an exact quote and drops a rewritten one", () => {
  const packet = "API keys live in SecretStorage.\nThe page never sees a key.\n";
  const findings = `--- finding ---
id: F1
severity: high
kind: fact
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
where: docs/a.md:2
claim: The wording is vague.
quote: |
  The page never sees the key.
suggestion: none
--- end ---
`;
  const report = run(packet, findings);
  assert.deepEqual(
    report.findings.map((item) => [item.id, item.quoteInPacket]),
    [
      ["F1", true],
      ["F2", false],
    ],
  );
});
