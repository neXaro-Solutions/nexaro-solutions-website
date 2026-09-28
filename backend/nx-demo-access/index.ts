// Custom authentication: high-entropy invitation, server-side expiry/revocation.
const allowedOrigins=new Set(['https://www.nexaro-solutions.de','https://nexaro-solutions.de']);
const base=Deno.env.get('SUPABASE_URL')!;
const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const sha=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('');
async function db(path:string,method='GET',body?:unknown){const r=await fetch(base+'/rest/v1/'+path,{method,headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});if(!r.ok)throw Error('database unavailable');return r.json()}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('origin')||'';
 const headers:Record<string,string>={'Content-Type':'application/json','Cache-Control':'no-store, private','Pragma':'no-cache','Vary':'Origin','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
 if(allowedOrigins.has(origin)){headers['Access-Control-Allow-Origin']=origin;headers['Access-Control-Allow-Headers']='content-type';headers['Access-Control-Allow-Methods']='POST, OPTIONS';}
 const reply=(status:number,data:unknown)=>new Response(JSON.stringify(data),{status,headers});
 if(origin&&!allowedOrigins.has(origin))return reply(403,{error:'Zugriff nicht erlaubt.'});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply(405,{error:'Einladungscode erforderlich.'});
 try{
  if(Number(req.headers.get('content-length')||0)>2048)return reply(413,{error:'Anfrage zu groß.'});
  const reader=req.body?.getReader();let size=0,raw='';if(!reader)return reply(400,{error:'Einladungscode erforderlich.'});
  const decoder=new TextDecoder();while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2048){await reader.cancel();return reply(413,{error:'Anfrage zu groß.'})}raw+=decoder.decode(value,{stream:true})}raw+=decoder.decode();
  let data;try{data=JSON.parse(raw)}catch{return reply(400,{error:'Ungültige Anfrage.'})}
  const ip=(req.headers.get('x-forwarded-for')||req.headers.get('cf-connecting-ip')||'unknown').split(',')[0].trim();
  // HMAC avoids storing a reversible hash of the visitor's address.
  const salt=await crypto.subtle.importKey('raw',new TextEncoder().encode(key),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const ipKey=Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',salt,new TextEncoder().encode(ip)))).map(x=>x.toString(16).padStart(2,'0')).join('');
  if(!await db('rpc/nx_demo_rate_limit','POST',{p_key:ipKey}))return reply(429,{error:'Zu viele Versuche. Bitte warte eine Minute.'});
  const code=typeof data.code==='string'?data.code.replace(/[\s-]/g,'').toUpperCase():'';
  if(!/^NX[A-F0-9]{32}$/.test(code))return reply(401,{error:'Der Einladungscode ist ungültig, abgelaufen oder gesperrt.'});
  const hash=await sha(code),now=new Date().toISOString();
  const rows=await db('nx_demo_invitations?select=id,expires_at&code_hash=eq.'+hash+'&revoked_at=is.null&expires_at=gt.'+encodeURIComponent(now)+'&limit=1');
  if(!rows.length)return reply(401,{error:'Der Einladungscode ist ungültig, abgelaufen oder gesperrt.'});
  if(data.action==='check')return reply(200,{expires_at:rows[0].expires_at});
  if(data.action!=='open')return reply(400,{error:'Ungültige Anfrage.'});
  const content=await db('nx_demo_content?select=html&id=eq.main&limit=1');
  if(!content.length)return reply(503,{error:'Die Vorführung wird gerade vorbereitet. Bitte versuche es später erneut.'});
  return reply(200,{html:content[0].html,expires_at:rows[0].expires_at});
 }catch{return reply(503,{error:'Der Zugang ist gerade nicht verfügbar. Bitte versuche es später erneut.'})}
});
