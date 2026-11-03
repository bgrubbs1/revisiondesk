import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createServer } from '../server.mjs';
import { ClockedError } from '../src/clocked.mjs';

async function serve(t, options = {}) {
  const server = createServer(options);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  });
  const origin = `http://127.0.0.1:${server.address().port}`;
  return { server, origin, post: (body = { before: 'Part ID: RD-7', after: 'Part ID: RD-8' }, headers = {}) => fetch(`${origin}/api/analyze`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin, ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body),
  }) };
}

test('local server serves only its explicit browser asset whitelist with protective headers', async t => {
  const { origin } = await serve(t, { liveEnabled: false });
  for (const path of ['/', '/public/index.html', '/public/styles.css', '/public/app.mjs', '/src/review.mjs', '/src/fixtures.mjs']) {
    const response = await fetch(origin + path);
    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'none'/);
    await response.text();
  }
  for (const path of ['/src/clocked.mjs', '/server.mjs', '/.env', '/package.json', '/README.md', '/public/../server.mjs', '/%2e%2e/.env', '/public/%2e%2e%2fserver.mjs']) {
    const response = await fetch(origin + path);
    assert.equal(response.status, 404, path);
    assert.deepEqual(await response.json(), { error: 'Not found.' });
  }
});

test('status reports disabled live mode and disabled analysis never invokes the adapter', async t => {
  let calls = 0;
  const { origin, post } = await serve(t, { liveEnabled: false, analyze: async () => { calls++; } });
  const status = await (await fetch(origin + '/api/status')).json();
  assert.equal(status.liveEnabled, false);
  assert.equal(status.limits.concurrency, 1);
  const response = await post();
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /No replay fallback/);
  assert.equal(calls, 0);
});

test('live analysis requires exact local Origin and JSON content type', async t => {
  let calls = 0;
  const { origin, post } = await serve(t, { liveEnabled: true, analyze: async () => { calls++; } });
  for (const headers of [{ Origin: '' }, { Origin: 'https://external.invalid' }, { Origin: origin + '.external.invalid' }]) {
    assert.equal((await post(undefined, headers)).status, 403);
  }
  assert.equal((await post(undefined, { 'Content-Type': 'text/plain' })).status, 415);
  // Node's Fetch API rewrites Host. Raw HTTP verifies the actual Host boundary.
  const deniedHost = await new Promise((resolve, reject) => {
    const request = http.request(origin + '/', { headers: { Host: 'external.invalid' } }, response => {
      response.resume(); response.on('end', () => resolve(response.statusCode));
    });
    request.on('error', reject); request.end();
  });
  assert.equal(deniedHost, 403);
  assert.equal(calls, 0);
});

test('invalid JSON, invalid fields, and oversized bodies cannot consume an analysis slot', async t => {
  let calls = 0;
  const { post } = await serve(t, { liveEnabled: true, analyze: async () => { calls++; return {}; } });
  assert.equal((await post('{broken')).status, 400);
  for (const body of [null, [], {}, { before: 5, after: 'x' }, { before: ' ', after: 'x' }, { before: 'a'.repeat(4001), after: 'x' }]) {
    assert.equal((await post(JSON.stringify(body))).status, 400);
  }
  assert.equal((await post('x'.repeat(20001))).status, 413);
  assert.equal(calls, 0);
  assert.equal((await post()).status, 200);
  assert.equal(calls, 1);
});

test('successful route preserves submitted source and repeated starts are rate limited', async t => {
  let calls = 0;
  const seen = [];
  const { post } = await serve(t, { liveEnabled: true, analyze: async input => {
    calls++; seen.push(input);
    return { documents: { before: 'wrong', after: 'wrong' }, provenance: { mode: 'live' }, guard: { status: 'clear' } };
  } });
  const body = { before: 'Exact original 🧰', after: 'Exact revised ⚙️' };
  const result = await (await post(body)).json();
  assert.deepEqual(result.documents, body);
  assert.deepEqual(seen, [body]);
  assert.match(result.id, /^live-\d+$/);
  assert.equal(result.provenance.mode, 'live');
  for (let i = 0; i < 3; i++) assert.equal((await post()).status, 429);
  assert.equal(calls, 1);
});

