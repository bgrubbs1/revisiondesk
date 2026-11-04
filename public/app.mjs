import { fixtures, getFixture } from '../src/fixtures.mjs';
import { analyzeReview } from '../src/review.mjs';

const $ = selector => document.querySelector(selector);
const node = (tag, className, text) => { const el = document.createElement(tag); if(className) el.className = className; if(text !== undefined) el.textContent = text; return el; };
let current, input, selected = 'lead_time', acknowledgments = new Set(), events = [], attentionOnly = false, completed = false, liveReady = false, sourceHashes = null, failureRecord = null, runGeneration = 0;
const shortNames = ['Schedule slip','Missing expiry','Conflicting terms','Injection warning','Broken source anchor','Low confidence','Clean reissue','Decide disagreement'];
const subtitles = ['Two verified changes','Absence is not evidence','Two lead times, one quote','Untrusted instructions','Unicode offset validation','Match ≠ certainty','Routine human review','Evidence takes precedence'];

fixtures.forEach((fixture, index) => {
  const button = node('button','scenario-button'); button.dataset.fixture = fixture.id;
  button.append(node('span','scenario-num', String(index+1).padStart(2,'0')));
  const title = node('span'); title.append(node('span','scenario-name',shortNames[index]),node('span','scenario-sub',subtitles[index]));button.append(title);
  button.addEventListener('click', () => { $('#mode-select').value = 'replay'; setMode('replay'); loadFixture(fixture.id); });
  $('#scenario-list').append(button);
});

