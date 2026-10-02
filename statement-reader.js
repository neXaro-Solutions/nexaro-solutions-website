const PDFJS_URL='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs';
const PDF_WORKER_URL='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';
const TESSERACT_URL='https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.esm.min.js';
const MAX_PAGES=8;
let pdfjsPromise=null,tesseractPromise=null;

function deNumber(raw){
 const s=String(raw||'').replace(/\s/g,'').replace(/€/g,'').trim();
 if(!s)return null;
 let n=s;
 if(n.includes(',')&&n.includes('.')) n=n.lastIndexOf(',')>n.lastIndexOf('.')?n.replace(/\./g,'').replace(',','.'):n.replace(/,/g,'');
 else if(n.includes(',')) n=n.replace(/\./g,'').replace(',','.');
 else if(/^\d{1,3}(?:\.\d{3})+$/.test(n)) n=n.replace(/\./g,'');
 const v=Number(n.replace(/[^0-9.-]/g,''));
 return Number.isFinite(v)?v:null;
}
function money(v){return Number.isFinite(v)?String(Math.round(v*100)/100):''}
function normalizeText(text){return String(text||'').replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ').replace(/\r/g,'').trim()}
function linesOf(text){return normalizeText(text).split(/\n+/).map(x=>x.trim()).filter(Boolean)}
function windowText(lines,i,r=1){return lines.slice(Math.max(0,i-r),Math.min(lines.length,i+r+1)).join(' ')}
function amounts(s){return [...String(s).matchAll(/(?:€\s*)?(-?\d{1,3}(?:[.\s]\d{3})*(?:,\d{1,2})|-?\d+(?:[.,]\d{1,2})?)(?:\s*€)?/g)].map(m=>deNumber(m[1])).filter(v=>v!==null)}
function percents(s){return [...String(s).matchAll(/(\d{1,2}(?:[.,]\d{1,3})?)\s*%/g)].map(m=>deNumber(m[1])).filter(v=>v!==null&&v<=20)}
function integers(s){return [...String(s).matchAll(/\b(\d{1,7})\b/g)].map(m=>Number(m[1])).filter(Number.isFinite)}
function pickContext(lines,terms,kind){
 let best=null;
 for(let i=0;i<lines.length;i++){
  const low=lines[i].toLowerCase();if(!terms.some(t=>low.includes(t)))continue;
  const scope=windowText(lines,i,1);let vals=kind==='percent'?percents(scope):kind==='integer'?integers(scope):amounts(scope);
  if(kind==='money')vals=vals.filter(v=>v>=0&&v<=100000000);
  if(kind==='integer')vals=vals.filter(v=>v>=0&&v<=10000000);
  if(!vals.length)continue;
  const value=kind==='money'?Math.max(...vals):vals[0];
  const score=terms.reduce((n,t)=>n+(low.includes(t)?1:0),0)+(lines[i].match(/gesamt|summe|total|monat/i)?1:0);
  if(!best||score>best.score)best={value,score,line:lines[i]};
 }
 return best;
}
function providerFrom(lines){
 const joined=lines.slice(0,35).join(' ').toLowerCase();
 const providers=[['Worldline',/worldline/],['PAYONE',/payone/],['Nexi',/\bnexi\b|concardis/],['TeleCash',/telecash|fiserv/],['VR Payment',/vr payment/],['Zettle / PayPal',/zettle|paypal/],['Adyen',/\badyen\b/],['Stripe',/\bstripe\b/],['Unzer',/\bunzer\b/],['Viva.com',/viva\.com|viva wallet/],['myPOS',/\bmypos\b/],['CCV',/\bccv\b/],['Global Payments',/global payments/],['Elavon',/\belavon\b/],['SumUp',/\bsumup\b/]];
 return providers.find(([,rx])=>rx.test(joined))?.[0]||'';
}
function extractFields(text,meta={}){
 const lines=linesOf(text);
 const volume=pickContext(lines,['kartenumsatz','gesamtumsatz','zahlungsvolumen','transaktionsvolumen','umsatz gesamt','bruttoumsatz','sales volume','turnover','total volume'],'money');
 const tx=pickContext(lines,['anzahl transaktionen','transaktionen gesamt','transaktionsanzahl','transactions','vorgänge','vorgaenge','anzahl zahlungen'],'integer');
 const total=pickContext(lines,['gesamtgebühr','gesamtgebuehr','gesamtkosten','gebühren gesamt','gebuehren gesamt','summe gebühren','summe gebuehren','total fees','serviceentgelt gesamt'],'money');
 const fixed=pickContext(lines,['grundgebühr','grundgebuehr','monatspauschale','servicegebühr','servicegebuehr','terminalmiete','mietgebühr','mietgebuehr','fixkosten','monatliche gebühr','monatliche gebuehr'],'money');
 const debit=pickContext(lines,['girocard','ec-karte','ec karte','debit','maestro','v pay','vpay'],'percent');
 const credit=pickContext(lines,['kreditkarte','credit card','visa','mastercard','master card','premiumkarte','premium card'],'percent');
 const debitTx=pickContext(lines,['girocard transaktionen','debit transaktionen','ec transaktionen','maestro transaktionen'],'integer');
 const creditTx=pickContext(lines,['kreditkarten transaktionen','credit card transactions','visa transaktionen','mastercard transaktionen','premium transaktionen'],'integer');
 const found=[volume,tx,total,fixed,debit,credit,debitTx,creditTx].filter(Boolean).length+(providerFrom(lines)?1:0);
 const confidence=Math.min(.98,.2+found*.085+(text.length>800?.08:0));
 return {
  version:1,source:meta.source||'local',file_type:meta.fileType||'',pages:meta.pages||1,confidence:Number(confidence.toFixed(2)),
  provider:providerFrom(lines),monthly_volume:volume?money(volume.value):'',transaction_count:tx?String(Math.round(tx.value)):'',
  current_total_cost:total?money(total.value):'',monthly_fixed_cost:fixed?money(fixed.value):'',
  debit_fee_percent:debit?money(debit.value):'',credit_fee_percent:credit?money(credit.value):'',
  debit_transactions:debitTx?String(Math.round(debitTx.value)):'',premium_transactions:creditTx?String(Math.round(creditTx.value)):'',
  text_length:text.length,review_required:true
 };
}
async function pdfjs(){
 if(!pdfjsPromise)pdfjsPromise=import(PDFJS_URL).then(m=>{m.GlobalWorkerOptions.workerSrc=PDF_WORKER_URL;return m});
 return pdfjsPromise;
}
async function tesseract(){if(!tesseractPromise)tesseractPromise=import(TESSERACT_URL);return tesseractPromise}
async function ocrSource(source,onProgress){
 const {createWorker}=await tesseract();
 let worker;
 try{worker=await createWorker('deu',1,{logger:m=>{if(m.status==='recognizing text'&&onProgress)onProgress(Math.round((m.progress||0)*100))}})}
 catch{worker=await createWorker('eng',1,{logger:m=>{if(m.status==='recognizing text'&&onProgress)onProgress(Math.round((m.progress||0)*100))}})}
 try{const r=await worker.recognize(source);return r?.data?.text||''}finally{await worker.terminate()}
}
async function readImage(file,onProgress){return {text:await ocrSource(file,onProgress),pages:1,source:'ocr-image'}}
async function readPdf(file,onProgress){
 const pdf=await (await pdfjs()).getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
 const pages=Math.min(pdf.numPages,MAX_PAGES);let text='';
 for(let n=1;n<=pages;n++){
  const page=await pdf.getPage(n);const content=await page.getTextContent();
  text+='\n'+content.items.map(i=>i.str||'').join(' ');
  if(onProgress)onProgress(Math.round(n/pages*45));
 }
 if(normalizeText(text).length>=220)return {text,pages,source:'pdf-text'};
 text='';
 for(let n=1;n<=pages;n++){
  const page=await pdf.getPage(n),viewport=page.getViewport({scale:1.6});
  const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
  const ctx=canvas.getContext('2d',{alpha:false});await page.render({canvasContext:ctx,viewport}).promise;
  text+='\n'+await ocrSource(canvas,p=>onProgress?.(45+Math.round(((n-1)+p/100)/pages*55)));
 }
 return {text,pages,source:'ocr-pdf'};
}
function applyField(form,name,value){const el=form.elements.namedItem(name);if(el&&value!==''&&!String(el.value||'').trim()){el.value=value;el.dataset.statementDetected='1'}}
function summary(data){
 const rows=[['Anbieter',data.provider],['Kartenumsatz',data.monthly_volume&&data.monthly_volume+' €'],['Transaktionen',data.transaction_count],['Gesamtkosten',data.current_total_cost&&data.current_total_cost+' €'],['Debit-/EC-Gebühr',data.debit_fee_percent&&data.debit_fee_percent+' %'],['Kreditkarten-Gebühr',data.credit_fee_percent&&data.credit_fee_percent+' %'],['Fixkosten',data.monthly_fixed_cost&&data.monthly_fixed_cost+' €'],['Debit-/EC-Transaktionen',data.debit_transactions],['Premium-/Kreditkarten-Transaktionen',data.premium_transactions]].filter(([,v])=>v);
 return rows;
}
export function attachStatementReader({form,fileInput,status,fileLabel,onExtracted}){
 const panel=document.createElement('div');panel.className='nx-statement-readout';panel.hidden=true;fileInput.closest('.nx-file-drop')?.insertAdjacentElement('afterend',panel);
 const style=document.createElement('style');style.textContent='.nx-statement-readout{margin:-7px 0 18px;padding:14px 15px;border:1px solid #cfe4b5;border-radius:13px;background:#f5ffe8;font-size:11px;color:#34452f}.nx-statement-readout strong{display:block;font-size:12px;margin-bottom:7px}.nx-statement-readout ul{margin:0;padding-left:18px;line-height:1.6}.nx-statement-readout small{display:block;margin-top:8px;color:#657260}.nx-statement-detected{box-shadow:0 0 0 2px #baff3755}';document.head.append(style);
 async function analyze(){
  const file=fileInput.files?.[0];if(!file)return;
  panel.hidden=false;panel.innerHTML='<strong>Abrechnung wird ausgelesen …</strong><small>Die Analyse läuft lokal auf deinem Gerät. Je nach Dokument kann das kurz dauern.</small>';
  status.textContent='Abrechnung wird ausgelesen …';delete status.dataset.state;
  try{
   const progress=p=>{status.textContent='Abrechnung wird ausgelesen … '+p+' %'};
   const read=file.type==='application/pdf'?await readPdf(file,progress):await readImage(file,progress);
   const data=extractFields(read.text,{source:read.source,fileType:file.type,pages:read.pages});
   applyField(form,'current_provider',data.provider);applyField(form,'monthly_volume',data.monthly_volume);applyField(form,'transaction_count',data.transaction_count);
   applyField(form,'debit_fee',data.debit_fee_percent?data.debit_fee_percent+' %':'');applyField(form,'credit_fee',data.credit_fee_percent?data.credit_fee_percent+' %':'');applyField(form,'monthly_fixed_cost',data.monthly_fixed_cost?data.monthly_fixed_cost+' €':'');
   form.querySelectorAll('[data-statement-detected="1"]').forEach(el=>el.classList.add('nx-statement-detected'));
   const rows=summary(data);panel.innerHTML=rows.length?'<strong>Abrechnung erkannt ✓ – bitte Werte kurz prüfen</strong><ul>'+rows.map(([k,v])=>'<li><b>'+k+':</b> '+String(v).replace(/[<>&]/g,'')+'</li>').join('')+'</ul><small>Erkannte Werte sind Vorschläge und können vor dem Absenden korrigiert werden.</small>':'<strong>Dokument gelesen – Werte bitte ergänzen</strong><small>Das Format konnte verarbeitet werden, aber die Vergleichswerte waren nicht eindeutig genug. Bitte ergänze die sichtbaren Werte manuell.</small>';
   status.textContent=rows.length?'Abrechnung ausgelesen. Bitte prüfe die vorausgefüllten Werte.':'Abrechnung gelesen. Bitte ergänze die fehlenden Werte.';status.dataset.state='success';
   onExtracted?.(data);
  }catch(e){
   panel.innerHTML='<strong>Automatisches Auslesen nicht vollständig möglich</strong><small>Die Datei bleibt ausgewählt und kann trotzdem sicher gesendet werden. Bitte ergänze die sichtbaren Werte manuell.</small>';
   status.textContent='Die Abrechnung konnte nicht zuverlässig automatisch ausgelesen werden. Bitte prüfe oder ergänze die Werte.';status.dataset.state='error';onExtracted?.({version:1,source:'failed',confidence:0,review_required:true});
  }
 }
 fileInput.addEventListener('change',()=>void analyze());
}
