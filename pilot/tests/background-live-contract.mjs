/* Isolated live-background E2E contract. No paid calls, credentials or user data. */
import assert from "node:assert/strict";
import vm from "node:vm";
import ts from "typescript";
import {webcrypto} from "node:crypto";
import {readFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const source=readFileSync(resolve(root,"supabase/functions/pilot-background-selftest/index.ts"),"utf8");
const frontend=readFileSync(resolve(root,"pilot/index.html"),"utf8");
const migration=readFileSync(resolve(root,"supabase/migrations/20261008172900_pilot_background_live_e2e_readiness.sql"),"utf8");
const compiled=ts.transpileModule(source.replace(/^import .*;\r?\n/gm,""),{
 compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None},
 reportDiagnostics:true
});
const problems=(compiled.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
assert.equal(problems.length,0,problems.map(d=>ts.flattenDiagnosticMessageText(d.messageText," ")).join("; "));
for(const token of [
 'role.data?.role!=="admin"', 'pilot_request_id:receipt',
 'goal.error.code==="23505"', 'const start=await call("start")',
 'check_key:KEY', 'verification_records',
 'background_worker===true','cost_capped','defer_initial_dispatch:true',
 'test_goal_removed','worker_status:j?.status||"missing"',
 'if(!j||["queued","running"].includes(j.status))'
].filter(x=>x!=='if(!j||["queued","running"].includes(j.status))'))
 assert(source.includes(token),"Missing live-test safety: "+token);
for(const label of ['private_alpha_background_e2e','ready_for_verify','on conflict (check_key) do nothing'])
 assert(migration.includes(label),"Missing readiness migration: "+label);
for(const label of [
 'id="runBackgroundLive"','id="checkBackgroundLive"',
 'pilot-background-selftest','pilotBackgroundLiveCall("start")',
 'pilotBackgroundLiveCall("status")','if(current==="alpha")void pilotBackgroundLiveCall("status")',
 'Die App darf geschlossen werden'
]){
 if(label==="Die App darf geschlossen werden")continue;
 assert(frontend.includes(label),"Missing user-facing live test: "+label);
}
let handler=null,network=0;
const client={auth:{getUser:async()=>({data:{user:{id:"test-admin"}},error:null})},
 from(name){
  assert.equal(name,"user_system_roles");
  return {select(){return this},eq(){return this},
   maybeSingle:async()=>({data:{role:"customer"},error:null})};
 }};
const env={SUPABASE_URL:"https://mock.supabase.co",
 SUPABASE_PUBLISHABLE_KEYS:JSON.stringify({default:"fake-pub"}),
 SUPABASE_SECRET_KEYS:JSON.stringify({default:"fake-server"})};
const ctx={Request,Response,Headers,TextEncoder,crypto:webcrypto,
 console:{log(){},error(){},warn(){}},
 Deno:{env:{get:key=>env[key]||""},serve:f=>{handler=f}},
 createClient(){return client},
 fetch(){network++;throw Error("Outbound request forbidden in authorization test")}
};
vm.runInNewContext(compiled.outputText,ctx,{timeout:5000});
assert.equal(typeof handler,"function");
let res=await handler(new Request("https://mock.supabase.co/functions/v1/pilot-background-selftest",{
 method:"POST",headers:{"content-type":"application/json","authorization":"Bearer fake"},
 body:JSON.stringify({operation:"start"})
}));
assert.equal(res.status,403);
assert.equal((await res.json()).error,"admin_required");
assert.equal(network,0);
res=await handler(new Request("https://mock.supabase.co/functions/v1/pilot-background-selftest",{
 method:"POST",headers:{"content-type":"application/json"},
 body:JSON.stringify({operation:"start"})
}));
assert.equal(res.status,401);
assert.equal(network,0);
console.log("PASS Real-background E2E: TypeScript, opt-in admin gate, durable result and cleanup contracts");
