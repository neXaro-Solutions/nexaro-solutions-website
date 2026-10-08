/* Background worker regression: no real credentials, customers or paid AI calls. */
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import ts from "typescript";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const source=readFileSync(resolve(root,"supabase/functions/pilot-background/index.ts"),"utf8");
const ui=readFileSync(resolve(root,"pilot/index.html"),"utf8");
const js=ts.transpileModule(source.replace(/^import "jsr:[^"]+";\r?\n/gm,"").replace(/^import \{createClient\} from "npm:[^"]+";\r?\n/gm,""),{
 compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None},
 fileName:"pilot-background.ts",reportDiagnostics:true
});
const errors=(js.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
assert.equal(errors.length,0,errors.map(d=>ts.flattenDiagnosticMessageText(d.messageText," ")).join("; "));
assert(source.includes("pilot_background_verify_token"),"Worker wake-up token is required");
assert(source.includes("pilot_background_claim"),"Atomic lease claim is required");
assert(source.includes('MAX_STEPS=6,MAX_USD=0.25'),"Bounded background budget is required");
assert(source.includes("CONTENT_SAFETY_REVIEW_REQUIRED"),"Input and output moderation is mandatory");
assert(source.includes('verification_scope:"creative_format_and_content_safety_only"'),"Creative review is not external fact verification");
assert(source.includes("USER_REVIEW")===false,"Do not misrepresent human approval");
assert(!source.includes("refresh_token"),"Cannot store or refresh user sessions");
assert(ui.includes("await pilotBackgroundStart(targetGoal.id)"),"One click must register backend job");
assert(ui.includes("pilotBackgroundWorking(g?.id)"),"Home must show background status");
assert(ui.includes('await pilotBackgroundResume(ctx.ex.goal_id)'),"User approvals resume bounded work");
console.log("PASS Worker TypeScript, owner-controlled queue, limited capability and UI contracts");
const OWNER="11111111-1111-4111-8111-111111111111";
const OTHER="22222222-2222-4222-8222-222222222222";
const GOAL="33333333-3333-4333-8333-333333333333";
const ORG="44444444-4444-4444-8444-444444444444";
function scene({owner=OWNER,job=null}={}){
 let seq=0,handler=null,aiCalls=0;
 const rows={
  goals:[{id:GOAL,owner_id:owner,organization_id:ORG,status:"active"}],
  pilot_background_jobs:job?[{...job}]:[]
 };
 class Q{
  constructor(t){this.t=t;this.p=[];this.mode="select";this.value=null;this.size=null}
  select(){return this}
  eq(k,v){this.p.push(x=>x[k]===v);return this}
  order(){return this}
  limit(n){this.size=n;return this}
  update(obj){this.mode="update";this.value=obj;return this}
  insert(obj){this.mode="insert";this.value=obj;return this}
  compute(){
   let items=rows[this.t]||[];
   if(this.mode==="insert"){
    const v={id:"55555555-5555-4555-8555-"+String(++seq).padStart(12,"0"),...this.value};
    items.push(v);return {data:[v],error:null};
   }
   items=items.filter(x=>this.p.every(p=>p(x)));
   if(this.mode==="update"){for(const x of items)Object.assign(x,this.value);return {data:items,error:null}}
   return {data:this.size?items.slice(0,this.size):items,error:null};
  }
  then(resolve,reject){return Promise.resolve(this.compute()).then(resolve,reject)}
  single(){const r=this.compute();return Promise.resolve(r.data.length?{data:r.data[0],error:null}:{data:null,error:{code:"PGRST116"}})}
  maybeSingle(){const r=this.compute();return Promise.resolve({data:r.data[0]||null,error:null})}
 }
 const db={auth:{getUser:async token=>token==="valid"?
   {data:{user:{id:OWNER}},error:null}:{data:null,error:{message:"unauthorized"}}},
  from:t=>new Q(t),
  rpc:async(name,arg)=>{
   if(name==="pilot_background_verify_token")return {data:arg.provided==="x".repeat(64),error:null};
   if(name==="pilot_background_reap")return {data:0,error:null};
   if(name==="pilot_background_claim")return {data:[],error:null};
   throw Error("Unexpected database RPC "+name);
  }
 };
 const context={
  Request,Response,Headers,URL,AbortSignal,console:{log(){},warn(){},error(){}},
  Deno:{env:{get:key=>({
   SUPABASE_URL:"https://mock.supabase.co",
   SUPABASE_SECRET_KEYS:JSON.stringify({default:"service-mock"})
  }[key]||"")},serve:h=>{handler=h}},
  createClient(){return db},
  fetch:async()=>{aiCalls++;throw Error("NO_NETWORK_ALLOWED")},
  EdgeRuntime:{waitUntil(){/* fast-wakeup suppressed in mocked tests */}}
 };
 vm.runInNewContext(js.outputText,context,{filename:"pilot-background.js",timeout:5000});
 assert.equal(typeof handler,"function","Handler must register");
 return {
  rows, calls:()=>aiCalls,
  request:async (body,auth="Bearer valid",workerKey=null)=>{
   const headers={"content-type":"application/json"};
   if(auth)headers.authorization=auth;
   if(workerKey)headers["x-pilot-worker-key"]=workerKey;
   const req=new Request("https://mock.supabase.co/functions/v1/pilot-background",{
    method:"POST",headers,body:JSON.stringify(body)
   });
   const out=await handler(req);return {status:out.status,data:await out.json()};
  }
 };
}
let s=scene();
let r=await s.request({operation:"tick"},null);
assert.equal(r.status,403);assert.equal(s.calls(),0);
console.log("PASS Cron endpoint requires private worker credential");
r=await s.request({operation:"tick"},null,"x".repeat(64));
assert.equal(r.status,200);assert.equal(r.data.processed,0);assert.equal(s.calls(),0);
console.log("PASS Authenticated cron tick uses claim RPC but not consumer session");
r=await s.request({operation:"start",goal_id:GOAL},"Bearer invalid");
assert.equal(r.status,401);assert.equal(s.rows.pilot_background_jobs.length,0);
console.log("PASS Invalid end-user session cannot enqueue an order");
s=scene({owner:OTHER});
r=await s.request({operation:"start",goal_id:GOAL});
assert.equal(r.status,404);assert.equal(s.rows.pilot_background_jobs.length,0);
console.log("PASS Cross-account background jobs are forbidden");
s=scene();
r=await s.request({operation:"start",goal_id:GOAL});
assert.equal(r.status,200);
assert.equal(r.data.status,"queued");
assert.equal(r.data.job.max_steps,6);
assert.equal(r.data.job.max_cost_usd,0.25);
assert.equal(s.calls(),0,"Queuing cannot charge an AI provider");
console.log("PASS First consent creates a capped, durable server-side job");
r=await s.request({operation:"status",goal_id:GOAL});
assert.equal(r.status,200);assert.equal(r.data.job.goal_id,GOAL);
r=await s.request({operation:"pause",goal_id:GOAL});
assert.equal(r.status,200);
assert.equal(r.data.status,"paused");
r=await s.request({operation:"resume",goal_id:GOAL});
assert.equal(r.status,200);assert.equal(r.data.status,"queued");
assert.equal(s.rows.pilot_background_jobs.length,1,"Resume never duplicates jobs");
console.log("PASS Pause and resume preserve one durable job");
s=scene({job:{id:"66666666-6666-4666-8666-666666666666",
 goal_id:GOAL,organization_id:ORG,owner_id:OWNER,
 status:"completed",steps_completed:6,max_steps:6,cost_spent_usd:0.25,max_cost_usd:0.25}});
r=await s.request({operation:"resume",goal_id:GOAL});
assert.equal(r.status,409);
assert.equal(s.calls(),0);
console.log("PASS Exhausted background budgets cannot be silently restarted");

const calls=[];
const example={deliverable:("Neon-grüne Markenwelt mit klarer typografischer Hierarchie, orangefarbenem Akzent, flexibler Bildsprache, verständlichem Nutzenversprechen und konsistenter Textführung. ").repeat(3),
 verification:"Umfang, Struktur, Klarheit und Inhaltsmoderation technisch geprüft.",
 next_recommendation:"Die bereits freigegebenen Gestaltungsvorgaben für das nächste Material übernehmen."};
const creativeEnv={
  Request,Response,Headers,URL,AbortSignal,
  console:{log(){},error(){},warn(){}},
  Deno:{env:{get:()=>""},serve(){}},
  createClient(){return {}},
  fetch:async(url,options)=>{
   calls.push({url:String(url),body:JSON.parse(options.body)});
   if(String(url).endsWith("/moderations"))return Response.json({results:[{flagged:false}]});
   if(String(url).endsWith("/responses"))return Response.json({
    output:[{content:[{type:"output_text",text:JSON.stringify(example)}]}],
    usage:{input_tokens:300,output_tokens:450}
   });
   throw Error("Unexpected external service in offline tests");
  }
};
vm.runInNewContext(js.outputText+";globalThis.__backgroundFunctions={createDraft,stageJob,eligible};",creativeEnv,{timeout:5000});
const fn=creativeEnv.__backgroundFunctions;
const prior=[{result_id:"77777777-7777-4777-8777-777777777777",
  title:"Bestätigtes Marken-Konzept",
  creative_excerpt:"Frühere Textgestaltung mit Neon-Grün, Orange und heller Oberfläche."}];
const doc=await fn.createDraft("mock_key",
 {title:"Floristikstudio",desired_outcome:"Einheitliche Gestaltung"},
 {title:"Erstelle ein Social-Media-Konzept",objective:"Erstelle passende Werbetexte"},
 [{key:"brand_style",value:"hell, Neon-Grün und Orange"}],prior);
assert.equal(calls.filter(x=>x.url.endsWith("/moderations")).length,2);
assert.equal(calls.filter(x=>x.url.endsWith("/responses")).length,1);
const sent=calls.find(x=>x.url.endsWith("/responses")).body;
const creativeInput=JSON.parse(sent.input[0].content[0].text);
assert.equal(creativeInput.prior_project_deliverables[0].result_id,prior[0].result_id);
assert.equal(creativeInput.confirmed_decisions[0].value,"hell, Neon-Grün und Orange");
assert(doc.cost>0&&doc.cost<0.02);
console.log("PASS Follow-up drafts reuse prior project outputs and confirmed decisions within cost cap");

assert.equal(fn.eligible({status:"active",domain:{primary:"marketing"}},
 {title:"Erstelle ein Logo-Konzept",objective:"Gestalte Markenauftritt",
  status:"ready",owner_type:"pilot",recommended_mode:"do_it",blocking:false}),true);
assert.equal(fn.eligible({status:"active",domain:{primary:"marketing"}},
 {title:"Veröffentliche Newsletter",objective:"Sende E-Mail an Kunden",
  status:"ready",owner_type:"pilot",recommended_mode:"do_it",blocking:false}),false);
assert.equal(fn.eligible({status:"active",domain:{primary:"business"}},
 {title:"Finanzplan",objective:"Investitionen ermitteln",
  status:"ready",owner_type:"pilot",recommended_mode:"do_it",blocking:false}),false);
console.log("PASS Creative tasks are eligible; external sends and financial operations still require user approval");

const stageWrites=[];
const fakeDb={from(table){
 assert.equal(table,"pilot_background_jobs");
 return {update(payload){stageWrites.push(payload);return this},
  eq(){return this},select(){return this},
  maybeSingle:async()=>({data:{id:"job"},error:null})};
}};
for(const stage of ["preparing","drafting","verifying","saving"]){
 const wrote=await fn.stageJob(fakeDb,{id:"job",lease_token:"lease"},stage,{id:"action",title:"Flyer texten"});
 assert.equal(wrote,true);
}
assert.deepEqual(stageWrites.map(x=>x.stage),["preparing","drafting","verifying","saving"]);
assert(stageWrites.every(x=>x.current_action_title==="Flyer texten"));
console.log("PASS Durable stage transitions are tied to the current action and worker lease");
assert(ui.includes("pilotBgProgressHTML(pilotBackgroundJob)"),"Mobile UI must render actual persisted stages");
assert(ui.includes("keine unabhängige Quellenprüfung"),"Project results must not claim external verification");
console.log("PASS Project view reports creative results honestly and compactly");

console.log("PASS All background contract and authorization scenarios");
