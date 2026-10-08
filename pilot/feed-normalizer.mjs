/*
 * neXaro Pilot | Licensed affiliate / marketplace product feed normalizer.
 * No scraping, no synthetic prices, and no invented tracking links.
 * Sources must be approved and feed links provided by their publishers.
 */
export const PILOT_FEED_SOURCES = Object.freeze([
 ["awin","Awin"],["adcell","ADCELL"],["impact","impact.com"],["cj","CJ Affiliate"],
 ["tradedoubler","Tradedoubler"],["webgains","Webgains"],["rakuten","Rakuten Advertising"],
 ["partnerize","Partnerize"],["belboon","belboon"],["amazon","Amazon PartnerNet"],
 ["ebay","eBay"],["comparison","Lizenzierter Vergleichspartner"]
]);
const MAX_BYTES=3*1024*1024,MAX_ROWS=1500;
const aliases={
 id:["external_id","aw_product_id","merchant_product_id","product_id","productid","sku","item_id","article_number","artikelnr","artikelnummer","ean","gtin"],
 name:["product_name","product_title","product","title","name","artikelname","bezeichnung","produktname"],
 merchant:["merchant_name","advertiser_name","shop_name","program_name","merchant","advertiser","shop","haendler","handler","anbieter"],
 tracking:["aw_deep_link","affiliate_link","tracking_url","tracking_link","click_url","clickurl","partner_link","publisher_url"],
 link:["product_url","aw_product_link","deeplink","deep_link","url","link","product_link","artikel_url"],
 price:["price_eur","search_price","sale_price","special_price","store_price","product_price","retail_price","price","preis","preis_eur"],
 shipping:["shipping_eur","shipping_cost","shipping_price","shipping","delivery_cost","delivery_price","versandkosten","versand"],
 currency:["currency","currency_code","price_currency","waehrung","wahrung"],
 condition:["condition","product_condition","zustand"],
 keywords:["keywords","category_name","category","product_category","brand","marke"],
 affiliate:["affiliate","is_affiliate"]
};
const key=k=>String(k??"").trim().toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");
const pick=(row,keys)=>{for(const k of keys){const x=row[k];if(x!==undefined&&x!==null&&String(x).trim()!=="")return String(x).trim()}return ""};
const money=v=>{
 let raw=String(v??"").trim().replace(/\s/g,"").replace(/(?:EUR|€)/gi,"");
 if(!raw||!/^[0-9.,]+$/.test(raw))return null;
 const c=raw.lastIndexOf(","),d=raw.lastIndexOf(".");
 if(c>=0&&d>=0){raw=c>d?raw.replace(/\./g,"").replace(",","."):raw.replace(/,/g,"")}
 else if(c>=0){const tail=raw.length-c-1;raw=tail===3?raw.replace(/,/g,""):raw.replace(",",".")}
 else if(d>=0){const count=(raw.match(/\./g)||[]).length;const tail=raw.length-d-1;if(count>1||tail===3)raw=raw.replace(/\./g,"")}
 if(!/^\d+(\.\d{1,2})?$/.test(raw))return null;
 const n=Number(raw);return Number.isFinite(n)&&n<=10000000?Math.round(n*100)/100:null;
};
const safeLink=value=>{
 try{
  const u=new URL(String(value??"").trim());
  if(u.protocol!=="https:"||u.username||u.password||!u.hostname.includes(".")||u.hostname.includes("..")||u.href.length>2048)return null;
  if(/(^|\.)(localhost|local|internal|example|test|invalid)$/.test(u.hostname))return null;
  if(/^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(u.hostname))return null;
  return u.href;
 }catch{return null}
};
function delimiter(text){
 const first=String(text).split(/\r?\n/,1)[0]||"";
 const count=d=>{let n=0,quoted=false;for(let i=0;i<first.length;i++){const c=first[i];if(c==='"'){if(quoted&&first[i+1]==='"')i++;else quoted=!quoted}else if(!quoted&&c===d)n++}return n};
 return [["\t",count("\t")],[";",count(";")],[",",count(",")]].sort((a,b)=>b[1]-a[1])[0][1]>0?[["\t",count("\t")],[";",count(";")],[",",count(",")]].sort((a,b)=>b[1]-a[1])[0][0]:null;
}
function parseDelimited(text){
 const sep=delimiter(text);if(!sep)throw Error("Keine Tabellenüberschriften erkannt. Bitte CSV, TSV oder JSON verwenden.");
 const records=[];let row=[],cell="",quoted=false;
 for(let i=0;i<text.length;i++){
  const ch=text[i];
  if(ch==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++}else quoted=!quoted;continue}
  if(!quoted&&ch===sep){row.push(cell);cell="";continue}
  if(!quoted&&(ch==="\n"||ch==="\r")){if(ch==="\r"&&text[i+1]==="\n")i++;row.push(cell);if(row.some(v=>v.trim()))records.push(row);row=[];cell="";if(records.length>MAX_ROWS+2)throw Error("Feed zu groß: höchstens 1.500 Produkte je Datei.");continue}
  cell+=ch;
 }
 if(quoted)throw Error("Die CSV-Datei enthält ein nicht geschlossenes Anführungszeichen.");
 row.push(cell);if(row.some(v=>v.trim()))records.push(row);
 if(records.length<2)throw Error("Keine Produktzeilen gefunden.");
 const headers=records.shift().map(key);
 if(!headers.some(h=>aliases.price.includes(h)))throw Error("Keine gültige Preisspalte gefunden.");
 return records.map(cells=>Object.fromEntries(headers.map((h,i)=>[h,cells[i]??""])));
}
function readRows(text){
 const clean=String(text??"").replace(/^\uFEFF/,"").trim();
 if(!clean)throw Error("Die Produktdatei ist leer.");
 if(new TextEncoder().encode(clean).length>MAX_BYTES)throw Error("Datei zu groß: maximal 3 MB.");
 let rows;
 if(clean[0]==="["||clean[0]==="{"){
  const obj=JSON.parse(clean);
  rows=Array.isArray(obj)?obj:Array.isArray(obj.offers)?obj.offers:Array.isArray(obj.products)?obj.products:null;
  if(!rows)throw Error("JSON muss eine Produktliste oder 'offers'/'products' enthalten.");
 }else rows=parseDelimited(clean);
 if(rows.length>MAX_ROWS)throw Error("Feed zu groß: höchstens 1.500 Produkte je Datei.");
 return rows;
}
export function parseProductFeed(text){
 const rows=readRows(text),offers=[],stats={read:rows.length,valid:0,skipped:0,reasons:{}};
 for(const raw of rows){
  if(!raw||typeof raw!=="object"||Array.isArray(raw)){stats.reasons.format=(stats.reasons.format||0)+1;continue}
  const row=Object.fromEntries(Object.entries(raw).map(([k,v])=>[key(k),v]));
  const price=money(pick(row,aliases.price));
  const currency=pick(row,aliases.currency);
  const tracked=pick(row,aliases.tracking),direct=pick(row,aliases.link);
  const url=safeLink(tracked)||safeLink(direct);
  const merchant=pick(row,aliases.merchant);
  const name=pick(row,aliases.name);
  const id=pick(row,aliases.id);
  const shippingRaw=pick(row,aliases.shipping);
  const shipping=shippingRaw?money(shippingRaw):null;
  let reason="";
  if(currency&&currency.toUpperCase()!=="EUR"&&currency!=="€")reason="currency";
  else if(price===null||price<=0)reason="price";
  else if(shippingRaw&&shipping===null)reason="shipping";
  else if(!url)reason="url";
  else if(!name||!merchant||!id)reason="required";
  if(reason){stats.reasons[reason]=(stats.reasons[reason]||0)+1;continue}
  const declaration=pick(row,aliases.affiliate);
  const affiliate=!!safeLink(tracked)||/^(true|1|yes|ja)$/i.test(declaration);
  offers.push({external_id:id.slice(0,120),name:name.slice(0,240),merchant:merchant.slice(0,100),url,price_eur:price,shipping_eur:shipping,condition:pick(row,aliases.condition).slice(0,60),affiliate,keywords:pick(row,aliases.keywords).slice(0,260)});
 }
 stats.valid=offers.length;stats.skipped=rows.length-offers.length;
 return {offers,stats};
}
