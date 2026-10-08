import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "npm:@supabase/supabase-js@2.57.4";
const CORS={"access-control-allow-origin":"*","access-control-allow-methods":"POST, OPTIONS",
 "access-control-allow-headers":"authorization, x-client-info, apikey, content-type, x-supabase-api-version"};
const KEYS=["legal_form","company_name","industry","budget","brand_style"] as const;
const LABELS:Record<string,string>={legal_form:"Rechtsform",company_name:"Unternehmensname",
 industry:"Branche",budget:"Budget",brand_style:"Gestaltungsstil"};
const FORM:Record<string,string>={einzelunternehmen:"Einzelunternehmen",ug:"UG (haftungsbeschränkt)",gmbh:"GmbH"};
const validGoal=(v:any)=>typeof v==="string"&&/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v);
function normalize(key:string,value:any){
 const text=String(value??"").normalize("NFKC").replace(/\s+/g," ").trim();
 if(!text||text.length>500)return null;
 if(key==="legal_form"){
   const raw=text.toLowerCase();
   if(raw in FORM)return raw;
   if(raw==="einzelunternehmer"||raw==="einzelfirma")return "einzelunternehmen";
   if(raw==="ug (haftungsbeschränkt)"||raw==="unternehmergesellschaft")return "ug";
   return null;
 }
 if(key==="company_name"&&text.length>140)return null;
 if(key==="industry"&&text.length>200)return null;
 if(key==="budget"&&text.length>240)return null;
 return text;
}
const reply=(data:any,status=200)=>Response.json(data,{status,headers:{...CORS,"cache-control":"no-store"}});
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:CORS});
 if(req.method!=="POST")return reply({error:"method_not_allowed"},405);
 const auth=req.headers.get("authorization")||"";
 if(!auth.startsWith("Bearer "))return reply({error:"auth_required"},401);
 let input:any;
 try{input=await req.json()}catch{return reply({error:"invalid_json"},400)}
 const goalId=String(input?.goal_id||"");
 if(!validGoal(goalId))return reply({error:"goal_id_invalid"},400);
 const base=Deno.env.get("SUPABASE_URL")||"";
 const pub=JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")||"{}").default;
 if(!pub||!base)return reply({error:"service_unavailable"},503);
 const sb=createClient(base,pub,{global:{headers:{Authorization:auth}},
   auth:{persistSession:false,autoRefreshToken:false}});
 const {data:identity,error:authError}=await sb.auth.getUser(auth.slice(7));
 if(authError||!identity?.user)return reply({error:"invalid_session"},401);
 const owner=identity.user.id;
 const {data:goal,error:goalError}=await sb.from("goals")
  .select("id,organization_id,owner_id,title").eq("id",goalId).eq("owner_id",owner).single();
 if(goalError||!goal)return reply({error:"goal_not_found"},404);
 const op=String(input?.operation||"list");
 const table="pilot_decision_journal";
 const {data:rows,error:historyError}=await sb.from(table)
   .select("id,goal_id,decision_key,decision_value,event_type,source_type,source_ref,created_at")
   .eq("goal_id",goalId).order("id",{ascending:false}).limit(250);
 if(historyError)return reply({error:"decision_history_unavailable",retryable:true},503);
 const history=rows||[];
 const latest=new Map<string,any>();
 for(const record of history)if(!latest.has(record.decision_key))latest.set(record.decision_key,record);
 const active=[...latest.values()].filter(x=>x.event_type==="set")
   .map(x=>({...x,label:LABELS[x.decision_key]||x.decision_key,
     display_value:x.decision_key==="legal_form"?FORM[x.decision_value]||x.decision_value:x.decision_value}));
 if(op==="list"){
   return reply({goal_id:goalId,goal_title:goal.title,active,
     history:input?.include_history===true?history:undefined,
     supported_keys:KEYS.map(key=>({key,label:LABELS[key]}))});
 }
 if(op!=="set"&&op!=="revoke")return reply({error:"unsupported_operation"},400);
 const key=String(input?.decision_key||"");
 if(!KEYS.includes(key as any))return reply({error:"decision_key_invalid"},400);
 const before=latest.get(key)||null;
 const value=op==="revoke"?"":normalize(key,input?.decision_value);
 if(op==="set"&&!value)return reply({error:"decision_value_invalid"},400);
 if(op==="revoke"&&(!before||before.event_type==="revoke"))
   return reply({status:"unchanged",goal_id:goalId,decision_key:key});
 if(before?.event_type==="set"&&op==="set"&&before.decision_value===value)
   return reply({status:"unchanged",goal_id:goalId,decision:before});
 // Compare-and-set: never overwrite a confirmed choice without the user's
 // explicitly submitted current revision.
 if(before&&((op==="revoke")||(op==="set"&&before.event_type==="set"&&before.decision_value!==value))){
   const expected=Number(input?.expected_revision_id);
   if(!Number.isSafeInteger(expected)||expected!==Number(before.id))
     return reply({error:"decision_conflict",reason_code:"CONFIRM_CHANGE_REQUIRED",
       current:{id:before.id,decision_key:key,decision_value:before.decision_value,
         label:LABELS[key],created_at:before.created_at}},409);
 }
 const payload={
   goal_id:goalId,organization_id:goal.organization_id,owner_id:owner,
   decision_key:key,decision_value:String(value||""),
   event_type:op==="revoke"?"revoke":"set",source_type:"direct_user" as const,
   source_ref:crypto.randomUUID()
 };
 const save=await sb.from(table).insert(payload).select("id,goal_id,decision_key,decision_value,event_type,source_type,created_at").single();
 if(save.error)return reply({error:"decision_store_failed",retryable:true},503);
 return reply({status:"saved",goal_id:goalId,decision:{...save.data,
   label:LABELS[key],display_value:key==="legal_form"?FORM[String(value)]||value:value}});
});
