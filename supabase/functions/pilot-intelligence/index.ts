
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

type Intent = {
  objective:string; desiredOutcome:string; constraints:string[]; budget:string|null; timeframe:string|null;
  domain:{primary:string;secondary:string[];confidence:"low"|"medium"|"high"};
  unknowns:string[]; confidence:"low"|"medium"|"high";
};

const cors={"content-type":"application/json","cache-control":"no-store"};

function domainOf(input:string){
  const t=input.toLowerCase();
  const rules:[string,string[]][]=[
    ["medical_documentation",["medizin","patient","gutachten","befund","arzt","medical","clinical"]],
    ["marketing",["marketing","kampagne","seo","content","leads","ads","social media"]],
    ["business",["business","unternehmen","kunden","kunde","startup","saas","angebot","umsatz","consulting","firma","betrieb","gründen","gruenden","gründung","selbstständig","gewerbe"]],
    ["career",["bewerbung","karriere","lebenslauf","job","career","cv"]],
    ["document_work",["dokument","bericht","vertrag","pdf","document","report","contract"]]
  ];
  const hits=rules.filter(([,words])=>words.some(w=>t.includes(w))).map(([d])=>d);
  const primary=hits[0]||"general";
  const secondary=hits.filter(x=>x!==primary);
  return {primary,secondary,confidence:(hits.length?"high":"medium") as "high"|"medium"};
}
function intentOf(input:string):Intent{
  const money=input.match(/(\d[\d., ]*)\s?(€|eur|euro|\$|usd|£|gbp)/i)?.[0]||null;
  const timeframe=input.match(/(\d+)\s*(tag|tage|woche|wochen|monat|monate|jahr|jahre|day|days|week|weeks|month|months|year|years)/i)?.[0]||null;
  const constraints:string[]=[];
  if(/wenig geld|wenig budget|kleines budget|low budget|limited budget/i.test(input)) constraints.push("low_budget");
  if(/nebenberuf|nebenbei|part.?time/i.test(input)) constraints.push("limited_time");
  const domain=domainOf(input);
  const unknowns:string[]=[];
  if(input.trim().length<28) unknowns.push("desired_outcome_detail");
  if(!money && /business|unternehmen|marketing|produkt|startup|saas|angebot|kampagne/i.test(input)) unknowns.push("budget_nonblocking");
  return {objective:input.trim().slice(0,400),desiredOutcome:input.trim(),constraints,budget:money,timeframe,domain,unknowns,confidence:input.length>70?"high":input.length>25?"medium":"low"};
}
// Branchenerkennung bleibt in der gemeinsamen Auftragsintelligenz; kein separater Spezialmodus.
function industryOf(input:string){
  const t=String(input||"").normalize("NFKC").toLowerCase();
  if(/garten.{0,35}landschaft|landschaft.{0,35}garten|(?:^|[^a-z])(?:gartenbau|landschaftsbau|galabau|gala[-\s]?bau|gartenpflege)(?:$|[^a-z])/i.test(t)){
    return {key:"garden_landscaping",label:"Garten- und Landschaftsbau"};
  }
  return null;
}
function clarification(intent:Intent){
  const qs:any[]=[];
  const request=String(intent.objective||"");
  const industry=industryOf(request);
  const genericBusiness=/\b(unternehmen|business|firma|startup|geschäft|selbstständig|selbststaendig)\b/i.test(request);
  const specificIdea=/\b(agentur|onlineshop|online.shop|restaurant|gastronomie|handel|software|saas|app|beratung|handwerk|reinigung|marketing|pflege|dienstleistung|produkt|service|shop|verkaufen|verkauf|für|im bereich|als|garten|landschaft|galabau|bauunternehmen|friseur|elektro|immobilien)\b/i.test(request);
  if(intent.domain.primary==="business" && industry?.key==="garden_landscaping"){
    // Recognized industry is sufficient to start; unknown details are nonblocking.
  }else if(intent.domain.primary==="business" && genericBusiness && !specificIdea){
    qs.push({key:"business_idea",priority:"critical",required:true,
      question_de:"Was für ein Unternehmen möchtest du aufbauen?",
      question_en:"What kind of business do you want to build?",
      hint_de:"Beschreibe die Geschäftsidee oder Branche kurz. Zielgruppe und Details kannst du später ergänzen.",
      placeholder_de:"z. B. Eine Agentur, die kleinen Unternehmen beim Online-Auftritt hilft."});
  }else if(intent.unknowns.includes("desired_outcome_detail")){
    qs.push({key:"outcome",priority:"critical",required:true,
      question_de:"Was möchtest du konkret erreichen?",
      question_en:"What outcome would you like to achieve?",
      hint_de:"Eine kurze Beschreibung reicht. Pilot präzisiert den Rest mit dir.",
      placeholder_de:"Beschreibe das gewünschte Ergebnis …"});
  }
  // Kein Budget vor der Branchen-/Leistungsklärung. Nur die tatsächlich relevanten Rückfragen.
  return qs.filter(q=>q.required===true).slice(0,1);
}
function reality(intent:Intent, outcome:string){
  const t=(intent.objective+" "+outcome).toLowerCase(); const risks:string[]=[]; let feasibility="realistic";
  if(/1\s*mio|million|millionen|global/.test(t)&&/(30 tag|2 woch|ohne kapital|ohne budget|without capital)/.test(t)){feasibility="high_risk";risks.push("Ziel und verfügbare Zeit/Ressourcen stehen wahrscheinlich nicht im realistischen Verhältnis.");}
  if(intent.constraints.includes("low_budget")) risks.push("Budget ist ein zentraler Constraint; frühe Validierung hat Vorrang vor größerem Entwicklungsaufwand.");
  return {feasibility,main_risks:risks,main_bottleneck:risks[0]||null,recommended_adjustments:feasibility==="high_risk"?["Ziel zunächst auf eine validierbare erste Stufe reduzieren."]:[]};
}
const plans:Record<string,string[]>={
  business:["Ziel und Markt schärfen","Angebot und Zielgruppe validieren","Ersten Vertriebskanal testen","Ergebnisse messen und optimieren"],
  marketing:["Zielgruppe und Botschaft festlegen","Kanal und Kampagne vorbereiten","Kleine Testkampagne durchführen","Performance auswerten und optimieren"],
  medical_documentation:["Unterlagen erfassen und strukturieren","Quellen und Konflikte prüfen","Entwurf erstellen","Fachliche Prüfung und Freigabe"],
  document_work:["Unterlagen erfassen","Relevante Fakten und Quellen extrahieren","Konflikte und Vollständigkeit prüfen","Ergebnis erstellen und validieren"],
  career:["Zielrolle definieren","Profil und Unterlagen schärfen","Bewerbungsstrategie erstellen","Feedback auswerten und verbessern"],
  general:["Ziel präzisieren","Grundlage erstellen","Ergebnis testen","Auswertung und Optimierung"]
};
function firstAction(domain:string){
  return ({business:"Zielgruppe und konkreten Kundennutzen in einem Satz festlegen",marketing:"Zielgruppe, gewünschte Handlung und Kernbotschaft festlegen",medical_documentation:"Vorliegende Unterlagen vollständig erfassen und Quellenstatus prüfen",document_work:"Unterlagen nach Relevanz, Version und Quelle strukturieren",career:"Zielrolle und wichtigste Auswahlkriterien festlegen",general:"Gewünschtes Ergebnis in ein überprüfbares Erfolgskriterium übersetzen"} as Record<string,string>)[domain]||"Nächstes Erfolgskriterium festlegen";
}


/* Clear creation requests need one production task, not a generic business workflow. */
function directCreativeTask(input:string,intent:any):string|null{
 if(intent.domain.primary==='medical_documentation'||/gründ|gruend|selbstst|buch|bestell|kauf|bezahl|veröffent|veroeffent|publish|versend|senden|vertrag|rechts|gesetz|steuer|finanz|budget|medizin|therapie|recherch|vergleich|aktuell/i.test(input))return null;
 if(!/erstell|entwirf|gestalt|schreib|generier|entwickl|brauche|benötige|möchte|will/i.test(input))return null;
 const kinds=[[/\b(?:logo|grafik|illustration)\b/i,'Logo oder Grafik erstellen'],[/präsentation|praesentation|powerpoint|pitch.?deck/i,'Präsentation erstellen'],[/homepage|website|webseite|landing.?page/i,'Homepage erstellen'],[/werbetext|marketingtext|produkttext|produktbeschreibung|social.?media.?text|\btext\b/i,'Fertigen Text erstellen']].filter(([pattern])=>(pattern as RegExp).test(input));
 return kinds.length===1?String(kinds[0][1]):null;
}

