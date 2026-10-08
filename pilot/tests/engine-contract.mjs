/* neXaro Pilot — isolated execution-engine regression checks.
   Live business data and external providers are never accessed. */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import vm from "node:vm";
import {webcrypto} from "node:crypto";
import ts from "typescript";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const source=readFileSync(resolve(root,"supabase/functions/execution-engine/index.ts"),"utf8");
const frontend=readFileSync(resolve(root,"pilot/index.html"),"utf8");
const moduleBody=source
  .replace(/^import "jsr:[^"]+";\r?\n/m,"")
  .replace(/^import \{ createClient \} from "npm:[^"]+";\r?\n/m,"");
assert(!/^import /m.test(moduleBody),"Unknown runtime import: update the test explicitly");
const compiled=ts.transpileModule(moduleBody,{
  compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None},
  reportDiagnostics:true,fileName:"index.ts"
});
const compilerErrors=(compiled.diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error);
assert.equal(compilerErrors.length,0,"Backend TypeScript syntax must compile: "+compilerErrors.map(x=>ts.flattenDiagnosticMessageText(x.messageText," ")).join("; "));
assert(source.includes('firstOpen.data?.[0]?.id!==actionId'),"Direct start must reject out-of-order actions");
assert(source.includes('reason_code:"EXECUTION_STEPS_CREATE_FAILED"'),"Initialization errors must carry a stable code");
assert(frontend.includes("function pilotNextQueuedAction()"),"UI and backend require the same ordered queue");
assert(frontend.includes('if(!n||n.status!=="ready"||pilotReviewContext()'),"Manual UI may only start READY actions");
console.log("PASS TypeScript syntax, backend/source contract and frontend queue contract");

const USER="11111111-1111-4111-8111-111111111111";
const GOAL="22222222-2222-4222-8222-222222222222";
const ACTION_A="33333333-3333-4333-8333-333333333333";
const ACTION_B="44444444-4444-4444-8444-444444444444";
const ORGANIZATION="55555555-5555-4555-8555-555555555555";
let counter=0;
const newId=()=> "66666666-6666-4666-8666-"+String(++counter).padStart(12,"0");
const mkAction=(id,status="ready",owner_type="pilot",created_at="2026-10-08T10:00:00.000Z")=>({
  id,goal_id:GOAL,status,owner_type,recommended_mode:owner_type==="pilot"?"do_it":"together",
  blocking:false,title:"Konzept formulieren",objective:"Erstelle ein nutzbares Konzept",created_at
});
const baseGoal={id:GOAL,owner_id:USER,organization_id:ORGANIZATION,status:"active",
  title:"Testprojekt",desired_outcome:"Dokument",domain:{primary:"general"},success_criteria:[]};
