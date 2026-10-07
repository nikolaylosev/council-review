#!/usr/bin/env node
// Usage: node check-quotes.mjs <packet.txt> <findings.md> [docs|tests]
// Prints JSON. ok is true only when the quote is an exact substring of the packet,
// the rubric id is allowed for the lane, the required fields are present,
// and a file path in where appears in the packet.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [packetPath, findingsPath, lane] = process.argv.slice(2);
if (!packetPath || !findingsPath || (lane && lane !== "docs" && lane !== "tests")) {
  console.error("usage: node check-quotes.mjs <packet.txt> <findings.md> [docs|tests]");
  process.exit(2);
}

const packet = fs.readFileSync(packetPath, "utf8");
const raw = fs.readFileSync(findingsPath, "utf8");
const rubricsPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "rubrics.md");
const rubricIds = new Set(
  [...fs.readFileSync(rubricsPath, "utf8").matchAll(/^- ([A-Z]\d+)\. /gm)].map((match) => match[1]),
);

function unindent(block) {
  const lines = block.replace(/\n$/, "").split("\n");
  const indents = lines.filter((line) => line.trim() !== "").map((line) => line.match(/^ */)?.[0].length ?? 0);
  const trim = indents.length ? Math.min(...indents) : 0;
  return lines.map((line) => line.slice(trim)).join("\n");
}

function field(body, name) {
  const match = body.match(new RegExp(`^${name}:[ \\t]*(.*)$`, "m"));
  return match ? match[1].trim() : "";
}

function quoteOf(body) {
  const match = body.match(/^quote:[ \t]*\|[ \t]*\n([\s\S]*?)(?=^[a-z]+:|^--- end ---)/m);
  if (!match) return field(body, "quote");
  return unindent(match[1]);
}

function pathOf(where) {
  const candidate = where.trim().replace(/:\d+\s*$/, "");
  if (/^[\w.@~/-]+\.[A-Za-z0-9]+$/.test(candidate)) return candidate;
  return "";
}

const findings = raw
  .split(/^--- finding ---\s*$/m)
  .slice(1)
  .map((chunk) => chunk.split(/^--- end ---\s*$/m)[0])
  .filter((body) => body.trim() !== "")
  .map((body) => {
    const quote = quoteOf(body);
    const where = field(body, "where");
    const rubric = field(body, "rubric");
    const filePath = pathOf(where);
    const reasons = [];
    if (!field(body, "id")) reasons.push("id");
    if (!["high", "medium", "low"].includes(field(body, "severity"))) reasons.push("severity");
    if (!["fact", "judgment", "gap"].includes(field(body, "kind"))) reasons.push("kind");
    if (!where) reasons.push("where");
    if (!field(body, "claim")) reasons.push("claim");
    if (!quote || !packet.includes(quote)) reasons.push("quote");
    const laneOk = !lane || rubric.startsWith(lane === "docs" ? "D" : "T");
    if (!rubricIds.has(rubric) || !laneOk) reasons.push("rubric");
    if (filePath && !packet.includes(filePath)) reasons.push("path");
    const quoteInPacket = quote.length > 0 && packet.includes(quote);
    return {
      id: field(body, "id"),
      kind: field(body, "kind"),
      where,
      rubric,
      quoteInPacket,
      ok: reasons.length === 0,
      reasons,
    };
  });

console.log(JSON.stringify({ findings }, null, 2));
