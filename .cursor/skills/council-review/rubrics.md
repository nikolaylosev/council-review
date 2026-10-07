# Rubrics

The clerk copies one rubric into each reviewer prompt.

## Docs

Report only these:

- D1. A sentence that disagrees with code included in the packet.
- D2. Two documents in the packet that disagree with each other.
- D3. A version, command, or path that the packet shows as stale.
- D4. Behavior described as changing when the packet does not show that change.
- D5. A step a developer needs that the changed section skips.

## Tests

Report only these:

- T1. A test that would still pass if the behavior it names broke.
- T2. A branch or edge in the included production code that no test covers.
- T3. An assertion that locks incidental output, including a snapshot of wording that is not the behavior.
- T4. A test that is green for a reason other than the behavior it names.
- T5. A sleep, an order dependency, or a clock dependency.

If a snapshot file is in the diff, note that under kind `judgment` and say a snapshot update is a separate decision. Do not treat the snapshot diff itself as a product bug.
