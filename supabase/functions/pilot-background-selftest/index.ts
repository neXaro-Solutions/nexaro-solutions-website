import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "npm:@supabase/supabase-js@2.57.4";
const H={"content-type":"application/json","cache-control":"no-store"};
const KEY="private_alpha_background_e2e";
const answer=(x:any,status=200)=>Response.json(x,{headers:H,status});
const uuid=async(id:string)=>{
 const b=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode("pilot-bg-e2e-v1:"+id)));
 b[6]=(b[6]&15)|0x50;b[8]=(b[8]&63)|0x80;
 const s=Array.from(b.slice(0,16),v=>v.toString(16).padStart(2,"0")).join("");
 return s.slice(0,8)+"-"+s.slice(8,12)+"-"+s.slice(12,16)+"-"+s.slice(16,20)+"-"+s.slice(20);
};
async function check(s:any,id:string,owner:string,createdAt:string){
 const job=await s.from("pilot_background_jobs").select("*").eq("goal_id",id).maybeSingle();
 if(job.error)return answer({error:"job_lookup_unavailable"},503);
 const j=job.data;
 const overdue=Date.now()-new Date(createdAt).getTime()>20*60*1000;
 const leased=j?.status==="running"&&j.lease_until&&new Date(j.lease_until).getTime()>Date.now();
 if((!j||["queued","running"].includes(j.status))&&(!overdue||leased))
  return answer({status:"running",stage:j?.stage||"starting",steps:j?.steps_completed||0});
 const [actions,results,execs,miles]=await Promise.all([
  s.from("actions").select("id,status").eq("goal_id",id),
  s.from("results").select("id,goal_id,execution_id,status,quality_status,structured_content").eq("goal_id",id),
  s.from("executions").select("id,status").eq("goal_id",id),
  s.from("milestones").select("status").eq("goal_id",id)
 ]);
 const result=results.data?.find((r:any)=>r.id===j.last_result_id);
 const verify=result?await s.from("verification_records").select("status,verification_type")
  .eq("result_id",result.id):{data:[],error:null};
 const tests=[
  ["background_completed",j.status==="completed"&&j.steps_completed===1],
  ["action_completed",!actions.error&&actions.data?.length===1&&actions.data[0].status==="completed"],
  ["result_persisted",!results.error&&!!result&&result.goal_id===id&&result.status==="final"&&result.quality_status==="ready"],
  ["genuine_text_worker",result?.structured_content?.background_worker===true],
  ["execution_linked",!execs.error&&execs.data?.length===1&&execs.data[0].status==="completed"&&execs.data[0].id===result?.execution_id],
  ["verified",!verify.error&&verify.data?.some((v:any)=>v.status==="passed"&&v.verification_type==="creative_text")===true],
  ["milestone_completed",!miles.error&&miles.data?.length===1&&miles.data[0].status==="completed"],
  ["cost_capped",Number(j.cost_spent_usd)>=0&&Number(j.cost_spent_usd)<=Number(j.max_cost_usd)]
 ].map(([check,passed])=>({check,passed:passed===true}));
 const removed=await s.from("goals").delete().eq("id",id).eq("owner_id",owner).select("id").maybeSingle();
 const remaining=await s.from("goals").select("id").eq("id",id).maybeSingle();
 tests.push({check:"test_goal_removed",passed:!removed.error&&!!removed.data&&!remaining.error&&!remaining.data});
 const passed=tests.every(x=>x.passed);
 const evidence={owner_id:owner,verified_at:new Date().toISOString(),
  worker_status:j.status,last_error:String(j.last_error||"").slice(0,120),checks:tests};
 const rec=await s.from("alpha_readiness_checks").upsert({
  check_key:KEY,category:"execution",required:true,status:passed?"passed":"failed",
  description:"Realtest: browserunabhängiger Hintergrundauftrag mit gespeichertem Ergebnis und Verifikation",
  evidence,updated_at:new Date().toISOString()
 },{onConflict:"check_key"});
 if(rec.error)return answer({status:"unavailable",error:"readiness_not_saved",checks:tests},503);
 return answer({status:passed?"passed":"failed",checks:tests,
  error:passed?undefined:j.last_error||"verification_failed"},passed?200:422);
}
const handler=async(req:Request)=>{
 if(req.method!=="POST")return answer({error:"method_not_allowed"},405);
 const bearer=req.headers.get("authorization")||"";
 if(!bearer.startsWith("Bearer "))return answer({error:"auth_required"},401);
 let body:any;try{body=await req.json()}catch{return answer({error:"invalid_json"},400)}
 if(!["start","status"].includes(body.operation))return answer({error:"operation_invalid"},400);
 const base=Deno.env.get("SUPABASE_URL")||"";
 const pub=JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")||"{}").default;
 const sec=JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}").default;
 if(!base||!pub||!sec)return answer({error:"configuration_unavailable"},503);
 const s=createClient(base,sec,{auth:{persistSession:false,autoRefreshToken:false}});
 const identity=await s.auth.getUser(bearer.slice(7));
 if(identity.error||!identity.data.user)return answer({error:"invalid_session"},401);
 const owner=identity.data.user.id;
 const role=await s.from("user_system_roles").select("role").eq("user_id",owner).maybeSingle();
 if(role.error)return answer({error:"role_check_failed"},503);
 if(role.data?.role!=="admin")return answer({error:"admin_required"},403);
 const receipt=await uuid(owner);
 const old=await s.from("goals").select("id,created_at").eq("pilot_request_id",receipt)
  .eq("owner_id",owner).maybeSingle();
 if(old.error)return answer({error:"existing_test_unavailable"},503);
 if(old.data)return check(s,old.data.id,owner,old.data.created_at);
 if(body.operation==="status")return answer({status:"not_running"});
 const member=await s.from("organization_members").select("organization_id")
  .eq("user_id",owner).eq("active",true).limit(1).single();
 if(member.error)return answer({error:"workspace_not_found"},409);
 const goal=await s.from("goals").insert({
  organization_id:member.data.organization_id,owner_id:owner,
  pilot_request_id:receipt,title:"[E2E] Pilot Hintergrundprüfung",
  description:"Isolierter realer Hintergrundtest mit fiktiven kreativen Texten",
  desired_outcome:"Ein vollständig geprüfter Textentwurf für eine fiktive Marke",
  domain:{primary:"marketing",secondary:[],confidence:"high"},
  status:"active",readiness:"ready"
 }).select("id").single();
 if(goal.error){
  if(goal.error.code==="23505")return answer({status:"running",message:"Ein anderer Tab hat denselben Test angenommen."},202);
  return answer({error:"test_goal_create_failed"},503);
 }
 const gid=goal.data.id;
 try{
  const p=await s.from("plans").insert({goal_id:gid,version:1,status:"active",
   strategy:"Ein sicherer interner Textentwurf"}).select("id").single();
  if(p.error)throw Error("plan_setup_failed");
  const m=await s.from("milestones").insert({goal_id:gid,plan_id:p.data.id,phase_key:"e2e_bg",
   title:"Textentwurf erstellt",desired_state:"Verifizierter interner Textentwurf",
   success_condition:"Ergebnis fachlich eingeordnet und technisch verifiziert",
   status:"active",weight:1}).select("id").single();
  if(m.error)throw Error("milestone_setup_failed");
  const a=await s.from("actions").insert({goal_id:gid,plan_id:p.data.id,milestone_id:m.data.id,
   title:"Erstelle ein Social-Media-Konzept",
   objective:"Erstelle drei präzise kreative Themenideen und verständliche Textentwürfe für eine fiktive Gartenmarke. Nur interne redaktionelle Inhalte.",
   status:"ready",priority:"normal",owner_type:"pilot",
   recommended_mode:"do_it",blocking:false}).select("id").single();
  if(a.error)throw Error("action_setup_failed");
  const call=async(op:string)=>{
   const res=await fetch(base+"/functions/v1/pilot-background",{
    method:"POST",headers:{authorization:bearer,apikey:pub,"content-type":"application/json"},
    body:JSON.stringify({operation:op,goal_id:gid,
      ...(op==="start"?{defer_initial_dispatch:true}:{})}),signal:AbortSignal.timeout(18000)
   });
   return {ok:res.ok,data:await res.json().catch(()=>({}))};
  };
  const pre=await call("preflight");
  if(!pre.ok||pre.data.mode!=="background")throw Error("background_preflight_rejected");
  const start=await call("start");
  if(!start.ok||!["queued","running"].includes(start.data.status))throw Error("background_start_unconfirmed");
  const rec=await s.from("alpha_readiness_checks").upsert({
   check_key:KEY,category:"execution",required:true,status:"ready_for_verify",
   description:"Realtest: browserunabhängiger Hintergrundauftrag mit gespeichertem Ergebnis und Verifikation",
   evidence:{owner_id:owner,started_at:new Date().toISOString(),stage:"queued"},
   updated_at:new Date().toISOString()
  },{onConflict:"check_key"});
  if(rec.error)return answer({status:"running",stage:"queued",warning:"readiness_pending"},202);
  return answer({status:"running",stage:"queued",message:"Serverauftrag angenommen. Die App darf geschlossen werden."},202);
 }catch(e){
  const accepted=await s.from("pilot_background_jobs").select("status").eq("goal_id",gid).maybeSingle();
  if(accepted.data&&["queued","running"].includes(accepted.data.status))
   return answer({status:"running",stage:accepted.data.status},202);
  await s.from("goals").delete().eq("id",gid).eq("owner_id",owner);
  const message=String((e as Error).message||e).slice(0,90);
  await s.from("alpha_readiness_checks").upsert({
   check_key:KEY,category:"execution",required:true,status:"failed",
   description:"Realtest: browserunabhängiger Hintergrundauftrag mit gespeichertem Ergebnis und Verifikation",
   evidence:{owner_id:owner,failed_at:new Date().toISOString(),error:message},
   updated_at:new Date().toISOString()
  },{onConflict:"check_key"});
  return answer({status:"failed",error:message},503);
 }
};
const C={"access-control-allow-origin":"*","access-control-allow-methods":"POST,OPTIONS",
 "access-control-allow-headers":"authorization,apikey,content-type,x-client-info"};
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:C});
 const r=await handler(req),h=new Headers(r.headers);
 for(const [k,v] of Object.entries(C))h.set(k,v);
 return new Response(r.body,{status:r.status,headers:h});
});
