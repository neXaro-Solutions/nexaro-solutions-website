import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Offer sources must be verified feeds or official APIs; affiliate status never affects rank.
const providers = ["ebay","awin","adcell","impact","cj","tradedoubler","webgains","rakuten","partnerize","belboon","amazon","comparison"] as const;
type Offer = {id:string;source:string;merchant:string;name:string;price_eur:number;shipping_eur:number|null;total_eur:number|null;url:string;affiliate:boolean;checked_at:string;condition:string|null};
const validNumber=(x:unknown)=>typeof x==="number"&&Number.isFinite(x)?x:typeof x==="string"&&x.trim()?Number(x):NaN;
const safeUrl=(v:unknown)=>{try{const u=new URL(String(v||""));if(u.protocol!=="https:"||u.username||u.password||!u.hostname.includes(".")||/(^|\.)(localhost|local|internal|example|test|invalid)$/.test(u.hostname)||/^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(u.hostname)||u.hostname.includes(".."))return null;return u.href}catch{return null}};
const truncate=(s:unknown,n=220)=>String(s??"").replace(/[<>]/g,"").trim().slice(0,n);
const cors=(origin:string|null)=>({"Access-Control-Allow-Origin":origin&&["https://nexaro-solutions.de","https://www.nexaro-solutions.de"].includes(origin)?origin:"https://nexaro-solutions.de","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"});
const json=(data:unknown,status=200,origin:string|null=null)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",...cors(origin)}});
const shortFetch=(url:string,init:RequestInit={},ms=5000)=>fetch(url,{...init,signal:AbortSignal.timeout(ms)});
let ebayToken="",ebayTokenUntil=0;
async function ebayAccessToken():Promise<string|null>{
 const id=Deno.env.get("EBAY_CLIENT_ID"),secret=Deno.env.get("EBAY_CLIENT_SECRET");
 if(!id||!secret)return null;
 if(ebayToken&&Date.now()+60000<ebayTokenUntil)return ebayToken;
 const encoded=btoa(id+":"+secret);
 const r=await shortFetch("https://api.ebay.com/identity/v1/oauth2/token",{
  method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded","Authorization":"Basic "+encoded},
  body:"grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope"},4200);
 if(!r.ok)throw new Error("eBay token not available");
 const body=await r.json();
 if(!body.access_token)throw new Error("eBay token missing");
 ebayToken=body.access_token;ebayTokenUntil=Date.now()+Math.max(120,Number(body.expires_in||7000))*1000;
 return ebayToken;
}
async function ebayOffers(query:string):Promise<Offer[]>{
 const token=await ebayAccessToken();if(!token)return [];
 const campaign=String(Deno.env.get("EBAY_EPN_CAMPAIGN_ID")||"").trim();
 const headers:Record<string,string>={"Authorization":"Bearer "+token,"X-EBAY-C-MARKETPLACE-ID":"EBAY_DE","Accept":"application/json"};
 if(/^\d{10,12}$/.test(campaign))headers["X-EBAY-C-ENDUSERCTX"]="affiliateCampaignId="+campaign;
 const u=new URL("https://api.ebay.com/buy/browse/v1/item_summary/search");
 u.searchParams.set("q",query);u.searchParams.set("limit","25");u.searchParams.set("filter","buyingOptions:{FIXED_PRICE}");
 const r=await shortFetch(u.href,{headers},5100);
 if(!r.ok)throw new Error("eBay search unavailable: "+r.status);
 const payload=await r.json();
 return (Array.isArray(payload.itemSummaries)?payload.itemSummaries:[]).flatMap((item:any)=>{
   const price=validNumber(item.price?.value);
   if(!Number.isFinite(price)||price<=0||item.price?.currency!=="EUR")return [];
   const opt=Array.isArray(item.shippingOptions)?item.shippingOptions[0]:null;
   const shipping=opt?.shippingCost?.currency==="EUR"?validNumber(opt.shippingCost?.value):null;
   const ship=shipping!==null&&Number.isFinite(shipping)&&shipping>=0?shipping:null;
   const affiliateUrl=/^\d{10,12}$/.test(campaign)?safeUrl(item.itemAffiliateWebUrl):null;
   const url=affiliateUrl||safeUrl(item.itemWebUrl);
   if(!url)return [];
   return [{id:truncate(item.itemId,120),source:"eBay",merchant:truncate(item.seller?.username||"eBay-Händler",110),name:truncate(item.title,240),price_eur:Math.round(price*100)/100,shipping_eur:ship,total_eur:ship!==null?Math.round((price+ship)*100)/100:null,url,affiliate:!!affiliateUrl,checked_at:new Date().toISOString(),condition:truncate(item.condition||"",40)||null} satisfies Offer];
 });
}
const mapStored=(r:any,name:string):Offer=>({id:String(r.external_id),source:name,merchant:r.merchant,name:r.name,price_eur:Number(r.price_eur),shipping_eur:r.shipping_eur===null?null:Number(r.shipping_eur),total_eur:r.shipping_eur===null?null:Math.round((Number(r.price_eur)+Number(r.shipping_eur))*100)/100,url:r.product_url,affiliate:!!r.affiliate,checked_at:r.checked_at,condition:r.condition_text});
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("origin");
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(origin)});
 if(req.method!=="POST")return json({error:"Method not allowed"},405,origin);
 try{
   const authorization=req.headers.get("authorization")||"";
   if(!authorization.startsWith("Bearer "))return json({error:"Anmeldung erforderlich."},401,origin);
   const anon=Deno.env.get("SUPABASE_ANON_KEY")||Deno.env.get("SUPABASE_PUBLISHABLE_KEY")||"";
   const url=Deno.env.get("SUPABASE_URL")||"";
   const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
   if(!anon||!service||!url)return json({error:"Suche ist noch nicht konfiguriert."},503,origin);
   const auth=createClient(url,anon,{global:{headers:{Authorization:authorization}}});
   const {data:{user},error:authError}=await auth.auth.getUser(authorization.slice(7));
   if(authError||!user)return json({error:"Anmeldung erforderlich."},401,origin);
   const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
   const body=await req.json().catch(()=>({}));
   const operation=String(body?.operation||"search");
   if(operation==="import"){
     const role=await db.from("user_system_roles").select("role").eq("user_id",user.id).maybeSingle();
     if(role.error||role.data?.role!=="admin")return json({error:"Nicht berechtigt."},403,origin);
     const source=String(body?.source||"");
     if(!providers.includes(source as typeof providers[number]))return json({error:"Unbekannte Quelle."},400,origin);
     if(!Array.isArray(body?.offers)||body.offers.length>150)return json({error:"Maximal 150 Angebote pro Import."},400,origin);
     const parsed=[];
     for(const o of body.offers){
       const p=validNumber(o?.price_eur),h=o?.shipping_eur==null?null:validNumber(o.shipping_eur);
       const link=safeUrl(o?.url);
       const name=truncate(o?.name,240),merchant=truncate(o?.merchant,100),id=truncate(o?.external_id,120);
       if(!link||!name||!merchant||!id||!Number.isFinite(p)||p<=0||p>10000000||h!==null&&(!Number.isFinite(h)||h<0))return json({error:"Ungültiges Angebot – Import abgebrochen."},400,origin);
       const checked=new Date().toISOString();
       parsed.push({source_id:source,external_id:id,name,merchant,product_url:link,price_eur:Math.round(p*100)/100,shipping_eur:h===null?null:Math.round(h*100)/100,condition_text:truncate(o?.condition,60)||null,affiliate:o?.affiliate===true,search_text:(name+" "+merchant+" "+truncate(o?.keywords,280)).toLocaleLowerCase("de-DE"),checked_at:checked,expires_at:new Date(Date.now()+48*3600*1000).toISOString()});
     }
     if(parsed.length){
       const result=await db.from("pilot_market_offers").upsert(parsed,{onConflict:"source_id,external_id"});
       if(result.error)throw result.error;
       await db.from("pilot_market_sources").update({integration_status:"configured"}).eq("source_id",source);
     }
     return json({ok:true,imported:parsed.length,source},200,origin);
   }
   if(operation!=="search")return json({error:"Unbekannte Operation."},400,origin);
   const query=truncate(body?.query,120).replace(/\s+/g," ").trim();
   if(query.length<3||query.length>120)return json({error:"Bitte gib einen konkreten Suchbegriff ein."},400,origin);
   const allowed=await db.rpc("pilot_market_allow_search",{p_user:user.id});
   if(allowed.error)return json({error:"Die Angebotsuche ist vorübergehend nicht verfügbar."},503,origin);
   if(allowed.data!==true)return json({error:"Bitte warte kurz, bevor du erneut suchst."},429,origin);
   const words=(query.toLocaleLowerCase("de-DE").match(/[\p{L}\p{N}]{2,}/gu)||[]).slice(0,5);
   if(!words.length)return json({error:"Bitte formuliere den Produktnamen genauer."},400,origin);
   let select=db.from("pilot_market_offers").select("source_id,external_id,name,merchant,product_url,price_eur,shipping_eur,condition_text,affiliate,checked_at")
    .gt("expires_at",new Date().toISOString()).gte("checked_at",new Date(Date.now()-72*3600*1000).toISOString());
   for(const token of words)select=select.ilike("search_text","%"+token+"%");
   const [feeds,ebay]=await Promise.allSettled([select.limit(60),ebayOffers(query)]);
   const names:Record<string,string>={awin:"Awin",adcell:"ADCELL",impact:"impact.com",cj:"CJ Affiliate",tradedoubler:"Tradedoubler",webgains:"Webgains",rakuten:"Rakuten Advertising",partnerize:"Partnerize",belboon:"belboon",amazon:"Amazon PartnerNet",comparison:"Vergleichspartner",ebay:"eBay"};
   const stored=feeds.status==="fulfilled"&&!feeds.value.error?(feeds.value.data||[]).map((o:any)=>mapStored(o,names[o.source_id]||o.source_id)).filter((o:Offer)=>safeUrl(o.url)):[] as Offer[];
   const live=ebay.status==="fulfilled"?ebay.value:[] as Offer[];
   const seen=new Set<string>(),offers=[...live,...stored].filter(o=>{const key=o.source+":"+o.id;if(seen.has(key))return false;seen.add(key);return true})
    .sort((a,b)=>(a.total_eur??Infinity)-(b.total_eur??Infinity)||a.price_eur-b.price_eur||a.name.localeCompare(b.name)).slice(0,25);
   return json({query,offers,checked_at:new Date().toISOString(),sources:{ebay:ebay.status==="fulfilled"&&!!(Deno.env.get("EBAY_CLIENT_ID")&&Deno.env.get("EBAY_CLIENT_SECRET")),feed_results:stored.length},notice:offers.length?"Preise und Verfügbarkeit bitte beim Händler prüfen. Affiliate-Links sind gekennzeichnet.":"Noch keine verfügbaren Angebote aus freigeschalteten Quellen. Weitere Partner werden erst nach offizieller Anbindung berücksichtigt."},200,origin);
 }catch(err){
   console.error("pilot-market:",String(err).slice(0,180));
   return json({error:"Angebote konnten gerade nicht geladen werden. Bitte später erneut versuchen."},503,origin);
 }
});
