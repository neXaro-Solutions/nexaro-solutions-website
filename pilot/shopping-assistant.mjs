import {productShoppingIntent,shoppingPreferences,needsShoppingClarification,isShoppingFollowUp,shortlistOffers} from "./shopping-intent.mjs";

/* A private assistant conversation, not a separate comparison screen or lead funnel. */
export function makeShoppingAssistant({sb,getUser,getOrg,redraw,safeLink,escape,money}){
 let state=null,busy=false,generation=0;
 const fresh=()=>({topic_key:"",topic:"",stage:"idle",preferences:{},conversation:[],offers:[],recommendation:{}});
 const note=(role,text)=>{if(state)state.conversation=[...(state.conversation||[]),{role,text:String(text||"").slice(0,1650)}].slice(-14);};
 const latest=()=>[...(state?.conversation||[])].reverse().find(x=>x.role==="assistant")?.text||"";
 function clear(){generation++;state=null;busy=false;}
 async function save(){
  if(!state||!getUser())return;
  const s=state;
  const data={user_id:getUser().id,topic_key:s.topic_key,topic:s.topic,stage:s.stage,
   preferences:s.preferences||{},conversation:(s.conversation||[]).slice(-14),
   offers:(s.offers||[]).slice(0,12),recommendation:s.recommendation||{},updated_at:new Date().toISOString()};
  try{
   const res=await sb.from("pilot_shopping_sessions").upsert(data,{onConflict:"user_id"});
   if(res.error)console.warn("Pilot shopping persistence unavailable");
  }catch{console.warn("Pilot shopping persistence unavailable");}
 }
 async function load(){
  const user=getUser();if(!user)return;
  const version=++generation;
  try{
   const res=await sb.from("pilot_shopping_sessions").select("topic_key,topic,stage,preferences,conversation,offers,recommendation")
    .eq("user_id",user.id).maybeSingle();
   if(res.error||version!==generation||getUser()?.id!==user.id)return;
   if(!state&&res.data?.topic_key){
    state={...fresh(),...res.data};
    if(state.stage==="working"){
     state.stage="error";note("assistant","Deine letzte Recherche wurde unterbrochen. Du kannst sie mit einer neuen Frage erneut starten.");
    }
    redraw();
   }
  }catch{console.warn("Pilot shopping context temporarily unavailable");}
 }
 function offerHTML(o,label){
  const url=safeLink(o.url);
  if(!url||!(Number(o.price_eur)>0))return "";
  const known=o.total_eur!==null&&o.total_eur!==undefined&&Number.isFinite(Number(o.total_eur));
  const when=o.checked_at&&Number.isFinite(new Date(o.checked_at).getTime())?new Date(o.checked_at).toLocaleString("de-DE"):"nicht angegeben";
  return '<article class="pilot-shopping-offer"><div><small>'+escape(label)+' · '+escape(o.source||"Händlerdaten")+'</small>'+
   '<strong>'+escape(o.name||"Artikel")+'</strong><span>'+escape(o.merchant||"Anbieter")+' · '+
   escape(known?"inklusive ausgewiesenem Versand":"Versandkosten unbekannt")+' · geprüft: '+escape(when)+'</span></div>'+
   '<div class="pilot-shopping-price"><b>'+money(known?o.total_eur:o.price_eur)+'</b>'+
   '<a href="'+escape(url)+'" target="_blank" rel="'+(o.affiliate?'sponsored ':'')+'noopener noreferrer">Zum Angebot ↗</a>'+
   (o.affiliate?'<small>Werbelink</small>':'')+'</div></article>';
 }
 function card(){
  if(!state||state.stage==="idle")return "";
  const s=state,working=s.stage==="working",clarify=s.stage==="clarify",offers=s.offers||[];
  const selected=offers.find(o=>o.id===s.recommendation?.selected_id)||null;
  const others=selected?offers.filter(o=>o.id!==selected.id).slice(0,2):[];
  return '<section class="pilot-shopping-card" aria-label="Persönliche Beratung" aria-live="polite">'+
   '<div class="pilot-shopping-heading"><span class="pilot-shopping-mark">✦</span><div><small>PILOT · DEIN ERGEBNIS</small><h3>'+escape(s.topic||"Deine Beratung")+'</h3></div>'+
   '<button type="button" id="pilotShoppingDismiss" aria-label="Beratung ausblenden">×</button></div>'+
   (working?'<p class="pilot-shopping-answer">Pilot prüft passende Produkte und verfügbare Händlerangebote …</p>':
    latest()?'<p class="pilot-shopping-answer">'+escape(latest())+'</p>':'')+
   (clarify?'<div class="pilot-shopping-choice"><button class="btn ai" type="button" id="pilotShoppingAny">Ohne Vorgaben fortfahren</button>'+
    '<small>Oder antworte oben, z. B. „bis 700 €, Android, gute Kamera“.</small></div>':'')+
   (!working&&!clarify&&selected?'<div class="pilot-shopping-evidence">'+offerHTML(selected,"Passender geprüfter Treffer")+
    others.map((o,i)=>offerHTML(o,"Weitere Möglichkeit "+(i+1))).join("")+'</div>':'')+
   (!working&&!clarify?'<p class="pilot-shopping-footer">Frag einfach weiter – nach Kamera, Akku, Unterschieden oder Alternativen. Händlerpreise können sich ändern. Affiliate-Links sind gekennzeichnet und beeinflussen die Auswahl nicht.</p>':'')+
   '</section>';
 }
 async function ai(task,payload,fields){
  const r=await sb.functions.invoke("best-of-ai",{body:{task_type:task,mode:"fast_best",
   sensitivity:"standard",required_fields:fields,input:payload}});
  if(r.error||r.data?.error||r.data?.status!=="completed")throw Error("KI-Beratung nicht erreichbar");
  const output=r.data?.final_output;
  if(!output||fields.some(k=>typeof output[k]!=="string"||!output[k].trim()))throw Error("Unvollständige Antwort");
  return output;
 }
 async function search(){
  const s=state;
  s.stage="working";redraw();await save();
  try{
   const r=await sb.functions.invoke("pilot-market",{body:{operation:"search",query:s.topic}});
   if(r.error||r.data?.error)throw Error("Keine verlässliche Suche");
   const shortlist=shortlistOffers(r.data?.offers||[],s.topic_key,s.preferences);
   s.offers=shortlist.map(o=>({
    id:String(o.id||"").slice(0,130),name:String(o.name||"").slice(0,230),
    source:String(o.source||"").slice(0,80),merchant:String(o.merchant||"").slice(0,95),
    price_eur:Number(o.price_eur),shipping_eur:o.shipping_eur??null,total_eur:o.total_eur??null,
    url:o.url,affiliate:!!o.affiliate,condition:String(o.condition||"").slice(0,50),checked_at:String(o.checked_at||"")
   }));
   if(!s.offers.length){
    s.recommendation={};
    note("assistant","Ich habe deine Wünsche erfasst. Aktuell finde ich dafür noch keine verifizierten Händlerangebote. Deshalb nenne ich dir keinen angeblichen Testsieger oder erfundenen Bestpreis. Du kannst mir aber bereits Fragen zu Kaufkriterien und wichtigen Eigenschaften stellen.");
   }else{
    let id=null,reason="",answer="";
    try{
     const response=await ai("product_recommendation",{
      goal:"Für den Nutzer die passendste nachgewiesene Kaufoption auswählen",topic:s.topic,
      preferences:s.preferences,
      offers:s.offers.map(o=>({id:o.id,name:o.name,source:o.source,merchant:o.merchant,price_eur:o.price_eur,total_eur:o.total_eur,condition:o.condition})),
      instruction:"Antwort auf Deutsch, JSON mit selected_id, answer, reason. selected_id MUSS zu einer gelisteten ID gehören. Es sind nur Händlernamen, Artikeltitel und Preise verifiziert, NICHT Gerätequalität, Kamera, Akkulaufzeit, Tests oder Verfügbarkeit. Nenne niemals ungesicherte technische Fakten. Begründe vorsichtig und unterscheide ausdrücklich belegtes Preisangebot von unabhängiger Qualität. Keine erfundenen Links. Provision niemals berücksichtigen."
     },["selected_id","answer","reason"]);
     if(s.offers.some(o=>o.id===response.selected_id)){id=response.selected_id;answer=response.answer;reason=response.reason;}
    }catch(e){console.warn("Shopping evaluation unavailable")}
    if(!id){
     const first=s.offers.find(o=>o.total_eur!=null)||s.offers[0];
     id=first.id;
     answer="Dieses ist eines der preislich passenden Angebote aus den aktuell belegten Händlerdaten. Ob es technisch das beste "+s.topic+" ist, kann ich ohne unabhängige Tests nicht bestätigen.";
     reason="Auswahl nach belegtem Artikelpreis, bekanntem Versand und deinen Vorgaben.";
    }
    s.recommendation={selected_id:id,reason:String(reason).slice(0,500)};
    note("assistant",String(answer).slice(0,950)+" "+String(reason).slice(0,450));
   }
   s.stage="result";
  }catch{
   s.stage="error";s.offers=[];s.recommendation={};
   note("assistant","Die Händlerquellen sind im Moment nicht zuverlässig erreichbar. Ich zeige daher keine erfundenen Preise. Du kannst später neu suchen oder mich zu Kaufkriterien weiterfragen.");
  }
  await save();redraw();
 }
 async function followup(question){
  const s=state;s.stage="working";redraw();
  try{
   const out=await ai("product_followup",{
    topic:s.topic,question,preferences:s.preferences,conversation:s.conversation.slice(-8),
    chosen:s.offers.find(o=>o.id===s.recommendation?.selected_id)||null,
    verified_offers:s.offers.slice(0,6).map(o=>({name:o.name,merchant:o.merchant,price_eur:o.price_eur,total_eur:o.total_eur,condition:o.condition})),
    instruction:"Antworte auf Deutsch kontextbezogen in JSON {answer,uncertainty}. Reale Händlertitel und Preise sind nachgewiesen; technische Spezifikationen, Tests, Preise anderer Händler und Garantiebedingungen sind NICHT nachgewiesen. Wenn diese fehlen, sage das statt sie zu erfinden. Hilf mit nützlichen, allgemein gültigen Überlegungen. Keine neuen Produktlinks erfinden. Kurz."
   },["answer","uncertainty"]);
   note("assistant",out.answer+(out.uncertainty&&out.uncertainty.toLowerCase()!=="none"?" "+out.uncertainty:""));
  }catch{
   note("assistant","Für eine belastbare Antwort auf diese Frage fehlen mir derzeit geprüfte Produktinformationen. Ich kann dir aber erklären, welche Angaben du vor einer Kaufentscheidung vergleichen solltest.");
  }
  s.stage="result";await save();redraw();
 }
 async function handle(input,{attachments=false}={}){
  if(busy)return true; // Do not turn a concurrent product reply into a separate project.
  if(!getUser()||!getOrg()||attachments)return false;
  const t=String(input||"").trim();
  const intent=productShoppingIntent(t),continuation=!intent&&isShoppingFollowUp(t,state);
  if(!intent&&!continuation)return false;
  busy=true;
  try{
   if(intent){
    state={...fresh(),topic_key:intent.key,topic:intent.topic,preferences:{...shoppingPreferences(t),...(intent.key==="generic"?{product_topic:intent.topic}:{})}};
    note("user",t);
    if(needsShoppingClarification(t)){
     state.stage="clarify";
     note("assistant","Damit ich das für dich passende "+intent.topic+" auswählen kann: Welches Budget hast du und was ist dir am wichtigsten – Kamera, Akku, Leistung oder Preis-Leistung? Du kannst auch einfach „egal“ antworten.");
     await save();redraw();return true;
    }
   }else if(state.stage==="clarify"){
    const p=shoppingPreferences(t);
    state.preferences={...state.preferences,budget:p.budget||state.preferences?.budget||null,platform:p.platform||state.preferences?.platform||null,priority:p.priority||state.preferences?.priority||null};
    note("user",t);
   }else{
    note("user",t);await followup(t);return true;
   }
   await search();return true;
  }finally{busy=false;}
 }
 return {card,handle,load,clear,getState:()=>state};
}
