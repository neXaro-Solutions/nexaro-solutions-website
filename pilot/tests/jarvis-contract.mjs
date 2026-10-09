/* Execute the real gateway and coordinator with isolated databases and provider replies. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const shared=readFileSync('supabase/functions/_shared/pilot-providers.ts','utf8').replace(/^export /gm,'');
const compile=name=>{
 const source=shared+'\n'+readFileSync(`supabase/functions/${name}/index.ts`,'utf8').replace(/^import .*;\r?\n/gm,'');
 const out=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None},reportDiagnostics:true});
 assert.equal(out.diagnostics?.filter(x=>x.category===ts.DiagnosticCategory.Error).length,0);
 return out.outputText;
};
const gatewayCode=compile('ai-gateway'),coordinatorCode=compile('best-of-ai');
const output={deliverable:'Dies ist ein vollständig ausgearbeitetes und unmittelbar nutzbares Testergebnis für den bestehenden Pilot-Auftrag. Es enthält keine erfundenen Tatsachen.',verification:'Struktur und Vollständigkeit geprüft; externe Fakten wurden nicht überprüft.',next_recommendation:'Prüfe das fertige Ergebnis im bestehenden Auftrag.'};
function scene({keys=['openai','anthropic'],extra={},fail=[],admin=true,malformed=[],safety=true}={}){
 const env={SUPABASE_URL:'https://mock.supabase.co',SUPABASE_PUBLISHABLE_KEYS:'{"default":"public"}',SUPABASE_SECRET_KEYS:'{"default":"secret"}',...extra};
 for(const key of keys)env[{openai:'OPENAI_API_KEY',anthropic:'ANTHROPIC_API_KEY',gemini:'GEMINI_API_KEY',mistral:'MISTRAL_API_KEY',deepseek:'DEEPSEEK_API_KEY',xai:'XAI_API_KEY'}[key]]='test-key';
 const rows={organization_members:[{organization_id:'org',user_id:'user',active:true}],user_system_roles:[{user_id:'user',role:admin?'admin':'member'}],ai_requests:[],quality_contracts:[],ai_consensus_runs:[]};
 const requests=[];
 class Q{
  constructor(table){this.table=table;this.filters=[];this.op='select'}
  select(){return this} eq(k,v){this.filters.push(r=>r[k]===v);return this} gte(k,v){this.filters.push(r=>r[k]>=v);return this}
  limit(n){this.max=n;return this} order(k,{ascending=true}={}){this.sort=[k,ascending];return this}
  insert(v){this.op='insert';this.value=v;return this} update(v){this.op='update';this.value=v;return this}
  result(){let records=rows[this.table]||[];if(this.op==='insert'){const r={id:`${this.table}-${records.length}`,created_at:new Date().toISOString(),...this.value};records.push(r);return {data:[r],error:null}}
   records=records.filter(r=>this.filters.every(f=>f(r)));if(this.sort)records.sort((a,b)=>String(a[this.sort[0]]).localeCompare(String(b[this.sort[0]]))*(this.sort[1]?1:-1));
   if(this.max)records=records.slice(0,this.max);if(this.op==='update')records.forEach(r=>Object.assign(r,this.value));return {data:records,error:null}}
  then(a,b){return Promise.resolve(this.result()).then(a,b)} single(){const r=this.result();return Promise.resolve({data:r.data[0]||null,error:r.data[0]?null:{code:'missing'}})} maybeSingle(){return this.single()}
 }
 const db={from:t=>new Q(t),auth:{getUser:async token=>({data:{user:token==='valid'?{id:'user'}:null},error:token==='valid'?null:{}})}};
 let gateway,coordinator;
 const fetch=async(url,init)=>{
  const body=JSON.parse(init.body);requests.push({url,body});
  if(url.endsWith('/safety-gate'))return Response.json({allowed:safety},{status:safety?200:403});
  if(url.endsWith('/ai-gateway'))return gateway(new Request(url,init));
  const provider=url.includes('openai.com')?'openai':url.includes('anthropic.com')?'anthropic':url.includes('googleapis.com')?'gemini':url.includes('mistral.ai')?'mistral':url.includes('deepseek.com')?'deepseek':url.includes('api.x.ai')?'xai':null;
  assert(provider,'Unexpected network destination '+url);
  if(fail.includes(provider))return Response.json({error:{message:'billing inactive'}},{status:429});
  const text=malformed.includes(provider)?'not valid JSON':JSON.stringify(output);
  if(provider==='openai')return Response.json({id:'oa',output_text:text,usage:{input_tokens:100,output_tokens:80}});
  if(provider==='anthropic')return Response.json({id:'cl',content:[{type:'text',text}],usage:{input_tokens:100,output_tokens:80}});
  return Response.json({id:provider,model:body.model,choices:[{finish_reason:'stop',message:{content:text}}],usage:{prompt_tokens:100,completion_tokens:80}});
 };
 const make=(code,set)=>vm.runInNewContext(code,{Request,Response,Headers,AbortController,AbortSignal,URL,console:{info(){},error(){},warn(){}},setTimeout,clearTimeout,fetch,createClient:()=>db,Deno:{env:{get:k=>env[k]},serve:set}});
 make(gatewayCode,h=>gateway=h);make(coordinatorCode,h=>coordinator=h);
 const invoke=async(body,target=coordinator,token='valid')=>{const response=await target(new Request('https://mock/run',{method:'POST',headers:{authorization:'Bearer '+token},body:JSON.stringify(body)}));return {status:response.status,data:await response.json()}};
 return {invoke,gateway,rows,requests};
}
const body={task_type:'execution_artifact',required_fields:['deliverable','verification','next_recommendation'],mode:'fast_best',sensitivity:'internal',input:{action:{title:'Text erstellen'}}};
{
 const s=scene();const r=await s.invoke(body);assert.equal(r.status,200);assert.equal(r.data.winner,'openai');assert.equal(r.data.orchestration.comparison_performed,false);assert.equal(s.rows.ai_requests.length,1);
 console.log('PASS routine uses one real provider, existing result contract preserved');
}
{
 const s=scene({fail:['openai']});const r=await s.invoke(body);assert.equal(r.status,200);assert.equal(r.data.winner,'anthropic');assert.equal(s.rows.ai_requests.length,2);
 const second=await s.invoke(body);assert.equal(second.status,200);assert.equal(s.rows.ai_requests.length,3);
 console.log('PASS provider failure falls back once; organization cooldown avoids repeat billing failure');
}
{
 const s=scene();const r=await s.invoke({...body,mode:'high_assurance'});assert.equal(r.status,200);assert.deepEqual(r.data.orchestration.independent_providers.sort(),['anthropic','openai']);assert.equal(s.rows.ai_requests.length,3);assert(r.data.synthesis);
 assert.equal(Object.values(r.data.providers).reduce((sum,p)=>sum+p.cost,0)+r.data.synthesis.cost,s.rows.ai_requests.reduce((sum,r)=>sum+r.actual_cost,0));
 console.log('PASS independent comparison and synthesis retain actual provider identities and costs');
}
{
 const s=scene({keys:['openai']});assert.equal((await s.invoke({...body,mode:'high_assurance'})).status,503);assert.equal(s.rows.ai_requests.length,0);
 const r=await s.invoke({...body,quality_level:'high',provider_preference:'anthropic',provider_strict:true},s.gateway);assert.equal(r.status,503);assert.equal(s.rows.ai_requests.length,0);
 console.log('PASS missing independent provider cannot silently become a duplicate OpenAI call');
}
{
 const s=scene();assert.equal((await s.invoke({...body,sensitivity:'sensitive'})).status,422);assert.equal((await s.invoke({...body,sensitivity:'sensitive'},s.gateway)).status,422);assert.equal(s.requests.length,0);
 console.log('PASS sensitive content stops before any external request');
}
{
 const s=scene({malformed:['openai','anthropic']});assert.equal((await s.invoke(body)).status,503);assert.equal(s.rows.ai_consensus_runs[0].status,'failed');assert(!s.rows.ai_requests.some(r=>r.status==='completed'));
 console.log('PASS invalid provider JSON cannot become a finished work product');
}
{
 const s=scene({safety:false});assert.equal((await s.invoke(body)).status,403);assert.equal(s.rows.ai_requests.length,0);
 assert.equal((await s.invoke(body,undefined,'invalid')).status,401);
 console.log('PASS input safety and session authorization remain enforced');
}
{
 const s=scene();const r=await s.invoke({operation:'provider_status'});assert.equal(r.status,200);assert.equal(r.data.providers.length,6);assert(!JSON.stringify(r.data).includes('test-key'));assert(r.data.providers.every(p=>p.live_verified===false));assert.equal(s.requests.length,0);
 assert.equal((await scene({admin:false}).invoke({operation:'provider_status'})).status,403);
 console.log('PASS status is admin-only, free of secrets, nonbillable, and never claims live verification');
}
for(const id of ['gemini','mistral','deepseek','xai']){
 const prefix='PILOT_'+id.toUpperCase();
 const extra={PILOT_ADDITIONAL_PROVIDERS_ENABLED:'true',[prefix+'_ENABLED']:'true',[prefix+'_MODEL']:'configured-test-model',[prefix+'_INPUT_USD_PER_M']:'1',[prefix+'_OUTPUT_USD_PER_M']:'2'};
 const s=scene({keys:[id],extra});const r=await s.invoke(body);assert.equal(r.status,200);assert.equal(r.data.winner,id);assert(r.data.providers[id].cost>0);
 const absent=scene({keys:[id],extra:{...extra,[prefix+'_ENABLED']:'false'}});assert.equal((await absent.invoke(body)).status,503);
 const unpriced=scene({keys:[id],extra:{...extra,[prefix+'_INPUT_USD_PER_M']:''}});assert.equal((await unpriced.invoke(body)).status,503);
 console.log('PASS '+id+' adapter, explicit activation, required model/pricing, accounted output');
}
{
 const s=scene({keys:['gemini'],extra:{PILOT_ADDITIONAL_PROVIDERS_ENABLED:'true',PILOT_GEMINI_ENABLED:'true',PILOT_GEMINI_MODEL:'configured-test-model',PILOT_GEMINI_INPUT_USD_PER_M:'100',PILOT_GEMINI_OUTPUT_USD_PER_M:'100'}});
 assert.equal((await s.invoke(body)).status,503);
 assert(!s.requests.some(r=>r.url.includes('googleapis.com')));
 const failed=scene({fail:['anthropic']});assert.equal((await failed.invoke({...body,mode:'high_assurance'})).status,503);
 assert.equal(failed.rows.ai_consensus_runs[0].status,'failed');
 console.log('PASS budget blocks paid request before dispatch; high assurance cannot downgrade to one provider');
}
{
 const routine=scene();const r=await routine.invoke({...body,mode:undefined});
 assert.equal(r.status,200);assert.equal(r.data.mode,'fast_best');assert.equal(routine.rows.ai_requests.length,1);
 const critical=scene();const c=await critical.invoke({...body,input:{action:{title:'Rechtsform festlegen'}}});
 assert.equal(c.status,200);assert.equal(c.data.mode,'high_assurance');assert.equal(critical.rows.ai_requests.length,3);
 const complex=scene();const x=await complex.invoke({...body,task_type:'complex_plan',mode:'auto'});
 assert.equal(x.status,200);assert.equal(x.data.mode,'best');
 const historical=scene();const h=await historical.invoke({...body,mode:'auto',input:{action:{title:'Text erstellen'},previous_deliverables:[{content:'Rechtsform medizin high_assurance'}]}});
 assert.equal(h.data.mode,'fast_best');
 const disabled=scene({keys:['gemini'],extra:{PILOT_GEMINI_ENABLED:'true',PILOT_GEMINI_MODEL:'model',PILOT_GEMINI_INPUT_USD_PER_M:'1',PILOT_GEMINI_OUTPUT_USD_PER_M:'2'}});
 assert.equal((await disabled.invoke(body)).status,503);assert.equal(disabled.requests.filter(r=>r.url.includes('googleapis.com')).length,0);
 console.log('PASS automatic effort selection, critical-task escalation, historical data isolation, existing-provider-only default');
}
console.log('PASS Jarvis real-handler regression suite; no production data or paid calls used.');