function createScenario({actions,executions=[],failSteps=false,goalDomain="general"}){
  const records={
    goals:[{...baseGoal,domain:{primary:goalDomain}}],
    actions:actions.map(x=>({...x})),
    executions:executions.map(x=>({...x,goal_id:GOAL})),
    goal_memories:[],context_items:[],results:[],pilot_internal_knowledge:[],
    execution_steps:[],audit_events:[]
  };
  const state={records,failSteps,fetchCount:0,handler:null};
  class Query{
    constructor(table){this.table=table;this.predicates=[];this.mode="read";this.payload=null;this.ascending=true;this.sortField=null;this.maximum=null;this.joins=false;}
    select(fields="*"){this.joins=fields.includes("goals!inner");return this}
    eq(k,v){this.predicates.push(r=>r[k]===v);return this}
    neq(k,v){this.predicates.push(r=>r[k]!==v);return this}
    in(k,arr){this.predicates.push(r=>arr.includes(r[k]));return this}
    not(k,op,val){
      if(op==="in"){const blocked=String(val).replace(/[()]/g,"").split(",");this.predicates.push(r=>!blocked.includes(r[k]));}
      return this;
    }
    gt(k,v){this.predicates.push(r=>r[k]>v);return this}
    order(k,{ascending=true}={}){this.sortField=k;this.ascending=ascending;return this}
    limit(n){this.maximum=n;return this}
    insert(payload){this.mode="insert";this.payload=payload;return this}
    update(payload){this.mode="update";this.payload=payload;return this}
    execute(){
      const data=records[this.table]||[];
      if(this.mode==="insert"){
        if(this.table==="execution_steps"&&state.failSteps)return {data:null,error:{message:"simulated initialization failure",code:"XX001"}};
        const created=(Array.isArray(this.payload)?this.payload:[this.payload]).map(x=>({id:newId(),...x}));
        data.push(...created);
        return {data:created,error:null};
      }
      const matches=data.filter(row=>this.predicates.every(p=>p(row)));
      if(this.mode==="update"){
        matches.forEach(row=>Object.assign(row,this.payload));
        return {data:matches,error:null};
      }
      const selected=[...matches];
      if(this.sortField)selected.sort((a,b)=>{
        const result=String(a[this.sortField]??"").localeCompare(String(b[this.sortField]??""));
        return this.ascending?result:-result;
      });
      const limited=this.maximum===null?selected:selected.slice(0,this.maximum);
      const joined=this.joins?limited.map(x=>({...x,goals:baseGoal})):limited;
      return {data:joined,error:null};
    }
    then(resolve,reject){return Promise.resolve(this.execute()).then(resolve,reject)}
    single(){const x=this.execute();return Promise.resolve(x.error?x:{
      data:x.data[0]||null,error:x.data.length===1?null:{code:"PGRST116",message:"not_single"}
    })}
    maybeSingle(){const x=this.execute();return Promise.resolve(x.error?x:{data:x.data[0]||null,error:null})}
  }
  const sb={
    auth:{getUser:async()=>({data:{user:{id:USER}},error:null})},
    from:table=>new Query(table)
  };
  const context={
    Response,Request,Headers,URL,crypto:webcrypto,
    console:{
      log(){},warn(){},error(){},info(){}
    },
    Deno:{
      env:{get:key=>({
        SUPABASE_URL:"https://mock.supabase.co",
        SUPABASE_PUBLISHABLE_KEYS:JSON.stringify({default:"sb_publishable_mock"}),
        SUPABASE_SECRET_KEYS:JSON.stringify({default:"sb_secret_mock"})
      }[key]||"")},
      serve(fn){state.handler=fn}
    },
    createClient(){return sb},
    fetch:async url=>{
      state.fetchCount++;
      if(!String(url).includes("/functions/v1/safety-gate"))throw Error("UNEXPECTED NETWORK: "+url);
      return Response.json({allowed:true});
    },
    setTimeout,clearTimeout,AbortController
  };
  vm.runInNewContext(compiled.outputText,context,{filename:"execution-engine.js",timeout:4000});
  assert.equal(typeof state.handler,"function","Edge handler must initialize");
  state.invoke=async(body)=>{
    const request=new Request("https://mock.supabase.co/functions/v1/execution-engine",{
      method:"POST",headers:{"Authorization":"Bearer mock_user_jwt","Content-Type":"application/json"},
      body:JSON.stringify(body)
    });
    const resp=await state.handler(request);
    return {status:resp.status,payload:await resp.json()};
  };
  return state;
}

async function scenario(name,fixture,request,check){
  const state=createScenario(fixture);
  const result=await state.invoke(request);
  check(result,state);
  console.log("PASS "+name);
}
const a=mkAction(ACTION_A,"ready","pilot");
const b=mkAction(ACTION_B,"ready","pilot","2026-10-08T11:00:00.000Z");