/* Permanent execution scope: anticipate essential deliverables before work starts. */
function buildExecutionContract(intent:Intent,goal:string){
 const startup=intent.domain.primary==="business"&&/gründ|gruend|selbstst|startup|firma aufbauen|unternehmen aufbauen/i.test(goal);
 const flight=/\b(?:flug|flüge|fluege|flight|hinflug|rückflug)\b/i.test(goal);
 const visual=/logo|marke|branding|homepage|website|webseite|design|flyer|präsentation|praesentation|powerpoint/i.test(goal);
 const m=(key:string,title:string,proof:string,kind="draft")=>({key,title,proof,kind});
 const deliverables=flight?[
 m("flight_request","Reisedaten","Start, Ziel, Hin- und Rückreisedatum sowie Reisendenzahl aus dem Auftrag übernommen; fehlende Angaben ausdrücklich offen"),
 m("flight_comparison","Belegter Flugvergleich","Nur tatsächlich verfügbare Angebote mit Anbieter, Quelle, Abrufzeit, Gesamtpreis für alle Reisenden, Flughäfen, Zeiten, Gepäck und Tarifbedingungen; günstigster nur innerhalb der geprüften Angebote"),
 m("flight_proposal","Kurzer Buchungsvorschlag","Konkretes Angebot und noch fehlende Angaben; keine erfundenen Flugdaten, Preise oder Verfügbarkeit"),
 m("flight_booking","Tatsächlich bestätigte Buchung","Buchungsnummer und Anbieterbeleg vorhanden; vorher konkrete Zustimmung zum aktuellen Gesamtpreis und Angebot. Ohne angebundene Buchungsfunktion bleibt dieser Punkt offen","external_proof")
 ]:startup?[
 m("model","Geschäftsmodell und Zielgruppe","Konkretes Konzept mit klarer Zielgruppe"),
 m("market","Marktanalyse","Echte Belege vorhanden oder Unsicherheiten offengelegt"),
 m("plan","Businessplan","Nutzbares, zusammenhängendes Dokument erstellt"),
 m("finance","Finanzplanung","Startkapital und Liquidität berechnet; offene Preise gekennzeichnet"),
 m("branding","Logo und Markenauftritt","Nutzbare Grafik wirklich erstellt; Konzept allein genügt nicht","asset"),
 m("website","Onlineauftritt und Kundengewinnung","Konkrete einsatzfähige Materialien"),
 m("registration","Rechtsform und amtliche Anmeldungen","Wahl bestätigt, offizielle Registrierung belegbar","external_proof"),
 m("ready","Betriebsbereitschaft","Pflichten und Voraussetzungen tatsächlich nachgewiesen","external_proof")
 ]:visual?[
 m("brief","Gestaltungsziel und Spezifikation","Zweck und Einsatzformat erkannt"),
 m("file","Fertige Design-Datei","Eine nutzbare Datei liegt wirklich vor","asset"),
 m("quality","Qualität und Übergabe","Ergebnis geprüft und übergeben")
 ]:intent.domain.primary==="document_work"?[
 m("source","Grundlagen","Vorhandene Unterlagen erfasst"),
 m("deliver","Dokument","Vollständiges verwendbares Dokument"),
 m("validate","Prüfung","Wesentliche Aussagen verifiziert oder offen")
 ]:intent.domain.primary==="career"?[
 m("role","Zielrolle","Stellenanforderungen und Profil erfasst"),
 m("application","Bewerbung","Nutzbare Unterlagen fertiggestellt"),
 m("review","Freigabe","Aussagen geprüft, Versand getrennt freigegeben")
 ]:intent.domain.primary==="marketing"?[
 m("target","Marketingziel","Zielgruppe und Metrik definiert"),
 m("assets","Werbemittel","Nutzbare Texte oder Grafiken erstellt"),
 m("approval","Veröffentlichung und Wirkung","Externe Maßnahmen nur mit Freigabe; Messung vorbereitet")
 ]:[
 m("goal","Ergebnis verstehen","Lieferobjekt und Erfolgskriterien definiert"),
 m("deliver","Ergebnis erstellen","Konkretes nutzbares Ergebnis statt Ratschlägen"),
 m("verify","Ergebnis prüfen","Qualität, Abhängigkeiten und offene Punkte erkannt")
 ];
 return {version:2,goal:goal.slice(0,1200),scope:flight?"flight_booking":startup?"business_startup":visual?"visual_asset":intent.domain.primary,
   deliverables,industry:industryOf(goal)?.key||null,
   missing_but_nonblocking:startup&&!intent.budget?["Startbudget unbekannt: Rechenfelder statt erfundener Beträge nutzen."]:[],
   instruction:"Erkenne sämtliche elementaren Teilziele selbstständig und ordne sie diesem Auftrag zu. Nutze vorherige bestätigte Entscheidungen. Fehlende nichtkritische Angaben als Platzhalter kennzeichnen. Reale externe Handlungen und rechtlich/finanziell wichtige Entscheidungen brauchen Zustimmung und Belege.",
   done_rule:flight?"Recherche und Vorschlag sind KEINE Buchung. Keine Buchung behaupten, keine persönlichen Reise- oder Zahlungsdaten erfinden, keine ausgefüllte Buchungsseite behaupten. Ohne Buchungsanbindung keine Ausführung zusichern. Das Gesamtziel bleibt offen, bis ein echter Anbieterbeleg und eine Buchungsnummer vorliegen.":"100 Prozent Arbeitsplan ist nicht gleich Ziel erreicht. Echtes Ergebnis muss nutzbar sein und externe Gründungsnachweise erfordern überprüfbare Registrierung.",
   view:"Eingabe, knapper Stand, klares Ergebnis."
 };
}

/* Give every new order a readable persistent name. The database stores its created_at time. */
function projectNameFromRequest(input:string,businessIdea:string,intent:Intent){
 const original=String(input||"").trim();
 const garden=industryOf(original);
 if(garden?.key==="garden_landscaping"&&/gründ|gruend|selbstst|aufbau|aufbauen|start/i.test(original))
   return "Garten- und Landschaftsbau gründen";
 if(businessIdea&&intent.domain.primary==="business"){
   const idea=businessIdea.replace(/\s+/g," ").trim();
   return ("Unternehmen gründen: "+idea).slice(0,95);
 }
 let name=original.split(/[\n.!?]/)[0].trim()
   .replace(/^(bitte\s+)?(ich möchte|ich will|ich würde gerne|ich brauche|hilf mir dabei[,]?\s*|kannst du mir|erstelle mir|mach mir|bitte erstelle|erstelle)\s+/i,"")
   .replace(/^(gerne|mir|dabei[,]?\s*)\s+/i,"")
   .replace(/^(ein|eine|einen)\s+(?=unternehmen|firma|business|logo|website|webseite)/i,"")
   .replace(/\s+/g," ").trim();
 if(!name)name=intent.domain.primary==="business"?"Neuer Unternehmensauftrag":"Neuer Auftrag";
 return name.charAt(0).toLocaleUpperCase("de-DE")+name.slice(1,95);
}

function tokenSet(s:string){
  return new Set(String(s||"").toLowerCase().replace(/[^a-z0-9äöüß ]/g," ").split(/\s+/).filter(x=>x.length>3));
}
function overlapScore(a:string,b:string){
  const A=tokenSet(a),B=tokenSet(b); if(!A.size||!B.size)return 0;
  let hit=0; for(const x of A) if(B.has(x)) hit++;
  return hit/Math.max(1,Math.min(A.size,B.size));
}

