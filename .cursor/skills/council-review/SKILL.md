---
name: council-review
description: Runs a council over documentation or tests and returns one memo. Use only when the user asks for a council review, an LLM council, or a council review of docs or tests.
disable-model-invocation: true
---

# Council review

You are the clerk. You have no opinion about the findings. You do not edit the project. You do not commit.

Read [council.json](council.json) and [rubrics.md](rubrics.md). Copy the matching rubric into the reviewer prompt.

## Seats

Lines that start with `//` are comments. Ignore them. `seats` is the reviewer list. `chair` is the model that writes the memo. Launch one `council-reviewer` per seat, all in one message, each with the full packet. Pass that seat's model on the call.

If `seats` has fewer than two entries, or `chair` is empty, stop and say so. If a slug is rejected, drop that seat and record the error. Do not replace it with your own model. If fewer than two seats return findings, stop. Do not call the chair.

The chair is a fresh `council-chair` call. Pass the `chair` model on that call. Never resume a reviewer.

## Packet

Write the packet under a fresh temp directory outside the project (`mktemp -d`). Do not commit it.

Lane: paths under `test/`, `tests/`, or `__tests__/`, and files named `*.test.*` or `*.spec.*`, are tests. Other prose the user named is docs. A mix is two lanes. A diff larger than about 400 lines, or more than four files, is split by file. Run reviewers and grounding per file. Call the chair once at the end with every cluster.

Include, with path and line numbers:

- The text under review (the named files, or the diff hunks).
- Code and docs that the text cites.
- The parts of `CLAUDE.md`, `AGENTS.md`, or `CONTRIBUTING` that constrain docs, tests, versions, or snapshots, when those files exist.

For the tests lane, run the affected tests once and append the output. Reviewers do not run tests. If you cannot tell the test command, say so in the packet and continue.

## Stage 1

Each reviewer returns finding blocks. Numbering restarts per seat. Keep the seat id on every finding.

## Grounding

Run `scripts/check-quotes.mjs` with the packet, a file of the finding blocks, and the lane (`docs` or `tests`). Drop every finding whose `ok` is not true before clustering.

Cluster what remains by path plus overlapping quote, not by the reviewer's F numbers. Different severity inside a cluster is a dispute.

For `kind: fact`, and for `kind: gap` that points at a file, open that file and mark the cluster `confirmed`, `refuted`, or `unverified`. Do not ground `judgment`.

## Stage 2

Run this only for a cluster that one seat raised, or whose severity differs. Skip agreed clusters.

Label the seats A, B, C, and so on, in `council.json` order. Strip model names. Launch one fresh `council-reviewer` per seat that returned findings, in one message, using the same model slugs as stage 1, not resumes. The prompt contains only the disputed clusters and asks for `agree`, `disagree`, or `unsure` plus one sentence. Tell each seat not to assume which cluster it wrote.

## Memo

Pass the clusters, grounding, and votes to `council-chair`. Apply this table and do not let the chair invent rows:

| Kind | Grounding | Seats | Section |
|---|---|---|---|
| fact | confirmed | 2 or more | Must-fix |
| fact | confirmed | 1 | Look at |
| fact | refuted | any | Dropped |
| fact | unverified | any | Open |
| judgment | none | agreement | Recommendations |
| judgment | none | split | Disputes |
| gap | same as fact when it points at code | same as fact | same as fact |

A changed snapshot is listed under Snapshots, not as a must-fix.

After the memo, run `scripts/save-memo.mjs` with the reviewed repo root, the memo text, and a line per reviewed file. The script writes outside the repo, under `~/.local/share/council-review/`, and prints the path. Tell the user that path. Do not commit the memo.

After the memo is saved, stop.