test('concurrent analysis admits one request and rejects the second before invoking adapter', async t => {
  let release;
  let started;
  const entered = new Promise(resolve => { started = resolve; });
  let calls = 0;
  const { post } = await serve(t, { liveEnabled: true, analyze: async () => {
    calls++; started();
    return new Promise(resolve => { release = resolve; });
  } });
  const first = post();
  await entered;
  assert.equal((await post()).status, 429);
  assert.equal(calls, 1);
  release({ provenance: { mode: 'live' } });
  assert.equal((await first).status, 200);
});

test('UTF-8 request bytes split inside a surrogate-pair character preserve the exact quote', async t => {
  let received;
  const { origin } = await serve(t, { liveEnabled: true, analyze: async input => { received = input; return {}; } });
  const payload = { before: 'Part ID: RD-🧰-7', after: 'Part ID: RD-🧰-8' };
  const bytes = Buffer.from(JSON.stringify(payload), 'utf8');
  const split = bytes.indexOf(Buffer.from('🧰')) + 2;
  const status = await new Promise((resolve, reject) => {
    const request = http.request(origin + '/api/analyze', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' } }, response => {
      response.resume(); response.on('end', () => resolve(response.statusCode));
    });
    request.on('error', reject);
    request.write(bytes.subarray(0, split));
    setTimeout(() => request.end(bytes.subarray(split)), 10);
  });
  assert.equal(status, 200);
  assert.deepEqual(received, payload);
});

test('unexpected adapter errors expose neither secret values nor stack traces', async t => {
  const { post } = await serve(t, { liveEnabled: true, analyze: async () => { throw new Error('secret-provider-key test-only'); } });
  const response = await post();
  assert.equal(response.status, 502);
  const text = await response.text();
  assert.ok(!text.includes('secret-provider-key'));
  assert.ok(!text.includes('server.mjs'));
  assert.match(text, /No replay/);
});

test('Clocked timeout preserves a sanitized unknown-outcome receipt for reconciliation', async t => {
  const requestId = 'e1a19274-ff87-4222-b05d-f730de56962a';
  const completedRequest = '392b3b95-bcc9-4dbc-aa41-26967780fdb0';
  const error = new ClockedError('CLOCKED_TIMEOUT', 'Clocked timed out. The remote outcome is unknown; further live calls are held.', {
    status: 504, requestId, outcome: 'unknown',
  });
  error.provenance = {
    mode: 'live', documentHashes: { before: 'a'.repeat(64), after: 'b'.repeat(64) },
    secret: 'test-only-secret', sourceDocuments: { before: 'private-source-text' },
    calls: [{ endpoint: '/clocked/injection', requestId: completedRequest, elapsedMs: 120, credits: 2, costUsd: 0.0004, costBasis: 'reference', authorization: 'test-only-secret', rawResponse: 'private-source-text' }],
  };
  const { post } = await serve(t, { liveEnabled: true, analyze: async () => { throw error; } });
  const response = await post();
  assert.equal(response.status, 504);
  const result = await response.json();
  assert.equal(result.code, 'CLOCKED_TIMEOUT');
  assert.equal(result.requestId, requestId);
  assert.equal(result.outcome, 'unknown');
  assert.equal(result.failureAudit.mode, 'live');
  assert.equal(result.failureAudit.calls[0].requestId, completedRequest);
  assert.equal(result.failureAudit.calls[0].costBasis, 'reference');
  assert.equal(result.failureAudit.documentHashes.before, 'a'.repeat(64));
  assert.match(result.failureAudit.notice, /No replay fallback/);
  const serialized = JSON.stringify(result);
  assert.ok(!serialized.includes('test-only-secret'));
  assert.ok(!serialized.includes('private-source-text'));
  assert.ok(!serialized.includes('stack'));
});
