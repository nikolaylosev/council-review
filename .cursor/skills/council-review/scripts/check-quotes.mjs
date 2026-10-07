#!/usr/bin/env node
// Usage: node check-quotes.mjs <packet.txt> <findings.md>
// Prints JSON. quoteInPacket is true only when the quote is an exact substring of the packet.

import fs from "node:fs";

const [packetPath, findingsPath] = process.argv.slice(2);
if (!packetPath || !findingsPath) {
  console.error("usage: node check-quotes.mjs <packet.txt> <findings.md>");
  process.exit(2);
}

const packet = fs.readFileSync(packetPath, "utf8");
const raw = fs.readFileSync(findingsPath, "utf8");

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

const findings = raw
  .split(/^--- finding ---\s*$/m)
  .slice(1)
  .map((chunk) => chunk.split(/^--- end ---\s*$/m)[0])
  .filter((body) => body.trim() !== "")
  .map((body) => {
    const quote = quoteOf(body);
    return {
      id: field(body, "id"),
      kind: field(body, "kind"),
      where: field(body, "where"),
      quoteInPacket: quote.length > 0 && packet.includes(quote),
    };
  });

console.log(JSON.stringify({ findings }, null, 2));
