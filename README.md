# RevisionDesk

**A quote revision desk where every extracted change has to show its evidence.**

RevisionDesk helps an independent industrial salesperson review a single line item across two supplier quote revisions. It compares part identifiers, quantities, lead times, and expiry dates; links valid values to exact source spans; and puts missing, contradictory, or uncertain information in the review queue.

The included quotes are original synthetic examples. No employer, customer, or personal quote data is included. This tool records a human review; it does not accept quotes, place orders, send messages, recommend prices, or make contractual decisions.

## Run locally

Use Node.js 18 or newer. The application has no third-party runtime dependencies.

```sh
npm start
```

Open <http://127.0.0.1:4177>. Start with the labeled **Fixture replay** mode and its synthetic scenarios. Replay works without an API key or internet connection after the local app is loaded. A local static server that serves both `public/` and `src/` can also serve the browser replay experience at `/public/index.html`; live analysis requires the Node server.

```sh
npm test
```

Tests exercise deterministic fixture behavior, source-span validation, review routing, and the API adapter with a controlled transport. Passing these tests does **not** establish that the hosted Clocked API has been tested.

This build passed **49 automated tests**, **8 deterministic fixture evaluations**, and **11 browser checks**. See [verification evidence](docs/VALIDATION.md). Run `npm run evaluate` to reproduce the fixture report. The [walkthrough notes](docs/DEMO.md) explain the included replay video and genuine local Git bundle.

## What to try

1. Open a synthetic revision pair and select a change card. Compare its highlighted evidence in the two source documents.
2. Try the missing-expiry scenario. Absence remains a review issue even if an extraction reports high confidence that the value is absent.
3. Try contradictory or suspicious text. Inspect why the review is routed for attention instead of treating a returned value as sufficient evidence.
4. Inspect the Unicode mismatch scenario. A value without a validated exact source span must not receive an invented highlight.
5. Review the audit trail. A recorded review is not a commercial approval.

## Replay and live are different

| Mode | Data and processing | What it proves |
| --- | --- | --- |
| Replay | Original synthetic quotes and explicitly authored example endpoint-shaped results, processed locally | Reproducible interface and review-policy behavior |
| Live | Original synthetic quote text is sent through the local server to Clocked when **Analyze with Clocked** is clicked | Actual integration behavior, only after a successful authorized run |

Replay values and probabilities are authored demonstrations, not measurements from Clocked. They must not be presented as live API responses or model accuracy evidence.

Live mode requires a server-side `CLOCKED_API_KEY` and explicit opt-in `REVISIONDESK_LIVE=1`. Set both in the server process environment; the app does not automatically load `.env` files. The browser never needs that credential. Do not paste a key into quote text, commit an environment file, or put a key in frontend code.

With an already authorized key and live opt-in configured in the server process environment:

```sh
npm start
```

Select **Live Clocked**, inspect the synthetic source text, then click **Analyze with Clocked** to transmit it. Missing configuration and upstream failures are reported explicitly; they do not silently substitute replay results. Start with the supplied synthetic text. Review the adapter's current timeout and request-budget limits in `src/clocked.mjs` before any live evaluation.

No Clocked account was created and no real credentialed request was used to prepare this version. Account access, eligibility, terms, free-credit availability, and live response compatibility remain release gates.

## How Clocked changes the workflow

- **Extract** supplies the four exact values and source positions. The review engine validates every returned span against its source. Missing, malformed, low-confidence, or mismatched evidence requires attention.
- **Decide** supplies the material-change result used by the review policy. It is a routing signal for human review, not permission to accept a quote. Ambiguous or invalid output is handled conservatively.
- **Guard**, when configured through the documented adapter, identifies suspicious instructions in quote text. A suspicious or unusable result keeps review completion blocked rather than allowing document text to control the workflow.

The adapter and its compatibility limits are described in [the API contract notes](docs/api-contract.md). Endpoint names alone are not evidence of a successful integration; inspect the mode and provenance of each run.

## Evidence and uncertainty

An extracted value is usable only when its reported source positions identify that exact text. Clocked positions count Unicode code points with an exclusive end. The engine validates that exact slice, then converts verified positions for browser highlighting. It rejects a mismatch without searching for a replacement or trying a different offset convention. A `null` value is absent. Its confidence describes absence, not a usable field.

Confidence and decision probability are endpoint outputs. They are not guarantees, independent calibration results, or business risk estimates. The app uses explicit review-policy thresholds so a reviewer can understand why an item requires attention.

This version reviews **one line-item pair at a time**. Repeated labeled part identifiers are treated as ambiguous. It is not a general multi-line quote parser, PDF/OCR system, or contract verification service. Contradiction detection and fixture coverage are deliberately bounded; a completed checklist does not prove that every possible issue in a document has been found.

## Project map

| Path | Purpose |
| --- | --- |
| `server.mjs` | Local web server and live-analysis route |
| `public/` | Browser interface |
| `src/review.mjs` | Evidence validation and human-review policy |
| `src/fixtures.mjs` | Original synthetic replay scenarios |
| `src/clocked.mjs` | Server-only Clocked adapter |
| `test/` | Deterministic tests and controlled API-transport checks |
| `docs/ENTRY.md` | Judge narrative, demonstration plan, and rubric critique |

## Challenge preparation

RevisionDesk was started for the October 21–November 10, 2026 Clocked Build Challenge. The organizer permits AI coding tools and asks for an application whose endpoint outputs affect behavior. The submission needs a demo, public source repository, integration explanation, and team details by **November 10, 2026 at 11:59 p.m. Eastern**. See the [organizer announcement](https://dev.to/clockedatrezolveai/clocked-build-challenge-build-something-intelligent-2000-in-prizes-nb4), [challenge page](https://clocked.rezolve.ai/build-challenge), and [official rules](https://clocked.rezolve.ai/build-challenge/rules).

This local package is a prepared entry, not a submitted entry. Public repository creation, deployment, registration, account operations, and submission have not been performed. Contest rules and API behavior must be checked again before release.
