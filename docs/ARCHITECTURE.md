# Architecture

This document describes how a council review runs: who does what, what is checked by a script, and where the memo goes. The clerk's procedure is [`.cursor/skills/council-review/SKILL.md`](../.cursor/skills/council-review/SKILL.md). This file is the map.

The shape follows [Andrej Karpathy's llm-council](https://github.com/karpathy/llm-council): several models answer on their own, they judge anonymously, and a chair writes one result. Here the unit is a finding about documentation or tests, and a script plus the repository decide which findings survive. There is no web app and no OpenRouter call. Cursor launches the models as subagents.

## 1. Pieces

| Piece | File | Job |
|---|---|---|
| Clerk | the agent in the chat, following `SKILL.md` | Builds the packet, clusters findings, checks facts, saves the memo. Has no opinion. |
| Reviewer | `.cursor/agents/council-reviewer.md` | Reads only the packet. Returns findings. `readonly`, model `inherit`. |
| Chair | `.cursor/agents/council-chair.md` | Writes the memo from clusters the clerk already classified. Does not add findings. `readonly`, model `inherit`. |
| Seats | `.cursor/skills/council-review/council.json` | `seats` is the reviewer model list. `chair` is the memo model. Lines starting with `//` are comments. |
| Rubric | `.cursor/skills/council-review/rubrics.md` | `D1`–`D5` for documents, `T1`–`T5` for tests. |
| Quote check | `.cursor/skills/council-review/scripts/check-quotes.mjs` | Drops a finding before clustering when `ok` is not true. |
| Memo log | `.cursor/skills/council-review/scripts/save-memo.mjs` | Writes the memo under `~/.local/share/council-review/`. |

The skill loads only when the user names a council review. It does not start on its own.

## 2. One run

1. The clerk reads `council.json` and the rubric for the lane. If `seats` has fewer than two entries, or `chair` is empty, it stops.
2. It writes a closed packet in a fresh temp directory outside the project. Reviewers do not search the repository and do not run tests.
3. It launches one `council-reviewer` per seat, in one message, and passes that seat's model. A rejected model is dropped and is not replaced by the clerk's own model. If fewer than two seats return findings, it stops and does not call the chair.
4. `check-quotes.mjs` marks each finding. The clerk drops every finding whose `ok` is not true.
5. The clerk clusters what remains by path and overlapping quote, then opens cited files for `fact` and for a `gap` that points at a file. A judgment is not grounded.
6. Stage 2 runs only for a cluster one seat raised, or whose severity differs. Seats are labeled A, B, C in `council.json` order. Model names are stripped. The calls are fresh, not resumes, so a seat does not know which cluster it wrote. Each vote is `agree`, `disagree`, or `unsure`.
7. A fresh `council-chair` call receives the classified clusters and writes the memo in the user's language. It does not invent rows.
8. `save-memo.mjs` stores the memo. The clerk tells the user the path and stops. Nothing in the reviewed project is edited or committed.

## 3. Packet and lanes

A path under `test/`, `tests/`, or `__tests__/`, or a file named `*.test.*` or `*.spec.*`, is the tests lane. Other prose is the docs lane. A mix is two lanes. A diff larger than about 400 lines, or more than four files, is split by file. Reviewers and grounding run per file. The chair is called once, with every cluster.

The packet includes the text under review, the code and docs it cites, and the parts of `CLAUDE.md`, `AGENTS.md`, or `CONTRIBUTING` that constrain docs, tests, versions, or snapshots, when those files exist. On the tests lane the clerk runs the affected tests once and appends the output.

The chat has to be open in the project under review. `council review the current diff` means that project's uncommitted changes. Paths are from that project's root. The same three symlinks install the skill into another project. `council.json` travels with the skill directory, so the seat list stays in this repository.

## 4. What a finding must contain

A reviewer returns blocks with `id`, `severity` (`high`, `medium`, or `low`), `kind` (`fact`, `judgment`, or `gap`), `rubric`, `where`, `claim`, and a `quote` copied from the packet.

`check-quotes.mjs` sets `ok` only when all of these hold:

- the quote is an exact substring of the packet
- `rubric` is a real id for the lane (`D1`–`D5` or `T1`–`T5`)
- the required fields are filled in
- if `where` names a file, that path appears in the packet

A heading in `where` is allowed. Line numbers are not checked. The quote is the proof that the text was in the packet.

## 5. How a finding reaches the memo

| Kind | Grounding | Seats | Section |
|---|---|---|---|
| fact | confirmed | 2 or more | Must-fix |
| fact | confirmed | 1 | Look at |
| fact | refuted | any | Dropped |
| fact | unverified | any | Open |
| judgment | none | agreement | Recommendations |
| judgment | none | split | Disputes |
| gap | same as fact when it points at code | same as fact | same as fact |

A changed snapshot is listed under Snapshots, not as a must-fix. Empty sections are omitted. A dispute states both sides. The chair does not pick a winner. Seats are listed without a ranking.

Every seat uses the same rubric. Two seats confirming one fact is what makes Must-fix mean something. Splitting seats into separate specialties, such as security or performance, would remove that overlap.

## 6. Where the result is written

The memo appears in the chat. A copy is written to `~/.local/share/council-review/`, named with the date and the short hash of the reviewed repository. The file records the date, the absolute repo path, the full commit (or `nogit`), the file list, and the memo. That directory is outside every project, so a review started in another repository still lands there and is not committed.

The packet stays in the temp directory from `mktemp -d` and is not committed.

## 7. Limits

The council does not edit the project, does not commit, and does not update snapshots. The person reading the memo decides what to change.

It reviews documentation and tests against the rubric. It does not search for vulnerabilities, architectural drift, or performance in product code.

Model ids in `council.json` are Cursor subagent ids. A plan may not include every id in the comment list. A rejected id is skipped. The chair model is passed on the call. The chair file does not pin one.
