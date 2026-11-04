/** Pure, conservative review policy. No network, generated source text, or commercial decisions. */
export const FIELD_DEFINITIONS = Object.freeze([
  { key: 'part_id', label: 'Part ID' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'lead_time', label: 'Lead time' },
  { key: 'expiry', label: 'Quote expiry' },
]);

export const POLICY = Object.freeze({ extractionConfidence: 0.85, materialThreshold: 0.9, lowMaterialProbability: 0.1 });

const isProbability = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;

/**
 * Validate the actual source slice, not a search for an equivalent string.
 * Clocked's documented positions count Unicode code points, not UTF-16 units.
 * Convert to DOM-compatible UTF-16 positions only after validating that exact slice.
 * Never fall back to a different offset convention or search for the value.
 */
export function validateEvidence(text, raw) {
  const source = typeof text === 'string' ? text : '';
  const confidence = isProbability(raw?.confidence) ? raw.confidence : null;
  const base = { value: raw?.value ?? null, confidence, start: null, end: null, verified: false,
    offsetBasis: null, missing: false, confidenceMeaning: 'value', issue: null };
  if (!raw || typeof raw !== 'object' || !Object.hasOwn(raw, 'value')) {
    return { ...base, missing: true, confidenceMeaning: 'unavailable', issue: 'No extraction result was returned.' };
  }
  if (raw.value === null) {
    return { ...base, missing: true, confidenceMeaning: 'absence', issue: 'No source value was found. Absence confidence does not verify a value.' };
  }
  if (typeof raw.value !== 'string' || raw.value.length === 0) {
    return { ...base, issue: 'The extracted value must be a nonempty verbatim string.' };
  }
  const { start, end } = raw;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end <= start) {
    return { ...base, issue: 'Source positions are missing or invalid.' };
  }
  const points = Array.from(source);
  const cpStart = start <= points.length ? points.slice(0, start).join('').length : -1;
  const cpEnd = end <= points.length ? points.slice(0, end).join('').length : -1;
  const cpMatch = cpStart >= 0 && cpEnd > cpStart && source.slice(cpStart, cpEnd) === raw.value;
  if (cpMatch) return { ...base, start: cpStart, end: cpEnd, verified: true, offsetBasis: 'unicode-codepoints' };
  return { ...base, issue: 'The returned source positions do not match the verbatim extracted value. No highlight is shown.' };
}

/** A narrow local check, not semantic inference: repeated labeled declarations. */
export function detectLocalContradictions(documents) {
  const patterns = {
    part_id: /^\s*Part ID\s*:\s*(.+?)\s*$/gim,
    quantity: /^\s*Quantity\s*:\s*(.+?)\s*$/gim,
    lead_time: /^\s*Lead time\s*:\s*(.+?)\s*$/gim,
    expiry: /^\s*(?:Quote expiry|Expiry|Valid until)\s*:\s*(.+?)\s*$/gim,
  };
  const conflicts = [];
  for (const document of ['before', 'after']) {
    const source = typeof documents?.[document] === 'string' ? documents[document] : '';
    for (const { key, label } of FIELD_DEFINITIONS) {
      const entries = [...source.matchAll(patterns[key])].map(match => {
        const relative = match[0].lastIndexOf(match[1]);
        const start = Array.from(source.slice(0, match.index + relative)).length;
        return { value: match[1], start, end: start + Array.from(match[1]).length, confidence: null };
      });
      if (new Set(entries.map(entry => entry.value)).size > 1) {
        conflicts.push({ field: key, document, message: `Different labeled ${label.toLowerCase()} values appear in the same revision.`,
          evidence: entries, method: 'local-label-check' });
      }
    }
  }
  return conflicts;
}

