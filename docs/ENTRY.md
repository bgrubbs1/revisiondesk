# RevisionDesk — entry draft

**Short description:** Evidence-linked review of industrial quote revisions, with uncertainty that changes the review queue.

**Planned award selections:** Best Overall App; Best Use of Decide, Extract, or Fill; Best Use of Protect, Guard, or Inspect. No People's Choice entry is planned. Guard contributes a meaningful separate review hold, although real provider validation is still pending for all three implemented endpoints.

**Current evidence:** [Public replay demo](https://bgrubbs1.github.io/revisiondesk/) and [public repository with development history](https://github.com/bgrubbs1/revisiondesk); 51 automated tests, eight fixture evaluations, 11 local browser checks, and six static-demo browser checks passed, with no browser console errors. See [VALIDATION.md](VALIDATION.md). No credentialed Clocked call or contest submission has occurred.

## The problem

A supplier revises a quote. A salesperson needs to know whether a part identifier, quantity, lead time, or expiry changed, and where the new value actually appears. A polished summary is not enough when a missing expiry, contradictory lead time, or nearly identical part identifier needs careful human attention.

RevisionDesk gives that task a dedicated workspace. A reviewer sees the two source documents, field-level change cards, the reason each item requires attention, and a record of the review. Selecting a field points back to the exact source text when its span is valid. An invalid span is an issue to resolve, not an opportunity to invent a highlight.

## Why Clocked is central

Extract's values, positions, and confidence drive which fields are usable and which enter the review queue. A missing value remains missing even when its absence confidence is high. Decide's material-change output affects review routing, while uncertain output keeps a human involved. Guard adds a separate stop when quote text contains suspicious instructions or its result cannot be safely interpreted.

These outputs change the workflow rather than decorating a chatbot response. Human review remains the final step. The tool does not communicate with suppliers, accept commercial terms, advise on pricing, or create orders.

The current package includes deterministic **synthetic replay**, plus a server-side integration adapter. Replay endpoint-shaped values are authored examples, not captured live results. The adapter requires a real authorized credential and a successful live validation before the entry can claim operational Clocked integration.

## Three-minute demonstration script

| Time | Action | What to say or show |
| --- | --- | --- |
| 0:00–0:20 | Open RevisionDesk in visibly labeled Replay mode | “These are original synthetic quotes and authored replay outputs. This run shows the review workflow; it is not a live API call.” |
| 0:20–0:55 | Open the changed quantity/lead-time scenario; select each change | Show the two exact source spans and the field-level differences. Explain why an exact part identifier is retained verbatim. |
| 0:55–1:25 | Switch to missing expiry and then contradictory lead time | Show why missing or conflicting information remains in the review queue. High confidence of absence does not create a date. |
| 1:25–1:50 | Show suspicious text | Explain the Guard-driven completion block and why quote content cannot instruct the application to ignore checks. |
| 1:50–2:10 | Show Unicode mismatch | Demonstrate the visible evidence failure. No offset is repaired by silently searching for a convenient substring. |
| 2:10–2:35 | Inspect review and audit behavior | Make a review action and show its record. Clarify that “reviewed” is not quote acceptance. |
| 2:35–3:00 | Explain live path and reproducibility | Show the source repository, run command, fixture tests, and server-only key configuration. State the exact live-validation status. |

After authorized live validation, record a separate short segment that visibly selects Live, runs an original synthetic quote pair, and shows the real response provenance. Retain honest failure handling in the recording if the service fails; do not replace that run with replay while calling it live.

## Evidence to provide with the entry

- A public demo URL **or** a short application video, plus a public repository with real build history and setup instructions.
- The exact source revision and test command for the demonstrated build.
- Fixture scenarios and expected review outcomes, so judges can reproduce edge cases locally.
- A live integration note identifying which endpoints actually succeeded, the verification date, and any observed contract or offset limitations. Exclude credentials and customer data.
- A concise limitation statement: one line-item pair, text input, bounded contradiction detection, no calibrated accuracy claim, and no commercial automation.

## Rubric critique

The following is a preparation checklist, not a prediction of scores. Criterion weights were verified against the [official rules](https://clocked.rezolve.ai/build-challenge/rules) and [challenge page](https://clocked.rezolve.ai/challenge), retrieved during the November 4 preparation pass from content acquired November 3.

| Criterion | Weight | Concrete strength | Remaining evidence or risk |
| --- | ---: | --- | --- |
| Usefulness | 25 | A specific recurring task with exact part identifiers and source-linked revision review | No usability study with real salespeople; use synthetic examples and avoid claiming measured time savings |
| Core integration | 30 | Extract and Decide outputs affect evidence validity, review priority, and human attention | Largest release gap: no credentialed live run yet; test exact real envelopes and Unicode positions |
| Meaningful extra endpoints | 15 | Guard introduces a distinct suspicious-input completion block | Verify the documented Guard response and demonstrate a real result; do not add endpoints solely for breadth |
| User experience | 20 | Side-by-side evidence, focused change cards, explicit uncertainty, and audit visibility; 11 local and six static-demo browser checks passed | No independent usability study or broad cross-browser study |
| Reproducibility | 10 | Dependency-free local setup, deterministic fixtures, controlled transport tests, and public initial development history | Attach verification to the final published source revision and keep the demo and repository accessible |

## Honest submission wording

Current copy-ready integration-status wording:

> RevisionDesk implements server-side adapters for Clocked Extract, Decide, and Guard. Their outputs drive exact evidence validation, material-change review, and suspicious-input holds. The demonstrated scenarios use clearly labeled synthetic replay: the returned values and scores are authored test data, not captured Clocked responses. The live adapter has deterministic transport tests but has not yet made a credentialed Clocked request.

Only after a successful real run, replace the final sentence with the actual successful endpoints and validation date. Do not imply that all endpoints passed if only some did.

## Submission requirements and agreement

The form at [the canonical challenge page](https://clocked.rezolve.ai/challenge) asks for the project overview, demo or video, public repository, endpoint integration explanation, team details, and award selections. Lessons learned and a public write-up are optional. The repository and demo must remain public through November 18, 2026.

The official rules state: **"The saved form is the official entry."** They also state: **"By entering you agree to them."** Saving the official entry therefore has a different meaning from publishing this repository. The rules include eligibility and rights representations, teammate agreement, publicity permission, and a liability release. Actual final form checkbox labels have not been observed; do not invent them or certify facts that have not been verified.

The public demo and repository are available. Submission remains pending account sign-in, verification of entrant/team eligibility, and a truthful final integration status. Entries can be edited until November 10, 2026 at 11:59 p.m. Eastern; the latest saved version is judged.

## Organizer references

- [Organizer announcement](https://dev.to/clockedatrezolveai/clocked-build-challenge-build-something-intelligent-2000-in-prizes-nb4)
- [Challenge and submission page](https://clocked.rezolve.ai/challenge)
- [Official rules](https://clocked.rezolve.ai/build-challenge/rules)
- [Clocked developer documentation](https://clocked.rezolve.ai/developers)

The official rules and canonical challenge page were retrieved through Parallel on November 4 from content acquired November 3. The rules reported no changes since October 19. The dynamic entry area returned only a loading message, so actual field limits and checkbox wording still require inspection in the signed-in form. The older `/build-challenge` address returned homepage content and should not be used for entry.
