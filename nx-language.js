(()=>{
"use strict";
const KEY="nexaro-language";
const q=new URLSearchParams(location.search);
const initial=(q.get("lang")||localStorage.getItem(KEY)||"de").toLowerCase()==="en"?"en":"de";
const original=new WeakMap();
let language=initial,applying=false;

const exact=new Map(Object.entries({
"Startseite":"Home","Lösungen":"Solutions","Sicherheit":"Security","Kontakt":"Contact","Direkt sprechen ↗":"Talk to us ↗",
"Persönlich sprechen":"Talk to us","Direkt persönlich sprechen":"Talk to us directly","Passende Lösung finden ↓":"Find the right solution ↓",
"Direkter Ansprechpartner":"Direct contact","Für Unternehmen & Gewerbe":"For businesses","Geschützte Datenverarbeitung":"Protected data processing","Keine unnötigen Umwege":"No unnecessary detours",
"DEIN STARTPUNKT":"YOUR STARTING POINT","Was möchtest du verbessern?":"What would you like to improve?",
"DREI BEREICHE · EIN KLARES ZIEL":"THREE AREAS · ONE CLEAR GOAL","WARUM NEXARO":"WHY NEXARO","SICHERHEIT & DATENSCHUTZ":"SECURITY & DATA PROTECTION",
"PERSÖNLICHER KONTAKT":"PERSONAL CONTACT","CRM & SOFTWARE":"CRM & SOFTWARE","CRM-Projekt besprechen":"Discuss your CRM project",
"Anliegen":"Request","Unternehmen":"Company","Ansprechpartner":"Contact person","E-Mail":"Email","Telefon (optional)":"Phone (optional)","Ort (optional)":"City (optional)","Branche (optional)":"Industry (optional)","Geplante Nutzer (optional)":"Planned users (optional)",
"Was soll im Vertrieb besser werden?":"What should improve in your sales process?","CRM-Anfrage senden →":"Send CRM request →",
"Beratung & individuelle Anpassung":"Consulting & customisation","Persönliche Demo-Einladung":"Personal demo invitation","Pilotbetrieb besprechen":"Discuss a pilot",
"Payment-Lösung prüfen →":"Review payment solution →","CRM kennenlernen →":"Discover CRM →","B2B-Anfrage starten →":"Start B2B request →",
"01 / VERSTEHEN":"01 / UNDERSTAND","02 / EINORDNEN":"02 / ASSESS","03 / UMSETZEN":"03 / IMPLEMENT",
"Erst die Ausgangslage.":"Start with the current situation.","Dann die passende Option.":"Then choose the right option.","Persönlich weiter.":"Continue personally.",
"Persönliche Erreichbarkeit":"Personal availability","Klare Prozesse":"Clear processes","Mobile Nutzung":"Mobile use","Unternehmerischer Blick":"Business-minded perspective",
"01 / ÜBERTRAGUNG":"01 / TRANSMISSION","02 / ZUGRIFF":"02 / ACCESS","03 / DATEN":"03 / DATA",
"Geschützte Verbindung.":"Protected connection.","Zugriff nur dort, wo er gebraucht wird.":"Access only where it is needed.","So viel wie nötig. Nicht mehr.":"Only what is needed. Nothing more.",
"Impressum":"Legal notice","Datenschutz":"Privacy","Cookies & Technik":"Cookies & technology",
"Gastronomie":"Hospitality","Einzelhandel":"Retail","Dienstleister":"Service providers","Payment-Lösung prüfen ↗":"Review payment solution ↗",
"SUMUP · KONDITIONSVERGLEICH":"SUMUP · RATE COMPARISON","Direktes Vergleichsangebot":"Direct comparison offer",
"Abrechnung hochladen":"Upload statement","Daten manuell erfassen":"Enter data manually","Abrechnung auswählen":"Select statement",
"Vergleich anfordern ↗":"Request comparison ↗","Manuellen Vergleich anfordern ↗":"Request manual comparison ↗",
"Persönliche Beratungsanfrage öffnen":"Open personal consultation request","Beratungsanfrage schließen":"Close consultation request","Persönliche Beratungsanfrage":"Personal consultation request",
"Menü öffnen":"Open menu","Menü schließen":"Close menu",
"CRM FÜR AUSSENDIENST & VERTRIEB":"CRM FOR FIELD SALES & SALES","DER AUSSENDIENST-ALLTAG":"THE FIELD SALES DAY","CRM-PROJEKT":"CRM PROJECT",
"CRM-Projekt besprechen →":"Discuss CRM project →","Produkt ansehen":"View product","Produkteinblick anfragen":"Request product preview","Demo anfragen ↗":"Request demo ↗","Demo oder Beratung anfragen →":"Request demo or consultation →","CRM im Detail ansehen":"View CRM in detail",
"Außendienst":"Field sales","Leads & Follow-ups":"Leads & follow-ups","Aus Vertriebspraxis entwickelt":"Built from real sales practice","FINDEN":"FIND","BESUCHEN":"VISIT","NACHFASSEN":"FOLLOW UP",
"Payment-Beratung · Vertriebssoftware · gewerbliche B2B-Lösungen":"Payment consulting · sales software · B2B solutions",
"Vertriebssoftware für Kunden, Außendienst und Follow-ups.":"Sales software for customers, field sales and follow-ups."
}));

const phrases=[
["neXaro Solutions · persönlich · praxisnah · unternehmerisch","neXaro Solutions · personal · practical · entrepreneurial"],
["Weniger Komplexität.\nMehr Klarheit.\nMehr Zeit fürs Geschäft.","Less complexity.\nMore clarity.\nMore time for business."],
["Weniger Komplexität.","Less complexity."],["Mehr Klarheit.","More clarity."],["Mehr Zeit fürs Geschäft.","More time for business."],
["Ob Kartenzahlung, Vertriebsorganisation oder gewerbliche Sortimentsanfrage: neXaro bringt dich ohne Umwege zur passenden Lösung – verständlich, persönlich und mit einem klaren nächsten Schritt.","Whether card payments, sales organisation or B2B product requests: neXaro gets you to the right solution without detours – clearly, personally and with a defined next step."],
["Finde schneller,","Find faster,"],["was dein Business weiterbringt.","what moves your business forward."],
["Jeder Bereich hat einen eigenen Fokus, eine eigene Seite und einen eindeutigen nächsten Schritt. So musst du dich nicht durch Inhalte kämpfen, die für dich gerade nicht relevant sind.","Each area has its own focus, page and clear next step, so you do not have to work through content that is not relevant to you right now."],
["Passt deine aktuelle Payment-Lösung noch zu deinem Geschäft?","Does your current payment solution still fit your business?"],
["Wir schauen auf Nutzung, Kartenmix, Hardware und Anforderungen und ordnen gemeinsam ein, welche SumUp-Lösung zu deinem Betrieb passen kann.","We review usage, card mix, hardware and requirements to assess which SumUp solution may fit your business."],
["Wenn Vertrieb nicht an fehlender Arbeit, sondern an fehlender Übersicht scheitert.","When sales does not fail because of a lack of work, but because of a lack of visibility."],
["Kunden, Leads, Außendienst, Angebote, Aufgaben und Follow-ups in einer klaren Arbeitsumgebung zusammenführen.","Bring customers, leads, field sales, offers, tasks and follow-ups together in one clear workspace."],
["Gewerbliche Sortimentsanfragen ohne Umwege.","B2B product requests without detours."],
["Nicht mehr Information.","Not more information."],["Sondern bessere Entscheidungen.","But better decisions."],
["Gute Beratung beginnt nicht mit einem Produkt, sondern mit der Frage, was im Alltag wirklich besser werden soll.","Good consulting does not start with a product, but with the question of what should actually improve in day-to-day business."],
["Wir starten bei deinem Geschäft, deinen Abläufen und deinem tatsächlichen Bedarf – nicht bei einer vorgefertigten Standardlösung.","We start with your business, your processes and your actual needs – not with a predefined standard solution."],
["Du bekommst eine klare Einordnung, welche Lösung sinnvoll sein kann und welche nächsten Schritte wirklich relevant sind.","You get a clear assessment of which solution may make sense and which next steps are actually relevant."],
["Wenn es passt, gehen wir gemeinsam in Beratung, Demo oder konkrete Abstimmung. Ohne unnötige Schleifen.","If it fits, we move into consulting, a demo or concrete coordination together. Without unnecessary loops."],
["AUS VERTRIEBSPRAXIS ENTSTANDEN","BUILT FROM SALES PRACTICE"],["Für Menschen, die im Alltag","For people who want to"],["einfach weiterkommen wollen.","move forward in everyday business."],
["Vertrauen beginnt damit,","Trust starts with"],["Daten verantwortungsvoll zu behandeln.","handling data responsibly."],
["Du weißt schon,","You already know"],["was besser werden soll?","what should improve?"],
["Dann sprich direkt mit uns. Wir ordnen dein Anliegen ein und bringen dich ohne Umweg zum richtigen neXaro Bereich.","Talk to us directly. We assess your request and get you to the right neXaro area without detours."],
["Beschreibe kurz, was in eurem Vertrieb heute Zeit kostet oder unübersichtlich ist. Wir nutzen das als Ausgangspunkt für Demo, Beratung oder Pilotbetrieb.","Briefly describe what currently costs time or lacks clarity in your sales process. We use this as the starting point for a demo, consultation or pilot."],
["Mehr Kundenkontakt.","More customer contact."],["Weniger Informationschaos.","Less information chaos."],
["Wenn Leads, Besuchsnotizen, Wiedervorlagen und Angebote zwischen Tabellen, Kalender und Handy verschwinden, kostet das Verkaufszeit. neXaro bringt genau diese Schritte in einen nachvollziehbaren Vertriebsfluss.","When leads, visit notes, follow-ups and offers disappear between spreadsheets, calendars and phones, selling time is lost. neXaro brings these steps into a traceable sales flow."],
["Der nächste Schritt darf","The next step must"],["nicht in einer Notiz verschwinden.","not disappear in a note."],
["Für Teams, die wirklich verkaufen.","For teams that actually sell."],
["Was bremst euren","What is slowing"],["Vertrieb heute aus?","your sales team down today?"],
["Wähle einfach den Weg, der für dich passt. Mit Abrechnung übernehmen wir die Auswertung. Ohne Abrechnung kannst du deine aktuellen Daten direkt eingeben.","Choose the path that works for you. With a statement, we handle the analysis. Without one, you can enter your current data directly."],
["Am einfachsten: Datei senden, wir lesen die Daten aus.","Easiest: send the file and we read the relevant data."],["Wenn du keine Abrechnung zur Hand hast.","If you do not have a statement available."],
["PDF oder Foto auswählen – die relevanten Vergleichsdaten werden beim sicheren Upload automatisch ausgelesen.","Select a PDF or photo – the relevant comparison data is read automatically during secure upload."],
["Elektronisch & datenschutzkonform ausgelesen.","Read electronically and in line with data protection requirements."],
["Geschafft! Deine Abrechnung ist sicher übermittelt. Wir bereiten jetzt deinen persönlichen Vergleich vor.","Done! Your statement was transmitted securely. We are now preparing your personal comparison."],
["Geschafft! Deine Vergleichsdaten sind übermittelt. Wir bereiten jetzt deinen persönlichen Vergleich vor.","Done! Your comparison data was submitted. We are now preparing your personal comparison."]
];

function translateString(value){
 if(!value||!value.trim())return value;
 const trimmed=value.trim();
 if(exact.has(trimmed))return value.replace(trimmed,exact.get(trimmed));
 let out=value;
 for(const [de,en] of phrases){if(out.includes(de))out=out.split(de).join(en);}
 return out;
}
function restoreNode(node){if(original.has(node)){node.nodeValue=original.get(node);original.delete(node);}}
function applyText(node){
 if(node.parentElement?.closest("script,style,noscript,code,pre"))return;
 if(language==="de"){restoreNode(node);return;}
 const source=original.get(node)??node.nodeValue;
 if(!original.has(node))original.set(node,source);
 const translated=translateString(source);
 if(translated!==node.nodeValue)node.nodeValue=translated;
}
function applyElement(el){
 for(const attr of ["placeholder","aria-label","title"]){
   const key="nxOriginal"+attr.replace(/-([a-z])/g,(_,c)=>c.toUpperCase());
   if(language==="de"){if(el.dataset?.[key]){el.setAttribute(attr,el.dataset[key]);delete el.dataset[key];}continue;}
   const v=el.getAttribute?.(attr);if(!v)continue;
   if(!el.dataset[key])el.dataset[key]=v;
   el.setAttribute(attr,translateString(el.dataset[key]));
 }
}
function decorateLinks(root=document){
 root.querySelectorAll?.("a[href]").forEach(a=>{
   try{
     const u=new URL(a.getAttribute("href"),location.href);
     if(u.hostname==="nexaro-solutions.github.io"&&u.pathname.includes("/nexaro-sales-hub/")){
       if(language==="en")u.searchParams.set("lang","en");else u.searchParams.delete("lang");
       a.href=u.toString();
     }
   }catch{}
 });
}
function walk(root=document.body){
 if(!root)return;
 applying=true;
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
 let n;while((n=walker.nextNode()))applyText(n);
 root.querySelectorAll?.("*").forEach(applyElement);
 document.documentElement.lang=language==="en"?"en":"de";
 decorateLinks(root);
 applying=false;
}
function setLanguage(next){
 language=next==="en"?"en":"de";
 localStorage.setItem(KEY,language);
 document.documentElement.lang=language;
 document.querySelectorAll("[data-nx-lang]").forEach(b=>{b.textContent=language==="de"?"EN":"DE";b.setAttribute("aria-label",language==="de"?"Switch to English":"Auf Deutsch umstellen");});
 walk();
 window.dispatchEvent(new CustomEvent("nx-language-change",{detail:{language}}));
}
function installToggle(){
 if(document.querySelector("[data-nx-lang]"))return;
 const b=document.createElement("button");b.type="button";b.dataset.nxLang="1";b.className="nx-language-toggle";
 b.textContent=language==="de"?"EN":"DE";b.setAttribute("aria-label",language==="de"?"Switch to English":"Auf Deutsch umstellen");
 b.addEventListener("click",()=>setLanguage(language==="de"?"en":"de"));
 const nav=document.querySelector(".top .nav,.nx-payment-nav");
 if(nav)nav.appendChild(b);else document.body.appendChild(b);
 const st=document.createElement("style");st.textContent=`
 .nx-language-toggle{display:inline-flex;align-items:center;justify-content:center;min-width:42px;height:34px;padding:0 10px;border:1px solid #cfdcc8;border-radius:999px;background:#fff;color:#243522;font:inherit;font-size:11px;font-weight:900;letter-spacing:.08em;cursor:pointer;box-shadow:0 6px 18px rgba(35,55,28,.08)}
 .nx-language-toggle:hover{border-color:#9fc970;background:#f5fbea}
 @media(max-width:900px){.nx-language-toggle{min-height:42px;width:100%;border-radius:10px}}
 `;document.head.appendChild(st);
}
const observer=new MutationObserver(muts=>{if(applying)return;for(const m of muts){for(const node of m.addedNodes){if(node.nodeType===Node.TEXT_NODE)applyText(node);else if(node.nodeType===Node.ELEMENT_NODE){applyElement(node);walk(node);}}}});
function boot(){installToggle();walk();observer.observe(document.body,{subtree:true,childList:true});}
window.neXaroLanguage={get:()=>language,set:setLanguage};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();