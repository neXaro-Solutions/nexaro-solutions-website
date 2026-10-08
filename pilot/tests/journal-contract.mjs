/* Isolated decision-journal contract: never reaches production credentials or user data. */
import assert from "node:assert/strict";
import vm from "node:vm";
import {webcrypto} from "node:crypto";
import {readFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import ts from "typescript";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const source=readFileSync(resolve(root,"supabase/functions/pilot-decision-journal/index.ts"),"utf8");
const code=source.replace(/^import "jsr:[^"]+";\r?\n/m,"").replace(/^import \{createClient\} from "npm:[^"]+";\r?\n/m,"");
const built=ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None},
 reportDiagnostics:true,fileName:"pilot-decision-journal.ts"});
const errors=(built.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
assert.equal(errors.length,0,errors.map(e=>ts.flattenDiagnosticMessageText(e.messageText," ")).join(";"));
const USER="11111111-1111-4111-8111-111111111111",ORGANIZATION="22222222-2222-4222-8222-222222222222";
const GOAL="33333333-3333-4333-8333-333333333333";
const OTHER="44444444-4444-4444-8444-444444444444";
const goals=[{id:GOAL,owner_id:USER,organization_id:ORGANIZATION,title:"Gartenbaubetrieb"},
 {id:OTHER,owner_id:"88888888-8888-4888-8888-888888888888",organization_id:ORGANIZATION,title:"Fremdes Projekt"}];
let seq=0,handler,raceOnNextInsert=false;const history=[];
class Query{
 constructor(table){this.table=table;this.pred=[];this.mode="read";this.payload=null;this.sortField=null;this.up=true;this.maximum=null}
 select(){return this}
 eq(k,v){this.pred.push(r=>r[k]===v);return this}
 order(k,{ascending=true}={}){this.sortField=k;this.up=ascending;return this}
 limit(n){this.maximum=n;return this}
 insert(payload){this.mode="insert";this.payload=payload;return this}
 execute(){
  const rows=this.table==="goals"?goals:history;
  if(this.mode==="insert"){
   if(this.table==="pilot_decision_journal"){
    if(raceOnNextInsert){
      raceOnNextInsert=false;
      history.push({id:++seq,goal_id:this.payload.goal_id,
        decision_key:this.payload.decision_key,decision_value:"Concurrent edit",
        event_type:"set",source_type:"direct_user",
        created_at:"2026-10-08T14:00:00.000Z"});
    }
    const prev=history.filter(x=>x.goal_id===this.payload.goal_id&&
      x.decision_key===this.payload.decision_key).at(-1);
    if((prev?.id??null)!==(this.payload.expected_revision_id??null))
      return {data:null,error:{code:"P0001",message:"decision_revision_conflict"}};
   }
   const record={id:++seq,created_at:"2026-10-08T14:00:00.000Z",...this.payload};
   rows.push(record);return {data:[record],error:null};
  }
  let selected=rows.filter(r=>this.pred.every(p=>p(r)));
  if(this.sortField)selected=selected.sort((a,b)=>{
   const cmp=this.sortField==="id"?Number(a.id)-Number(b.id):
    String(a[this.sortField]).localeCompare(String(b[this.sortField]));
   return this.up?cmp:-cmp;
  });
  if(this.maximum!==null)selected=selected.slice(0,this.maximum);
  return {data:selected,error:null};
 }
 then(a,b){return Promise.resolve(this.execute()).then(a,b)}
 single(){const result=this.execute();return Promise.resolve(
  result.error?result:result.data.length?{data:result.data[0],error:null}:{data:null,error:{code:"PGRST116"}}
 )}
}
const sb={auth:{getUser:async()=>({data:{user:{id:USER}},error:null})},
 from:name=>new Query(name)};
const context={Response,Request,Headers,URL,crypto:webcrypto,
 console:{error(){},warn(){}},
 createClient:()=>sb,
 Deno:{env:{get:key=>({
  SUPABASE_URL:"https://mock.supabase.co",
  SUPABASE_PUBLISHABLE_KEYS:JSON.stringify({default:"sb_publishable_test"})
 }[key]||"")},serve(fn){handler=fn}}};
vm.runInNewContext(built.outputText,context,{timeout:4000,filename:"journal.js"});
assert.equal(typeof handler,"function");
async function send(body,authorization="Bearer mocked"){
 const request=new Request("https://mock.supabase.co/functions/v1/pilot-decision-journal",{
  method:"POST",headers:{"content-type":"application/json",authorization},body:JSON.stringify(body)
 });
 const response=await handler(request);return {http:response.status,data:await response.json()};
}
let result=await send({goal_id:GOAL,operation:"list"});
assert.equal(result.http,200);assert.equal(result.data.active.length,0);
console.log("PASS Journal initially empty");
result=await send({goal_id:OTHER,operation:"set",decision_key:"company_name",decision_value:"Fremde Firma"});
assert.equal(result.http,404);assert.equal(history.length,0);
console.log("PASS Cross-user project cannot be modified");
result=await send({goal_id:GOAL,operation:"set",decision_key:"company_name",decision_value:"neXaro Solutions"});
assert.equal(result.http,200);assert.equal(result.data.status,"saved");assert.equal(history.length,1);
console.log("PASS Explicit confirmed company name stored");
const first=history[0].id;
result=await send({goal_id:GOAL,operation:"set",decision_key:"company_name",decision_value:"neXaro Solutions"});
assert.equal(result.data.status,"unchanged");assert.equal(history.length,1);
result=await send({goal_id:GOAL,operation:"set",decision_key:"company_name",decision_value:"Neue Firma"});
assert.equal(result.http,409);assert.equal(result.data.reason_code,"CONFIRM_CHANGE_REQUIRED");assert.equal(history.length,1);
console.log("PASS Duplicate suppression and confirmation gate");
result=await send({goal_id:GOAL,operation:"set",decision_key:"company_name",
 decision_value:"Neue Firma",expected_revision_id:first});
assert.equal(result.http,200);assert.equal(history.length,2);
result=await send({goal_id:GOAL,operation:"revoke",decision_key:"company_name",expected_revision_id:first});
assert.equal(result.http,409);assert.equal(history.length,2);
console.log("PASS Explicit revision confirmation and stale-write rejection");
result=await send({goal_id:GOAL,operation:"revoke",decision_key:"company_name",expected_revision_id:history[1].id});
assert.equal(result.http,200);assert.equal(history.length,3);
result=await send({goal_id:GOAL,operation:"list",include_history:true});
assert.equal(result.http,200);assert.equal(result.data.active.length,0);assert.equal(result.data.history.length,3);
console.log("PASS Revocation keeps append-only history and removes current choice");
result=await send({goal_id:GOAL,operation:"set",decision_key:"legal_form",decision_value:"Einzelunternehmen oder GmbH"});
assert.equal(result.http,400);assert.equal(history.length,3);
console.log("PASS Contradictory legal forms are not stored as decisions");
result=await send({goal_id:GOAL,operation:"set",decision_key:"company_name",decision_value:"Restarted Brand"});
assert.equal(result.http,409);assert.equal(result.data.reason_code,"CONFIRM_CHANGE_REQUIRED");
result=await send({goal_id:GOAL,operation:"set",decision_key:"company_name",
  decision_value:"Restarted Brand",expected_revision_id:history[2].id});
assert.equal(result.http,200);assert.equal(history.length,4);
console.log("PASS Reopening a revoked decision requires acknowledgement of the last revision");
raceOnNextInsert=true;
result=await send({goal_id:GOAL,operation:"set",decision_key:"budget",decision_value:"5.000 EUR"});
assert.equal(result.http,409);assert.equal(result.data.reason_code,"REVISION_CHANGED");
assert.equal(history.filter(x=>x.decision_key==="budget").length,1);
console.log("PASS Simultaneous edits cannot bypass the database revision guard");

console.log("PASS Journal tests: 9 scenarios, no production data touched.");