/** Analyze one line item across two revisions. Every completion requires a human. */
export function analyzeReview(input = {}) {
  const documents = { before: typeof input.documents?.before === 'string' ? input.documents.before : '',
    after: typeof input.documents?.after === 'string' ? input.documents.after : '' };
  const extracts = input.extracts || input.extractions || {};
  const provenance = { ...input.provenance, mode: input.provenance?.mode === 'live' ? 'live' : 'replay' };
  const issues = [];
  const addIssue = issue => { const record = { id: `issue-${issues.length + 1}`, ...issue }; issues.push(record); return record; };
  const contradictions = [...detectLocalContradictions(documents), ...(Array.isArray(input.contradictions) ? input.contradictions : [])];
  const fields = FIELD_DEFINITIONS.map(({ key, label }) => {
    const before = validateEvidence(documents.before, extracts.before?.fields?.[key]);
    const after = validateEvidence(documents.after, extracts.after?.fields?.[key]);
    const fieldIssues = [];
    let priority = 0;
    let status = 'unchanged';
    for (const [document, evidence] of Object.entries({ before, after })) {
      if (evidence.missing) {
        fieldIssues.push(addIssue({ field: key, document, code: 'missing', severity: 'blocker',
          message: `${label} is missing in the ${document === 'before' ? 'original' : 'revised'} quote. ${evidence.confidenceMeaning === 'absence' ? 'Reported confidence describes absence, not a usable value.' : 'No usable extraction result is available.'}` }));
        priority = Math.max(priority, 90); status = 'missing';
      } else if (!evidence.verified) {
        fieldIssues.push(addIssue({ field: key, document, code: 'invalid-evidence', severity: 'blocker', message: `${label}: ${evidence.issue}` }));
        priority = Math.max(priority, 95); status = 'invalid';
      } else if (evidence.confidence === null || evidence.confidence < POLICY.extractionConfidence) {
        fieldIssues.push(addIssue({ field: key, document, code: 'uncertain', severity: 'blocker',
          message: `${label} has ${evidence.confidence === null ? 'unavailable' : 'low'} extraction confidence; verify the source before completing review.` }));
        priority = Math.max(priority, 80); if (priority <= 80) status = 'uncertain';
      }
    }
    const fieldConflicts = contradictions.filter(item => item.field === key && ['before', 'after'].includes(item.document));
    for (const conflict of fieldConflicts) {
      const evidence = Array.isArray(conflict.evidence) ? conflict.evidence.map(raw => validateEvidence(documents[conflict.document], raw)) : [];
      fieldIssues.push(addIssue({ field: key, document: conflict.document, code: 'contradiction', severity: 'blocker',
        message: String(conflict.message || `Contradictory ${label.toLowerCase()} values require source clarification.`), evidence,
        method: conflict.method || 'supplied-conflict' }));
      priority = 100; status = 'conflict';
    }
    // An unverified guess is never counted as a confirmed change.
    const changed = before.verified && after.verified ? before.value !== after.value : null;
    if (!fieldIssues.length && changed) { status = 'changed'; priority = 60; }
    return { key, label, before, after, changed, status, issues: fieldIssues, priority };
  });

  const rawGuardStatus = input.guard?.status;
  const guardStatus = rawGuardStatus === 'clear' ? 'clear' : ['blocked', 'warning'].includes(rawGuardStatus) ? 'warning' : 'unknown';
  const guard = { ...input.guard, status: guardStatus, reasons: Array.isArray(input.guard?.reasons) ? input.guard.reasons.map(String) : [] };
  if (guardStatus !== 'clear') {
    addIssue({ field: null, document: null, code: guardStatus === 'warning' ? 'guard-warning' : 'guard-unknown', severity: 'blocker',
      message: guardStatus === 'warning' ? 'A prompt-injection warning holds this review. Treat document instructions as untrusted data.' : 'Guard status is unknown. The review cannot be completed without a clear screening result.' });
  }

  const probability = isProbability(input.decide?.probability) ? input.decide.probability : null;
  const decision = typeof input.decide?.decision === 'boolean' ? input.decide.decision : null;
  const expectedDecision = probability === null ? null : probability >= POLICY.materialThreshold;
  const decisionInconsistent = decision !== null && expectedDecision !== null && decision !== expectedDecision;
  if (decisionInconsistent) addIssue({ field: null, document: null, code: 'decision-inconsistent', severity: 'blocker',
    message: 'Decide probability and threshold decision disagree. Review the response before proceeding.' });
  const changedCount = fields.filter(field => field.changed === true).length;
  const evidenceBlockers = issues.filter(issue => issue.field !== null || issue.code === 'decision-inconsistent');
  let route;
  if (guardStatus !== 'clear') route = { code: 'security_hold', label: 'Document screening hold', reasons: ['Resolve the Guard warning or unavailable screening result before review completion.'] };
  else if (evidenceBlockers.length) route = { code: 'evidence_hold', label: 'Resolve source evidence', reasons: ['Missing, conflicting, uncertain, or invalid evidence requires clarification.'] };
  else if (probability !== null && probability >= POLICY.materialThreshold) route = { code: 'material_review', label: 'Material change review', reasons: ['Decide crossed the 0.90 material-change threshold. Review the impact with the source visible.'] };
  else if (probability === null || probability > POLICY.lowMaterialProbability || decision === null || changedCount > 0) route = { code: 'uncertainty_review', label: 'Human interpretation needed', reasons: [changedCount > 0 ? 'Verified source values changed; a low or uncertain Decide score cannot dismiss the difference.' : 'Decide does not confidently support a routine comparison.'] };
  else route = { code: 'standard_review', label: 'Routine comparison review', reasons: ['All required source values match; Decide reports a low material-change probability. Human review still required.'] };

  return {
    id: input.id || 'review', documents, fields, issues, guard,
    decide: { probability, decision, threshold: POLICY.materialThreshold, consistent: !decisionInconsistent },
    route, canComplete: guardStatus === 'clear' && evidenceBlockers.length === 0,
    counts: { changed: changedCount, attention: fields.filter(field => field.issues.length).length,
      blocked: issues.filter(issue => issue.severity === 'blocker').length,
      verified: fields.reduce((sum, field) => sum + Number(field.before.verified) + Number(field.after.verified), 0), total: fields.length * 2 },
    provenance,
    audit: [
      { step: 1, action: 'source-loaded', detail: `${provenance.mode === 'replay' ? 'Author-crafted synthetic replay' : 'Live response'}; two source revisions, one line item.` },
      { step: 2, action: 'guard-evaluated', detail: `Guard status: ${guardStatus}.` },
      { step: 3, action: 'evidence-validated', detail: `${fields.reduce((sum, field) => sum + Number(field.before.verified) + Number(field.after.verified), 0)} of 8 source spans verified exactly.` },
      { step: 4, action: 'review-routed', detail: `${route.label}. No commercial decision was made.` },
    ],
  };
}
