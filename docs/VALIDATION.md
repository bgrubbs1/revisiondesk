# Verification evidence

Build date: 2026-11-03. These checks used original synthetic data only. No credentialed Clocked call was made.

## Automated checks

Node.js v22.23.4: **49 tests passed, zero failed**. Tests cover exact Unicode source positions, confidence of absence, contradictions, conservative routing, Guard early exits, malformed responses, timeouts, idempotency identifiers, call budgets, HTTP origin/host checks, static file boundaries, concurrent requests, split UTF-8 request bytes, and sanitized failure receipts. Provider transport responses are controlled test doubles.

Run `npm test`. See [test-results.txt](test-results.txt) for the captured final output.

`npm run evaluate` checks all eight authored scenarios against explicit expected routes, change counts, and completion eligibility. **8/8 passed**. See [evaluation.json](evaluation.json). This evaluates deterministic application policy, not model accuracy.

## Browser checks

Installed Chrome, Playwright CLI, actual local server, desktop 1440 by 1100 and mobile 390 by 844:

1. Selected lead time highlights the exact earlier and later values.
2. Completion requires four checked fields; material/uncertain reviews also require a note. Completion enters the audit and JSON downloads successfully.
3. Missing expiry blocks completion without creating a highlight.
4. Both contradictory lead-time spans are visible.
5. Guard warning changes the route and disables field acknowledgments.
6. Invalid Unicode evidence never acquires a replacement highlight.
7. Low extraction confidence holds completion.
8. Matching fields still require human confirmation.
9. Verified differences survive a low Decide probability.
10. Live mode without credentials visibly disables analysis and hides prior replay results.
11. The 390px layout has no horizontal overflow.

All 11 checks passed. Browser console: zero errors and zero warnings. Desktop and mobile were visually inspected. Internal screenshots are not part of the public export. The local walkthrough video is a replay recording, without voice-over or a live API success claim.

## Issues found and corrected

- Malformed Guard evidence containers could clear screening; the adapter now holds them and has a regression test.
- Request chunks decoded separately could damage a split Unicode character; the server now buffers bytes before decoding.
- Unknown provider outcomes lacked useful failure receipts; sanitized request IDs and usage records now survive into the export.
- A delayed live result could overwrite a replay selection; controls are locked during a live run and response generations are checked.
- The initial HTTP Host regression used a client that normalized Host; raw HTTP now verifies the actual server boundary.

The execution sandbox initially rejected local HTTP/browser connections. An approved scoped run completed the real localhost checks. This was an environment restriction, not a provider integration result.

## Remaining limits

Live response compatibility, real model quality, extraction latency, and actual credit consumption remain unmeasured. One line item per pair; contradiction detection only covers repeated explicit labels. Scores are uncalibrated, and the editable local audit is not tamper-proof. There is no authenticated multi-user deployment. Publishing the live proxy would require deployment-specific authentication and abuse controls; the current server binds only to localhost.
