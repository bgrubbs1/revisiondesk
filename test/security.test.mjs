import test from 'node:test';
import assert from 'node:assert/strict';
import { createClockedClient } from '../src/clocked.mjs';
import { analyzeReview } from '../src/review.mjs';
import { getFixture } from '../src/fixtures.mjs';

const documents = { before: 'Part ID: RD-7', after: 'Part ID: RD-7' };
const response = data => new Response(JSON.stringify(data), { headers: { 'x-clocked-credits': '1' } });
const client = fetchImpl => createClockedClient({ apiKey: 'synthetic-test-key', enabled: true, fetchImpl, minReviewIntervalMs: 0 });

test('Guard cannot clear malformed evidence containers when evidence was requested', async () => {
  // Absence is documented as optional; a supplied malformed container is not.
  for (const evidence of [null, 'not-an-array', { quote: 'Part ID: RD-7' }]) {
    let calls = 0;
    const result = await client(async () => {
      calls++;
      return response({ injection: 0.01, verdict: 'benign', threshold: 0.5, evidence });
    }).analyzeLive(documents);
    assert.equal(result.guard.status, 'unknown');
    assert.equal(calls, 1, 'malformed Guard evidence must stop before extraction');
    assert.equal(analyzeReview(result).canComplete, false);
  }
});

test('oversized streamed response is rejected and cancelled without trusting Content-Length', async () => {
  let cancelled = false;
  let calls = 0;
  const body = new ReadableStream({
    pull(controller) { controller.enqueue(new Uint8Array(262145)); },
    cancel() { cancelled = true; },
  });
  const bounded = client(async () => {
    calls++;
    return new Response(body, { headers: { 'x-clocked-credits': '1' } });
  });
  await assert.rejects(bounded.analyzeLive(documents), { code: 'RESPONSE_TOO_LARGE' });
  assert.equal(cancelled, true);
  assert.equal(calls, 1);
});

test('different repeated line-item identifiers block a high-confidence material review', () => {
  const fixture = getFixture('material-change');
  fixture.documents.after += '\nPart ID: RD-OTHER\nQuantity: 99 units';
  const review = analyzeReview(fixture);
  assert.equal(review.route.code, 'evidence_hold');
  assert.equal(review.canComplete, false);
  assert.ok(review.issues.some(issue => issue.field === 'part_id' && issue.code === 'contradiction'));
  assert.ok(review.issues.some(issue => issue.field === 'quantity' && issue.code === 'contradiction'));
});

test('external contradiction evidence never acquires an invented source highlight', () => {
  const fixture = getFixture('material-change');
  fixture.contradictions = [{ field: 'lead_time', document: 'after', message: 'Competing term requires review.', evidence: [{ value: '999 weeks', start: 0, end: 9, confidence: 1 }] }];
  const review = analyzeReview(fixture);
  assert.equal(review.canComplete, false);
  const issue = review.issues.find(item => item.code === 'contradiction');
  assert.equal(issue.evidence[0].verified, false);
  assert.equal(issue.evidence[0].start, null);
  assert.equal(issue.evidence[0].end, null);
});
