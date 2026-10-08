import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import webpush from "npm:web-push@3.6.7";
const cors={"access-control-allow-origin":"https://www.nexaro-solutions.de","access-control-allow-methods":"POST, OPTIONS","access-control-allow-headers":"authorization, apikey, content-type, x-client-info","content-type":"application/json","cache-control":"no-store"};
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:cors});
export function validPushEndpoint(endpoint:string){
 try{const u=new URL(endpoint);return u.protocol==="https:"&&!u.username&&!u.password&&!u.port&&
 (u.hostname==="fcm.googleapis.com"||u.hostname==="updates.push.services.mozilla.com"||
 u.hostname==="web.push.apple.com"||u.hostname.endsWith(".push.apple.com")||u.hostname.endsWith(".notify.windows.com"))}
 catch{return false}
}
export function validSubscription(s:any){
 if(!s||typeof s.endpoint!=="string"||s.endpoint.length>2048||!validPushEndpoint(s.endpoint))return false;
 const decode=(v:any)=>{if(typeof v!=="string"||!/^[A-Za-z0-9_-]+={0,2}$/.test(v))return 0;try{return atob(v.replace(/-/g,'+').replace(/_/g,'/')).length}catch{return 0}};
 return decode(s.keys?.auth)===16&&decode(s.keys?.p256dh)===65;
}
async function config(admin:any){
 const r=await admin.from('pilot_push_config').select('public_key,private_key').eq('id',1).maybeSingle();
 if(r.error)throw Error('config_unavailable');if(r.data)return r.data;
 const k=webpush.generateVAPIDKeys();
 const i=await admin.from('pilot_push_config').insert({id:1,public_key:k.publicKey,private_key:k.privateKey}).select('public_key,private_key').single();
 if(!i.error)return i.data;
 const again=await admin.from('pilot_push_config').select('public_key,private_key').eq('id',1).single();
 if(again.error)throw Error('config_unavailable');return again.data;
}
async function send(sub:any,payload:any,keys:any){
 const d=webpush.generateRequestDetails(sub.subscription,JSON.stringify(payload),{
   vapidDetails:{subject:'mailto:kontakt@nexaro-solutions.de',publicKey:keys.public_key,privateKey:keys.private_key},TTL:3600,urgency:'normal'
 });
 // Use fetch; never allow user-controlled redirect chains or generic outbound URLs.
 return await fetch(d.endpoint,{method:d.method,headers:d.headers,body:new Uint8Array(d.body),redirect:'error',signal:AbortSignal.timeout(12000)});
}
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(req.method!=='POST')return reply({error:'method_not_allowed'},405);
 try{
 const base=Deno.env.get('SUPABASE_URL')!;
 const secrets=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}');
 const service=secrets.default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(!service)return reply({error:'server_configuration_unavailable'},503);
 const admin=createClient(base,service,{auth:{persistSession:false,autoRefreshToken:false}});
 let body:any;try{body=await req.json()}catch{return reply({error:'invalid_json'},400)}
 if(body.operation==='dispatch'){
   // Reuse the existing private server scheduler credential, never a consumer JWT.
   const token=req.headers.get('x-pilot-worker-key')||'';
   if(!/^[a-f0-9]{64}$/.test(token))return reply({error:'worker_auth_required'},403);
   const check=await admin.rpc('pilot_background_verify_token',{provided:token});
   if(check.error||check.data!==true)return reply({error:'worker_auth_required'},403);
   const keys=await config(admin);
   const jobs=await admin.rpc('pilot_push_claim');if(jobs.error)return reply({error:'queue_unavailable'},503);
   let sent=0,failed=0;
   for(const job of jobs.data||[]){
     const owned=await admin.from('goals').select('id,owner_id').eq('id',job.goal_id).eq('owner_id',job.owner_id).maybeSingle();
     if(owned.error){failed++;continue}
     if(!owned.data){await admin.from('pilot_push_events').update({state:'cancelled'}).eq('id',job.id).eq('lease_token',job.lease_token);continue}
     const subscriptions=await admin.from('pilot_push_subscriptions').select('id,subscription').eq('owner_id',job.owner_id);
     if(subscriptions.error){failed++;continue}
     let successes=0,transient=false;
     for(const sub of subscriptions.data||[]){
       if(!validSubscription(sub.subscription))continue;
       try{
         const r=await send(sub,{title:job.title,body:job.body,tag:'pilot-'+job.goal_id,url:'/pilot/?auftrag='+job.goal_id},keys);
         if(r.ok)successes++;
         else if(r.status===404||r.status===410)await admin.from('pilot_push_subscriptions').delete().eq('id',sub.id).eq('owner_id',job.owner_id);
         else transient=true;
       }catch{transient=true}
     }
     const state=transient&&successes===0&&job.attempts<3?'pending':successes?'sent':'failed';
     await admin.from('pilot_push_events').update({state,sent_at:successes?new Date().toISOString():null,next_attempt_at:new Date(Date.now()+60000).toISOString()}).eq('id',job.id).eq('lease_token',job.lease_token);
     if(successes)sent++;else failed++;
   }
   return reply({status:'ok',processed:(jobs.data||[]).length,sent,failed});
 }
 const auth=req.headers.get('authorization')||'';
 if(!auth.startsWith('Bearer '))return reply({error:'auth_required'},401);
 const verified=await admin.auth.getUser(auth.slice(7));
 const user=verified.data?.user;if(verified.error||!user)return reply({error:'invalid_session'},401);
 if(body.operation==='config'){const keys=await config(admin);return reply({public_key:keys.public_key})}
 if(body.operation==='subscribe'){
   if(!validSubscription(body.subscription))return reply({error:'invalid_subscription'},400);
   const endpoint_hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(body.subscription.endpoint)))).map(x=>x.toString(16).padStart(2,'0')).join('');
   const count=await admin.from('pilot_push_subscriptions').select('endpoint_hash').eq('owner_id',user.id);
   if(count.error)return reply({error:'subscription_unavailable'},503);
   if(count.data.length>=8&&!count.data.some((x:any)=>x.endpoint_hash===endpoint_hash))return reply({error:'device_limit'},409);
   const r=await admin.from('pilot_push_subscriptions').upsert({owner_id:user.id,endpoint_hash,subscription:{endpoint:body.subscription.endpoint,keys:{auth:body.subscription.keys.auth,p256dh:body.subscription.keys.p256dh}},updated_at:new Date().toISOString()},{onConflict:'owner_id,endpoint_hash'});
   if(r.error)return reply({error:'subscription_unavailable'},503);
   return reply({status:'subscribed'});
 }
 if(body.operation==='unsubscribe'){
   const q=admin.from('pilot_push_subscriptions').delete().eq('owner_id',user.id);
   const r=body.endpoint?await q.contains('subscription',{endpoint:String(body.endpoint)}):await q;
   if(r.error)return reply({error:'unsubscribe_failed'},503);return reply({status:'unsubscribed'});
 }
 if(body.operation==='test'){
   const list=await admin.from('pilot_push_subscriptions').select('id,subscription').eq('owner_id',user.id);
   if(list.error)return reply({error:'subscription_unavailable'},503);
   const sub=list.data?.find((s:any)=>s.subscription.endpoint===body.endpoint);
   if(!sub)return reply({error:'subscription_not_found'},404);
   const keys=await config(admin);
   const r=await send(sub,{title:'Pilot: Benachrichtigungen verbunden',body:'Pilot meldet sich, wenn ein Ergebnis bereitliegt oder deine Entscheidung nötig ist.',tag:'pilot-test',url:'/pilot/'},keys);
   return reply({status:r.ok?'accepted':'rejected'},r.ok?200:502);
 }
 return reply({error:'operation_not_supported'},400);
 }catch{console.warn('PILOT_PUSH_OPERATION_FAILED');return reply({error:'push_temporarily_unavailable'},503)}
});
