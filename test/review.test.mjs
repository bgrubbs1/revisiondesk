import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeReview, detectLocalContradictions, validateEvidence } from '../src/review.mjs';
import { fixtures, getFixture } from '../src/fixtures.mjs';

for (const fixture of fixtures) {
  test(`fixture policy: ${fixture.id}`, () => {
    const review = analyzeReview(fixture);
    assert.equal(review.route.code, fixture.expected.route);
    assert.equal(review.counts.changed, fixture.expected.changed);
    assert.equal(review.canComplete, fixture.expected.canComplete);
    for (const field of review.fields) for (const document of ['before', 'after']) {
      const evidence = field[document];
      if (evidence.verified) assert.equal(review.documents[document].slice(evidence.start, evidence.end), evidence.value);
      else { assert.equal(evidence.start, null); assert.equal(evidence.end, null); }
    }
  });
}

test('null with very high confidence is confidence of absence, never verified data', () => {
  const evidence = validateEvidence('Expiry omitted', { value: null, confidence: 1, start: 0, end: 6 });
  assert.equal(evidence.missing, true);
  assert.equal(evidence.verified, false);
  assert.equal(evidence.confidenceMeaning, 'absence');
  assert.equal(evidence.start, null);
});

test('code-point offsets normalize only when the exact Unicode slice matches', () => {
  const source = '⚙️ 😀 Part ID: VX-204-B';
  const start = Array.from(source.slice(0, source.indexOf('VX-204-B'))).length;
  const evidence = validateEvidence(source, { value: 'VX-204-B', start, end: start + 8, confidence: 0.96 });
  assert.equal(evidence.verified, true);
  assert.equal(evidence.offsetBasis, 'unicode-codepoints');
  assert.equal(source.slice(evidence.start, evidence.end), 'VX-204-B');
});

test('UTF-16 offsets are rejected after surrogate pairs instead of changing the contract', () => {
  const source = '🔧 Part ID: VX-204-B';
  const start = source.indexOf('VX-204-B');
  const evidence = validateEvidence(source, { value: 'VX-204-B', start, end: start + 8, confidence: 0.96 });
  assert.equal(evidence.verified, false);
  assert.equal(evidence.offsetBasis, null);
  assert.equal(evidence.start, null);
});

test('mismatched offsets are not repaired with an ungrounded substring search', () => {
  const evidence = validateEvidence('first VX-204-B, second VX-204-B', { value: 'VX-204-B', start: 3, end: 11, confidence: 1 });
  assert.equal(evidence.verified, false);
  assert.equal(evidence.start, null);
});

test('repeated values use the documented code-point index, not the first substring', () => {
  const evidence = validateEvidence('😀aa', { value: 'a', start: 2, end: 3, confidence: 0.99 });
  assert.equal(evidence.verified, true);
  assert.equal(evidence.start, 3);
});

test('unknown confidence requires human evidence resolution even when span is exact', () => {
  const fixture = getFixture();
  delete fixture.extracts.after.fields.quantity.confidence;
  const review = analyzeReview(fixture);
  assert.equal(review.route.code, 'evidence_hold');
  assert.equal(review.canComplete, false);
  assert.equal(review.fields.find(field => field.key === 'quantity').after.verified, true);
});

test('all unknown, nonfinite, and out-of-range confidence scores fail conservatively', () => {
  for (const confidence of [NaN, Infinity, -0.01, 1.01, '0.99', undefined]) {
    const fixture = getFixture();
    fixture.extracts.after.fields.quantity.confidence = confidence;
    assert.equal(analyzeReview(fixture).canComplete, false);
  }
});

test('decide must cross configured threshold; ambiguous probability routes separately', () => {
  for (const [probability, decision, expected] of [[0.9, true, 'material_review'], [0.89, false, 'uncertainty_review'], [0.1, false, 'standard_review']]) {
    const fixture = getFixture('no-change');
    fixture.decide = { probability, decision };
    assert.equal(analyzeReview(fixture).route.code, expected);
  }
});

test('disagreement between Decide probability and decision holds completion', () => {
  const fixture = getFixture('no-change');
  fixture.decide = { probability: 0.2, decision: true };
  const review = analyzeReview(fixture);
  assert.equal(review.route.code, 'evidence_hold');
  assert.equal(review.canComplete, false);
  assert.ok(review.issues.some(issue => issue.code === 'decision-inconsistent'));
});

test('unavailable Decide output still asks for human interpretation', () => {
  const fixture = getFixture('no-change');
  fixture.decide = {};
  assert.equal(analyzeReview(fixture).route.code, 'uncertainty_review');
});

test('unavailable Guard blocks completion regardless of other scores', () => {
  const fixture = getFixture('no-change');
  fixture.guard = { status: 'unknown' };
  const review = analyzeReview(fixture);
  assert.equal(review.route.code, 'security_hold');
  assert.equal(review.canComplete, false);
});

test('Guard blocked synonym takes precedence over extraction failures', () => {
  const review = analyzeReview({ documents: { before: '', after: '' }, guard: { status: 'blocked' } });
  assert.equal(review.route.code, 'security_hold');
  assert.equal(review.canComplete, false);
});

test('repeated equal labels are harmless but different declarations preserve both spans', () => {
  assert.deepEqual(detectLocalContradictions({ before: 'Lead time: 3 weeks\nLead time: 3 weeks', after: '' }), []);
  const after = 'Lead time: 3 weeks\nLead time: 5 weeks';
  const [conflict] = detectLocalContradictions({ before: '', after });
  assert.equal(conflict.field, 'lead_time');
  assert.equal(conflict.evidence.length, 2);
  for (const evidence of conflict.evidence) assert.equal(after.slice(evidence.start, evidence.end), evidence.value);
});

test('missing fields produce no confirmed change and never fabricate a source anchor', () => {
  const review = analyzeReview(getFixture('missing-expiry'));
  const expiry = review.fields.find(field => field.key === 'expiry');
  assert.equal(expiry.changed, null);
  assert.equal(expiry.after.start, null);
  assert.equal(expiry.after.confidenceMeaning, 'absence');
});

test('fixture retrieval is isolated and unknown fixtures are not silently substituted', () => {
  const one = getFixture();
  one.extracts.after.fields.part_id.value = 'MODIFIED';
  assert.equal(getFixture().extracts.after.fields.part_id.value, 'VX-204-B');
  assert.equal(getFixture('not-a-fixture'), null);
});

test('source data resembling markup is preserved as data by the pure engine', () => {
  const text = 'Part ID: <img src=x onerror=alert(1)>';
  const value = '<img src=x onerror=alert(1)>';
  const start = text.indexOf(value);
  const evidence = validateEvidence(text, { value, start, end: start + value.length, confidence: 0.98 });
  assert.equal(evidence.verified, true);
  assert.equal(evidence.value, value);
});