function record(action, detail) { events.push({at:new Date().toISOString(),action,detail}); renderTrace(); }
async function hashSources(documents, id) {
  const values = await Promise.all(['before','after'].map(async side => [side,Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(documents[side]))),b=>b.toString(16).padStart(2,'0')).join('')]));
  if(current.id === id) { sourceHashes = Object.fromEntries(values); renderTrace(); }
}
function loadReview(value, title, subtitle, index) {
  input = value; current = analyzeReview(value); acknowledgments = new Set(); events = []; completed = false; sourceHashes = null; failureRecord = null;
  selected = current.fields.slice().sort((a,b)=>b.priority-a.priority)[0].key;
  $('#review-note').value = ''; $('#completion-status').textContent = '';
  $('#case-kicker').textContent = index == null ? 'LIVE ANALYSIS / SYNTHETIC TEXT' : `CASE ${String(index+1).padStart(2,'0')} / SYNTHETIC QUOTE`;
  $('#case-title').textContent = title; $('#case-summary').textContent = subtitle;
  document.querySelectorAll('[data-fixture]').forEach(button => { const active = button.dataset.fixture===value.id;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active)); });
  for (const item of current.audit) events.push({at:new Date().toISOString(),action:item.action,detail:item.detail});
  $('#review-content').hidden = false;render(); hashSources(current.documents,current.id).catch(()=>{});
}
function loadFixture(id) { const f=getFixture(id); if(!f)return;loadReview(f,f.title,f.subtitle,fixtures.findIndex(x=>x.id===id));$('#before-input').value=f.documents.before;$('#after-input').value=f.documents.after; }
function render() { renderRoute(); renderFields();renderSources();renderCompletion();renderTrace(); }
function renderRoute() {
  const banner=$('#route-banner');banner.replaceChildren();banner.className='route-banner'+(!current.canComplete?' blocked':current.route.code==='standard_review'?' clear':'');
  banner.append(node('span','route-icon',current.canComplete?'↗':'!'));
  const copy=node('div');copy.append(node('strong','',current.route.label),node('p','',current.route.reasons[0]));banner.append(copy);
  banner.append(node('span','route-chip',current.canComplete?`${current.counts.changed} VERIFIED CHANGES`:`${current.counts.blocked} REVIEW HOLDS`));
}
const formatValue = evidence => evidence.missing ? 'Not found' : typeof evidence.value === 'string' ? evidence.value : 'Invalid result';
const confidence = evidence => evidence.confidence === null ? 'Unavailable' : evidence.confidence.toFixed(2);
function renderFields() {
  const list=$('#field-list');list.replaceChildren();
  const cards=current.fields.slice().sort((a,b)=>b.priority-a.priority).filter(f=>!attentionOnly || f.issues.length || f.changed===true);
  $('#change-count').textContent=String(cards.length).padStart(2,'0');
  if(!cards.length)list.append(node('div','empty-state','No changed or uncertain fields in this case. Show all fields to review the matching values.'));
  for(const field of cards){
    const card=node('div','field-card'+(selected===field.key?' selected':''));card.tabIndex=0;card.setAttribute('role','group');card.setAttribute('aria-label',`${field.label}: ${field.status}. Select to inspect source evidence.`);
    const select=()=>{selected=field.key;renderFields();renderSources();};card.addEventListener('click',select);card.addEventListener('keydown',event=>{if(event.target===card&&(event.key==='Enter'||event.key===' ')){event.preventDefault();select();}});
    const head=node('div','field-header');head.append(node('span','field-title',field.label),node('span','field-status'+(field.issues.length?' danger':field.changed?' attention':''),field.status==='invalid'?'Invalid anchor':field.status));
    const values=node('div','field-values');values.append(node('span','old-value',formatValue(field.before)),node('span','value-arrow','→'),node('span','new-value'+(field.after.missing?' missing-value':''),formatValue(field.after)));
    card.append(head,values);
    if(field.issues.length)card.append(node('div','field-detail warning',field.issues[0].message));
    else card.append(node('div','field-detail',`${field.before.verified&&field.after.verified?'Both source spans verified':'Source verification needed'} · ${current.provenance.mode==='replay'?'Authored':'Model'} scores ${confidence(field.before)} / ${confidence(field.after)}`));
    if(field.after.missing)card.append(node('div','field-detail',`Absence confidence ${confidence(field.after)} · no usable value`));
    const actions=node('div','field-actions');actions.append(node('span','',selected===field.key?'◉ Evidence selected':'↗ Inspect evidence'));
    const ack=node('button','ack-button'+(acknowledgments.has(field.key)?' reviewed':''),acknowledgments.has(field.key)?'✓ Checked':'Mark checked');ack.disabled=field.issues.length>0||current.guard.status!=='clear'||completed;
    ack.addEventListener('click',event=>{event.stopPropagation();if(ack.disabled)return;acknowledgments.add(field.key);record('field-checked',`${field.label} checked against both source revisions.`);renderFields();renderCompletion();});
    actions.append(ack);card.append(actions);list.append(card);
  }
}
function renderSources(){
  const field=current.fields.find(f=>f.key===selected);
  for(const side of ['before','after']){
    const source=$(`#source-${side}`);source.replaceChildren();const text=current.documents[side];
    let spans=[field[side],...field.issues.filter(x=>x.document===side).flatMap(x=>x.evidence||[])].filter(x=>x.verified).sort((a,b)=>a.start-b.start);
    let offset=0,shown=0;
    for(const span of spans){if(span.start<offset)continue;source.append(document.createTextNode(text.slice(offset,span.start)));const mark=node('mark','',text.slice(span.start,span.end));mark.title=`${field.label}: exact Unicode source span`;source.append(mark);offset=span.end;shown++;}
    source.append(document.createTextNode(text.slice(offset)));
    const evidence=field[side];$(`#evidence-${side}`).textContent=shown?`${field.label} · ${shown} exact source span${shown===1?'':'s'} · Unicode validated`:`${field.label} · ${evidence.missing?'not found; no highlight':'invalid source anchor; no highlight'}`;
  }
}
function renderCompletion(){
  const count=acknowledgments.size;const material=current.route.code!=='standard_review';const noteReady=!material||$('#review-note').value.trim().length>=10;
  const ready=current.canComplete&&count===4&&noteReady&&!completed;
  $('#complete-review').disabled=!ready;
  $('#completion-hint').textContent=completed?'Review recorded locally. Export the audit to retain it.':!current.canComplete?'On hold. Clarify the source or screening result, then run a new analysis.':`${count} of 4 fields checked.${material?' Add a reviewer note of at least 10 characters before completing.':' Human confirmation is required.'}`;
}
function renderTrace(){
  if(!current)return;$('#audit-count').textContent=`${events.length} events · local session`;
  const receipt=$('#analysis-receipt');receipt.replaceChildren();
  const rows=[['Response provenance',current.provenance.mode==='replay'?'Author-crafted fixture':'Live Clocked response'],['Guard screening',current.guard.status],['Exact evidence',`${current.counts.verified} / ${current.counts.total} spans`],['Decide material probability',current.decide.probability===null?'Unavailable':current.decide.probability.toFixed(2)],['Material threshold','0.90'],['Extraction threshold','0.85'],['Before SHA-256',sourceHashes?.before.slice(0,16)||'Computing…'],['After SHA-256',sourceHashes?.after.slice(0,16)||'Computing…']];
  for(const [name,value]of rows){const row=node('div','receipt-row');row.append(node('span','',name),node('strong','',value));receipt.append(row);}
  receipt.append(node('p','receipt-note',current.provenance.mode==='replay'?'All scores are synthetic scenario inputs, not measured model accuracy. Hashes identify this text; the local audit is not tamper-proof.':'Scores are model outputs, not a guarantee of correctness. Reference cost, if returned, is not an actual charge. The local audit is not tamper-proof.'));
  const list=$('#audit-list');list.replaceChildren();for(const event of events){const li=node('li');li.append(node('time','',new Date(event.at).toLocaleTimeString([], {hour12:false})),document.createTextNode(event.detail));list.append(li);}
}
function setMode(mode){
  // Public static deployment is replay-only, including programmatic mode changes.
  mode='replay'; $('#mode-select').value='replay';
  runGeneration++;
  failureRecord=null;
  const live=mode==='live';$('#live-panel').hidden=!live;$('#mode-badge').textContent=live?'LIVE MODE':'FIXTURE REPLAY';$('#mode-badge').className='pill '+(live?'live':'replay');$('#mode-copy').textContent=live?'Server-only key. Explicit submission. No replay fallback.':'Author-crafted responses. No live AI call. No customer data.';
  // Never show old replay results under a live-mode heading.
  if(live){$('#review-content').hidden=true;$('#export-audit').disabled=true;refreshStatus();}else{$('#export-audit').disabled=false;}
}
async function refreshStatus(){
  liveReady=false; $('#run-live').disabled=true;
  $('#live-status').textContent='This public demo runs authored fixture replay only. Run the local Node server for authorized live analysis.';
  return; // No status or analysis request is made by the static deployment.
  try{const response=await fetch('/api/status',{cache:'no-store'});if(!response.ok)throw Error();const data=await response.json();liveReady=data.liveEnabled===true;$('#live-status').textContent=liveReady?'Local server ready. Credentials stay on the server.':'Live is unavailable. Configure CLOCKED_API_KEY and explicitly set REVISIONDESK_LIVE=1 on the local server.';}catch{liveReady=false;$('#live-status').textContent='Live API server is unavailable. Fixture replay works offline; start the Node server for live mode.';}
  $('#run-live').disabled=!liveReady;
}
$('#mode-select').addEventListener('change',event=>{setMode(event.target.value);if(event.target.value==='replay')loadFixture('material-change');});
$('#filter-toggle').addEventListener('click',()=>{attentionOnly=!attentionOnly;$('#filter-toggle').setAttribute('aria-pressed',String(attentionOnly));$('#filter-toggle').textContent=attentionOnly?'Show all fields':'Needs attention';renderFields();});
$('#review-note').addEventListener('input',()=>{if(completed){completed=false;$('#completion-status').textContent='';record('review-reopened','Reviewer note changed after completion; completion must be recorded again.');}renderCompletion();});
$('#complete-review').addEventListener('click',()=>{if($('#complete-review').disabled)return;completed=true;record('human-review-completed','Human checked all four fields and recorded this comparison. No purchase, contract, or message was created.');$('#completion-status').textContent='✓ Human review recorded. No commercial action taken.';renderCompletion();renderFields();});
$('#export-audit').addEventListener('click',()=>{
  if(failureRecord){downloadAudit(failureRecord,'live-failure');return;}
  record('audit-exported','A local audit JSON was exported.');
  const payload={application:'RevisionDesk',schemaVersion:1,exportedAt:new Date().toISOString(),provenance:current.provenance,sourceHashes,sourceDocuments:current.documents,fields:current.fields,route:current.route,guard:current.guard,decide:current.decide,acknowledgedFields:[...acknowledgments],reviewerNote:$('#review-note').value,reviewComplete:completed,events,notice:'Local review record; not tamper-proof. No commercial decision or outgoing action.'};
  downloadAudit(payload,current.id);
});
function downloadAudit(payload,id){const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));const a=node('a');a.href=url;a.download=`revisiondesk-${id}-audit.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('#run-live').addEventListener('click',async()=>{
  if(!liveReady)return;const generation=++runGeneration;const button=$('#run-live');button.disabled=true;button.textContent='Analyzing source evidence…';$('#live-error').textContent='';$('#review-content').hidden=true;$('#export-audit').disabled=true;
  const controls=[$('#mode-select'),$('#before-input'),$('#after-input'),...document.querySelectorAll('[data-fixture]')];controls.forEach(control=>control.disabled=true);
  try{const response=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({before:$('#before-input').value,after:$('#after-input').value}),signal:AbortSignal.timeout(75000)});const data=await response.json();if(generation!==runGeneration||$('#mode-select').value!=='live')return;if(!response.ok){failureRecord={application:'RevisionDesk',exportedAt:new Date().toISOString(),...data};$('#export-audit').disabled=false;throw Error((data.error||'Analysis failed. No result was substituted.')+(data.requestId?` Request ID: ${data.requestId}. Export the audit to retain this failure receipt.`:''));}loadReview(data,'Live source comparison','Clocked responses validated against the exact submitted source text.');$('#export-audit').disabled=false;}
  catch(error){if(generation===runGeneration)$('#live-error').textContent=error.name==='TimeoutError'?'The local request timed out. Outcome may be unknown; no automatic retry or replay fallback.':error.message;}
  finally{controls.forEach(control=>control.disabled=false);button.disabled=!liveReady;button.textContent='Analyze with Clocked →';}
});
loadFixture('material-change');
