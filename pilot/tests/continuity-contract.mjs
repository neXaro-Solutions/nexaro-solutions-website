/* Pilot goal-continuity regression test: pure mocked backend, no production account or API writes. */
import assert from "node:assert/strict";
import vm from "node:vm";
import {webcrypto} from "node:crypto";
import {readFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import ts from "typescript";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const file=readFileSync(resolve(root,"supabase/functions/pilot-intelligence/index.ts"),"utf8");
const compiled=ts.transpileModule(file.replace(/^import "[^"]+";?\r?\n/gm,"").replace(/^import \{ createClient \} from "[^"]+";?\r?\n/gm,""),{
 compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None},
 reportDiagnostics:true,fileName:"pilot-intelligence.ts"
});
const diagnostics=(compiled.diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error);
assert.equal(diagnostics.length,0,diagnostics.map(x=>ts.flattenDiagnosticMessageText(x.messageText," ")).join("\n"));
console.log("PASS Intelligence TypeScript syntax");
const OWNER="11111111-1111-4111-8111-111111111111";
const ORG="22222222-2222-4222-8222-222222222222";
const GOAL="33333333-3333-4333-8333-333333333333";
const PLAN="44444444-4444-4444-8444-444444444444";
const FIRST="55555555-5555-4555-8555-555555555555";
let seq=0;
const uuid=()=> "66666666-6666-4666-8666-"+String(++seq).padStart(12,"0");
const goal={id:GOAL,owner_id:OWNER,organization_id:ORG,title:"Gartenbaubetrieb gründen",
 description:"Ein Garten- und Landschaftsbauunternehmen aufbauen",desired_outcome:"Geprüfte Gründung",
 domain:{primary:"business"},status:"active"};
const earlier={id:FIRST,goal_id:GOAL,status:"ready",title:"Rechtsform bestätigen",
 created_at:"2026-10-07T12:00:00.000Z",owner_type:"joint",recommended_mode:"together"};
const intent={objective:"Erstelle ein Logo für die Gründung eines Garten- und Landschaftsbaubetriebs",
 desiredOutcome:"Logo für das bestehende Unternehmen",constraints:[],budget:null,timeframe:null,
 domain:{primary:"general",secondary:[],confidence:"medium"},
 unknowns:["desired_outcome_detail"],confidence:"low"};
