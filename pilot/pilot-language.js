/* neXaro Pilot interface language. The corporate homepage stays independent.
   Only interface chrome is translated; private project content and model answers remain unchanged. */
(()=>{
"use strict";
const STORE="nexaro-language";
let language="de",busy=false;
try{
 const q=new URLSearchParams(location.search).get("lang");
 const saved=q||localStorage.getItem(STORE);
 language=String(saved||"de").toLowerCase()==="en"?"en":"de";
}catch{}
const texts=new Map(Object.entries({
 "Was soll ich für dich erledigen?":"What can I take care of for you?",
 "Was soll ich für dich":"What can I take care of",
 "erledigen?":"for you?",
 "PILOT · DEIN KI-MITARBEITER":"PILOT · YOUR AI ASSISTANT",
 "Beschreibe dein Ziel. Pilot kümmert sich um die Schritte und hält deine Ergebnisse im Auftrag zusammen.":"Describe your goal. Pilot handles the steps and keeps your results together with the task.",
 "Ein Ziel. Ein digitaler Mitarbeiter. Ein greifbares Ergebnis.":"One goal. One digital assistant. One tangible result.",
 "Pilot verbindet deinen Auftrag mit den Arbeitsschritten und hält die Ergebnisse an einem Ort.":"Pilot connects your task to the steps and keeps your results in one place.",
 "Einfach sagen, was du brauchst":"Simply say what you need",
 "Ein Auftrag statt komplizierter Prompt-Ketten.":"One task instead of complicated prompt chains.",
 "Pilot klärt und arbeitet":"Pilot clarifies and works",
 "Rückfragen nur, wenn wichtige Angaben fehlen.":"Questions only when key details are missing.",
 "Ergebnisse bleiben bei dir":"Your results stay with you",
 "Fertige Inhalte und Folgeschritte direkt im Auftrag.":"Finished work and follow-ups within your task.",
 "Ein Auftrag":"One task",
 "Pilot übernimmt Schritte":"Pilot takes care of the steps",
 "Fertige Ergebnisse im Auftrag":"Finished results with your task",
 "Starten":"Start",
 "Pilot":"Pilot",
 "Aufträge":"Tasks",
 "Mehr":"More",
 "Weitere Bereiche":"More areas",
 "Weitere Funktionen":"More functions",
 "DEIN BEREICH":"YOUR SPACE",
 "SYSTEM · INTERN":"SYSTEM · INTERNAL",
 "Mitteilungen & Push":"Notifications",
 "Mitteilungen":"Notifications",
 "Dokumente":"Documents",
 "Gestaltung":"Design",
 "Einstellungen":"Settings",
 "Entwicklungsplan":"Development plan",
 "Systemtest":"System tests",
 "Administration":"Administration",
 "Admin-Cockpit":"Admin dashboard",
 "Kundenansicht":"Customer view",
 "Adminansicht":"Admin view",
 "Profil":"Profile",
 "Abmelden":"Sign out",
 "Anmelden":"Sign in",
 "Konto erstellen":"Create account",
 "Deine Aufträge":"Your tasks",
 "Hier findest du jeden Auftrag, seinen Stand und die fertigen Ergebnisse – zusammen an einem Ort.":"Here you can find each task, its status and your finished results in one place.",
 "Hier erscheinen deine Aufträge und die fertigen Ergebnisse.":"Your tasks and finished results will appear here.",
 "Ersten Auftrag starten":"Start your first task",
 "Gespeichert":"Saved",
 "Pilot arbeitet":"Pilot is working",
 "Ergebnis bereit":"Result ready",
 "Prüfung erforderlich":"Review needed",
 "Pausiert":"Paused",
 "Bearbeitet":"Processed",
 "Deine Antwort fehlt":"Your input is needed",
 "Dein Ergebnis":"Your result",
 "Ältere Ergebnisse anzeigen":"Show earlier results",
 "Fertigen Text lesen":"Read finished text",
 "Text herunterladen ↓":"Download text ↓",
 "Ergebnis ansehen":"View result",
 "Herunterladen ↓":"Download ↓",
 "Auftrag fortsetzen":"Continue task",
 "Ergebnis ändern oder ergänzen":"Modify or extend result",
 "Bisherige Entscheidungen":"Previous decisions",
 "Ergebnisse werden hier angezeigt …":"Results will appear here …",
 "Fertige Ergebnisse werden hier angezeigt …":"Finished results will appear here …",
 "Noch kein fertiges Ergebnis. Sobald Pilot etwas Nutzbares erstellt hat, erscheint es hier.":"No finished result yet. Once Pilot completes usable work, it will appear here.",
 "Deine Grafik ist bereit.":"Your design is ready.",
 "Deine Präsentation ist bereit.":"Your presentation is ready.",
 "Deine Website-Datei ist bereit – sie ist noch nicht veröffentlicht.":"Your website file is ready, but it has not been published.",
 "Dein fertiger Text":"Your finished text",
 "Das Ergebnis ist als Arbeitsprodukt gespeichert; keine unabhängige Quellenprüfung sachlicher Aussagen.":"Saved as a work product; factual claims have not been independently verified.",
 "Zum Anzeigen aufklappen.":"Expand to view.",
 "Admin":"Admin",
 "PILOT · SYSTEMSTEUERUNG":"PILOT · SYSTEM CONTROL",
 "Systemstatus und wichtige Funktionen auf einen Blick.":"System status and key functions at a glance.",
 "Partnerprogramme":"Partner programs",
 "Plan":"Plan",
 "Tests":"Tests",
 "Aktualisieren":"Refresh",
 "Nutzer":"Users",
 "Aktiv · 7 Tage":"Active · 7 days",
 "Ziele":"Goals",
 "Ausführungen":"Executions",
 "Ergebnisse":"Results",
 "angelegt":"created",
 "letzte Anmeldung":"last login",
 "abgeschlossen":"completed",
 "erzeugt":"created",
 "Nutzer & Ausführungen":"Users & executions",
 "Letzte Ereignisse":"Recent events",
 "QUALITÄTSPRÜFUNG":"QUALITY CHECK",
 "Private Testphase":"Private beta",
 "Systemstatus":"System status",
 "Prüfsuite starten":"Run test suite",
 "Live-Auftrag testen":"Test a live task",
 "Pflichtchecks bestanden":"Required checks passed",
 "Noch keine Prüfungen erfasst":"No checks recorded yet",
 "PRÜFERGEBNISSE":"TEST RESULTS",
 "BESTANDEN":"PASSED",
 "OFFEN":"OPEN",
 "Deine Umgebung":"Your workspace",
 "Dein Konto":"Your account",
 "Arbeitsbereich":"Workspace",
 "Personal":"Personal",
 "Geschützt arbeiten":"Work securely",
 "SICHERHEITSKONTEXT":"SECURITY",
 "DEIN ZUGANG":"YOUR ACCOUNT",
 "PROFIL":"PROFILE",
 "Sicherer Systemzugang":"Secure account access",
 "SICHERER SYSTEMZUGANG":"SECURE SIGN-IN",
 "Pilot öffnen":"Open Pilot",
 "Melde dich mit deinem bestehenden Zugang an.":"Sign in with your existing account.",
 "Sicheren Zugang erstellen":"Create secure account",
 "Passwort":"Password",
 "Passwort wiederholen":"Repeat password",
 "E-Mail":"Email",
 "Noch kein Konto? Konto erstellen":"No account yet? Create one",
 "Bereits registriert? Pilot öffnen":"Already registered? Open Pilot",
 "Deine Daten bleiben geschützt.":"Your data stays protected.",
 "So schützen wir deinen Zugang":"How we protect your account",
 "Datenschutzhinweise öffnen →":"Read our privacy policy →",
 "Pilot bereit":"Pilot ready",
 "Deine persönliche Produktempfehlung":"Your personal product recommendation",
 "PILOT · DEIN ERGEBNIS":"PILOT · YOUR RESULT",
 "Zum Angebot ↗":"View offer ↗",
 "Werbelink":"Sponsored link",
 "Ohne Vorgaben fortfahren":"Continue without preferences",
 "Deine Beratung":"Your consultation"
}));
const placeholder=new Map(Object.entries({
 "Beschreibe dein gewünschtes Ergebnis …":"Describe the result you want …",
 "Dein Auftrag":"Your task",
 "Dein Passwort":"Your password"
}));
const aria=new Map(Object.entries({
 "Weitere Bereiche":"More areas",
 "Hauptnavigation":"Main navigation",
 "Weitere Funktionen":"More features",
 "Aufträge":"Tasks",
 "Admin-Cockpit":"Admin dashboard",
 "Administration":"Administration",
 "Einstellungen":"Settings",
 "Entwicklungsplan":"Development plan",
 "Systemtest":"System tests",
 "Dein Auftrag":"Your task",
 "Auftrag starten":"Start task",
 "Datei hinzufügen":"Add file",
 "Deine Aufträge":"Your tasks",
 "Sprachauswahl":"Language selection"
}));
const original=new WeakMap(),originalAttrs=new WeakMap();
function translateNode(node){
 if(node.nodeType!==Node.TEXT_NODE)return;
 const parent=node.parentElement;
 if(!parent||parent.closest("script,style,textarea,option,code,pre,[data-no-translate],.pilot-project-document-body,.pilot-shopping-answer"))return;
 const raw=original.has(node)?original.get(node):node.nodeValue;
 if(!original.has(node))original.set(node,raw);
 const trim=raw.trim();
 if(!trim||!texts.has(trim))return;
 const before=raw.slice(0,raw.indexOf(trim)),after=raw.slice(raw.indexOf(trim)+trim.length);
 const next=language==="en"?before+texts.get(trim)+after:raw;
 if(node.nodeValue!==next)node.nodeValue=next;
}
function translateAttr(element,name,dict){
 const value=element.getAttribute(name);
 if(value===null)return;
 let saved=originalAttrs.get(element);
 if(!saved){saved={};originalAttrs.set(element,saved);}
 if(!(name in saved))saved[name]=value;
 const old=saved[name],next=language==="en"?(dict.get(old)||old):old;
 if(value!==next)element.setAttribute(name,next);
}
function walk(scope){
 if(!scope)return;
 busy=true;
 try{
  const root=scope.nodeType===Node.DOCUMENT_NODE?scope.documentElement:scope;
  if(root.nodeType===Node.TEXT_NODE)translateNode(root);
  else if(root.nodeType===Node.ELEMENT_NODE){
   const iter=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
   let node;while((node=iter.nextNode()))translateNode(node);
   const els=[root,...root.querySelectorAll("button,input,textarea,nav,summary,a,[aria-label],[title]")];
   for(const el of els){
    translateAttr(el,"placeholder",placeholder);
    translateAttr(el,"aria-label",aria);
    translateAttr(el,"title",texts);
   }
  }
  document.documentElement.lang=language;
 }finally{busy=false;}
}
function closeLanguageOptions(){
 const toggle=document.getElementById("pilotLanguageToggle");
 const menu=document.getElementById("pilotLanguageOptions");
 if(menu)menu.hidden=true;
 if(toggle)toggle.setAttribute("aria-expanded","false");
}
function setLanguage(value){
 language=value==="en"?"en":"de";
 try{localStorage.setItem(STORE,language)}catch{}
 document.querySelectorAll("[data-pilot-locale]").forEach(button=>{
  const selected=button.dataset.pilotLocale===language;
  button.setAttribute("aria-pressed",String(selected));
  button.classList.toggle("is-active",selected);
 });
 const current=document.getElementById("pilotLanguageCurrent");
 if(current)current.textContent=language.toUpperCase();
 const selector=document.getElementById("pilotLanguageSwitcher");
 if(selector)selector.setAttribute("aria-label",language==="en"?"Language selection":"Sprachauswahl");
 walk(document);
 closeLanguageOptions();
}
const observer=new MutationObserver(mutations=>{
 if(busy)return;
 for(const m of mutations){
  for(const n of m.addedNodes)if(n.nodeType===Node.ELEMENT_NODE||n.nodeType===Node.TEXT_NODE)walk(n);
 }
});
function init(){
 const selector=document.getElementById("pilotLanguageSwitcher");
 const toggle=document.getElementById("pilotLanguageToggle");
 const menu=document.getElementById("pilotLanguageOptions");
 // The picker is intentionally always accessible at the top right.
 // Both the visible DE/EN state and the dropdown must reflect the same value.
 if(selector&&toggle&&menu){
  toggle.addEventListener("click",event=>{
   event.stopPropagation();
   const next=menu.hidden;
   menu.hidden=!next;
   toggle.setAttribute("aria-expanded",String(next));
  });
  selector.addEventListener("click",event=>event.stopPropagation());
  document.addEventListener("click",event=>{
   if(!selector.contains(event.target))closeLanguageOptions();
  });
  document.addEventListener("keydown",event=>{
   if(event.key==="Escape"&&!menu.hidden){
    closeLanguageOptions();toggle.focus();
   }
  });
 }
 document.querySelectorAll("[data-pilot-locale]").forEach(button=>button.addEventListener("click",()=>{
  setLanguage(button.dataset.pilotLocale);
  toggle?.focus({preventScroll:true});
 }));
 setLanguage(language);
 observer.observe(document.body,{childList:true,subtree:true});
}
window.pilotLanguage={get:()=>language,set:setLanguage};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
