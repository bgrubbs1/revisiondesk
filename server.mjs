import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { analyzeLive, ClockedError } from './src/clocked.mjs';

const root=fileURLToPath(new URL('.',import.meta.url));
const staticFiles=new Map([['/','public/index.html'],['/public/index.html','public/index.html'],['/public/styles.css','public/styles.css'],['/public/app.mjs','public/app.mjs'],['/src/fixtures.mjs','src/fixtures.mjs'],['/src/review.mjs','src/review.mjs']]);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8'};
export function createServer({analyze=analyzeLive,liveEnabled=process.env.REVISIONDESK_LIVE==='1'&&Boolean(process.env.CLOCKED_API_KEY)}={}){
  let busy=false,lastStart=0,analyses=0;
  return http.createServer(async(req,res)=>{
    const send=(status,value,type='application/json; charset=utf-8')=>{res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"});res.end(type.startsWith('application/json')?JSON.stringify(value):value);};
    if(!/^127\.0\.0\.1(?::\d+)?$|^localhost(?::\d+)?$|^\[::1\](?::\d+)?$/.test(req.headers.host||''))return send(403,{error:'Only localhost access is supported.'});
    let pathname;try{pathname=new URL(req.url,'http://localhost').pathname;}catch{return send(400,{error:'Invalid request.'});}
    if(req.method==='GET'&&pathname==='/api/status')return send(200,{liveEnabled,application:'RevisionDesk',limits:{maxCharacters:4000,maxAnalysesPerProcess:10,minIntervalSeconds:15,concurrency:1}});
    if(pathname==='/api/analyze'&&req.method==='POST'){
      if(!liveEnabled)return send(503,{error:'Live mode is disabled. Configure the server key and explicitly enable REVISIONDESK_LIVE=1. No replay fallback.'});
      const origin=req.headers.origin;if(!origin||origin!==`http://${req.headers.host}`)return send(403,{error:'A same-origin browser request is required.'});
      if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))return send(415,{error:'Use application/json.'});
      if(busy)return send(429,{error:'Another analysis is in progress. No request was sent.'});
      if(analyses>=10)return send(429,{error:'This server session has reached its 10-analysis cap. Review usage before restarting.'});
      if(Date.now()-lastStart<15000)return send(429,{error:'Allow 15 seconds between analysis starts. No request was sent.'});
      try{
        const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>20000){send(413,{error:'Request too large.'});req.resume();return;}chunks.push(chunk);}const body=Buffer.concat(chunks).toString('utf8');
        let data;try{data=JSON.parse(body);}catch{return send(400,{error:'Invalid JSON.'});}
        if(!data||typeof data.before!=='string'||typeof data.after!=='string'||!data.before.trim()||!data.after.trim()||data.before.length>4000||data.after.length>4000)return send(400,{error:'Provide two nonempty synthetic revisions, at most 4,000 characters each.'});
        // Lock after reading the body too: two slow requests must not both enter.
        if(busy||Date.now()-lastStart<15000||analyses>=10)return send(429,{error:'Analysis capacity is unavailable. No request was sent.'});
        busy=true;lastStart=Date.now();analyses++;
        try{const result=await analyze({before:data.before,after:data.after});return send(200,{...result,documents:{before:data.before,after:data.after},id:`live-${Date.now()}`});}
        catch(error){
          if(error instanceof ClockedError){
            const calls=(error.provenance?.calls||[]).map(call=>({endpoint:call.endpoint,requestId:call.requestId,elapsedMs:call.elapsedMs,credits:call.credits,costUsd:call.costUsd,costBasis:call.costBasis}));
            return send(error.status>=400&&error.status<=599?error.status:502,{error:error.message,code:error.code,requestId:error.requestId,outcome:error.outcome,failureAudit:{mode:'live',documentHashes:error.provenance?.documentHashes||null,calls,notice:'No replay fallback. Preserve request IDs for usage reconciliation; unknown outcomes are held.'}});
          }
          return send(502,{error:'Clocked analysis did not complete. No replay result was substituted. Check server configuration and provider status before retrying.',code:'ANALYSIS_FAILED'});
        }
        finally{busy=false;}
      }catch{return send(400,{error:'Request could not be read.'});}
    }
    if(req.method!=='GET')return send(405,{error:'Method not allowed.'});
    const file=staticFiles.get(pathname);if(!file)return send(404,{error:'Not found.'});
    try{const data=await readFile(resolve(root,file));return send(200,data,mime[file.slice(file.lastIndexOf('.'))]||'text/plain');}catch{return send(500,{error:'Application file unavailable.'});}
  });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const port=Number(process.env.PORT||4177);if(!Number.isInteger(port)||port<1024||port>65535)throw Error('PORT must be an integer from 1024 to 65535.');
  createServer().listen(port,'127.0.0.1',()=>console.log(`RevisionDesk: http://127.0.0.1:${port} — fixture replay ready; live requires explicit server configuration.`));
}