function scenario(existingActions=[],goalOwner=OWNER){
 const data={
  goals:[{...goal,owner_id:goalOwner}],
  organization_members:[{organization_id:ORG,user_id:OWNER,active:true}],
  actions:existingActions.map(x=>({...x})),
  plans:[{id:PLAN,goal_id:GOAL,version:1}],
  context_items:[],results:[],documents:[],milestones:[],
  goal_memories:[{goal_id:GOAL,owner_id:OWNER,active:true,importance:5,
   memory_key:"goal_brief",memory_type:"goal_brief",content:{project:"Gartenbau"},updated_at:"2026-10-07T12:00:00Z"}],
  pilot_states:[{user_id:OWNER,goal_id:GOAL,attention_required:true,
   work_state:"review_required",avatar_variant:"garden_landscaping",risk_level:"moderate"}]
 };
 const state={data,handler:null,networkCalls:[]};
 class Query{
  constructor(name){this.name=name;this.predicates=[];this.sortKey=null;this.asc=true;this.take=null;this.operation="select";this.payload=null;}
  select(){return this}
  eq(key,val){this.predicates.push(r=>r[key]===val);return this}
  in(key,values){this.predicates.push(r=>values.includes(r[key]));return this}
  order(key,{ascending=true}={}){this.sortKey=key;this.asc=ascending;return this}
  limit(n){this.take=n;return this}
  insert(payload){this.operation="insert";this.payload=payload;return this}
  upsert(payload){this.operation="upsert";this.payload=payload;return this}
  calculate(){
   const rows=data[this.name]||[];
   if(this.operation!=="select"){
    const incoming=(Array.isArray(this.payload)?this.payload:[this.payload]).map(p=>({id:uuid(),...p}));
    if(this.operation==="upsert"){
     for(const row of incoming){
      const matched=rows.find(r=>r.goal_id===row.goal_id&&r.memory_key===row.memory_key);
      if(matched)Object.assign(matched,row);else rows.push(row);
     }
    }else rows.push(...incoming);
    return {data:incoming,error:null};
   }
   let found=rows.filter(r=>this.predicates.every(p=>p(r)));
   if(this.sortKey)found=found.sort((a,b)=>{
    const n=String(a[this.sortKey]||"").localeCompare(String(b[this.sortKey]||""));
    return this.asc?n:-n;
   });
   if(this.take!==null)found=found.slice(0,this.take);
   return {data:found,error:null};
  }
  then(ok,err){return Promise.resolve(this.calculate()).then(ok,err)}
  single(){const v=this.calculate();return Promise.resolve(v.data.length===1?
    {data:v.data[0],error:null}:{data:null,error:{message:"not found",code:"PGRST116"}})}
  maybeSingle(){const v=this.calculate();return Promise.resolve({data:v.data[0]||null,error:null})}
 }
 const client={auth:{getUser:async()=>({data:{user:{id:OWNER}},error:null})},
  from:name=>new Query(name)};
 const context={
  Response,Request,Headers,URL,crypto:webcrypto,
  console:{log(){},error(){},warn(){}},
  Deno:{env:{get:key=>({
   SUPABASE_URL:"https://mock.supabase.co",
   SUPABASE_PUBLISHABLE_KEYS:JSON.stringify({default:"sb_publishable_mock"})
  }[key]||"")},serve(fn){state.handler=fn}},
  createClient:()=>client,
  fetch:async u=>{
   state.networkCalls.push(String(u));
   if(String(u).includes("/functions/v1/safety-gate"))return Response.json({allowed:true});
   throw Error("Unexpected request to "+u);
  },
  setTimeout,clearTimeout
 };
 vm.runInNewContext(compiled.outputText,context,{filename:"pilot-intelligence.js",timeout:5000});
 assert.equal(typeof state.handler,"function");
 state.invoke=async()=>{const request=new Request("https://mock.supabase.co/functions/v1/pilot-intelligence",{
  method:"POST",headers:{Authorization:"Bearer fake", "content-type":"application/json"},
  body:JSON.stringify({input:intent.objective,intent,existing_goal_id:GOAL})
 });const result=await state.handler(request);return {http:result.status,body:await result.json()}};
 return state;
}
const withPredecessor=scenario([earlier]);
const older=await withPredecessor.invoke();
assert.equal(older.http,200);
assert.equal(older.body.stage,"ready");
assert.equal(older.body.continuity.mode,"existing_goal");
assert.equal(older.body.continuity.queued_after_action_id,FIRST);
assert.equal(older.body.actions[0].status,"pending");
assert.equal(older.body.next_action.id,FIRST);
assert.equal(withPredecessor.data.pilot_states[0].avatar_variant,"garden_landscaping");
assert.equal(withPredecessor.data.pilot_states[0].attention_required,true);
assert.equal(withPredecessor.data.pilot_states[0].risk_level,"moderate");
assert.equal(withPredecessor.data.goal_memories.filter(x=>x.memory_type==="followup").length,1);
assert.equal(withPredecessor.networkCalls.length,1,"Only safety gate should run for explicit existing selection");
console.log("PASS Existing goal inherits context, queues behind open work, preserves avatar/review and avoids repeated clarification");

const noPredecessor=scenario();
const available=await noPredecessor.invoke();
assert.equal(available.http,200);
assert.equal(available.body.actions[0].status,"ready");
assert.equal(available.body.next_action.id,available.body.actions[0].id);
assert.equal(available.body.continuity.queued_after_action_id,null);
console.log("PASS Empty queue makes follow-up immediately READY");

const outsider=scenario([],"99999999-9999-4999-8999-999999999999");
const denied=await outsider.invoke();
assert.equal(denied.http,404);
assert.equal(denied.body.error,"existing_goal_not_found");
assert.equal(outsider.data.actions.length,0);
console.log("PASS Ownership enforced for chosen existing goals");
console.log("PASS Goal continuity handler regression suite — no real user data or writes");
