# Clocked integration contract

The adapter uses dependency-free Node HTTP requests. Documentation was inspected on 2026-11-03; no real Clocked request has been made in this build. Tests use synthetic transport responses. A live credential and an authorized smoke test remain release gates.

## Documented routes and output

All routes use `https://clocked.rezolve.ai/clocked`, a server-only Bearer key, JSON, and a fresh UUID `Idempotency-Key`. Raw HTTP returns the endpoint object directly; `data` is a JavaScript SDK wrapper, not the HTTP envelope. See [getting started](https://clocked.rezolve.ai/developers) and [response conventions](https://clocked.rezolve.ai/docs/responses).

1. `POST /injection` screens each revision independently. The body contains `text`, `source: "content"`, a fixed application policy in `instructions`, `threshold: 0.5`, and `evidence: true`. Its `injection` probability and `verdict` change the application flow. At probability 0.5 or higher, or verdict `injection`, extraction stops with a warning. The local policy also holds probabilities from 0.1 to 0.5 for human inspection. Unsupported responses stop with unknown status. Evidence `{quote,start,end,confidence}` is retained in the audit only after exact source validation; the source pane's interactive highlights belong to extracted fields. This policy is conservative and has not been calibrated on real quotes. See the [Guard reference](https://clocked.rezolve.ai/docs/injection).
2. `POST /extract` reads each screened revision. The body is `{text,fields}`, where `fields` maps `part_id`, `quantity`, `lead_time`, and `expiry` to fixed descriptions. The response uses `fields.<name>.{value,start,end,confidence}`. Null is retained as absence, never promoted to a populated field because of a high confidence score. See [Extract](https://clocked.rezolve.ai/docs/extract).
3. `POST /decide` receives the two revision strings as a JSON-encoded `state`. `questions.material_change` specifies `type: "noul"`, fixed review instructions, and `threshold: 0.9`. The adapter consumes `answers.material_change.noul` and the boolean `decision`, checking they agree at that threshold. The review engine routes the probability into human review and never treats it as commercial authorization. See [Decide](https://clocked.rezolve.ai/docs/decide).

The adapter never follows instructions from quote text. Guard is a model-based detector, not an authorization boundary. RevisionDesk has no action that buys, approves contracts, sends messages, or recommends a price.

## Evidence and uncertainty

Source positions count Unicode code points, starting at zero with an exclusive end. `Array.from(source).slice(start,end).join('')` must equal the returned text. Source strings are not normalized before validation. An invalid span remains an explicit evidence problem; the app does not search for a plausible replacement highlight. Extraction confidence, Decide probability, and Guard probability have different meanings. See [source positions](https://clocked.rezolve.ai/docs/responses).

## Runtime bounds

Live mode needs both `REVISIONDESK_LIVE=1` and `CLOCKED_API_KEY` in the server environment. The credential is never returned to the browser. Default limits are:

- One review at a time. The HTTP server requires fifteen seconds between starts and caps ten analyses per process; the adapter independently enforces at least ten seconds.
- At most five sequential calls per review: two Guard, two Extract, one Decide. Guard may stop earlier.
- Twenty provider requests per server process, including failed attempts; this permits at most four complete five-call analyses. No automatic retries.
- Browser and HTTP input cap: 4,000 UTF-16 units per revision. Adapter backstop: 4,000 Unicode code points per revision. A non-BMP character consumes two browser units. Responses are limited to 256 KiB.
- Twelve seconds per API call; at most sixty seconds across the five calls. This demo latency bound is intentionally shorter than the provider's documented 110-second gateway allowance and can time out legitimate slow responses.
- An additional stop between calls after observed usage reaches 2,000 credits. This is not a preauthorized spend cap: a call can cross the threshold. The request-count bound remains independent.

The fixed base URL and `redirect: "error"` prevent sending credentials to an alternate service through configuration or redirects. HTTP error bodies and transport exception strings are not exposed to the browser.

Each completed call contributes its UUID, endpoint, round-trip duration, reported credits, model identifier if present, and cost basis to the review provenance. `reference` cost is a trial's hypothetical Production-rate comparison and is not a charge. See [usage headers](https://clocked.rezolve.ai/docs/responses).

## Failure and recovery

Missing credentials, disabled live mode, HTTP errors, oversized input, timeout, and malformed responses have explicit error codes. Live failure never falls back to replay. Timeout, network error, HTTP 409 or 5xx, and missing usage accounting place the client on hold because the remote outcome may be unknown. Preserve the error's request ID and reconcile with the account before any operator-initiated restart. RevisionDesk deliberately does not retry; the [official retry guide](https://clocked.rezolve.ai/developers) explains safe reuse of an existing UUID with the exact payload when a recovery tool is added later.

Replay fixtures are authored examples, not recorded Clocked results. They validate application behavior, not provider accuracy. No Compare, Fill, or other undocumented adapter is silently substituted.