async function saveGoalMemory(sb:any,goal:any,ownerId:string,item:any){
  const type=String(item?.type||"note");
  if(!["goal_brief","decision","preference","constraint","fact","followup","result","note"].includes(type)) return {error:"unsupported_memory_type"};
  const key=String(item?.key||"").trim().slice(0,120);
  if(!key) return {error:"memory_key_required"};
  let content=item?.content;
  if(typeof content==="string")content={text:content.slice(0,5000)};
  if(!content || typeof content!=="object" || JSON.stringify(content).length>12000) return {error:"invalid_memory_content"};
  const payload={
    goal_id:goal.id,organization_id:goal.organization_id,owner_id:ownerId,
    memory_key:key,memory_type:type,content,
    source_type:String(item?.source||"pilot").slice(0,60),
    source_ref:item?.source_ref?String(item.source_ref).slice(0,180):null,
    confidence:["low","medium","high"].includes(item?.confidence)?item.confidence:"high",
    importance:Math.max(1,Math.min(5,Number(item?.importance)||3)),
    active:true,updated_at:new Date().toISOString()
  };
  const {error}=await sb.from("goal_memories").upsert(payload,{onConflict:"goal_id,memory_key"});
  return error?{error:error.message}:{saved:true};
}
async function saveMemoryUpdates(sb:any,goal:any,ownerId:string,updates:any){
  if(!Array.isArray(updates))return {saved:0,errors:[]};
  const errors:string[]=[];let saved=0;
  for(const [i,item] of updates.slice(0,12).entries()){
    const r=await saveGoalMemory(sb,goal,ownerId,{...item,key:item?.key||"user_note_"+i,source:"user_input"});
    if(r.error)errors.push(r.error);else saved++;
  }
  return {saved,errors};
}
// A retried command must not create a second action after a lost response.
const PILOT_REQUEST_UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
async function recoverAcceptedFollowup(sb:any,ownerId:string,input:string,requestId:string,body:any){
  const lookup=await sb.from("actions").select("*")
    .eq("pilot_request_id",requestId).maybeSingle();
  if(lookup.error)return {status:503,body:{error:"request_lookup_unavailable",retryable:true}};
  const action=lookup.data;
  if(!action)return null;
  const owned=await sb.from("goals").select("*")
    .eq("id",action.goal_id).eq("owner_id",ownerId).single();
  if(owned.error||!owned.data)return {status:404,body:{error:"request_not_found"}};
  // Reject a token reused for a different intention, even if the text matches.
  if(action.objective!==input || body.force_new_goal===true ||
    (body.existing_goal_id&&String(body.existing_goal_id)!==action.goal_id))
    return {status:409,body:{error:"request_id_conflict",
      message:"Diese Übertragung gehört bereits zu einem anderen Auftrag."}};
  const pending=await sb.from("actions").select("id,goal_id,title,status,created_at")
    .eq("goal_id",action.goal_id).in("status",["ready","pending"])
    .order("created_at",{ascending:true}).limit(1);
  if(pending.error)return {status:503,body:{error:"work_queue_unavailable",retryable:true}};
  const next=pending.data?.[0]||action;
  return {status:200,body:{
    stage:"ready",goal:owned.data,actions:[action],recovered:true,
    continuity:{mode:"existing_goal",goal_id:action.goal_id,confidence:"high",
      reason:"already_received",queued_after_action_id:next.id===action.id?null:next.id},
    next_action:{...next,reason:"Diesen Auftrag hat Pilot bereits erhalten. Es wird kein zweiter Schritt angelegt."},
    decision_journal:{reused:0,keys:[]}
  }};
}

// Initial project creation can be retried without generating another project,
// even if the original HTTP response disappeared after the goal was accepted.
// A partially initialized goal is deliberately NOT reported as ready.
async function initialRequestFingerprint(text:string){
  const bytes=new TextEncoder().encode(text);
  const digest=new Uint8Array(await crypto.subtle.digest("SHA-256",bytes));
  return Array.from(digest,b=>b.toString(16).padStart(2,"0")).join("");
}
async function recoverAcceptedNewGoal(sb:any,ownerId:string,input:string,requestId:string,body:any){
  const lookup=await sb.from("goals").select("*")
    .eq("pilot_request_id",requestId).maybeSingle();
  if(lookup.error)return {status:503,body:{error:"goal_request_lookup_unavailable",retryable:true}};
  const goal=lookup.data;
  if(!goal)return null;
  if(goal.owner_id!==ownerId)return {status:404,body:{error:"request_not_found"}};
  if(body.existing_goal_id||goal.pilot_request_fingerprint!==await initialRequestFingerprint(input))
    return {status:409,body:{error:"request_id_conflict",
      message:"Diese Übertragung gehört bereits zu einem anderen Projektauftrag."}};
  const [pr,ar]=await Promise.all([
    sb.from("plans").select("*").eq("goal_id",goal.id)
      .order("version",{ascending:false}).limit(1),
    sb.from("actions").select("*").eq("goal_id",goal.id)
      .order("created_at",{ascending:true}).limit(100)
  ]);
  if(pr.error||ar.error)return {status:503,body:{error:"goal_recovery_lookup_failed",retryable:true}};
  const plan=pr.data?.[0]||null,actions=ar.data||[];
  if(!plan||!actions.length){
    // The initial request may still be planning in another tab. Never
    // declare success or create a second project in this state.
    return {status:503,body:{error:"goal_setup_incomplete",
      goal_id:goal.id,retryable:true,
      message:"Pilot hat das Projekt angelegt, aber die Planung noch nicht abgeschlossen. Bitte denselben Auftrag erneut prüfen."}};
  }
  const next=actions.find((a:any)=>a.status==="ready")||
    actions.find((a:any)=>a.status==="pending")||actions[0];
  return {status:200,body:{
    stage:"ready",recovered:true,goal,plan,actions,
    next_action:{...next,reason:"Pilot hat diesen Projektauftrag bereits übernommen. Es wurde kein zweites Projekt angelegt."},
    continuity:{mode:"new_goal",goal_id:goal.id,confidence:"high",reason:"already_received"},
    decision_journal:{reused:0,keys:[]}
  }};
}

/* User decisions are authoritative. Detect an explicit request to replace a prior
   choice, not ordinary background discussion of alternative options. */
function explicitDecisionProposal(input:string,latest:Map<string,any>){
  const request=String(input||"").normalize("NFKC").trim();
  if(!request)return null;
  const legal=latest.get("legal_form");
  if(legal?.event_type==="set"){
    const options:Array<[string,RegExp]>=[
      ["einzelunternehmen",/\b(?:einzelunternehmen|einzelunternehmer(?:in)?)\b/i],
      ["gmbh",/\bgmbh\b/i],
      ["ug",/\bug\b(?:\s*\(haftungsbeschränkt\))?/i]
    ];
    const found=options.filter(([,pattern])=>pattern.test(request));
    const changing=/\b(rechtsform|statt|anstelle|wechseln|wechsel|umwandeln|ändern|ändere|aendern|aendere|künftig|kuenftig|ab jetzt|doch lieber|entscheide mich|soll.*(?:werden|sein))\b/i.test(request);
    // Two different legal forms in the same sentence may be a comparison, not a choice.
    if(changing&&found.length===1&&found[0][0]!==legal.decision_value){
      const mention=found[0][1].exec(request);
      const beforeMention=request.slice(Math.max(0,(mention?.index||0)-16),mention?.index||0);
      if(!/\b(?:keine?|nicht|ohne)\s*$/i.test(beforeMention))
        return {decision_key:"legal_form",proposed_value:found[0][0],current:legal,
          reason:"explicit_legal_form_change"};
    }
  }
  const patterns:Array<[string,RegExp]>=[
    ["company_name",/(?:ändere|aendere|aktualisiere|setze)\s+(?:(?:den|die|das|meinen|unsere[nr]?)\s+)?(?:unternehmensnamen|firmennamen|firmenname|unternehmensname|firma)\s+(?:auf|zu|in)\s+(.+?)(?:[.!?\n]|$)/i],
    ["company_name",/(?:unternehmensnamen|firmennamen|firma|unternehmen)\s+(?:auf|in|zu)\s+(.+?)\s+(?:ändern|aendern|umbenennen)(?:[.!?\n]|$)/i],
    ["company_name",/(?:nenne|benenne)\s+(?:meine\s+)?(?:firma|unternehmen)\s+(?:jetzt\s+)?(.+?)(?:[.!?\n]|$)/i],
    ["budget",/(?:ändere|aendere|aktualisiere|setze)\s+(?:(?:das|mein|unser)\s+)?(?:budget|startkapital)\s+(?:auf|zu)\s+(.+?)(?:[.!?\n]|$)/i],
    ["budget",/(?:budget|startkapital)\s+(?:auf|zu)\s+(.+?)\s+(?:ändern|aendern|setzen|festlegen)(?:[.!?\n]|$)/i],
    ["industry",/(?:ändere|aendere|wechsel|wechsle)\s+(?:(?:die|meine|unsere)\s+)?(?:branche|geschäftsfeld)\s+(?:auf|zu|in)\s+(.+?)(?:[.!?\n]|$)/i],
    ["industry",/(?:branche|geschäftsfeld)\s+(?:auf|zu)\s+(.+?)\s+(?:ändern|aendern|wechseln)(?:[.!?\n]|$)/i],
    ["brand_style",/(?:ändere|aendere|aktualisiere|setze)\s+(?:(?:den|die|das|mein|unser)\s+)?(?:gestaltungsstil|designstil|farbschema)\s+(?:auf|zu|in)\s+(.+?)(?:[.!?\n]|$)/i],
    ["brand_style",/(?:gestaltungsstil|designstil|farbschema)\s+(?:auf|zu)\s+(.+?)\s+(?:ändern|aendern|umstellen)(?:[.!?\n]|$)/i]
  ];
  for(const [key,pattern] of patterns){
    const existing=latest.get(key);
    if(existing?.event_type!=="set")continue;
    const hit=pattern.exec(request);
    if(!hit)continue;
    const proposed=hit[1].replace(/\s+/g," ").trim().slice(0,240);
    if(proposed.length<2||proposed.length>200)continue;
    if(proposed.toLocaleLowerCase("de-DE")===String(existing.decision_value).toLocaleLowerCase("de-DE"))continue;
    return {decision_key:key,proposed_value:proposed,current:existing,
      reason:"explicit_project_decision_change"};
  }
  return null;
}
/* Contextual follow-up routing: select an existing project only when its identity
   is independently clear; do not let model confidence invent ownership/context. */
