# Live Clocked validation

One bounded local run succeeded on **2026-11-10 at 04:24 UTC** using the original synthetic material-change quote pair.

The application and adapter came from [commit 50404316f2f09515a0c734a5b54ec3ec06a6f6dc](https://github.com/bgrubbs1/revisiondesk/tree/50404316f2f09515a0c734a5b54ec3ec06a6f6dc). A single-use local wrapper restricted this run to one exact synthetic pair and at most five sequential provider requests. It did not change the adapter's endpoint contracts or the application's review policy. The public static demo remains **authored fixture replay**, with live mode disabled.

## Actual requests and usage

| Order | Endpoint | Source | HTTP | Trial credits | Observed request time |
| --- | --- | --- | --- | --- | --- |
| 1 | Guard: /clocked/injection | Before revision | 200 | 2 | 857 ms |
| 2 | Guard: /clocked/injection | After revision | 200 | 2 | 201 ms |
| 3 | Extract: /clocked/extract | Before revision | 200 | 4 | 272 ms |
| 4 | Extract: /clocked/extract | After revision | 200 | 4 | 254 ms |
| 5 | Decide: /clocked/decide | Comparison | 200 | 1 | 286 ms |

Exactly five requests completed, using **13 free Trial credits**, with no retries or paid fallback. Every cost header had reference basis, meaning a hypothetical production-rate comparison rather than a charge. A post-run usage check at 04:25:47 UTC confirmed 13 free Trial credits used and zero charges.

The individual times above describe this run only. They are not a latency benchmark or reliability estimate.

## Outputs changed the application

- **Guard** returned clear for both revisions. Injection probabilities were 0.005115097761434262 and 0.005962975830417161. These clear results allowed extraction and comparison to proceed.
- **Extract** supplied four fields for each revision. All **8 of 8 source spans** matched exactly. Quantity changed from **24 units to 30 units**; lead time changed from **3 weeks after order to 6 weeks after order**. Part ID VX-204-B and expiry 2026-11-20 were unchanged.
- **Decide** returned probability **0.9887** and decision true at the 0.90 threshold. The application displayed 0.99 after rounding and routed the pair to **material change review**.
- The browser audit preserves those values, validated spans, endpoint usage, route and events. The export occurred at 04:25:16 UTC.
- Human review was **not** marked complete: zero fields were acknowledged, the reviewer note remained empty, and reviewComplete is false. No quote acceptance, purchase, message or commercial decision occurred.

## Evidence files

- [Sanitized genuine browser audit](evidence/live-2026-11-10-audit.json)
- [Sanitized final request receipt and post-run usage check](evidence/live-2026-11-10-receipt.json)

Request identifiers were removed from the public copies. No key, account identity, local machine path or customer data is included. The quote text and numeric outputs are from this real run, not substituted fixture responses. Both files remain editable records, not signed or tamper-proof attestations.

## 60-second judge walkthrough

No credential or additional provider call is needed for this walkthrough.

| Time | Inspect | What it demonstrates |
| --- | --- | --- |
| 0:00-0:10 | Open the [public demo](https://bgrubbs1.github.io/revisiondesk/) and its Schedule slip scenario. Note the Fixture Replay label. | Two source-linked changes in the interactive, authored replay interface. |
| 0:10-0:30 | Open the [genuine live audit](evidence/live-2026-11-10-audit.json) and [final receipt](evidence/live-2026-11-10-receipt.json). Inspect the five HTTP 200 calls, 13 credits, eight verified spans and Decide 0.9887. | Separately recorded evidence that all three real endpoints influenced this application's result. Human review remains incomplete. |
| 0:30-0:50 | Return to replay. Select Injection warning, then Missing expiry. | Guard screening blocks completion; missing evidence stays missing rather than receiving an invented highlight. These edge cases are labeled replay, not additional live tests. |
| 0:50-1:00 | Inspect the [source and local setup](../README.md#run-locally), then the [deterministic verification](VALIDATION.md). | Dependency-free setup, reproducible tests and a clear distinction between policy tests and one real provider run. |

## Scope and limits

This establishes one successful credentialed path through Guard, Extract and Decide for one synthetic quote pair. It does not establish provider accuracy, calibrated confidence, production reliability or broad input compatibility. A real malicious-input Guard hold, malformed response, timeout and other failure paths were not exercised against the provider in this run; those remain covered by controlled-transport and fixture tests.

The original application defaults still allow a larger per-process budget than this one-run wrapper; see the [API contract limits](api-contract.md#runtime-bounds). This evidence records exactly five provider requests.

The static website and older replay video remain labeled replay. These JSON files are live-run evidence, not a video or a live public API.
