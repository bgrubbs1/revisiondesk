import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
export const STATIC_FILES = Object.freeze([
  '.nojekyll', 'index.html', 'public/app.mjs', 'public/styles.css', 'src/fixtures.mjs', 'src/review.mjs',
]);

function replaceOnce(source, before, after) {
  if (source.split(before).length !== 2) throw new Error(`Static build source marker changed: ${before}`);
  return source.replace(before, after);
}

async function checkOutput(directory, relative = '') {
  let entries;
  try { entries = await readdir(directory, { withFileTypes: true }); }
  catch (error) { if (error.code === 'ENOENT') return; throw error; }
  for (const entry of entries) {
    const name = relative + entry.name;
    if (entry.isDirectory() && ['public', 'src'].includes(name)) await checkOutput(resolve(directory, entry.name), `${name}/`);
    else if (!entry.isFile() || !STATIC_FILES.includes(name)) {
      throw new Error(`Refusing a static output directory containing an unexpected entry: ${name}`);
    }
  }
}

/** Build only authored replay assets. No account, network, secrets, or deployment operations. */
export async function buildStatic({ destination = resolve(projectRoot, 'dist/pages') } = {}) {
  await checkOutput(destination);
  let html = await readFile(resolve(projectRoot, 'public/index.html'), 'utf8');
  html = replaceOnce(html, 'href="/public/styles.css"', 'href="./public/styles.css"');
  html = replaceOnce(html, 'src="/public/app.mjs"', 'src="./public/app.mjs"');
  html = replaceOnce(html, 'href="/" class="brand"', 'href="./" class="brand"');
  html = replaceOnce(html, '<option value="live">Live Clocked</option>', '<option value="live" disabled>Live Clocked — run locally</option>');
  html = replaceOnce(html, '<head>', `<head>
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">
  <meta name="revisiondesk-deployment" content="static-replay">`);

  let app = await readFile(resolve(projectRoot, 'public/app.mjs'), 'utf8');
  app = replaceOnce(app, "from '/src/fixtures.mjs'", "from '../src/fixtures.mjs'");
  app = replaceOnce(app, "from '/src/review.mjs'", "from '../src/review.mjs'");
  app = replaceOnce(app, 'function setMode(mode){', `function setMode(mode){
  // Public static deployment is replay-only, including programmatic mode changes.
  mode='replay'; $('#mode-select').value='replay';`);
  app = replaceOnce(app, 'async function refreshStatus(){', `async function refreshStatus(){
  liveReady=false; $('#run-live').disabled=true;
  $('#live-status').textContent='This public demo runs authored fixture replay only. Run the local Node server for authorized live analysis.';
  return; // No status or analysis request is made by the static deployment.`);

  const output = new Map([
    ['.nojekyll', ''], ['index.html', html], ['public/app.mjs', app],
    ['public/styles.css', await readFile(resolve(projectRoot, 'public/styles.css'))],
    ['src/fixtures.mjs', await readFile(resolve(projectRoot, 'src/fixtures.mjs'))],
    ['src/review.mjs', await readFile(resolve(projectRoot, 'src/review.mjs'))],
  ]);
  for (const [name, contents] of output) {
    const target = resolve(destination, name);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, contents);
  }
  return { directory: destination, files: [...output.keys()].sort(), mode: 'static-fixture-replay', liveApiEnabled: false };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await buildStatic();
  // Deliberately avoid machine-specific paths in captured public build output.
  console.log(JSON.stringify({ directory: 'dist/pages', files: result.files, mode: result.mode, liveApiEnabled: result.liveApiEnabled }, null, 2));
}