const GOAL_GENERIC_WORDS=new Set([
  "projekt","projekte","auftrag","aufträge","unternehmen","firma","firmen","business",
  "gründung","gründen","gruenden","gruendung","aufbauen","erstellen","erstelle",
  "website","webseite","logo","branding","marke","gestaltung","marketing",
  "geschäft","geschaeft","startup","neues","neue","neuer","meine","meinen",
  "meiner","meinem","einen","einem","einer","eines","für","fuer",
  "bitte","macht","machen","eine","einer","einem","mein","dein","deine",
  "unser","unsere","beim","dazu","dieses","diesem","darauf","und","oder"
]);
function distinctiveGoalWords(value:string){
  return [...tokenSet(value)].filter(w=>w.length>=4&&!GOAL_GENERIC_WORDS.has(w));
}
function goalChoices(items:any[]){
  return items.slice(0,6).map((g:any)=>({
    id:g.id,title:String(g.title||"Projekt").slice(0,110),
    status:g.status,
    description:String(g.desired_outcome||g.description||"").slice(0,190)
  }));
}
async function resolveGoalContinuity(sb:any,base:string,pub:string,auth:string,userId:string,input:string,intent:Intent,body:any){
  if(body.force_new_goal===true)return {decision:"new",confidence:"high",reason:"user_forced_new_goal"};
  // An explicitly selected current goal overrides ambiguous phrases such as
  // "Neue Firma" inside a requested name change.
  if(body.existing_goal_id)return {
    decision:"existing",confidence:"high",goal_id:String(body.existing_goal_id),
    reason:"user_selected_existing_goal"
  };
  const explicitlyNew=/(?:\b(?:erstelle|starte|beginne|gründe|gruende|lege|eröffne|eroeffne)\b.{0,35}\b(?:neues? (?:unternehmen|business|projekt|ziel)|neue firma|andere firma)\b|\b(?:neues? (?:unternehmen|business|projekt|ziel)|neue firma|andere firma)\b.{0,35}\b(?:anlegen|starten|beginnen|gründen|gruenden|erstellen|aufbauen)\b|^\s*(?:ein(?:e|en)?\s+)?(?:neues? (?:unternehmen|business|projekt|ziel)|neue firma)\s*[.!?]?\s*$)/i.test(input);
  if(explicitlyNew)return {decision:"new",confidence:"high",reason:"explicit_new_project"};

  const gr=await sb.from("goals")
    .select("id,title,description,desired_outcome,domain,status,created_at,updated_at")
    .eq("owner_id",userId).in("status",["active","achieved"])
    .order("updated_at",{ascending:false}).limit(16);
  if(gr.error)return {decision:"unavailable",confidence:"low",reason:"goal_lookup_unavailable"};
  const candidates=gr.data||[];
  if(!candidates.length)return {decision:"new",confidence:"high",reason:"no_existing_goals"};

  const active=candidates.filter((g:any)=>g.status==="active");
  const requestWords=tokenSet(input);
  // An explicit project/brand name is stronger evidence than a model guess.
  const names=candidates.map((g:any)=>({
    goal:g,matching:distinctiveGoalWords(String(g.title||""))
      .filter(word=>requestWords.has(word))
  })).filter((item:any)=>item.matching.length>0)
    .sort((a:any,b:any)=>b.matching.length-a.matching.length);
  if(names.length===1||(
    names.length>1&&names[0].matching.length>=2&&
    names[0].matching.length>names[1].matching.length
  )){
    const goal=names[0].goal;
    return {decision:"existing",confidence:"high",goal_id:goal.id,goal,
      reason:"explicit_project_name",matching_terms:names[0].matching.length};
  }
  // Also recognize an explicitly confirmed company name, even if the project title
  // was originally a generic prompt. Never rely on an unconfirmed AI brand name.
  const companyRows=await sb.from("pilot_decision_journal")
    .select("goal_id,decision_value,event_type,id").eq("owner_id",userId)
    .eq("decision_key","company_name").in("goal_id",candidates.map((g:any)=>g.id))
    .order("id",{ascending:false}).limit(120);
  if(companyRows.error)return {decision:"unavailable",confidence:"low",reason:"decision_journal_unavailable"};
  const companyByGoal=new Map<string,any>();
  for(const entry of companyRows.data||[])if(!companyByGoal.has(entry.goal_id))companyByGoal.set(entry.goal_id,entry);
  const normalizedInput=input.normalize("NFKC").toLowerCase();
  const explicitCompanies=candidates.filter((g:any)=>{
    const company=companyByGoal.get(g.id);
    if(!company||company.event_type!=="set")return false;
    const value=String(company.decision_value||"").normalize("NFKC").toLowerCase().trim();
    return value.length>=4&&normalizedInput.includes(value);
  });
  if(explicitCompanies.length===1){
    const goal=explicitCompanies[0];
    return {decision:"existing",confidence:"high",goal_id:goal.id,goal,reason:"confirmed_company_name"};
  }
  if(explicitCompanies.length>1){
    return {decision:"ask",confidence:"medium",goal_id:explicitCompanies[0].id,
      goal:explicitCompanies[0],candidates:goalChoices(explicitCompanies),
      reason:"multiple_confirmed_company_names"};
  }
  const followup=/\b(logo|logos|branding|brand|website|webseite|landingpage|visitenkarte|flyer|anzeige|kampagne|rechnung|angebot|präsentation|praesentation|design|entwurf|broschüre|broschuere|texte|grafik|farbschema|social.media|rechtsform|firmennamen?|unternehmensnamen?|budget|startkapital|branche|geschäftsfeld|gestaltungsstil|designstil)\b/i.test(input);
  const branding=/\b(logo|logos|branding|brand|website|webseite|landingpage|visitenkarte|flyer|anzeige|kampagne|design|grafik|farbschema|social.media)\b/i.test(input);
  const matchingIndustry=industryOf(input);
  const isFounding=/\b(gründen|gruenden|gründe|gründung|aufbauen|eröffnen)\b/i.test(input);
  const byNameAmbiguous=names.length>1;
  // "Logo" with just one live project: use its existing brief and decisions.
  // Multiple project candidates: ask once and never silently choose the most recent.
  const eligible=branding?active.filter((g:any)=>["business","marketing"].includes(g.domain?.primary)):active;
  const plausible=eligible.length?eligible:active;
  if(followup&&!byNameAmbiguous){
    if(plausible.length===1){
      const goal=plausible[0];
      return {decision:"existing",confidence:"high",goal_id:goal.id,goal,
        reason:"unique_active_followup"};
    }
    if(plausible.length>1){
      return {decision:"ask",confidence:"medium",goal_id:plausible[0].id,
        goal:plausible[0],candidates:goalChoices(plausible),
        reason:"multiple_plausible_projects"};
    }
  }
  if(byNameAmbiguous){
    const matches=names.map((item:any)=>item.goal);
    return {decision:"ask",confidence:"medium",goal_id:matches[0].id,
      goal:matches[0],candidates:goalChoices(matches),
      reason:"ambiguous_project_name"};
  }
  if(matchingIndustry&&isFounding){
    const general=active.filter((g:any)=>{
      const old=[g.title,g.description,g.desired_outcome].filter(Boolean).join(" ");
      return ["business","marketing"].includes(g.domain?.primary)&&!industryOf(old);
    });
    if(general.length){
      return {decision:"ask",confidence:"medium",goal_id:general[0].id,
        goal:general[0],candidates:goalChoices(general),
        reason:"specific_industry_vs_existing_general_business_goal"};
    }
  }

  // For complex requests not identifiable as a follow-up, preserve the AI-assisted
  // matching path, but never permit semantic "high" confidence alone to pick
  // among multiple plausible active projects.
  const memoryRes=await sb.from("goal_memories")
    .select("goal_id,memory_key,memory_type,content,importance")
    .eq("owner_id",userId).in("goal_id",candidates.map((g:any)=>g.id))
    .eq("active",true).order("importance",{ascending:false}).limit(120);
  const memories=memoryRes.data||[];
  const heuristic=candidates.map((g:any)=>{
    const memoryText=memories.filter((m:any)=>m.goal_id===g.id)
      .map((m:any)=>JSON.stringify(m.content).slice(0,600)).join(" ");
    let score=overlapScore(input,[g.title,g.description,g.desired_outcome,memoryText].filter(Boolean).join(" "));
    if(g.domain?.primary&&g.domain.primary===intent.domain.primary)score+=0.18;
    if(g.status==="active")score+=0.12;
    return {goal_id:g.id,score:Math.min(1,score),title:g.title};
  }).sort((a:any,b:any)=>b.score-a.score);
  const top=heuristic[0],second=heuristic[1];
  if(top?.score>=0.72&&(!second||top.score-second.score>=0.32)){
    const goal=candidates.find((g:any)=>g.id===top.goal_id);
    return {decision:"existing",confidence:"high",goal_id:goal.id,goal,
      reason:"strong_context_match",score:top.score};
  }
  let aiMatch:any=null;
  try{
    const rr=await fetch(base+"/functions/v1/ai-gateway",{
      method:"POST",headers:{"content-type":"application/json","apikey":pub,"authorization":auth},
      body:JSON.stringify({task_type:"goal_match",input:{
        new_request:input,interpreted_domain:intent.domain,
        candidates:candidates.map((g:any)=>({id:g.id,title:g.title,
          description:g.description,desired_outcome:g.desired_outcome,domain:g.domain,status:g.status}))
      },quality_level:"high",sensitivity:"standard",
      required_fields:["goal_id","confidence","relationship","reason"]})
    });
    if(rr.ok){const answer=await rr.json();aiMatch=answer.output||null}
  }catch{}
  const aiGoal=candidates.find((g:any)=>g.id===aiMatch?.goal_id);
  const aiConfidence=String(aiMatch?.confidence||"").toLowerCase();
  if(aiGoal&&["high","very_high"].includes(aiConfidence)&&
     (active.length<=1||(top?.goal_id===aiGoal.id&&top.score>=0.64&&
       (!second||top.score-second.score>=0.26)))){
    return {decision:"existing",confidence:"high",goal_id:aiGoal.id,goal:aiGoal,
      reason:"semantic_and_context_match"};
  }
  if(aiGoal||top?.score>=0.30||followup){
    const selected=aiGoal||candidates.find((g:any)=>g.id===top?.goal_id)||plausible[0]||candidates[0];
    const possible=active.length>1?active:possibleGoals(selected,candidates);
    return {decision:"ask",confidence:"medium",goal_id:selected.id,goal:selected,
      candidates:goalChoices(possible),reason:"goal_context_ambiguous"};
  }
  return {decision:"new",confidence:"high",reason:"no_meaningful_match"};
}
function possibleGoals(selected:any,candidates:any[]){
  return [selected,...candidates.filter((g:any)=>g.id!==selected.id)].slice(0,6);
}

