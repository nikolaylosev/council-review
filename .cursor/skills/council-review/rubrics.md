# Rubrics

The clerk copies one rubric into each reviewer prompt.

## Docs

Report only these:

- A sentence that disagrees with code included in the packet.
- Two documents in the packet that disagree with each other.
- A version, command, or path that the packet shows as stale.
- Behavior described as changing when the packet does not show that change.
- A step a developer needs that the changed section skips.

## Tests

Report only these:

- A test that would still pass if the behavior it names broke.
- A branch or edge in the included production code that no test covers.
- An assertion that locks incidental output, including a snapshot of wording that is not the behavior.
- A test that is green for a reason other than the behavior it names.
- A sleep, an order dependency, or a clock dependency.

If a snapshot file is in the diff, note that under kind `judgment` and say a snapshot update is a separate decision. Do not treat the snapshot diff itself as a product bug.
