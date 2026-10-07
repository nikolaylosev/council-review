# Council review

A Cursor skill that reviews documentation and tests. Three models read the same packet, a clerk checks factual quotes against the repository, and a chair writes one memo. The council does not edit files.

This repository is private. It is not part of SessionLens.

## Install into a project

From the project you want to review:

```bash
mkdir -p .cursor/skills .cursor/agents
ln -s /absolute/path/to/council-review/.cursor/skills/council-review .cursor/skills/council-review
ln -s /absolute/path/to/council-review/.cursor/agents/council-reviewer.md .cursor/agents/council-reviewer.md
ln -s /absolute/path/to/council-review/.cursor/agents/council-chair.md .cursor/agents/council-chair.md
```

Copy the same three paths if you would rather not use symlinks.

## Run

In the agent chat of that project, name the skill and the target:

```text
council review docs/ARCHITECTURE.md
council review the current diff
```

The skill loads only when you name it. It does not start on its own.

## What you get

A memo with must-fix items, single-model facts to look at, agreed recommendations, disputes with both sides, and dropped claims. You decide what to change. Snapshot updates stay a separate decision.

## Quote check

```bash
node .cursor/skills/council-review/scripts/check-quotes.mjs packet.txt findings.md
node --test .cursor/skills/council-review/scripts/check-quotes.test.mjs
```
