/* Isolated checks for the opt-in admin-only live E2E mission.
   No credentials, production data writes or paid model calls. */
import assert from "node:assert/strict";
import vm from "node:vm";
import {webcrypto} from "node:crypto";
import {readFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import ts from "typescript";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const code=readFileSync(resolve(root,"supabase/functions/alpha-e2e-selftest/index.ts"),"utf8");
const ui=readFileSync(resolve(root,"pilot/index.html"),"utf8");
const js=ts.transpileModule(code.replace(/^import .*;?\r?\n/gm,""),{
 compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None},
 reportDiagnostics:true
});
const errors=(js.diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error);
assert.equal(errors.length,0,errors.map(x=>ts.flattenDiagnosticMessageText(x.messageText," ")).join("\n"));
for(const s of [
 'admin.from("user_system_roles").select("role")',
 'role.data?.role!=="admin"',
 'decision_key:"brand_style"',
 'next.data?.goal?.id===goalId',
 'retry.data?.recovered===true',
 'conflict.data?.stage==="decision_conflict"',
 '(actionList.data||[]).length===2',
 'const clean=!deleted.error&&!!deleted.data&&!remaining.error&&!remaining.data',
 'if(clean)goalId=null',
 'checks.every(c=>c.passed)',
 'check_key:"private_alpha_continuity_e2e"',
 'continuityChecks.length===7&&continuityChecks.every(x=>x.passed)',
 'if(passed&&continuityPassed&&!continuityRecord.error)'
])assert(code.includes(s),"Missing live E2E guard: "+s);
assert(ui.includes("Live-Auftragskette prüfen"));
assert(ui.includes("pilotE2ELastReportHTML"),
 "The live test result must remain visible after the admin view reloads");
console.log("PASS Admin live E2E contract: TypeScript, continuity, decisions, retry and teardown");

let handler=null,networkCalls=0;
const admin={from(name){
 assert.equal(name,"user_system_roles");
 return {select(){return this},eq(){return this},maybeSingle:async()=>({data:{role:"customer"},error:null})};
}};
const userClient={auth:{getUser:async()=>({data:{user:{id:"test-user"}},error:null})}};
const context={Response,Request,Headers,crypto:webcrypto,Date,
 console:{log(){},error(){},warn(){}},
 Deno:{env:{get(key){return {
  SUPABASE_URL:"https://mock.supabase.co",
  SUPABASE_PUBLISHABLE_KEYS:JSON.stringify({default:"pub"}),
  SUPABASE_SECRET_KEYS:JSON.stringify({default:"secret"})
 }[key]||""}},serve(fn){handler=fn}},
 createClient(_url,key){return key==="secret"?admin:userClient},
 fetch(){networkCalls++;throw Error("Unexpected outgoing request")}
};
vm.runInNewContext(js.outputText,context,{timeout:5000});
assert.equal(typeof handler,"function");
const res=await handler(new Request("https://mock.supabase.co/functions/v1/alpha-e2e-selftest",{
 method:"POST",headers:{Authorization:"Bearer simulated"}
}));
assert.equal(res.status,403);
assert.equal((await res.json()).error,"admin_required");
assert.equal(networkCalls,0,"Non-admin must not trigger AI calls");
console.log("PASS Authenticated non-admin cannot create test projects or run paid E2E");
