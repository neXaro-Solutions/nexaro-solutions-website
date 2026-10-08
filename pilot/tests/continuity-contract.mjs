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
const frontend=readFileSync(resolve(root,"pilot/index.html"),"utf8");
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
function scenario(existingActions=[],goalOwner=OWNER,otherGoals=[],confirmed=[]){
 const data={
  goals:[{...goal,owner_id:goalOwner},...otherGoals],
  organization_members:[{organization_id:ORG,user_id:OWNER,active:true}],
  actions:existingActions.map(x=>({...x})),
  plans:[{id:PLAN,goal_id:GOAL,version:1}],
  context_items:[],results:[],documents:[],milestones:[],
  pilot_decision_journal:confirmed.map(x=>({...x,goal_id:x.goal_id||GOAL,owner_id:OWNER})),
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
 state.invoke=async(overrides={})=>{const request=new Request("https://mock.supabase.co/functions/v1/pilot-intelligence",{
  method:"POST",headers:{Authorization:"Bearer fake", "content-type":"application/json"},
  body:JSON.stringify({input:intent.objective,intent,existing_goal_id:GOAL,...overrides})
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

const automatic=scenario();
const auto=await automatic.invoke({
  input:"Erstelle mir ein Logo",existing_goal_id:undefined
});
assert.equal(auto.http,200);
assert.equal(auto.body.stage,"ready");
assert.equal(auto.body.continuity.mode,"existing_goal");
assert.equal(auto.body.continuity.reason,"unique_active_followup");
assert.equal(automatic.data.goals.length,1,"Must never create a second project");
assert.equal(automatic.data.actions.length,1,"Only the new follow-up action is added");
assert.equal(automatic.networkCalls.length,1,"Unique project needs no extra AI matching request");
console.log("PASS Unique live project auto-matches a logo follow-up without prompting or AI lookups");

const OTHER="77777777-7777-4777-8777-777777777777";
const competing={...goal,id:OTHER,title:"Bäckereibetrieb gründen",
 description:"Backwaren und Konditorei",desired_outcome:"Geschäft für Gebäck",
 updated_at:"2026-10-07T15:00:00.000Z"};
const multiple=scenario([],OWNER,[competing]);
const ambiguous=await multiple.invoke({input:"Erstelle mir ein Logo",existing_goal_id:undefined});
assert.equal(ambiguous.http,200);
assert.equal(ambiguous.body.stage,"goal_resolution");
assert.equal(ambiguous.body.candidate_goals.length,2);
assert.deepEqual(new Set(ambiguous.body.candidate_goals.map(x=>x.id)),new Set([GOAL,OTHER]));
assert.equal(multiple.data.actions.length,0,"Ambiguous input should never create a new action");
assert.equal(multiple.networkCalls.length,1,"No unnecessary AI run for an ambiguous short follow-up");
console.log("PASS Two plausible projects produce one named choice without guessing or creating work");

const explicit=scenario([],OWNER,[competing]);
const named=await explicit.invoke({input:"Bitte ein Logo für Gartenbaubetrieb",existing_goal_id:undefined});
assert.equal(named.http,200);
assert.equal(named.body.stage,"ready");
assert.equal(named.body.goal.id,GOAL);
assert.equal(named.body.continuity.reason,"explicit_project_name");
assert.equal(explicit.data.goals.length,2);
assert.equal(explicit.data.actions.length,1);
console.log("PASS Explicit business name uniquely selects the correct project among multiple goals");

const first=String(frontend.match(/async function askGoalResolution\(resolution\)\{[\s\S]*?(?=\nasync function createGoal\(\))/)?.[0]||"");
assert(first.startsWith("async function askGoalResolution"),"Could not isolate the project-selection UI");
const captured=[];
const chooser=new Function("nxDialog",first+"\nreturn askGoalResolution;")(
  async settings=>{captured.push(settings);return settings.buttons[1].value}
);
const choice=await chooser({candidate_goals:ambiguous.body.candidate_goals});
assert.equal(choice,"goal:"+ambiguous.body.candidate_goals[1].id);
assert.equal(captured[0].buttons.length,3,"Two named projects and one new-project choice");
assert(captured[0].buttons.some(x=>x.label.includes("Bäckereibetrieb")));
assert(captured[0].buttons.some(x=>x.value==="new"));
console.log("PASS Choice dialog presents named projects and preserves the chosen goal ID");


const legalEntry={id:17,decision_key:"legal_form",decision_value:"einzelunternehmen",
  event_type:"set",source_type:"direct_user",created_at:"2026-10-08T12:00:00Z"};
const legalScenario=scenario([],OWNER,[],[legalEntry]);
const legalConflict=await legalScenario.invoke({input:"Ändere die Rechtsform auf GmbH"});
assert.equal(legalConflict.http,200);
assert.equal(legalConflict.body.stage,"decision_conflict");
assert.equal(legalConflict.body.goal.id,GOAL);
assert.equal(legalConflict.body.decision.key,"legal_form");
assert.equal(legalConflict.body.decision.old_value,"einzelunternehmen");
assert.equal(legalConflict.body.decision.new_value,"gmbh");
assert.equal(legalConflict.body.decision.revision_id,17);
assert.equal(legalScenario.data.actions.length,0,"No work may be queued on contradiction");
assert.equal(legalScenario.data.pilot_decision_journal.length,1,"AI cannot overwrite confirmed choices");
console.log("PASS Explicit legal-form change intercepted before new work");

const routine=scenario([],OWNER,[],[legalEntry]);
const unchanged=await routine.invoke({input:"Erstelle mir ein Logo"});
assert.equal(unchanged.http,200);
assert.equal(unchanged.body.stage,"ready");
assert.equal(unchanged.body.decision_journal.reused,1);
assert.deepEqual(Array.from(unchanged.body.decision_journal.keys),["legal_form"]);
assert.equal(routine.data.pilot_decision_journal.length,1);
console.log("PASS Routine follow-up silently reuses a confirmed decision");

// A historical, human-confirmed review imported into the journal is authoritative.
// The user must not repeat a legal-form question when requesting a later logo.
const importedChoice={...legalEntry,id:23,decision_value:"gmbh",
  source_type:"user_confirmed_review",
  source_ref:"legacy_memory:33333333-3333-4333-8333-333333333333"};
const afterMigration=scenario([],OWNER,[],[importedChoice]);
const logoAfterMigration=await afterMigration.invoke({
  input:"Erstelle ein Logo für mein bestehendes Unternehmen",
  existing_goal_id:undefined
});
assert.equal(logoAfterMigration.http,200);
assert.equal(logoAfterMigration.body.stage,"ready");
assert.equal(logoAfterMigration.body.continuity.mode,"existing_goal");
assert.equal(logoAfterMigration.body.decision_journal.reused,1);
assert.equal(afterMigration.data.goals.length,1);
assert.equal(afterMigration.data.actions.length,1);
assert.equal(afterMigration.data.pilot_decision_journal.length,1,
  "A follow-up must never create a duplicate legal-form decision");
console.log("PASS Imported confirmed legal choice survives next-day follow-up without questions");

const revisingImported=scenario([],OWNER,[],[importedChoice]);
const importedConflict=await revisingImported.invoke({
  input:"Ändere die Rechtsform auf Einzelunternehmen"
});
assert.equal(importedConflict.body.stage,"decision_conflict");
assert.equal(importedConflict.body.decision.old_value,"gmbh");
assert.equal(importedConflict.body.decision.revision_id,23);
assert.equal(revisingImported.data.actions.length,0);
console.log("PASS A migrated choice cannot be silently overwritten by a later request");

const migrationSQL=readFileSync(resolve(root,
  "supabase/migrations/20261008160729_backfill_confirmed_legacy_legal_choices.sql"),"utf8");
for(const safetyGuard of [
  "m.source_type='user_decision'",
  "m.content->>'confirmed_by_user'='true'",
  "m.content->>'edited_by_user'='true'",
  "m.content->>'verification_scope'='explicit_choice_only'",
  "HAVING count(DISTINCT chosen_form)=1",
  "WHERE NOT EXISTS (",
  "AND j.decision_key='legal_form'",
  "'user_confirmed_review'",
  "expected_revision_id"
])assert(migrationSQL.includes(safetyGuard),"Migration safeguard missing: "+safetyGuard);
assert(frontend.includes('const reusedDecisions=Number(data.decision_journal?.reused||0);'),
  "UI must read the returned verified-decision count");
assert(frontend.includes('pilotNotice("Pilot übernimmt "+reusedDecisions'),
  "Users must see that an earlier confirmed choice is being reused");
console.log("PASS Verified-only migration, revocation protection and human-readable UI notice");

// Explicitly choosing "Auftrag fortsetzen" should prevent duplicate goal questions.
// Merely having a recent active goal is insufficient; user intent must be explicit.
const pinnedScopeSource=String(frontend.match(/function pilotContinuationScope\(input\)\{[\s\S]*?\n\}/)?.[0]||"");
assert(pinnedScopeSource.startsWith("function pilotContinuationScope"));
const scoped=new Function("goals","pilotPinnedGoalId",pinnedScopeSource+"\nreturn pilotContinuationScope;")(
  [{id:GOAL,status:"active"}],GOAL);
assert.equal(scoped("Erstelle mir ein Logo"),GOAL);
assert.equal(scoped("Arbeite an der Website weiter"),GOAL);
assert.equal(scoped("Ich möchte eine neue Firma gründen"),null);
assert.equal(scoped("Bitte ein anderes Projekt starten"),null);
const unscoped=new Function("goals","pilotPinnedGoalId",pinnedScopeSource+"\nreturn pilotContinuationScope;")(
  [{id:GOAL,status:"active"}],null);
assert.equal(unscoped("Erstelle mir ein Logo"),null,
  "The most recently active project must never be silently pinned");
assert(frontend.includes("pilotPinnedGoalId=activeGoalId"),
  "Explicit project open must retain project context");
assert(frontend.includes('id="pilotNewProject"'),
  "A visible one-tap new-project escape must always be available");
assert(frontend.includes('body:{input:text,...(pinnedGoalId?{existing_goal_id:pinnedGoalId}:{})}'),
  "Pinned project must be passed to the backend before unnecessary goal resolution");
assert(frontend.includes("user=session.user;pilotPinnedGoalId=null;"),
  "A new authenticated session must clear any previous explicit project pin");
assert(frontend.includes("async function leave(){pilotPinnedGoalId=null;"),
  "Logging out must clear project context");
console.log("PASS Explicit goal continuation is one tap, visible, and session-safe");

// The 'Neues Projekt' control must force a genuinely fresh project even when
// a single active goal would otherwise be automatically matched by the backend.
assert(frontend.includes("pilotPinnedGoalId=null;pilotForceNewGoal=true;render()"),
  "New-project button must explicitly switch to new-goal mode");
assert(frontend.includes("let pilotForceNewGoal=false;"));
assert(frontend.includes("body:{input:text,...(forceNewGoal?{force_new_goal:true}:"),
  "New-goal intention must reach the backend on the first request");
assert(frontend.includes("pilotForceNewGoal=false;\n    PS.textContent=continued?"),
  "After a successful command the new-goal scope must reset");
assert(frontend.includes('id="pilotCancelNewProject"'),
  "User must be able to return to the previously opened project");
assert(frontend.includes('user=session.user;pilotPinnedGoalId=null;pilotForceNewGoal=false;'));
assert(frontend.includes('async function leave(){pilotPinnedGoalId=null;pilotForceNewGoal=false;'));
console.log("PASS New-project control actually bypasses goal matching and can be undone");

const alternatives=scenario([],OWNER,[],[legalEntry]);
const comparison=await alternatives.invoke({input:"Bitte Rechtsform GmbH oder Einzelunternehmen vergleichen"});
assert.equal(comparison.http,200);
assert.equal(comparison.body.stage,"ready");
console.log("PASS Legal-form alternatives are not treated as confirmed changes");

const same=scenario([],OWNER,[],[legalEntry]);
const sameValue=await same.invoke({input:"Rechtsform Einzelunternehmen beibehalten"});
assert.equal(sameValue.http,200);
assert.equal(sameValue.body.stage,"ready");
console.log("PASS Existing decision restated without extra confirmation");

const revoked=scenario([],OWNER,[],[{...legalEntry,event_type:"revoke",decision_value:""}]);
const revived=await revoked.invoke({input:"Ändere die Rechtsform auf GmbH"});
assert.equal(revived.http,200);
assert.equal(revived.body.stage,"ready");
assert.equal(revived.body.decision_journal.reused,0);
console.log("PASS Revoked decisions are neither reused nor considered conflicting");

for(const [key,stored,command,expected] of [
 ["company_name","Altes Unternehmen","Ändere den Firmennamen auf Neue Firma","Neue Firma"],
 ["budget","5000 EUR","Ändere das Budget auf 8000 EUR","8000 EUR"],
 ["industry","Gartenbau","Ändere die Branche auf Gastronomie","Gastronomie"],
 ["brand_style","Neongrün","Ändere das Farbschema auf Neonorange","Neonorange"]
]){
 const c=scenario([],OWNER,[],[{id:18,decision_key:key,decision_value:stored,
   event_type:"set",created_at:"2026-10-08T12:00:00Z"}]);
 const r=await c.invoke({input:command});
 assert.equal(r.http,200,key);
 assert.equal(r.body.stage,"decision_conflict",key);
 assert.equal(r.body.decision.new_value,expected,key);
 assert.equal(c.data.actions.length,0,key);
}
console.log("PASS Company name, budget, industry and design conflicts require confirmation");

assert(frontend.includes('while(data.stage==="decision_conflict"'),"Missing UI decision prompt");
assert(frontend.includes('expected_revision_id:d.revision_id'),"Missing revision safety in UI");
assert(frontend.includes('choice==="keep"'),"Missing retain existing choice");
console.log("PASS UI provides confirmation, retention and optimistic version check");

const implicitRename=scenario([],OWNER,[],[{
 id:27,decision_key:"company_name",decision_value:"Alte Firma",
 event_type:"set",created_at:"2026-10-08T12:00:00Z"
}]);
const renaming=await implicitRename.invoke({
 input:"Ändere den Firmennamen auf Neue Firma",existing_goal_id:undefined
});
assert.equal(renaming.http,200);
assert.equal(renaming.body.stage,"decision_conflict");
assert.equal(renaming.body.goal.id,GOAL);
assert.equal(renaming.body.decision.key,"company_name");
assert.equal(implicitRename.data.goals.length,1);
assert.equal(implicitRename.data.actions.length,0);
console.log("PASS A new company name remains attached to the original project without manual selection");

const trueNew=scenario();
const startingNew=await trueNew.invoke({
 input:"Ich möchte eine neue Firma gründen",existing_goal_id:undefined
});
assert.equal(startingNew.http,200);
assert.equal(startingNew.body.stage,"clarification");
assert.equal(trueNew.data.actions.length,0);
console.log("PASS A genuinely new company request starts fresh qualification");


console.log("PASS Goal continuity handler regression suite — no real user data or writes");
