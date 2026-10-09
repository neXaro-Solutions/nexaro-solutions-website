
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

import {pilotProviderCatalog, pilotCompatibleExecute} from "../_shared/pilot-providers.ts";

const headers={"content-type":"application/json","cache-control":"no-store"};
const OPENAI_URL="https://api.openai.com/v1/responses";
const ANTHROPIC_URL="https://api.anthropic.com/v1/messages";
const EXTERNAL_MODEL=Deno.env.get("PILOT_OPENAI_MODEL")||"gpt-6-sol";
const INTERACTIVE_OPENAI_MODEL=Deno.env.get("PILOT_INTERACTIVE_OPENAI_MODEL")||"gpt-4.1-mini";
const CLAUDE_MODEL=Deno.env.get("ANTHROPIC_EXECUTION_MODEL")||"claude-sonnet-4-6";
const CLAUDE_INTERACTIVE_MODEL=Deno.env.get("PILOT_INTERACTIVE_CLAUDE_MODEL")||"claude-haiku-5-5";
const MAX_OUTPUT_TOKENS=1200;
const MAX_INPUT_CHARS=24000;
const INPUT_USD_PER_M=1.0;
const OUTPUT_USD_PER_M=5.0;
const CLAUDE_INPUT_USD_PER_M=2.0;
const CLAUDE_OUTPUT_USD_PER_M=10.0;