const pilotCorsHandler=async(req:Request)=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers:{...cors,"access-control-allow-origin":"*","access-control-allow-headers":"authorization, apikey, content-type"}});
  if(req.method!=="POST") return Response.json({error:"method_not_allowed"},{status:405,headers:cors});
  const auth=req.headers.get("Authorization")||"";
  if(!auth.startsWith("Bearer ")) return Response.json({error:"auth_required"},{status:401,headers:cors});
  const pubs=JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")||"{}");
  const sb=createClient(Deno.env.get("SUPABASE_URL")!,pubs.default,{global:{headers:{Authorization:auth}},auth:{persistSession:false,autoRefreshToken:false}});
  const token=auth.slice(7);
  const u=await sb.auth.getUser(token);
  if(u.error||!u.data.user) return Response.json({error:"invalid_session"},{status:401,headers:cors});
  const user=u.data.user;
  let body:any={}; try{body=await req.json()}catch{return Response.json({error:"invalid_json"},{status:400,headers:cors})}
  const input=String(body.input||"").trim();
  if(!input) return Response.json({error:"input_required"},{status:400,headers:cors});
  const requestId=body.request_id===undefined?null:String(body.request_id||"").trim();
  if(requestId!==null&&!PILOT_REQUEST_UUID.test(requestId))
    return Response.json({error:"request_id_invalid"},{status:400,headers:cors});

  const guardBase=Deno.env.get("SUPABASE_URL")!;
  const guardPub=JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")||"{}").default;
  const guard=await fetch(guardBase+"/functions/v1/safety-gate",{
    method:"POST",headers:{"content-type":"application/json","apikey":guardPub,"authorization":auth},
    body:JSON.stringify({phase:"input",text:JSON.stringify({input,intent:body.intent||null,answers:body.answers||null,memory_updates:body.memory_updates||null})})
  }).catch(()=>null);
  const verdict=await guard?.json().catch(()=>({allowed:false,reason_code:"safety_check_unavailable"}));
  if(!guard?.ok||verdict?.allowed!==true)
    return Response.json({error:guard?.status===403?"request_blocked_by_policy":"safety_check_unavailable",diagnostic_code:verdict?.diagnostic_code||null,reason_code:verdict?.reason_code||"safety_check_unavailable"},
      {status:guard?.status===403?403:503,headers:cors});
  // Retries are checked before classification, planning or any new writes.
  // Follow-up actions and initial projects share the same client receipt.
  if(requestId){
    const followup=await recoverAcceptedFollowup(sb,user.id,input,requestId,body);
    if(followup)return Response.json(followup.body,{status:followup.status,headers:cors});
    const initial=await recoverAcceptedNewGoal(sb,user.id,input,requestId,body);
    if(initial)return Response.json(initial.body,{status:initial.status,headers:cors});
  }
  let intent:Intent=body.intent||intentOf(input);
  const base=Deno.env.get("SUPABASE_URL")!;
  const pub=JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")||"{}").default;
  let classifyTelemetry:any=null;
  if(!body.intent){
    try{
      const rr=await fetch(base+"/functions/v1/ai-gateway",{method:"POST",headers:{"content-type":"application/json","apikey":pub,"authorization":auth},body:JSON.stringify({task_type:"classify",input:{text:input},quality_level:"fast",sensitivity:"standard",required_fields:["objective","domain","confidence"]})});
      if(rr.ok){classifyTelemetry=await rr.json();const o=classifyTelemetry.output;if(intent.domain.primary==="general"&&["business","marketing","medical_documentation","career","document_work","general"].includes(o?.domain)){intent={...intent,domain:{...intent.domain,primary:o.domain,confidence:o.confidence||intent.domain.confidence}}}}
    }catch{}
  }

  const continuity=await resolveGoalContinuity(sb,base,pub,auth,user.id,input,intent,body);
  if(continuity.decision==="unavailable")
    return Response.json({error:"goal_context_unavailable",retryable:true},
      {status:503,headers:cors});
  if(continuity.decision==="ask"){
    return Response.json({
      stage:"goal_resolution",
      intent,
      candidate_goal:{
        id:continuity.goal_id,
        title:continuity.goal?.title||"Bestehendes Ziel",
        description:continuity.goal?.description||null,
        desired_outcome:continuity.goal?.desired_outcome||null
      },
      candidate_goals:continuity.candidates||goalChoices([continuity.goal]),
      reason:continuity.reason,
      question:(continuity.candidates?.length||0)>1?
        "Zu welchem bestehenden Projekt gehört dieser Auftrag?":
        "Gehört das zu deinem bestehenden Projekt oder soll ein neues entstehen?"
    },{headers:cors});
  }
  const foundingIndustry=industryOf(input)&&/\b(gründen|gruenden|gründe|gründung|aufbauen|eröffnen)\b/i.test(input);
  // The existing goal already carries its brief and choices; never restart initial
  // qualification solely because the follow-up also discusses founding.
  const questions=continuity.decision==="existing"?[]:clarification(intent);
  if(questions.length && !body.answers && !body.skip_clarification){
    return Response.json({stage:"clarification",intent,questions},{headers:cors});
  }
  const answers=body.answers||{};
  const businessIdea=String(answers.business_idea||"").trim().slice(0,1200);
  const industry=industryOf(input);
  const serviceOffer=industry?String(answers.services||"").trim().slice(0,1200):"";
  const serviceArea=industry?String(answers.service_area||"").trim().slice(0,300):"";
  const qualification=[businessIdea?"Geschäftsidee: "+businessIdea:null,serviceOffer?"Geplantes Leistungsangebot: "+serviceOffer:null,serviceArea?"Einsatzgebiet: "+serviceArea:null].filter(Boolean).join("\n");
  const desiredOutcome=String(answers.outcome||(qualification?intent.desiredOutcome+"\n"+qualification:intent.desiredOutcome)).trim();
  const budget=String(answers.budget||intent.budget||"").trim()||null;
  const check=reality(intent,desiredOutcome);
  const executionContract=buildExecutionContract(intent,desiredOutcome);

  const membership=await sb.from("organization_members").select("organization_id").eq("user_id",user.id).eq("active",true).limit(1).single();
  if(membership.error) return Response.json({error:"workspace_not_found",detail:membership.error.message},{status:409,headers:cors});
  const orgId=membership.data.organization_id;
  const title=projectNameFromRequest(input,businessIdea,intent);


  if(continuity.decision==="existing" && continuity.goal_id){
    const existingRes=await sb.from("goals").select("*").eq("id",continuity.goal_id).eq("owner_id",user.id).single();
    if(existingRes.error) return Response.json({error:"existing_goal_not_found"},{status:404,headers:cors});
    const existingGoal=existingRes.data;

    const ctxRes=await sb.from("context_items").select("context_type,key,value,source_type,confidence,created_at").eq("goal_id",existingGoal.id).eq("active",true).order("created_at",{ascending:false}).limit(50);
    const resultRes=await sb.from("results").select("id,title,result_type,content,structured_content,quality_status,created_at").eq("goal_id",existingGoal.id).order("created_at",{ascending:false}).limit(20);
    const memoryRes=await sb.from("goal_memories").select("memory_key,memory_type,content,importance,confidence,source_type,source_ref,updated_at")
      .eq("goal_id",existingGoal.id).eq("owner_id",user.id).eq("active",true)
      .order("importance",{ascending:false}).order("updated_at",{ascending:false}).limit(80);
    // Project decisions override unconfirmed assumptions; revocations stay revoked.
    const decisionsRead=await sb.from("pilot_decision_journal")
      .select("id,decision_key,decision_value,event_type,source_type,created_at")
      .eq("goal_id",existingGoal.id).eq("owner_id",user.id)
      .order("id",{ascending:false}).limit(150);
    if(decisionsRead.error)return Response.json({error:"decision_journal_unavailable",retryable:true},
      {status:503,headers:cors});
    const latestDecisions=new Map<string,any>();
    for(const entry of decisionsRead.data||[])
      if(!latestDecisions.has(entry.decision_key))latestDecisions.set(entry.decision_key,entry);
    const conflicting=explicitDecisionProposal(input,latestDecisions);
    if(conflicting){
      const entry=conflicting.current;
      return Response.json({
        stage:"decision_conflict",intent,
        goal:{id:existingGoal.id,title:existingGoal.title},
        decision:{
          key:conflicting.decision_key,old_value:entry.decision_value,
          new_value:conflicting.proposed_value,revision_id:entry.id,
          reason:conflicting.reason
        },
        question:"Der neue Auftrag würde eine bestätigte Projektentscheidung ändern. Welche Angabe gilt?"
      },{headers:cors});
    }
    const confirmedDecisions=[...latestDecisions.values()]
      .filter((entry:any)=>entry.event_type==="set")
      .map((entry:any)=>({key:entry.decision_key,value:entry.decision_value,
        source:entry.source_type,confirmed_at:entry.created_at}));
    const docRes=await sb.from("documents").select("id,title,filename,mime_type,processing_status,metadata,created_at").eq("owner_id",user.id).order("created_at",{ascending:false}).limit(30);
    const inheritedContext={
      goal:{id:existingGoal.id,title:existingGoal.title,description:existingGoal.description,desired_outcome:existingGoal.desired_outcome,domain:existingGoal.domain},
      context:ctxRes.data||[],
      memories:memoryRes.data||[],
      decisions:confirmedDecisions,
      results:resultRes.data||[],
      documents:(docRes.data||[]).filter((d:any)=>d.metadata?.goal_id===existingGoal.id)
    };

    const nextPlan=await sb.from("plans").select("*").eq("goal_id",existingGoal.id).order("version",{ascending:false}).limit(1);
    const currentPlan=nextPlan.data?.[0]||null;
    // Enqueue follow-ups after the existing work. A ready predecessor has priority,
    // even if this follow-up could otherwise begin immediately.
    const queue=await sb.from("actions").select("id,status,created_at")
      .eq("goal_id",existingGoal.id).in("status",["ready","pending"])
      .order("created_at",{ascending:true}).limit(1);
    if(queue.error)return Response.json({error:"existing_work_queue_unavailable"},
      {status:503,headers:cors});
    const predecessor=queue.data?.[0]||null;
    const followupStatus=predecessor?"pending":"ready";
    // Insert the unique action BEFORE ancillary milestones/memories. Two parallel
    // submissions may race; only one may create the durable work item.
    const ar=await sb.from("actions").insert({
      goal_id:existingGoal.id,
      plan_id:currentPlan?.id||null,
      milestone_id:null,
      pilot_request_id:requestId,
      title:(input.split(/[.!?\n]/)[0]||"Folgeauftrag").slice(0,120),
      objective:input,
      status:followupStatus,
      priority:"high",
      owner_type:"pilot",
      recommended_mode:"do_it",
      blocking:false
    }).select("*").single();
    if(ar.error){
      if(ar.error.code==="23505"&&requestId){
        const recovered=await recoverAcceptedFollowup(sb,user.id,input,requestId,body);
        if(recovered)return Response.json(recovered.body,{status:recovered.status,headers:cors});
      }
      return Response.json({error:"followup_action_create_failed",retryable:true},
        {status:503,headers:cors});
    }
    // Only the accepted action gets a milestone; failed duplicate attempts create
    // neither a second milestone nor duplicate follow-up memories.
    if(currentPlan){
      const mr=await sb.from("milestones").insert({
        goal_id:existingGoal.id,plan_id:currentPlan.id,
        phase_key:"followup_"+ar.data.id,
        title:"Folgeauftrag abgeschlossen",desired_state:input,
        success_condition:"Der Folgeauftrag ist überprüfbar abgeschlossen.",
        status:"active",weight:1
      }).select("id").single();
      if(!mr.error){
        const linked=await sb.from("actions").update({milestone_id:mr.data.id})
          .eq("id",ar.data.id).select("*").single();
        if(!linked.error)ar.data=linked.data;
      }
    }

    await sb.from("context_items").insert({
      organization_id:orgId,goal_id:existingGoal.id,context_type:"followup_request",key:"followup_"+Date.now(),
      value:{input,intent,qualification:industry?{industry_key:industry.key,industry_label:industry.label,services:serviceOffer||null,service_area:serviceArea||null}:null,inherited_context_summary:{context_items:inheritedContext.context.length,results:inheritedContext.results.length,documents:inheritedContext.documents.length}},
      source_type:"user_input",scope:"goal",confidence:continuity.confidence||"high",active:true
    });
    const followupMemory=await saveGoalMemory(sb,existingGoal,user.id,{
      key:"followup_"+ar.data.id,type:"followup",
      content:{request:input,action_id:ar.data.id,linked_goal_id:existingGoal.id,industry:industry?.key||null,services:serviceOffer||null,service_area:serviceArea||null,related_scope:executionContract.scope},
      source:"user_input",source_ref:ar.data.id,importance:4
    });
    const qualificationMemory=industry && serviceOffer ? await saveGoalMemory(sb,existingGoal,user.id,{
      key:"industry_and_services",type:"fact",
      content:{industry_key:industry.key,industry_label:industry.label,services:serviceOffer,service_area:serviceArea||null},
      source:"user_input",source_ref:ar.data.id,importance:5
    }):null;
    const userMemories=await saveMemoryUpdates(sb,existingGoal,user.id,body.memory_updates);
    // Keep the active Pilot state untouched: do not discard an ongoing review,
    // change the existing industry avatar, or lower the stored risk assessment.
    return Response.json({
      stage:"ready",execution_contract:executionContract,
      continuity:{mode:"existing_goal",goal_id:existingGoal.id,confidence:continuity.confidence,
        reason:continuity.reason,queued_after_action_id:predecessor?.id||null},
      intent,
      goal:existingGoal,
      inherited_context:inheritedContext,
      memory_status:{followup_saved:!followupMemory.error,updates:userMemories,warning:followupMemory.error||null},
      decision_journal:{reused:confirmedDecisions.length,keys:confirmedDecisions.map((d:any)=>d.key)},
      actions:[ar.data],
      next_action:{...(predecessor||ar.data),
        reason:predecessor?"Der Folgeauftrag ist vorgemerkt. Pilot beendet zuerst den bereits offenen Schritt.":
          "Dieser Folgeauftrag gehört zum bestehenden Ziel und nutzt dessen bisherigen Kontext."}
    },{headers:cors});
  }

  const profileRes=await sb.from("domain_profiles").select("*").eq("domain_key",intent.domain.primary).eq("active",true).single();
  const profile=profileRes.data||{domain_key:intent.domain.primary,avatar_variant:"general",quality_rules:{},evidence_rules:{},safety_rules:{}};

  const goalIns=await sb.from("goals").insert({
    organization_id:orgId,owner_id:user.id,title,description:intent.objective,desired_outcome:desiredOutcome,
    success_criteria:executionContract.deliverables.map(x=>({key:x.key,required:true,definition:x.proof,kind:x.kind})),constraints:intent.constraints,resources:[],domain:intent.domain,timeframe:intent.timeframe,budget,
    status:"active",readiness:"ready_with_assumptions",
    pilot_request_id:requestId,
    pilot_request_fingerprint:requestId?await initialRequestFingerprint(input):null
  }).select("*").single();
  if(goalIns.error){
    if(goalIns.error.code==="23505"&&requestId){
      const existing=await recoverAcceptedNewGoal(sb,user.id,input,requestId,body);
      if(existing)return Response.json(existing.body,{status:existing.status,headers:cors});
    }
    return Response.json({error:"goal_create_failed",retryable:true},{status:503,headers:cors});
  }
  const goal=goalIns.data;

  const contextRows:any[]=[
    {organization_id:orgId,goal_id:goal.id,context_type:"intent",key:"execution_brief",value:intent,source_type:"user_input",scope:"goal",confidence:intent.confidence,active:true},
    {organization_id:orgId,goal_id:goal.id,context_type:"reality_check",key:"feasibility",value:check,source_type:"pilot",scope:"goal",confidence:"medium",active:true},
     {organization_id:orgId,goal_id:goal.id,context_type:"execution_contract",key:"deliverables",value:executionContract,source_type:"pilot",scope:"goal",confidence:"medium",active:true},
    {organization_id:orgId,goal_id:goal.id,context_type:"domain_profile",key:"active_profile",value:{domain_key:profile.domain_key,quality_rules:profile.quality_rules,evidence_rules:profile.evidence_rules,safety_rules:profile.safety_rules,avatar_variant:profile.avatar_variant,secondary_domains:intent.domain.secondary},source_type:"domain_intelligence",scope:"goal",confidence:intent.domain.confidence,active:true}
  ];
  if(industry){
    contextRows.push({organization_id:orgId,goal_id:goal.id,context_type:"business_qualification",key:"industry_and_services",
      value:{industry_key:industry.key,industry_label:industry.label,service_offer:serviceOffer||null,service_area:serviceArea||null},
      source_type:"user_input",scope:"goal",confidence:"high",active:true});
  }
  const ctx=await sb.from("context_items").insert(contextRows);
  if(ctx.error) return Response.json({error:"context_create_failed",detail:ctx.error.message},{status:500,headers:cors});
  const initialMemory=await saveGoalMemory(sb,goal,user.id,{
    key:"goal_brief",type:"goal_brief",
    content:{objective:intent.objective,desired_outcome:desiredOutcome,domain:intent.domain,
      industry:industry?.key||null,services:serviceOffer||null,service_area:serviceArea||null,
      constraints:intent.constraints,budget,timeframe:intent.timeframe},
    source:"user_input",source_ref:goal.id,importance:5
  });
  const contractMemory=await saveGoalMemory(sb,goal,user.id,{key:"execution_contract",type:"goal_brief",content:executionContract,source:"pilot",source_ref:goal.id,confidence:"medium",importance:5});
   const initialUserMemories=await saveMemoryUpdates(sb,goal,user.id,body.memory_updates);

  const ps=await sb.from("pilot_states").upsert({organization_id:orgId,user_id:user.id,goal_id:goal.id,domain_key:intent.domain.primary,work_state:"planning",attention_required:false,risk_level:profile?.safety_rules?.sensitivity==="sensitive"?"moderate":"low",avatar_variant:profile.avatar_variant||"general",message:"Pilot hat die Domain erkannt und plant den nächsten Schritt.",updated_at:new Date().toISOString()},{onConflict:"user_id,goal_id"}).select("*").single();
  if(ps.error) return Response.json({error:"pilot_state_failed",detail:ps.error.message},{status:500,headers:cors});

  const researchCue=executionContract.scope==="flight_booking"||/\b(aktuell|current|latest|markt|market|wettbewerb|competitor|preis|pricing|gesetz|law|regulation|trend|quelle|source|research|recherch|news|statistik|statistics|benchmark|anbieter|vergleich|compare)\b/i.test(input);
  const researchAllowed=(profile?.safety_rules?.sensitivity||"standard")!=="sensitive";
  let researchContext:any=null;
  if(researchCue&&researchAllowed){
    try{
      const rq=await fetch(base+"/functions/v1/research-intelligence",{method:"POST",headers:{"content-type":"application/json","apikey":pub,"authorization":auth},body:JSON.stringify({
        query:input,goal_id:goal.id,language:/\b(the|and|with|for|market|business|current)\b/i.test(input)?"en":"de",sources:["wikipedia","google_legacy"],limit:6
      })});
      if(rq.ok){
        researchContext=await rq.json();
        await sb.from("context_items").insert({
          organization_id:orgId,goal_id:goal.id,context_type:"research",key:"public_evidence",
          value:{answer:researchContext.answer,sources:researchContext.sources,uncertainties:researchContext.uncertainties,quality:researchContext.quality,result_id:researchContext.result?.id||null},
          source_type:"research_intelligence",scope:"goal",confidence:researchContext.quality?.evidence_gate==="passed"?"high":"medium",active:true
        });
      }
    }catch{}
  }

  const isFlight=executionContract.scope==="flight_booking";
  const directTask=directCreativeTask(input,intent);
  const defaultPhaseNames=isFlight?[
    "Aktuelle Flugangebote für die angegebenen Reisedaten recherchieren und vergleichen. Nur belegte Gesamtpreise für alle Reisenden, Quellen und Abrufzeit verwenden. Fehlende Gepäckangaben offenhalten; keine Live-Verfügbarkeit aus Suchtreffern ableiten.",
    "Die recherchierten Flugangebote auf Route, Reisedaten, Reisendenzahl, Gesamtpreis, Gepäck und Tarifbedingungen prüfen. Fehlende Angebotsdaten ausdrücklich nennen; nur innerhalb der tatsächlich geprüften Angebote vergleichen.",
    "Einen kurzen Buchungsvorschlag aus den belegten Angeboten vorbereiten. Fehlende Anbindung für automatisches Ausfüllen und Buchen ausdrücklich nennen. Keine ausgefüllte Buchungsseite und keine erfolgreiche Buchung behaupten. Keine Zahlung oder Reservierung auslösen."
  ]:plans[intent.domain.primary]||plans.general;
  const complexPlan=check.feasibility==="high_risk"||(intent.domain.secondary||[]).length>0||(intent.unknowns||[]).length>=2||input.length>500;
  const planningSensitivity=profile?.safety_rules?.sensitivity||"standard";
  const planningQuality=profile?.quality_rules?.minimum_quality==="high"||complexPlan?"high":"standard";
  const planningTask=complexPlan?"complex_plan":"plan";
  let planGateway:any=null;
  if(!directTask)try{
    const endpoint=(planningQuality==="high"&&planningSensitivity!=="sensitive")?"best-of-ai":"ai-gateway";
    const payload=endpoint==="best-of-ai"
      ? {task_type:planningTask,goal_id:goal.id,input:{goal:desiredOutcome,execution_contract:executionContract,domain:intent.domain,reality_check:check,constraints:intent.constraints,unknowns:intent.unknowns,research:researchContext?{answer:researchContext.answer,sources:researchContext.sources,uncertainties:researchContext.uncertainties}:null},mode:"auto",sensitivity:planningSensitivity,required_fields:["strategy","phases","next_action"],evidence_required:profile?.evidence_rules?.required_for_critical_claims===true||!!researchContext,human_review_required:profile?.safety_rules?.human_review===true}
      : {task_type:planningTask,goal_id:goal.id,input:{goal:desiredOutcome,execution_contract:executionContract,domain:intent.domain,reality_check:check,constraints:intent.constraints,unknowns:intent.unknowns,research:researchContext?{answer:researchContext.answer,sources:researchContext.sources,uncertainties:researchContext.uncertainties}:null},quality_level:planningQuality,sensitivity:planningSensitivity,required_fields:["strategy","phases","next_action"],evidence_required:profile?.evidence_rules?.required_for_critical_claims===true||!!researchContext,human_review_required:profile?.safety_rules?.human_review===true};
    const rr=await fetch(base+"/functions/v1/"+endpoint,{method:"POST",headers:{"content-type":"application/json","apikey":pub,"authorization":auth},body:JSON.stringify(payload)});
    if(rr.ok){const data=await rr.json();planGateway=endpoint==="best-of-ai"?{...data,output:data.final_output,route:{route_key:"best_of_ai",provider:"multi",model_name:Object.values(data.providers||{}).map((p:any)=>p?.route?.model_name).filter(Boolean).join("+")||"reported_in_consensus"},quality_contract:{status:"passed"},attempts:1}:data}
  }catch{}
  const strategy=directTask?"Gewünschtes Ergebnis direkt erstellen und vor der Übergabe prüfen":planGateway?.output?.strategy||(check.feasibility==="high_risk"?"Mit kleiner Validierungsstufe starten":"Schrittweise und outcome-orientiert vorgehen");
  const modelPhases=Array.isArray(planGateway?.output?.phases)?planGateway.output.phases.map((x:any)=>String(x).trim()).filter(Boolean).slice(0,6):[];
  const phaseNames=directTask?[directTask]:isFlight?defaultPhaseNames:modelPhases.length>=3?modelPhases:defaultPhaseNames;
  const planIns=await sb.from("plans").insert({goal_id:goal.id,version:1,status:"active",strategy,assumptions:[],dependencies:[]}).select("*").single();
  if(planIns.error) return Response.json({error:"plan_create_failed",detail:planIns.error.message},{status:500,headers:cors});
  const plan=planIns.data;

  // Never label a milestone with an unrelated firstAction() title.
  // Preserve each source plan phase as its own step and create a separate foundation
  // task if the first domain decision is different from the plan's first phase.
  const firstTask=directTask|| (isFlight?defaultPhaseNames[0]:executionContract.scope==="business_startup"?"Geschäftsmodell und Zielgruppe ausarbeiten":firstAction(intent.domain.primary));
  const needsFoundation=phaseNames.length>0&&overlapScore(firstTask,phaseNames[0])<0.32;
  const workingPhases=[
    ...(needsFoundation?[{name:firstTask,phase_key:"foundation",foundation:true}]:[]),
    ...phaseNames.map((name,i)=>({name,phase_key:"phase_"+(i+1),foundation:!needsFoundation&&i===0}))
  ];
  const milestonePayload=workingPhases.map((item,i)=>({
    goal_id:goal.id,plan_id:plan.id,phase_key:item.phase_key,
    title:item.name+" abgeschlossen",desired_state:item.name,
    success_condition:directTask?"Die angeforderte Datei oder der fertige Text liegt vor und hat die Ergebnisprüfung bestanden.":item.foundation?"Das erste Ergebnis ist überprüft und ausdrücklich bestätigt.":"Ergebnis der Phase ist überprüfbar vorhanden.",
    status:i===0?"active":"pending",weight:1
  }));
  const miles=await sb.from("milestones").insert(milestonePayload).select("*");
  if(miles.error) return Response.json({error:"milestones_create_failed",detail:miles.error.message},{status:500,headers:cors});

  const actionPayload=workingPhases.map((item,i)=>({
    goal_id:goal.id,plan_id:plan.id,milestone_id:miles.data[i].id,
    title:directTask|| (isFlight?["Aktuelle Flugangebote recherchieren und vergleichen","Flugangebote und Gesamtpreis prüfen","Belegten Buchungsvorschlag vorbereiten"][i]:item.foundation?firstTask:"Nächsten Schritt für „"+item.name+"“ ausführen"),
    objective:directTask?input+". Erstelle das vollständige nutzbare Lieferobjekt. Prüfe es vor der Übergabe. Keine vorgeschalteten Konzeptfreigaben; nur zwingend fehlende Angaben oder externe Handlungen benötigen Rückfrage.":item.foundation
      ?(needsFoundation
        ?firstTask+". Erstelle eine konkrete, nachvollziehbare Arbeitsfassung, kennzeichne Annahmen und lege das Ergebnis dem Nutzer zur Bestätigung vor."
        :item.name)
      :item.name,
    status:i===0?"ready":"pending",priority:i===0?"high":"normal",
    owner_type:intent.domain.primary==="medical_documentation"&&i===0?"joint":"pilot",recommended_mode:intent.domain.primary==="medical_documentation"&&i===0?"together":"do_it",blocking:false
  }));
  const acts=await sb.from("actions").insert(actionPayload).select("*");
  if(acts.error) return Response.json({error:"actions_create_failed",detail:acts.error.message},{status:500,headers:cors});
  const nextAction=acts.data.find((a:any)=>a.status==="ready")||acts.data[0];

  await sb.from("pilot_states").update({work_state:"waiting",message:"Plan ist bereit. Pilot wartet auf den nächsten Schritt.",updated_at:new Date().toISOString()}).eq("user_id",user.id).eq("goal_id",goal.id);

  return Response.json({
    stage:"ready",intent,goal,execution_contract:executionContract,industry_context:industry?{industry,services:serviceOffer||null,service_area:serviceArea||null}:null,reality_check:check,plan,
    memory_status:{goal_brief_saved:!initialMemory.error,updates:initialUserMemories,warning:initialMemory.error||null},
    ai:{classification:classifyTelemetry?{route:classifyTelemetry.route,quality_contract:classifyTelemetry.quality_contract,attempts:classifyTelemetry.attempts}:null,research:researchContext?{result_id:researchContext.result?.id||null,source_count:researchContext.sources?.length||0,evidence_gate:researchContext.quality?.evidence_gate||null,consensus:researchContext.consensus||null}:null,planning:planGateway?{route:planGateway.route,quality_contract:planGateway.quality_contract,attempts:planGateway.attempts,cost:planGateway.cost,usage:planGateway.usage,complex:complexPlan}:null},domain_profile:{domain_key:profile.domain_key,avatar_variant:profile.avatar_variant,quality_rules:profile.quality_rules,evidence_rules:profile.evidence_rules,safety_rules:profile.safety_rules},
    pilot_state:{domain_key:intent.domain.primary,work_state:"waiting",avatar_variant:profile.avatar_variant||"general",risk_level:profile?.safety_rules?.sensitivity==="sensitive"?"moderate":"low"},
    milestones:miles.data,actions:acts.data,
    next_action:{...nextAction,reason:"Dieser Schritt reduziert die größte aktuelle Unsicherheit und schafft die Grundlage für die nächsten Phasen."}
  },{headers:cors});
};
const PILOT_CORS_HEADERS={"access-control-allow-origin":"*","access-control-allow-methods":"GET, POST, OPTIONS","access-control-allow-headers":"authorization, x-client-info, apikey, content-type, x-supabase-api-version","access-control-max-age":"86400"};

Deno.serve(async (req:Request)=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:PILOT_CORS_HEADERS});
  const response=await pilotCorsHandler(req);
  const responseHeaders=new Headers(response.headers);
  for(const [name,value] of Object.entries(PILOT_CORS_HEADERS))responseHeaders.set(name,value);
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers:responseHeaders});
});
