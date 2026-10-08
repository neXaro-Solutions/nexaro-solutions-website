
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const H={"content-type":"application/json","cache-control":"no-store"};

async function invoke(base:string,pub:string,auth:string,fn:string,body:any){
  const r=await fetch(base+"/functions/v1/"+fn,{method:"POST",headers:{"content-type":"application/json","apikey":pub,"authorization":auth},body:JSON.stringify(body)});
  const j=await r.json().catch(()=>({}));
  return {ok:r.ok,status:r.status,data:j};
}

const pilotCorsHandler=async(req:Request)=>{
  if(req.method!=="POST") return Response.json({error:"method_not_allowed"},{status:405,headers:H});
  const auth=req.headers.get("Authorization")||"";
  if(!auth.startsWith("Bearer ")) return Response.json({error:"auth_required"},{status:401,headers:H});

  const base=Deno.env.get("SUPABASE_URL")!;
  const pubs=JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")||"{}");
  const pub=pubs.default;
  const sec=JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}").default;
  const sb=createClient(base,pub,{global:{headers:{Authorization:auth}},auth:{persistSession:false,autoRefreshToken:false}});
  const admin=createClient(base,sec,{auth:{persistSession:false,autoRefreshToken:false}});
  const ud=await sb.auth.getUser(auth.slice(7));
  if(ud.error||!ud.data.user) return Response.json({error:"invalid_session"},{status:401,headers:H});
  const user=ud.data.user;
  // Run real, billable model calls only on an authenticated admin's request.
  const role=await admin.from("user_system_roles").select("role")
    .eq("user_id",user.id).maybeSingle();
  if(role.error)return Response.json({error:"admin_role_check_unavailable"},{status:503,headers:H});
  if(role.data?.role!=="admin")return Response.json({error:"admin_required"},{status:403,headers:H});

  const mem=await sb.from("organization_members").select("organization_id").eq("user_id",user.id).eq("active",true).limit(1).single();
  if(mem.error) return Response.json({error:"workspace_not_found"},{status:409,headers:H});
  const orgId=mem.data.organization_id;

  const startedAt=new Date();
  const runId=crypto.randomUUID();
  let goalId:string|null=null;
  const checks:any[]=[];
  let execution:any=null;

  try{
    const g=await admin.from("goals").insert({
      organization_id:orgId,owner_id:user.id,
      title:"[E2E] Pilot Alpha Systemtest",
      description:"Isolierter automatischer Test der produktiven Execution Runtime",
      desired_outcome:"Erzeuge ein kurzes, verwendbares internes Briefing mit drei konkreten nächsten Schritten.",
      domain:{primary:"business",secondary:[],confidence:"high"},
      status:"active",readiness:"ready"
    }).select("*").single();
    if(g.error) throw new Error("goal_create:"+g.error.message);
    goalId=g.data.id; checks.push({check:"test_goal_created",passed:true});

    const p=await admin.from("plans").insert({
      goal_id:goalId,version:1,status:"active",
      strategy:"E2E-Systemtest: sichere interne Arbeit vollständig durch Pilot ausführen."
    }).select("*").single();
    if(p.error) throw new Error("plan_create:"+p.error.message);
    checks.push({check:"test_plan_created",passed:true});

    const m=await admin.from("milestones").insert({
      goal_id:goalId,plan_id:p.data.id,phase_key:"e2e",title:"Systemtest abschließen",
      desired_state:"Execution, Result und Verification sind abgeschlossen",
      success_condition:"Execution status completed",status:"pending",weight:1
    }).select("*").single();
    if(m.error) throw new Error("milestone_create:"+m.error.message);

    const a=await admin.from("actions").insert({
      goal_id:goalId,plan_id:p.data.id,milestone_id:m.data.id,
      title:"Erstelle ein internes Pilot-Systemtest-Briefing",
      objective:"Erstelle ein kurzes internes Briefing mit einer klaren Zusammenfassung und genau drei konkreten nächsten Schritten. Keine externe Aktion ausführen.",
      status:"ready",priority:"normal",owner_type:"pilot",recommended_mode:"pilot",blocking:false,estimated_effort:"2 min"
    }).select("*").single();
    if(a.error) throw new Error("action_create:"+a.error.message);
    checks.push({check:"test_action_created",passed:true});

    const ex=await invoke(base,pub,auth,"execution-engine",{operation:"start",action_id:a.data.id});
    execution=ex.data;
    checks.push({check:"execution_http_success",passed:ex.ok,status:ex.status});
    checks.push({check:"execution_completed",passed:ex.data?.status==="completed",actual:ex.data?.status||null});
    checks.push({check:"result_created",passed:!!ex.data?.result?.id});
    checks.push({check:"verification_created",passed:!!ex.data?.verification?.id});
    checks.push({check:"verification_passed",passed:ex.data?.verification?.status==="passed",actual:ex.data?.verification?.status||null});
    checks.push({check:"progress_returned",passed:!!ex.data?.progress});

    if(ex.data?.execution_id){
      const steps=await admin.from("execution_steps").select("step_key,status,capability_key").eq("execution_id",ex.data.execution_id).order("step_order");
      const stepRows=steps.data||[];
      checks.push({check:"all_steps_terminal",passed:stepRows.length>0&&stepRows.every((s:any)=>["completed","waiting_review"].includes(s.status)),steps:stepRows});
      const er=await admin.from("executions").select("status,actual_cost,output_reference").eq("id",ex.data.execution_id).single();
      checks.push({check:"execution_persisted_completed",passed:er.data?.status==="completed",actual:er.data?.status||null,cost:er.data?.actual_cost||0});
    }


    // End-to-end continuity: a confirmed decision must follow the same goal.
    const journal=await invoke(base,pub,auth,"pilot-decision-journal",{
      operation:"set",goal_id:goalId,decision_key:"brand_style",
      decision_value:"Orange und Dunkelgrün"
    });
    checks.push({check:"user_choice_saved",passed:journal.ok&&
      ["saved","unchanged"].includes(String(journal.data?.status||""))});
    const requestId=crypto.randomUUID();
    const requestText="Erstelle ein freundliches Logo-Konzept für diesen bestehenden Testauftrag";
    const requestIntent={
      objective:requestText,desiredOutcome:requestText,
      constraints:[],budget:null,timeframe:null,unknowns:[],
      confidence:"high",domain:{primary:"marketing",secondary:[],confidence:"high"}
    };
    const followupRequest={input:requestText,intent:requestIntent,
      existing_goal_id:goalId,request_id:requestId};
    const next=await invoke(base,pub,auth,"pilot-intelligence",followupRequest);
    const followupId=next.data?.actions?.[0]?.id||null;
    checks.push({check:"existing_goal_continued",
      passed:next.ok&&next.data?.stage==="ready"&&next.data?.goal?.id===goalId&&!!followupId});
    checks.push({check:"confirmed_choice_inherited",
      passed:next.data?.decision_journal?.keys?.includes("brand_style")===true});
    const retry=await invoke(base,pub,auth,"pilot-intelligence",followupRequest);
    checks.push({check:"network_retry_returns_original_action",
      passed:retry.ok&&retry.data?.recovered===true&&retry.data?.actions?.[0]?.id===followupId});
    const conflict=await invoke(base,pub,auth,"pilot-intelligence",{
      input:"Ändere das Farbschema auf Tiefblau",intent:requestIntent,
      existing_goal_id:goalId,request_id:crypto.randomUUID()
    });
    checks.push({check:"conflicting_decision_requires_confirmation",
      passed:conflict.ok&&conflict.data?.stage==="decision_conflict"&&
        conflict.data?.decision?.key==="brand_style"});
    const actionList=await admin.from("actions").select("id,pilot_request_id").eq("goal_id",goalId);
    checks.push({check:"no_duplicate_or_conflicting_actions",
      passed:!actionList.error&&(actionList.data||[]).length===2&&
        (actionList.data||[]).filter((a:any)=>a.pilot_request_id===requestId).length===1});

    // A pass requires verified cleanup, not merely an optimistic DELETE.
    const deleted=await admin.from("goals").delete().eq("id",goalId).select("id").maybeSingle();
    const remaining=await admin.from("goals").select("id").eq("id",goalId).maybeSingle();
    const clean=!deleted.error&&!!deleted.data&&!remaining.error&&!remaining.data;
    checks.push({check:"isolated_test_goal_removed",passed:clean});
    if(clean)goalId=null;

    const passed=checks.every(c=>c.passed);
    await admin.from("alpha_readiness_checks").upsert({
      check_key:"private_alpha_e2e",
      category:"execution",
      description:"Isolierter Live-Test für Execution, Verifikation, Projektkontinuität, Wiederholungsschutz und Entscheidungsschutz",
      required:true,
      status:passed?"passed":"failed",
      evidence:{
        run_id:runId,completed_at:new Date().toISOString(),
        execution_status:execution?.status||null,
        verification_status:execution?.verification?.status||null,
        checks:checks.map(c=>({check:c.check,passed:c.passed,actual:c.actual??undefined,status:c.status??undefined}))
      },
      updated_at:new Date().toISOString()
    },{onConflict:"check_key"});

    // An earlier execution-only E2E pass must not certify the newly added
    // continuity and duplicate-submission guarantees before a new live run.
    const continuityKeys=new Set([
      "user_choice_saved","existing_goal_continued","confirmed_choice_inherited",
      "network_retry_returns_original_action","conflicting_decision_requires_confirmation",
      "no_duplicate_or_conflicting_actions","isolated_test_goal_removed"
    ]);
    const continuityChecks=checks.filter(x=>continuityKeys.has(x.check));
    const continuityPassed=continuityChecks.length===7&&continuityChecks.every(x=>x.passed);
    const continuityRecord=await admin.from("alpha_readiness_checks").upsert({
      check_key:"private_alpha_continuity_e2e",category:"execution",
      description:"Live-E2E: bestätigte Entscheidungen, Projektfortsetzung, Retry, Konflikt und sauberes Aufräumen",
      required:true,status:continuityPassed?"passed":"failed",
      evidence:{run_id:runId,verified_at:new Date().toISOString(),
        checks:continuityChecks.map(x=>({check:x.check,passed:x.passed}))},
      updated_at:new Date().toISOString()
    },{onConflict:"check_key"});
    if(continuityRecord.error)checks.push({check:"continuity_evidence_persisted",passed:false});

    if(passed&&continuityPassed&&!continuityRecord.error){
      await admin.from("alpha_readiness_checks").update({
        status:"passed",
        evidence:{
          function:"execution-engine",ui_button:"Pilot jetzt starten",timeline:true,approval_controls:true,
          verification_records:true,live_e2e_verified:true,continuation_and_retry_verified:true,
          e2e_run_id:runId,verified_at:new Date().toISOString()
        },
        updated_at:new Date().toISOString()
      }).eq("check_key","execution_runtime");
    }

    return Response.json({
      status:passed?"passed":"failed",run_id:runId,duration_ms:Date.now()-startedAt.getTime(),
      checks,execution_status:execution?.status||null,
      verification_status:execution?.verification?.status||null
    },{status:passed?200:422,headers:H});
  }catch(e){
    const msg=String((e as any)?.message||e);
    checks.push({check:"selftest_exception",passed:false,error:msg});
    await admin.from("alpha_readiness_checks").upsert({
      check_key:"private_alpha_e2e",category:"execution",
      description:"Isolierter Live-Test für Execution, Verifikation, Projektkontinuität, Wiederholungsschutz und Entscheidungsschutz",
      required:true,status:"failed",
      evidence:{run_id:runId,failed_at:new Date().toISOString(),error:msg,checks},
      updated_at:new Date().toISOString()
    },{onConflict:"check_key"});
    await admin.from("alpha_readiness_checks").upsert({
      check_key:"private_alpha_continuity_e2e",category:"execution",
      description:"Live-E2E: bestätigte Entscheidungen, Projektfortsetzung, Retry, Konflikt und sauberes Aufräumen",
      required:true,status:"failed",
      evidence:{run_id:runId,failed_at:new Date().toISOString(),error:msg},
      updated_at:new Date().toISOString()
    },{onConflict:"check_key"});
    return Response.json({status:"failed",run_id:runId,error:msg,checks},{status:500,headers:H});
  }finally{
    if(goalId){
      try{
        const removal=await admin.from("goals").delete().eq("id",goalId);
        if(removal.error)console.error("E2E_CLEANUP_FAILED",removal.error.code);
      }catch{console.error("E2E_CLEANUP_FAILED")}
    }
  }
};
const PILOT_CORS_HEADERS={"access-control-allow-origin":"*","access-control-allow-methods":"GET, POST, OPTIONS","access-control-allow-headers":"authorization, x-client-info, apikey, content-type, x-supabase-api-version","access-control-max-age":"86400"};

Deno.serve(async (req:Request)=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:PILOT_CORS_HEADERS});
  const response=await pilotCorsHandler(req);
  const responseHeaders=new Headers(response.headers);
  for(const [name,value] of Object.entries(PILOT_CORS_HEADERS))responseHeaders.set(name,value);
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers:responseHeaders});
});