function classify(taskType:string,input:any){
  const t=String(taskType||"").toLowerCase();
  const text=JSON.stringify(input||{}).toLowerCase();
  const complex=/strategy|complex|reason|multi|tradeoff|risk|legal|medical|replan|analysis/.test(t+" "+text);
  const simple=/classify|extract|route/.test(t);
  return {complex,simple};
}
function selectRoute(taskType:string,quality:string,sensitivity:string,input:any){
  const c=classify(taskType,input);
  if(quality==="high"||c.complex){
    if(sensitivity==="sensitive") return {route_key:"local_standard",provider:"local",model_name:"heuristic-standard",fallback_used:true,reason:"sensitive_data_restricts_external_route"};
    return {route_key:"external_reasoning",provider:"openai",model_name:EXTERNAL_MODEL,fallback_used:false,reason:"complex_or_high_quality"};
  }
  if(c.simple||quality==="fast") return {route_key:"local_fast",provider:"local",model_name:"heuristic-fast",fallback_used:false,reason:"simple_low_cost_task"};
  return {route_key:"local_standard",provider:"local",model_name:"heuristic-standard",fallback_used:false,reason:"default_standard_route"};
}
function localExecute(taskType:string,input:any,attempt:number){
  const t=String(taskType||"").toLowerCase();
  const text=typeof input==="string"?input:String(input?.text||input?.input||input?.content||JSON.stringify(input||{}));
  if(t==="classify"||t==="intent"){
    return {objective:text.slice(0,500),domain:/medical|patient|befund/i.test(text)?"medical_documentation":/marketing|campaign|seo/i.test(text)?"marketing":/business|customer|kunde|unternehmen/i.test(text)?"business":"general",confidence:text.length>40?"high":"medium"};
  }
  if(t==="plan"||t==="complex_plan"){
    return {strategy:"Outcome-first, rolling planning",phases:["Ziel schärfen","Grundlage validieren","Umsetzen","Messen und anpassen"],next_action:"Größte aktuelle Unsicherheit zuerst reduzieren"};
  }
  if(t==="summarize"){
    const s=text.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0,5);
    return {summary:s,claims:s.slice(0,3).map((x:string)=>({text:x,evidence_required:true}))};
  }
  if(t==="validate") return {status:"ready",issues:[]};
  return {content:text.slice(0,2000),status:"ready",attempt};
}
function validate(output:any,required:string[]){
  const issues:string[]=[];
  if(!output||typeof output!=="object"||Array.isArray(output))issues.push("output_not_object");
  for(const f of required||[]) if(output==null||output[f]===undefined||output[f]===null||output[f]==="") issues.push("missing_"+f);
  if(required.includes("deliverable")&&required.includes("verification")){
    for(const [field,min] of [["deliverable",90],["verification",22],["next_recommendation",14]] as const){
      if(required.includes(field)&&(typeof output?.[field]!=="string"||output[field].trim().length<min))
        issues.push("incomplete_"+field);
    }
  }
  return {valid:issues.length===0,issues};
}
function schemaHint(taskType:string,required:string[]){
  const t=taskType.toLowerCase();
  const known=t==="image_analysis"
    ? {summary:"string",observations:["string"],text_visible:["string"],relevance:"string",uncertainty:["string"]}
    : t==="classify"||t==="intent"
    ? {objective:"string",domain:"string",confidence:"high|medium|low"}
    : t==="plan"||t==="complex_plan"
      ? {strategy:"string",phases:["string"],next_action:"string"}
      : t==="summarize"
        ? {summary:["string"],claims:[{text:"string",evidence_required:true}]}
        : t==="validate"
          ? {status:"ready|needs_work|failed",issues:["string"]}
          : t==="execution_artifact"
          ? {
            deliverable:"A complete, immediately usable German work product (at least 90 characters), with real source markers [S1] when evidence is supplied.",
            verification:"At least one sentence explaining what was checked and which limits remain.",
            next_recommendation:"One concrete actionable next step in German."
          }
          : Object.fromEntries(required.map(x=>[x,"value"]));
  return known;
}
function responseText(data:any){
  if(typeof data?.output_text==="string"&&data.output_text.trim()) return data.output_text.trim();
  for(const item of data?.output||[]){
    for(const part of item?.content||[]){
      if(part?.type==="output_text"&&typeof part?.text==="string") return part.text.trim();
    }
  }
  return "";
}
function parseJsonLoose(text:string){
  const clean=text.trim().replace(/^\`\`\`(?:json)?\s*/i,"").replace(/\s*\`\`\`$/,"");
  try{return JSON.parse(clean)}catch{}
  const a=clean.indexOf("{"),b=clean.lastIndexOf("}");
  if(a>=0&&b>a) return JSON.parse(clean.slice(a,b+1));
  throw new Error("MODEL_OUTPUT_NOT_JSON");
}
async function externalExecute(apiKey:string,taskType:string,input:any,requiredFields:string[],interactive=false){
  const compact=JSON.stringify(input??{}).slice(0,interactive?8000:MAX_INPUT_CHARS);
  const expected=schemaHint(taskType,requiredFields);
  const isImageAnalysis=taskType.toLowerCase()==="image_analysis"&&typeof input?.image_url==="string";
  const instructions=[
    "You are the reasoning engine inside neXaro Pilot.",
    "Return ONLY one valid JSON object. No markdown, no commentary.",
    "Be concise, operational, and outcome-oriented.",
    "Do not invent facts. Preserve uncertainty explicitly.",
    "The JSON must satisfy this shape: "+JSON.stringify(expected),
    requiredFields.length?"Required top-level keys: "+requiredFields.join(", "):""
  ].filter(Boolean).join("\n");
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),interactive?32000:25000);
  try{
    const res=await fetch(OPENAI_URL,{
      method:"POST",
      headers:{"content-type":"application/json","authorization":"Bearer "+apiKey},
      body:JSON.stringify({
        model:interactive?INTERACTIVE_OPENAI_MODEL:EXTERNAL_MODEL,
        instructions,
        input:[{role:"user",content:isImageAnalysis?[
          {type:"input_text",text:"Analyze this image for the user's task. Describe only what is visibly supported. User task/context: "+String(input?.task||input?.text||"").slice(0,4000)},
          {type:"input_image",image_url:input.image_url}
        ]:[{type:"input_text",text:"JSON output required. "+compact}]}],
        ...(interactive?{}:{reasoning:{effort:"medium"}}),
        ...(isImageAnalysis?{}:{text:{format:{type:"json_object"}}}),
        max_output_tokens:interactive?1700:MAX_OUTPUT_TOKENS,
        store:false
      }),
      signal:controller.signal
    });
    const data=await res.json();
    if(!res.ok) throw new Error("OPENAI_"+res.status+":"+(data?.error?.message||"request_failed"));
    const text=responseText(data);
    if(!text) throw new Error("OPENAI_EMPTY_OUTPUT");
    const output=parseJsonLoose(text);
    const usage=data?.usage||{};
    const inputTokens=Number(usage.input_tokens||0);
    const outputTokens=Number(usage.output_tokens||0);
    const cost=(inputTokens/1_000_000)*INPUT_USD_PER_M+(outputTokens/1_000_000)*OUTPUT_USD_PER_M;
    return {output,usage:{input_tokens:inputTokens,output_tokens:outputTokens,total_tokens:Number(usage.total_tokens||inputTokens+outputTokens)},cost,response_id:data?.id||null};
  } finally { clearTimeout(timer); }
}

async function anthropicExecute(apiKey:string,taskType:string,input:any,requiredFields:string[],interactive=false){
  const compact=JSON.stringify(input??{}).slice(0,interactive?8000:MAX_INPUT_CHARS);
  const expected=schemaHint(taskType,requiredFields);
  const system=[
    "You are the reasoning engine inside neXaro Pilot.",
    "Return ONLY one valid JSON object. No markdown, no commentary.",
    "Be concise, operational, and outcome-oriented.",
    "Do not invent facts. Preserve uncertainty explicitly.",
    "The JSON must satisfy this shape: "+JSON.stringify(expected),
    requiredFields.length?"Required top-level keys: "+requiredFields.join(", "):""
  ].filter(Boolean).join("\n");
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),interactive?32000:25000);
  try{
    const requestHeaders={
      "content-type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01",
      ...((Deno.env.get("ANTHROPIC_WORKSPACE_ID")||"").trim().match(/^wrkspc_[A-Za-z0-9_-]+$/)?
        {"anthropic-workspace-id":(Deno.env.get("ANTHROPIC_WORKSPACE_ID")||"").trim()}:{})
    };
    const requestPayload:any={
      model:interactive?CLAUDE_INTERACTIVE_MODEL:CLAUDE_MODEL,
      max_tokens:interactive?2300:MAX_OUTPUT_TOKENS,
      ...(interactive?{output_config:{effort:"low"}}:{}),
      system,messages:[{role:"user",content:compact}]
    };
    let res=await fetch(ANTHROPIC_URL,{
      method:"POST",headers:requestHeaders,body:JSON.stringify(requestPayload),
      signal:controller.signal
    });
    // If the newly released fast model isn't enabled for this workspace, transparently
    // retry the long-established Haiku 4.5. Do NOT mask auth/billing/quota failures.
    if(interactive&&requestPayload.model==="claude-haiku-5-5"&&(res.status===400||res.status===404)){
      const errBody=await res.clone().json().catch(()=>null);
      const detail=String(errBody?.error?.message||"").toLowerCase();
      if(/model|access|not found|output_config|effort|unsupported/.test(detail)){
        requestPayload.model="claude-haiku-4-5-20251001";
        delete requestPayload.output_config;
        res=await fetch(ANTHROPIC_URL,{
          method:"POST",headers:requestHeaders,body:JSON.stringify(requestPayload),
          signal:controller.signal
        });
      }
    }
    const data=await res.json();
    if(!res.ok) throw new Error("ANTHROPIC_"+res.status+":"+(data?.error?.message||"request_failed"));
    const text=(data?.content||[]).filter((x:any)=>x?.type==="text").map((x:any)=>x.text).join("\n").trim();
    if(!text) throw new Error("ANTHROPIC_EMPTY_OUTPUT");
    const output=parseJsonLoose(text);
    const usage=data?.usage||{};
    const inputTokens=Number(usage.input_tokens||0);
    const outputTokens=Number(usage.output_tokens||0);
    const isHaiku55=interactive&&requestPayload.model==="claude-haiku-5-5";
    const isHaiku45=interactive&&requestPayload.model==="claude-haiku-4-5-20251001";
    const inputRate=isHaiku55?0.1:isHaiku45?1:CLAUDE_INPUT_USD_PER_M;
    const outputRate=isHaiku55?0.5:isHaiku45?5:CLAUDE_OUTPUT_USD_PER_M;
    const cost=(inputTokens/1_000_000)*inputRate+(outputTokens/1_000_000)*outputRate;
    return {output,usage:{input_tokens:inputTokens,output_tokens:outputTokens,total_tokens:inputTokens+outputTokens},cost,response_id:data?.id||null,model:requestPayload.model};
  } finally { clearTimeout(timer); }
}

const pilotCorsHandler=async(req:Request)=>{
  if(req.method!=="POST") return Response.json({error:"method_not_allowed"},{status:405,headers});
  const auth=req.headers.get("Authorization")||"";
  if(!auth.startsWith("Bearer ")) return Response.json({error:"auth_required"},{status:401,headers});
  const pubs=JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")||"{}");
  const sb=createClient(Deno.env.get("SUPABASE_URL")!,pubs.default,{global:{headers:{Authorization:auth}},auth:{persistSession:false,autoRefreshToken:false}});
  const ud=await sb.auth.getUser(auth.slice(7));
  if(ud.error||!ud.data.user) return Response.json({error:"invalid_session"},{status:401,headers});
  const user=ud.data.user;
  let body:any={};try{body=await req.json()}catch{return Response.json({error:"invalid_json"},{status:400,headers})}
  const taskType=String(body.task_type||"").trim();
  if(!taskType) return Response.json({error:"task_type_required"},{status:400,headers});
  const input=body.input??{};
  // Fail closed before moderation or inference can transmit sensitive content.
  if(body.sensitivity==="sensitive")return Response.json({error:"sensitive_execution_unavailable",reason_code:"LOCAL_MODEL_REQUIRED"},{status:422,headers});
  const strictProvider=body.provider_strict===true;
  const catalog=pilotProviderCatalog(name=>Deno.env.get(name));
  const safetyBase=Deno.env.get("SUPABASE_URL")!;
  const safetyPub=JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")||"{}").default;
  async function checkSafety(phase:string,content:any,image_url?:string|null){
    const safeInput=JSON.stringify(content??{});
    const r=await fetch(safetyBase+"/functions/v1/safety-gate",{
      method:"POST",headers:{"content-type":"application/json","apikey":safetyPub,"authorization":auth},
      body:JSON.stringify({phase,text:safeInput,image_url:image_url||null})
    }).catch(()=>null);
    const j=await r?.json().catch(()=>({allowed:false,reason_code:"safety_check_unavailable"}));
    return {allowed:!!r?.ok&&j?.allowed===true,denied:r?.status===403,diagnostic_code:j?.diagnostic_code||null,reason_code:j?.reason_code||"safety_check_unavailable"};
  }
  // Do not submit base64 image payloads as text; the image is moderated through its image_url.
  const safeContent=typeof input==="object"&&input!==null?
    {...input,image_url:input.image_url?"[image_attached]":undefined}:input;
  const safety=await checkSafety("input",{task_type:taskType,input:safeContent},typeof input?.image_url==="string"?input.image_url:null);
  if(!safety.allowed)return Response.json({error:safety.denied?"request_blocked_by_policy":"safety_check_unavailable",reason_code:safety.reason_code,diagnostic_code:safety.diagnostic_code||null},
    {status:safety.denied?403:503,headers});
  const quality=String(body.quality_level||"standard");
  const interactive=body.latency_profile==="interactive"&&String(body.task_type||"")==="execution_artifact";
  const sensitivity=String(body.sensitivity||"standard");
  const goalId=body.goal_id?String(body.goal_id):null;
  const requiredFields=Array.isArray(body.required_fields)?body.required_fields.map(String):[];
  const org=await sb.from("organization_members").select("organization_id").eq("user_id",user.id).eq("active",true).limit(1).single();
  if(org.error) return Response.json({error:"workspace_not_found"},{status:409,headers});

  let route=selectRoute(taskType,quality,sensitivity,input);
  if(taskType.toLowerCase()==="image_analysis"){
    route={route_key:"external_vision",provider:"openai",model_name:EXTERNAL_MODEL,fallback_used:false,reason:"image_analysis_requires_vision"};
  }
  const providerKey=Deno.env.get("AI_PROVIDER_API_KEY")||Deno.env.get("OPENAI_API_KEY");
  const anthropicKey=Deno.env.get("ANTHROPIC_API_KEY");
  const preferred=String(body.provider_preference||"").toLowerCase();
  const selected=catalog.find(p=>p.id===preferred);
  if(strictProvider&&(!selected?.ready||taskType.toLowerCase()==="image_analysis"&&preferred!=="openai"))
    return Response.json({error:"provider_not_available",reason_code:"PROVIDER_NOT_CONFIGURED_OR_UNSUPPORTED"},{status:503,headers});
  if(selected?.ready&&!selected.existing&&taskType.toLowerCase()!=="image_analysis")
    route={route_key:"jarvis_"+preferred,provider:preferred,model_name:selected.model!,fallback_used:false,reason:"jarvis_specialist_route"};
  if(taskType.toLowerCase()!=="image_analysis"&&route.provider==="openai"&&preferred==="anthropic"&&anthropicKey){
    route={route_key:"claude_reasoning",provider:"anthropic",model_name:CLAUDE_MODEL,fallback_used:false,reason:"explicit_provider_preference"};
  } else if(taskType.toLowerCase()!=="image_analysis"&&route.provider==="openai"&&!providerKey&&anthropicKey){
    route={route_key:"claude_reasoning",provider:"anthropic",model_name:CLAUDE_MODEL,fallback_used:true,reason:"openai_not_configured_anthropic_available"};
  }
  if(interactive&&route.provider==="openai")route={
    ...route,model_name:INTERACTIVE_OPENAI_MODEL,route_key:"interactive_json",
    reason:"interactive_schema_compatible_model"
  };
  if(interactive&&route.provider==="anthropic")route={
    ...route,model_name:CLAUDE_INTERACTIVE_MODEL,route_key:"interactive_haiku",
    reason:"low_latency_verified_execution"
  };
  if(route.provider!=="local"&&!catalog.find(p=>p.id===route.provider)?.ready)
    return Response.json({error:"provider_not_available",reason_code:"PROVIDER_NOT_CONFIGURED"},{status:503,headers});
  if(route.provider==="openai"&&!providerKey){
    if(taskType.toLowerCase()==="image_analysis") return Response.json({error:"vision_provider_not_configured"},{status:503,headers});
    route={route_key:"local_standard",provider:"local",model_name:"heuristic-standard",fallback_used:true,reason:"external_provider_not_configured"};
  }

  const start=Date.now();
  const reqRow=await sb.from("ai_requests").insert({
    organization_id:org.data.organization_id,user_id:user.id,goal_id:goalId,task_type:taskType,sensitivity,quality_level:quality,
    route_key:route.route_key,provider:route.provider,model_name:route.model_name,status:"running",
    routing_reason:route.reason,fallback_used:!!route.fallback_used,input_digest:String(JSON.stringify(input)).slice(0,500)
  }).select("*").single();
  if(reqRow.error) return Response.json({error:"ai_request_create_failed",detail:reqRow.error.message},{status:500,headers});

  const contract=await sb.from("quality_contracts").insert({
    organization_id:org.data.organization_id,goal_id:goalId,execution_id:null,task_type:taskType,required_fields:requiredFields,
    evidence_required:!!body.evidence_required,human_review_required:!!body.human_review_required,minimum_quality:quality,status:"pending",issues:[]
  }).select("*").single();
  if(contract.error) return Response.json({error:"quality_contract_failed",detail:contract.error.message},{status:500,headers});

  let output:any=null,validation={valid:false,issues:["not_run"]},attempts=0,errorCode:string|null=null;
  let actualCost=0,usage:any=null,responseId:string|null=null;
  const maxAttempts=strictProvider||interactive?1:3;

  for(let i=1;i<=maxAttempts;i++){
    attempts=i;
    try{
      if(route.provider==="openai"&&providerKey){
        const ext=await externalExecute(providerKey,taskType,input,requiredFields,interactive);
        output=ext.output; actualCost+=ext.cost; usage=ext.usage; responseId=ext.response_id;
      } else if(route.provider==="anthropic"&&anthropicKey){
        const ext=await anthropicExecute(anthropicKey,taskType,input,requiredFields,interactive);
        route.model_name=ext.model||route.model_name;
        output=ext.output; actualCost+=ext.cost; usage=ext.usage; responseId=ext.response_id;
      } else if(catalog.some(p=>p.id===route.provider&&!p.existing&&p.ready)){
        const ext=await pilotCompatibleExecute(route.provider,taskType,input,schemaHint(taskType,requiredFields),name=>Deno.env.get(name));
        route.model_name=ext.model;
        output=ext.output;actualCost+=ext.cost;usage=ext.usage;responseId=ext.response_id;
      } else {
        output=localExecute(taskType,input,i);
      }
      validation=validate(output,requiredFields);
      if(validation.valid) break;
      if(i===1&&route.route_key==="local_fast") route={route_key:"local_standard",provider:"local",model_name:"heuristic-standard",fallback_used:true,reason:"validation_escalation"};
    }catch(e){
      const msg=String((e as any)?.message||e);
      errorCode=/^(GEMINI|MISTRAL|DEEPSEEK|XAI)_\d+$/.test(msg)?msg:msg.startsWith("OPENAI_")?msg.split(":")[0]:
        msg.startsWith("ANTHROPIC_")?msg.split(":")[0]:
        route.provider==="openai"&&/account is not active|billing details|billing.*inactive/i.test(msg)?"OPENAI_BILLING_INACTIVE":
        /signal has been aborted|aborted/i.test(msg)?"PROVIDER_TIMEOUT":
        "PROVIDER_FAILED";
      console.warn("PILOT_MODEL_FAILURE",JSON.stringify({
        provider:route.provider,model:route.model_name,code:errorCode,interactive,
        detail:"redacted"
      }));
      if(strictProvider||interactive||taskType.toLowerCase()==="image_analysis"){
        break; // fast-best upstream owns provider fallback; avoid redundant internal attempts
      } else if(route.provider==="openai"&&anthropicKey){
        route={route_key:"claude_reasoning",provider:"anthropic",model_name:CLAUDE_MODEL,fallback_used:true,reason:"openai_error_anthropic_fallback"};
      } else if(route.provider==="anthropic"&&providerKey){
        route={route_key:"external_reasoning",provider:"openai",model_name:EXTERNAL_MODEL,fallback_used:true,reason:"anthropic_error_openai_fallback"};
      } else if(route.provider==="openai"||route.provider==="anthropic"){
        route={route_key:"local_standard",provider:"local",model_name:"heuristic-standard",fallback_used:true,reason:"external_provider_error_fallback"};
      }
    }
  }

  // A placeholder/heuristic is never an acceptable final work product.
  // Failed external providers must stop operative work, not fabricate success.
  if(taskType.toLowerCase()==="execution_artifact"&&route.provider==="local"){
    output=null;
    validation={valid:false,issues:["external_execution_model_unavailable"]};
    errorCode=errorCode||"EXECUTION_PROVIDER_UNAVAILABLE";
  }
  if(validation.valid && output!=null){
    const outputSafety=await checkSafety("output",output);
    if(!outputSafety.allowed){
      output=null;
      validation={valid:false,issues:[outputSafety.denied?"output_blocked_by_policy":"safety_check_unavailable"]};
      errorCode=outputSafety.reason_code;
    }
  }
  const ok=validation.valid;
  const latency=Date.now()-start;
  await sb.from("quality_contracts").update({status:ok?"passed":"failed",issues:validation.issues,updated_at:new Date().toISOString()}).eq("id",contract.data.id);
  await sb.from("ai_requests").update({
    route_key:route.route_key,provider:route.provider,model_name:route.model_name,routing_reason:route.reason,fallback_used:!!route.fallback_used,status:ok?"completed":"failed",
    structured_output:{output,provider_usage:usage,provider_response_id:responseId},validation_status:ok?"passed":"failed",attempts,latency_ms:latency,
    actual_cost:Number(actualCost.toFixed(6)),error_code:errorCode||(ok?null:"AI_OUTPUT_INVALID"),completed_at:new Date().toISOString()
  }).eq("id",reqRow.data.id);

  return Response.json({
    status:ok?"completed":"failed",request_id:reqRow.data.id,route,
    quality_contract:{id:contract.data.id,status:ok?"passed":"failed",issues:validation.issues},
    output,attempts,latency_ms:latency,cost:Number(actualCost.toFixed(6)),usage
  },{status:ok?200:422,headers});
};
const PILOT_CORS_HEADERS={"access-control-allow-origin":"*","access-control-allow-methods":"GET, POST, OPTIONS","access-control-allow-headers":"authorization, x-client-info, apikey, content-type, x-supabase-api-version","access-control-max-age":"86400"};

Deno.serve(async (req:Request)=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:PILOT_CORS_HEADERS});
  const response=await pilotCorsHandler(req);
  const responseHeaders=new Headers(response.headers);
  for(const [name,value] of Object.entries(PILOT_CORS_HEADERS))responseHeaders.set(name,value);
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers:responseHeaders});
});
