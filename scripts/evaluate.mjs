import {fixtures} from '../src/fixtures.mjs';
import {analyzeReview} from '../src/review.mjs';
const evaluations=fixtures.map(f=>{const r=analyzeReview(f);const actual={route:r.route.code,changed:r.counts.changed,canComplete:r.canComplete};return {id:f.id,expected:f.expected,actual,pass:Object.entries(f.expected).every(([k,v])=>actual[k]===v)};});
const report={suite:'RevisionDesk deterministic policy fixtures',generatedAt:new Date().toISOString(),provenance:'Author-crafted synthetic fixtures. Policy checks only; not live API evaluation or model accuracy.',passed:evaluations.filter(e=>e.pass).length,total:evaluations.length,evaluations};
console.log(JSON.stringify(report,null,2));
if(report.passed!==report.total)process.exitCode=1;
