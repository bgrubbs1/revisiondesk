# RevisionDesk: evidence-linked quote review

**Short description:** Evidence-linked review of industrial quote revisions, with uncertainty that changes the review queue.

**Planned award selections:** Best Overall App; Best Use of Decide, Extract, or Fill; Best Use of Protect, Guard, or Inspect. No People's Choice entry is planned. Guard contributes a separate screening gate. All three implemented endpoints succeeded in one bounded local synthetic-pair run on November 10; Guard hold behavior remains demonstrated by clearly labeled replay and controlled-transport tests.

**Current evidence:** [Public replay demo](https://bgrubbs1.github.io/revisiondesk/) and [public repository with development history](https://github.com/bgrubbs1/revisiondesk); 51 automated tests, eight fixture evaluations, 11 local browser checks, and six static-demo browser checks passed, with no browser console errors. See [VALIDATION.md](VALIDATION.md). A separate [live validation](LIVE-VALIDATION.md) completed five successful Guard, Extract and Decide requests using 13 free Trial credits with zero charges.

## The problem

A supplier revises a quote. A salesperson needs to know whether a part identifier, quantity, lead time, or expiry changed, and where the new value actually appears. A polished summary is not enough when a missing expiry, contradictory lead time, or nearly identical part identifier needs careful human attention.

RevisionDesk gives that task a dedicated workspace. A reviewer sees the two source documents, field-level change cards, the reason each item requires attention, and a record of the review. Selecting a field points back to the exact source text when its span is valid. An invalid span is an issue to resolve, not an opportunity to invent a highlight.

## Why Clocked is central

Extract's values, positions, and confidence drive which fields are usable and which enter the review queue. A missing value remains missing even when its absence confidence is high. Decide's material-change output affects review routing, while uncertain output keeps a human involved. Guard adds a separate stop when quote text contains suspicious instructions or its result cannot be safely interpreted.

These outputs change the workflow rather than decorating a chatbot response. Human review remains the final step. The tool does not communicate with suppliers, accept commercial terms, advise on pricing, or create orders.

The current package includes deterministic **synthetic replay**, plus a server-side integration adapter. Replay endpoint-shaped values remain authored examples. Separately, the [sanitized genuine live audit](evidence/live-2026-11-10-audit.json) records one successful credentialed run with the original synthetic quote pair. The public static application remains replay-only.

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

The successful local run now has [sanitized live evidence](LIVE-VALIDATION.md). Any separate recording should show that genuine result and its provenance without describing authored replay as live. The existing replay video remains replay; no separate live video is included in this evidence update.

## Evidence to provide with the entry

- A public demo URL **or** a short application video, plus a public repository with real build history and setup instructions.
- The exact source revision and test command for the demonstrated build.
- Fixture scenarios and expected review outcomes, so judges can reproduce edge cases locally.
- A live integration note identifying which endpoints actually succeeded, the verification date, and any observed contract or offset limitations. Exclude credentials and customer data.
- A concise limitation statement: one line-item pair, text input, bounded contradiction detection, no calibrated accuracy claim, and no commercial automation.

## Rubric critique

The following is a preparation checklist, not a prediction of scores. Criterion weights were checked against the [official rules](https://clocked.rezolve.ai/build-challenge/rules) and [challenge page](https://clocked.rezolve.ai/challenge) on November 10, 2026.

| Criterion | Weight | Concrete strength | Remaining evidence or risk |
| --- | ---: | --- | --- |
| Usefulness | 25 | A specific recurring task with exact part identifiers and source-linked revision review | No usability study with real salespeople; use synthetic examples and avoid claiming measured time savings |
| Core integration | 30 | Extract and Decide outputs affect evidence validity, review priority, and human attention | One successful synthetic-pair run verified real response compatibility and all eight source spans; broader inputs and reliability remain unmeasured |
| Meaningful extra endpoints | 15 | Guard introduces a distinct suspicious-input completion block | Both real Guard calls returned clear and allowed analysis; real adversarial-input hold behavior has not been measured |
| User experience | 20 | Side-by-side evidence, focused change cards, explicit uncertainty, and audit visibility; 11 local and six static-demo browser checks passed | No independent usability study or broad cross-browser study |
| Reproducibility | 10 | Dependency-free local setup, deterministic fixtures, controlled transport tests, and public initial development history | Attach verification to the final published source revision and keep the demo and repository accessible |

## Honest submission wording

Current copy-ready integration-status wording:

> RevisionDesk uses Clocked Extract, Decide and Guard to drive evidence validation, material-change review and document screening. On November 10, 2026, one bounded local run completed two Guard, two Extract and one Decide request on an original synthetic quote pair. All five returned HTTP 200, using 13 free Trial credits with zero charges. All eight source spans matched; quantity and lead time changed, and Decide routed the result to material review. A sanitized genuine audit is included. The public static demo remains clearly labeled authored replay. Human review was not marked complete, and no commercial action occurred.

This is evidence from one successful run, not a model-accuracy, reliability or contest-submission claim.

## Submission requirements and agreement

The form at [the canonical challenge page](https://clocked.rezolve.ai/challenge) asks for the project overview, demo or video, public repository, endpoint integration explanation, team details, and award selections. Lessons learned and a public write-up are optional. The repository and demo must remain public through November 18, 2026.

The official rules state: **"The saved form is the official entry."** They also state: **"By entering you agree to them."** Saving the official entry therefore has a different meaning from publishing this repository. The rules include eligibility and rights representations, teammate agreement, publicity permission, and a liability release. The observed form declaration is: **"Every team member is eligible and agrees to the official rules, including the license to feature the project in coverage of the challenge."**

The public replay demo and repository are available, and one local live integration is documented. Final entrant/team eligibility declarations and the official saved entry remain separate submission steps; this document does not claim they are complete. Entries can be edited until November 10, 2026 at 11:59 p.m. Eastern; the latest saved version is judged.

## Organizer references

- [Organizer announcement](https://dev.to/clockedatrezolveai/clocked-build-challenge-build-something-intelligent-2000-in-prizes-nb4)
- [Challenge and submission page](https://clocked.rezolve.ai/challenge)
- [Official rules](https://clocked.rezolve.ai/build-challenge/rules)
- [Clocked developer documentation](https://clocked.rezolve.ai/developers)

The official rules and challenge page were checked on November 10, 2026. The rules report no changes since October 19. Use the canonical /challenge page for entry.
