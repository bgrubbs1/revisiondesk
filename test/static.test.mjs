import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildStatic, STATIC_FILES } from '../scripts/build-static.mjs';
import { getFixture } from '../src/fixtures.mjs';

async function filesAt(directory, prefix = '') {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) files.push(...await filesAt(join(directory, entry.name), `${prefix}${entry.name}/`));
    else files.push(prefix + entry.name);
  }
  return files.sort();
}

test('static export includes only replay assets and resolves at root or project subpath', async () => {
  const destination = await mkdtemp(join(tmpdir(), 'revisiondesk-static-'));
  await buildStatic({ destination });
  assert.deepEqual(await filesAt(destination), [...STATIC_FILES].sort());
  const html = await readFile(join(destination, 'index.html'), 'utf8');
  const app = await readFile(join(destination, 'public/app.mjs'), 'utf8');
  assert.match(html, /FIXTURE REPLAY/);
  assert.match(html, /<option value="live" disabled>/);
  assert.match(html, /connect-src 'none'/);
  assert.match(app, /mode='replay'; \$\('#mode-select'\)\.value='replay'/);
  assert.match(app, /return; \/\/ No status or analysis request/);
  for (const prefix of ['/', '/revisiondesk/']) {
    const page = new URL(prefix, 'https://example.invalid');
    const style = new URL(/rel="stylesheet" href="([^"]+)"/.exec(html)[1], page);
    const script = new URL(/type="module" src="([^"]+)"/.exec(html)[1], page);
    assert.equal(style.pathname, `${prefix}public/styles.css`);
    assert.equal(script.pathname, `${prefix}public/app.mjs`);
    for (const match of app.matchAll(/from '([^']+)'/g)) {
      const url = new URL(match[1], script);
      assert.ok(url.pathname.startsWith(`${prefix}src/`));
      assert.ok(STATIC_FILES.includes(url.pathname.slice(prefix.length)));
    }
    assert.equal(new URL(/href="([^"]+)" class="brand"/.exec(html)[1], page).pathname, prefix);
  }
});

test('static build refuses unexpected output files without deleting or overwriting them', async () => {
  const destination = await mkdtemp(join(tmpdir(), 'revisiondesk-static-'));
  const sentinel = join(destination, 'private-note.txt');
  await writeFile(sentinel, 'test sentinel');
  await assert.rejects(buildStatic({ destination }), /unexpected entry: private-note.txt/);
  assert.equal(await readFile(sentinel, 'utf8'), 'test sentinel');
  assert.deepEqual(await filesAt(destination), ['private-note.txt']);
});

test('replay walkthrough matches the real fixture and links separately recorded live evidence at root and project paths', async () => {
  const fixture = getFixture('material-change');
  assert.deepEqual([fixture.extracts.before.fields.quantity.value, fixture.extracts.after.fields.quantity.value], ['24 units', '30 units']);
  assert.deepEqual([fixture.extracts.before.fields.lead_time.value, fixture.extracts.after.fields.lead_time.value], ['3 weeks after order', '6 weeks after order']);
  const destination = await mkdtemp(join(tmpdir(), 'revisiondesk-proof-links-'));
  await buildStatic({ destination });
  const html = await readFile(join(destination, 'index.html'), 'utf8');
  assert.match(html, /Start with Schedule slip: quantity 24 → 30 units; lead time 3 → 6 weeks/);
  assert.match(html, /FIXTURE REPLAY/);
  assert.match(html, /Author-crafted responses\. No live AI call\. No customer data\./);
  assert.match(html, /<option value="live" disabled>/);
  assert.match(html, /connect-src 'none'/);
  const note = /<p id="live-validation-links" role="note">([\s\S]*?)<\/p>/.exec(html)[1];
  assert.match(note, /One separate local live run: 5 requests, 8 verified spans/);
  const links = [...note.matchAll(/<a href="([^"]+)" target="_blank" rel="noopener noreferrer">([^<]+)<\/a>/g)];
  assert.equal(links.length, 2);
  for (const prefix of ['/', '/revisiondesk/']) {
    const page = new URL(prefix, 'https://example.invalid');
    assert.equal(new URL(links[0][1], page).href, 'https://github.com/bgrubbs1/revisiondesk/blob/main/docs/LIVE-VALIDATION.md');
    assert.equal(new URL(links[1][1], page).href, 'https://github.com/bgrubbs1/revisiondesk#run-locally');
  }
  assert.ok(html.indexOf('id="live-validation-links"') > html.indexOf('</section>', html.indexOf('class="mode-strip"')));
});

test('workflow stages are neutral rather than a fixed claim that Guard, extraction or review completed', async () => {
  const destination = await mkdtemp(join(tmpdir(), 'revisiondesk-neutral-stages-'));
  await buildStatic({ destination });
  const html = await readFile(join(destination, 'index.html'), 'utf8');
  const pipeline = /<ol class="pipeline" aria-label="Workflow stages">([\s\S]*?)<\/ol>/.exec(html)[1];
  assert.equal((pipeline.match(/<li>/g) || []).length, 4);
  assert.ok(!/class="(?:done|active)"/.test(pipeline));
  for (const label of ['Guard screening', 'Extract evidence', 'Decide/routing', 'Human review']) assert.ok(pipeline.includes(label));
  assert.match(html, /id="route-banner" class="route-banner" aria-live="polite"/);
});
