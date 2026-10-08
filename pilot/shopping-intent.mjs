/* Product research is a behind-the-scenes capability, never a customer menu. */
export const PRODUCT_TOPICS=[
 {key:"smartphone",noun:"Smartphone",match:/\b(?:smartphones?|handys?|handys|mobiltelefone?|iphones?|galaxy\s+s\d+|google\s+pixel(?:\s+\d+)?|android.?handys?)\b/i,
  products:/\b(?:smartphone|mobiltelefon|handy|iphone\s*\d+|galaxy\s+(?:s|z)\d+|google\s+pixel\s*\d+|oneplus\s*\d+|xiaomi\s*\d+|redmi\s*note\s*\d+)\b/i},
 {key:"laptop",noun:"Laptop",match:/\b(?:laptops?|notebooks?|macbooks?|ultrabooks?)\b/i,products:/\b(?:laptop|notebook|macbook|thinkpad|ideapad|zenbook|vivobook)\b/i},
 {key:"tablet",noun:"Tablet",match:/\b(?:tablets?|ipads?)\b/i,products:/\b(?:tablet|ipad|galaxy\s+tab|surface\s+pro)\b/i},
 {key:"headphones",noun:"Kopfhörer",match:/\b(?:kopfhörer|headphones?|ohrhörer|earbuds?|airpods?)\b/i,products:/\b(?:kopfhörer|headphones?|headset|earbuds?|airpods)\b/i},
 {key:"television",noun:"Fernseher",match:/\b(?:fernseher|tvs?|smart.?tv|oled.?tv)\b/i,products:/\b(?:fernseher|tv|oled|qled)\b/i},
 {key:"vacuum",noun:"Staubsauger",match:/\b(?:staubsauger|saugroboter)\b/i,products:/\b(?:staubsauger|saugroboter|robot.?vacuum)\b/i}
];
const purchasing=/\b(?:beste[nrs]?|empfehl\w*|kaufberatung|kaufen|anschaffen|lohnt|günstig\w*|preis\w*|vergleichen|angebote?|welch\w*|suche|finden|kostet|wie teuer)\b/i;
const notBuying=/\b(?:businessplan|firmengründung|startup|firma gründen|logo erstellen|website erstellen|homepage erstellen|werbekampagne|marketingplan)\b/i;
export function productShoppingIntent(text){
 const t=String(text||"").trim();
 if(notBuying.test(t))return null;
 const topic=PRODUCT_TOPICS.find(p=>p.match.test(t));
 if(topic){
  if(!purchasing.test(t)&&!/^(?:was\s+ist|welches?|welcher|welche|ich\s+(?:brauche|möchte))\b/i.test(t))return null;
  return {key:topic.key,topic:topic.noun,query:topic.noun,raw:t};
 }
 // Extend to other physical products without treating every question as a shopping intent.
 const generic=t.match(/^(?:(?:was\s+ist|welches?\s+ist|welche\s+ist|welcher\s+ist)\s+(?:(?:das|der|die)\s+)?)?(?:beste[nrs]?|günstigste[nrs]?|empfehlenswerteste[nrs]?)\s+([\p{L}\p{N}äöüÄÖÜß -]{4,45})[?.!]?$/iu);
 if(generic){
  const noun=generic[1].trim().replace(/\s*[?.!]$/, "");
  if(!/\b(?:versicherung|kredit|tarif|bank|anwalt|arzt|aktie|medikament)\b/i.test(noun))
   return {key:"generic",topic:noun,query:noun,raw:t};
 }
 return null;
}
export function shoppingPreferences(text){
 const t=String(text||"");
 const amount=t.match(/(?:bis|max(?:imal)?|unter|höchstens|budget|ca\.?|etwa)?\s*(\d{2,5})(?:[.,]00)?\s*(?:€(?!\w)|eur\b|euro\b)/i);
 const budget=amount?Number(amount[1]):null;
 const platform=/\b(?:ios|iphone|apple)\b/i.test(t)?"iOS":/\bandroid\b/i.test(t)?"Android":null;
 const needs=[
 ["Kamera",/\b(?:kamera|fotos?|videos?|fotograf)\b/i],
 ["Akku",/\b(?:akku|laufzeit|batterie)\b/i],
 ["Leistung",/\b(?:leistung|gaming|spiele|schnell|performance)\b/i],
 ["Preis-Leistung",/\b(?:preis.leistung|günstig|preiswert|spar)\b/i],
 ["Größe",/\b(?:klein|kompakt|groß|display|bildschirm)\b/i]
 ].filter(([,re])=>re.test(t)).map(([label])=>label);
 return {budget:budget&&budget>=50&&budget<=100000?budget:null,platform,priority:needs[0]||null};
}
export function needsShoppingClarification(text){
 const p=shoppingPreferences(text);
 return !p.budget&&!p.platform&&!p.priority&&!/\b(?:egal|keine präferenz|keine vorgaben|alles egal)\b/i.test(text);
}
export function isNewNonShoppingRequest(text){
 const t=String(text||"").trim();
 return /^(?:erstelle|entwickle|schreibe|generiere|gestalte|plane|gründe|baue|programmiere)\b/i.test(t)||
  !!(productShoppingIntent(t)&&/^(?:ich\s+suche|welches?|was ist|finde|vergleiche|zeig|suche)\b/i.test(t));
}
export function isShoppingFollowUp(text,active){
 if(!active||!String(text||"").trim())return false;
 if(isNewNonShoppingRequest(text))return false;
 if(active.stage==="clarify")return true;
 const t=String(text).trim();
 return /(?:\?|^(?:und|aber|warum|wie|was|ist|kann|hat|gibt|zeig|zeige|erklär|vergleich|ich|gibt\s+es|hast|welche|welches)\b|(?:akku|kamera|display|preis|garantie|speicher|alternative|unterschied|stattdessen|davon|dieses|das gerät|empfohlen))/i.test(t);
}
const accessories=/\b(?:hülle|case|schutzfolie|schutzglas|ladegerät|ladekabel|netzteil|stativ|ersatzteil|displayersatz|displayglas|schutzhülle|adapter|silikonhülle|schutzcover|telefonhalter|handyhalter|cover)\b/i;
export function shortlistOffers(raw,topic,preferences={}){
 const info=PRODUCT_TOPICS.find(x=>x.key===topic)||null;
 const tokens=String(preferences.product_topic||"").trim().toLowerCase().split(/\s+/).filter(x=>x.length>=4);
 const offers=(Array.isArray(raw)?raw:[]).filter(o=>{
  const title=String(o.name||"");
  const price=Number(o.price_eur);
  if(info?!info.products.test(title):!tokens.length||!tokens.every(x=>title.toLowerCase().includes(x)))return false;
  if(accessories.test(title))return false;
  if(!Number.isFinite(price)||price<=0)return false;
  if(preferences.budget&&((o.total_eur==null?price:Number(o.total_eur))>preferences.budget))return false;
  if(preferences.platform==="iOS"&&topic==="smartphone"&&!/\biphone\b/i.test(title))return false;
  if(preferences.platform==="Android"&&info.key==="smartphone"&&/\biphone\b/i.test(title))return false;
  try{if(new URL(String(o.url)).protocol!=="https:")return false}catch{return false}
  return true;
 });
 return offers.sort((a,b)=>(a.total_eur==null?Infinity:Number(a.total_eur))-(b.total_eur==null?Infinity:Number(b.total_eur))||
  Number(a.price_eur)-Number(b.price_eur)).slice(0,12);
}