await scenario("First PENDING prerequisite halts next",{
 actions:[{...a,status:"pending"},b]
},{operation:"next",goal_id:GOAL},({status,payload},state)=>{
 assert.equal(status,200);assert.equal(payload.status,"pending_prerequisite");
 assert.equal(payload.next_action.id,ACTION_A);assert.equal(state.records.executions.length,0);
});
await scenario("Joint decision requires human authorization",{
 actions:[{...a,owner_type:"joint",recommended_mode:"together"}]
},{operation:"status",goal_id:GOAL},({status,payload})=>{
 assert.equal(status,200);assert.equal(payload.status,"collaboration_required");
});
await scenario("Pilot-owned READY task is eligible",{
 actions:[a]
},{operation:"status",goal_id:GOAL},({status,payload})=>{
 assert.equal(status,200);assert.equal(payload.status,"ready");assert.equal(payload.next_action.id,ACTION_A);
});
await scenario("Historical blocked work cannot freeze a new task",{
 actions:[{...a,status:"completed"},b],
 executions:[{id:newId(),action_id:ACTION_A,status:"blocked",created_at:"2026-10-08T09:00:00.000Z"}]
},{operation:"status",goal_id:GOAL},({status,payload})=>{
 assert.equal(status,200);assert.equal(payload.status,"ready");assert.equal(payload.next_action.id,ACTION_B);
});
await scenario("Current unresolved execution pauses automation",{
 actions:[a],
 executions:[{id:newId(),action_id:ACTION_A,status:"review_required",created_at:"2026-10-08T09:00:00.000Z"}]
},{operation:"next",goal_id:GOAL},({status,payload},state)=>{
 assert.equal(status,200);assert.equal(payload.status,"attention_required");
 assert.equal(state.records.executions.length,1);
});
await scenario("Direct start cannot bypass earlier pending action",{
 actions:[{...a,status:"pending"},b]
},{operation:"start",action_id:ACTION_B},({status,payload},state)=>{
 assert.equal(status,409);assert.equal(payload.reason_code,"PREDECESSOR_NOT_COMPLETED");
 assert.equal(state.fetchCount,0);assert.equal(state.records.executions.length,0);
});
await scenario("Failed step initialization rolls back running status",{
 actions:[a],failSteps:true
},{operation:"start",action_id:ACTION_A},({status,payload},state)=>{
 assert.equal(status,503);assert.equal(payload.reason_code,"EXECUTION_STEPS_CREATE_FAILED");
 assert.equal(state.records.executions.length,1);
 assert.equal(state.records.executions[0].status,"failed");
 assert.equal(state.records.executions[0].error_code,"EXECUTION_STEPS_CREATE_FAILED");
 assert.equal(state.records.execution_steps.length,0);
});

await scenario("Completed prerequisites unlock the next pending user step",{
 actions:[{...a,status:"completed"}, {...b,status:"pending",owner_type:"user",recommended_mode:"together"}]
},{operation:"next",goal_id:GOAL},({status,payload},state)=>{
 assert.equal(status,200);
 assert.equal(payload.status,"collaboration_required");
 assert.equal(state.records.actions.find(x=>x.id===ACTION_B).status,"ready");
 assert.equal(payload.next_action.id,ACTION_B);
 assert.equal(state.fetchCount,0);
});
await scenario("Status check previews next unlock without mutating data",{
 actions:[{...a,status:"completed"}, {...b,status:"pending",owner_type:"user",recommended_mode:"together"}]
},{operation:"status",goal_id:GOAL},({status,payload},state)=>{
 assert.equal(status,200);
 assert.equal(payload.status,"collaboration_required");
 assert.equal(payload.next_action.status,"ready");
 assert.equal(state.records.actions.find(x=>x.id===ACTION_B).status,"pending");
});
await scenario("A blocked predecessor can never be bypassed",{
 actions:[{...a,status:"blocked"}, {...b,status:"pending",owner_type:"user",recommended_mode:"together"}]
},{operation:"next",goal_id:GOAL},({status,payload},state)=>{
 assert.equal(status,200);
 assert.equal(payload.status,"pending_prerequisite");
 assert.equal(state.records.actions.find(x=>x.id===ACTION_B).status,"pending");
});
await scenario("User-owned decisions cannot be drafted by Autopilot",{
 actions:[{...a,owner_type:"user",recommended_mode:"together"}]
},{operation:"next",goal_id:GOAL},({status,payload},state)=>{
 assert.equal(status,200);
 assert.equal(payload.status,"collaboration_required");
 assert.equal(state.records.executions.length,0);
});
await scenario("External writes still require manual authorization",{
 actions:[{...a,title:"E-Mail senden",objective:"Send customer email",
   owner_type:"joint",recommended_mode:"together"}]
},{operation:"next",goal_id:GOAL},({status,payload},state)=>{
 assert.equal(status,200);
 assert.equal(payload.status,"collaboration_required");
 assert.equal(state.records.executions.length,0);
});
await scenario("High-risk medical joint work never auto-starts",{
 actions:[{...a,owner_type:"joint",recommended_mode:"together"}],
 goalDomain:"medical_documentation"
},{operation:"next",goal_id:GOAL},({status,payload},state)=>{
 assert.equal(status,200);
 assert.equal(payload.status,"collaboration_required");
 assert.equal(state.records.executions.length,0);
});

console.log("PASS All 13 live-handler policy and recovery simulations; no real accounts or network writes.");
