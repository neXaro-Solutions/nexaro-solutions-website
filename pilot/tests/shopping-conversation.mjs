import assert from "node:assert/strict";
import {productShoppingIntent,shoppingPreferences,needsShoppingClarification,isShoppingFollowUp,shortlistOffers} from "../shopping-intent.mjs";
import {makeShoppingAssistant} from "../shopping-assistant.mjs";
import {readFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const html=readFileSync(resolve(root,"pilot/index.html"),"utf8");
assert(!html.includes('data-view="market"'),"shopping menu must not exist");
assert(html.includes("pilotShoppingAsk(text)"),"one input must route to shopping assistant");
assert(html.includes('data-jump="market"'),"admin retains access to partner sources");
assert(html.includes("pilotShoppingCard()"),"conversation result appears with home input");
assert(!html.includes("Kontakt@nexaro-solutions.de"),"personal registration data cannot be hardcoded in client");
assert.equal(productShoppingIntent("Was ist das beste Smartphone?")?.key,"smartphone");
assert.equal(productShoppingIntent("Welches Notebook soll ich kaufen?")?.key,"laptop");
assert.equal(productShoppingIntent("Erstelle ein Logo für meine Smartphone-Firma"),null);
assert.equal(productShoppingIntent("Erstelle mir einen Businessplan für Smartphonehandel"),null);
assert.equal(shoppingPreferences("Bis 700 €, Android, gute Kamera").budget,700,"German EUR sign budget");
assert.equal(shoppingPreferences("Maximal 900 Euro für iOS").platform,"iOS");
assert(needsShoppingClarification("Was ist das beste Smartphone?"));
assert(!needsShoppingClarification("Das beste Smartphone bis 850 €"));
assert(isShoppingFollowUp("Wie lange hält der Akku?",{stage:"result"}));
assert(!isShoppingFollowUp("Erstelle jetzt einen Businessplan",{stage:"result"}));
const items=[
 {id:"case",name:"Apple iPhone 17 Schutzhülle",merchant:"Shop",price_eur:9,shipping_eur:0,total_eur:9,url:"https://shop.de/case",source:"Awin",affiliate:true},
 {id:"apple",name:"Apple iPhone 17 128GB",merchant:"Mobile",price_eur:680,shipping_eur:0,total_eur:680,url:"https://shop.de/iphone",source:"Awin",affiliate:true,checked_at:new Date().toISOString()},
 {id:"samsung",name:"Samsung Galaxy S25 Smartphone",merchant:"Mobile",price_eur:610,shipping_eur:0,total_eur:610,url:"https://shop.de/samsung",source:"eBay",affiliate:false,checked_at:new Date().toISOString()},
 {id:"expensive",name:"Google Pixel 10 Smartphone",merchant:"Shop",price_eur:1350,total_eur:1350,shipping_eur:0,url:"https://shop.de/pixel",source:"eBay",affiliate:false}
];
assert.deepEqual(shortlistOffers(items,"smartphone",{budget:700,platform:"Android"}).map(x=>x.id),["samsung"]);
assert.deepEqual(shortlistOffers(items,"smartphone",{}).map(x=>x.id),["samsung","apple","expensive"],"filter accessories and sort by total");
let persisted=null,marketCalls=0,aiCalls=0,redraws=0;
const sb={
 from(table){
  assert.equal(table,"pilot_shopping_sessions");
  return {
   upsert:async row=>{persisted=JSON.parse(JSON.stringify(row));return {error:null}},
   select(){return {eq(){return {maybeSingle:async()=>({data:persisted,error:null})}}}}
  };
 },
 functions:{invoke:async(name)=>{
  if(name==="pilot-market"){marketCalls++;return {data:{offers:items},error:null}}
  if(name==="best-of-ai"){
   aiCalls++;
   const final_output=aiCalls===1?
    {selected_id:"samsung",answer:"Dieses passende Gerät ist preislich belegt.",reason:"Zur Leistung fehlen unabhängige Testdaten."}:
    {answer:"Aus dem Angebot geht keine Akkulaufzeit hervor.",uncertainty:"Eine Herstellerangabe wäre erforderlich."};
   return {data:{status:"completed",final_output},error:null};
  }
  throw Error(name);
 }}
};
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const create=()=>makeShoppingAssistant({sb,getUser:()=>({id:"test-user"}),getOrg:()=>({organization_id:"test-org"}),
 redraw:()=>{redraws++},safeLink:v=>{try{return new URL(v).protocol==="https:"?v:null}catch{return null}},
 escape:esc,money:v=>Number(v).toFixed(2)+" €"});
const assistant=create();
assert(await assistant.handle("Was ist das beste Smartphone?"));
assert.equal(assistant.getState().stage,"clarify");
assert(assistant.card().includes("Kamera"));
assert(!assistant.card().includes("shop.de"));
assert(await assistant.handle("bis 700 €, Android, Akku"));
assert.equal(marketCalls,1);
assert.equal(assistant.getState().stage,"result");
assert.equal(assistant.getState().recommendation.selected_id,"samsung");
assert(assistant.card().includes("shop.de/samsung"));
assert(!assistant.card().includes("shop.de/case"));
assert(!assistant.card().includes("shop.de/iphone"));
assert(await assistant.handle("Wie lange hält der Akku?"));
assert(aiCalls>=2,"follow-up gets a new grounded answer");
assert(assistant.card().includes("Herstellerangabe"));
assert(persisted?.conversation?.some(x=>x.text.includes("Akku")));
const restored=create();await restored.load();
assert.equal(restored.getState().topic_key,"smartphone","return visit resumes conversation");
assert(restored.card().includes("Herstellerangabe"));
assistant.clear();assert.equal(assistant.getState(),null);
console.log("PASS invisible product advice: intent, concise questions, actual offers, follow-ups, private persistence");
