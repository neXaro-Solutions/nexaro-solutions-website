/* neXaro SumUp solution configurator – official DE price snapshot 06.10.2026 */
(() => {
 const PRODUCTS={
  tap:{name:'Tap to Pay',price:'0 €',img:'./sumup-assets/phone.svg',desc:'Kontaktlos direkt mit einem kompatiblen Smartphone kassieren.',fit:'Mobil / sehr einfacher Einstieg'},
  lite:{name:'Solo Lite',price:'22 €',img:'./sumup-assets/lite.svg',desc:'Kompaktes Kartenlesegerät, gekoppelt mit dem Smartphone.',fit:'Einfacher Einstieg / gelegentliche Zahlungen'},
  solo:{name:'Solo',price:'59 €',img:'./sumup-assets/solo.svg',desc:'Eigenständiges Kartenterminal mit WLAN und Mobilfunk.',fit:'Laden, Tresen oder mobil ohne Smartphone'},
  terminal:{name:'Terminal',price:'139 €',img:'./sumup-assets/terminal.svg',desc:'Eigenständiges kompaktes Kassengerät mit integriertem Belegdruck.',fit:'Gastronomie, Handel und höherer Durchsatz'},
  starter:{name:'Kassensystem Starter-Kit',price:'549 €',img:'./sumup-assets/pos.svg',desc:'Kasse mit zwei Touchscreens und Bondrucker.',fit:'Fester Kassenplatz / Gastro / Dienstleistung'},
  complete:{name:'Komplettes Kassensystem-Set',price:'599 €',img:'./sumup-assets/pos.svg',desc:'Zwei Displays, Bondrucker und Kassenschublade.',fit:'Kompletter stationärer Kassenplatz'},
  retail:{name:'Kassensystem-Set Einzelhandel',price:'649 €',img:'./sumup-assets/pos.svg',desc:'Zwei Displays, Bondrucker, Kassenschublade und Barcode-Scanner.',fit:'Einzelhandel mit Warenbestand'}
 };
 const ADDONS={
  posplus:{icon:'🍽️',name:'Kassensoftware Plus',price:'49 € / Monat',desc:'Erweiterte Gastro- und Handelsfunktionen, u. a. Raum-/Tischverwaltung und weitere Kassenfunktionen.'},
  bookings:{icon:'📅',name:'SumUp Bookings',price:'0 € / Monat',desc:'Online-Terminbuchung, Erinnerungen und optional Vorauszahlung; Online-Zahlungen 2,5 %.'},
  paylink:{icon:'🔗',name:'Zahlungslinks',price:'keine Monatsgebühr',desc:'Online aus der Ferne kassieren; Online-Zahlungen 2,5 %.'}
 };
 function init(){
  const panel=document.querySelector('.nx-new-payment-panel'); if(!panel||panel.dataset.solutionsReady==='1')return false;
  panel.dataset.solutionsReady='1';
  const checks=panel.querySelector('.nx-new-checks'),costs=panel.querySelector('.nx-new-costs'),useCase=panel.querySelector('[name="new_use_case"]'),receipt=panel.querySelector('[name="new_receipt"]'),withoutPhone=panel.querySelector('[name="new_without_phone"]');
  if(!checks||!costs||!useCase)return false;
  const box=document.createElement('details');box.className='nx-solution-picker';
  box.innerHTML=`<summary><span><strong>Hardware & Zusatzlösungen auswählen</strong><small>Geräte, Kasse, Tisch-/Reservierungsfunktionen und Online-Optionen</small></span><b>⌄</b></summary>
   <div class="nx-solution-body">
    <label class="nx-solution-need">Was passt am besten zu deinem Geschäft?<select data-solution-need><option value="auto">Automatische Empfehlung aus deinem Einsatz</option><option value="gastro">Gastronomie / Tischservice / Reservierung</option><option value="retail">Einzelhandel / Barcode / Warenbestand</option><option value="appointments">Dienstleistung / Termine / Buchungen</option><option value="mobile">Mobil / Außendienst / unterwegs</option><option value="counter">Fester Tresen / Laden</option></select></label>
    <div class="nx-solution-note" data-solution-note></div>
    <div class="nx-product-grid">${Object.entries(PRODUCTS).map(([id,p])=>`<label class="nx-product-card" data-product="${id}"><input type="radio" name="nx_solution_product" value="${id}"><img src="${p.img}" alt="${p.name}" loading="lazy"><span><b>${p.name}</b><strong>${p.price}</strong><small>${p.desc}</small><em>${p.fit}</em></span></label>`).join('')}</div>
    <h4>Optionale Funktionen</h4><div class="nx-addon-grid">${Object.entries(ADDONS).map(([id,a])=>`<label class="nx-addon-card" data-addon="${id}"><input type="checkbox" name="nx_solution_addon" value="${id}"><span class="nx-addon-icon">${a.icon}</span><span><b>${a.name}</b><strong>${a.price}</strong><small>${a.desc}</small></span></label>`).join('')}</div>
    <p class="nx-price-source"><strong>Offizieller SumUp-Preisstand 06.10.2026.</strong> Angezeigt werden die aktuell öffentlich ausgewiesenen Preise. Aktionspreise und Verfügbarkeit können sich ändern und werden vor Abschluss erneut geprüft.</p>
   </div>`;
  checks.before(box);
  const style=document.createElement('style');style.textContent=`
   .nx-solution-picker{margin:16px 0;border:1px solid #dce5d7;border-radius:16px;background:#fbfdf9;overflow:hidden}.nx-solution-picker>summary{list-style:none;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:16px;cursor:pointer}.nx-solution-picker>summary::-webkit-details-marker{display:none}.nx-solution-picker>summary span{display:flex;flex-direction:column;gap:2px}.nx-solution-picker>summary strong{font-size:15px}.nx-solution-picker>summary small{font-size:11px;color:#667268}.nx-solution-picker>summary>b{font-size:18px;transition:.2s}.nx-solution-picker[open]>summary>b{transform:rotate(180deg)}.nx-solution-body{padding:0 14px 15px;border-top:1px solid #e4eae0}.nx-solution-need{display:block;margin:14px 0 10px;font-size:11px;font-weight:900}.nx-solution-need select{display:block;width:100%;margin-top:7px;padding:12px;border:1px solid #cfdbc9;border-radius:11px;background:#fff}.nx-solution-note{padding:11px 12px;border-radius:11px;background:#f1ffe2;border:1px solid #cde6a8;font-size:11px;line-height:1.5;margin-bottom:12px}.nx-product-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.nx-product-card{display:grid!important;grid-template-columns:22px 78px 1fr;gap:9px;align-items:center;padding:10px!important;border:1px solid #dce5d7!important;border-radius:13px;background:#fff;cursor:pointer}.nx-product-card.is-selected,.nx-product-card.is-recommended{border-color:#91c542!important;background:#f3ffe5}.nx-product-card input{width:17px!important;margin:0!important}.nx-product-card img{width:78px;height:62px;object-fit:cover;border-radius:10px}.nx-product-card>span:last-child{display:flex;flex-direction:column;gap:2px}.nx-product-card b{font-size:11px}.nx-product-card strong{font-size:14px;color:#f36b29}.nx-product-card small{font-size:9.5px;line-height:1.35;color:#59665d}.nx-product-card em{font-size:9px;color:#6d786f;font-style:normal}.nx-solution-body h4{margin:18px 0 8px;font-size:12px}.nx-addon-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.nx-addon-card{display:grid!important;grid-template-columns:18px 30px 1fr;gap:7px;align-items:start;padding:11px!important;border:1px solid #dce5d7!important;border-radius:12px;background:#fff;cursor:pointer}.nx-addon-card.is-selected,.nx-addon-card.is-recommended{border-color:#91c542!important;background:#f3ffe5}.nx-addon-card input{width:16px!important;margin:2px 0 0!important}.nx-addon-icon{font-size:22px}.nx-addon-card>span:last-child{display:flex;flex-direction:column;gap:2px}.nx-addon-card b{font-size:10.5px}.nx-addon-card strong{font-size:11px;color:#f36b29}.nx-addon-card small{font-size:9.5px;line-height:1.35;color:#617066}.nx-price-source{margin:12px 0 0;font-size:9.5px!important;line-height:1.45;color:#748076!important}@media(max-width:700px){.nx-product-grid,.nx-addon-grid{grid-template-columns:1fr}.nx-product-card{grid-template-columns:22px 74px 1fr}}
  `;document.head.appendChild(style);
  const need=box.querySelector('[data-solution-need]'),note=box.querySelector('[data-solution-note]');
  const radios=[...box.querySelectorAll('[name="nx_solution_product"]')],addons=[...box.querySelectorAll('[name="nx_solution_addon"]')];
  const choose=id=>{const r=radios.find(x=>x.value===id);if(r){r.checked=true;radios.forEach(x=>x.closest('.nx-product-card').classList.toggle('is-selected',x.checked));const p=PRODUCTS[id];const hw=panel.querySelector('[data-cost="hardware"]'),hn=panel.querySelector('[data-hardware-note]');if(hw)hw.textContent=`${p.name} · ${p.price}`;if(hn)hn.textContent=p.fit;}};
  function recommend(){
   let id='lite',text='Für den einfachen Einstieg reicht meist ein kompaktes Gerät; du kannst jederzeit erweitern.',recommended=[];
   const n=need.value;
   if(n==='gastro'||(n==='auto'&&useCase.value==='busy')){id='terminal';recommended=['posplus'];text='Für Gastronomie empfehlen wir Terminal für schnelles Kassieren. Bei Tischservice, Raumplan oder Reservierungsbedarf zusätzlich Kassensoftware Plus prüfen.'}
   else if(n==='retail'||(n==='auto'&&useCase.value==='pos')){id='retail';text='Für Einzelhandel mit Warenbestand ist das Retail-Set mit Barcode-Scanner die vollständigste Ausgangsbasis.'}
   else if(n==='appointments'){id='solo';recommended=['bookings'];text='Für Dienstleistungen mit Terminen: Solo für Vor-Ort-Zahlungen plus Bookings für Online-Termine und Erinnerungen.'}
   else if(n==='mobile'||(n==='auto'&&useCase.value==='mobile')){id='tap';text='Für mobilen Einstieg ohne Zusatzgerät ist Tap to Pay die schlankste Lösung.'}
   else if(n==='counter'||(n==='auto'&&useCase.value==='counter')){id='solo';text='Für einen festen Tresen ohne Smartphone-Abhängigkeit passt Solo gut.'}
   if(receipt?.checked){id=useCase.value==='pos'?'retail':'terminal';text+=' Da gedruckte Belege wichtig sind, wird eine Lösung mit Druckmöglichkeit priorisiert.'}
   if(withoutPhone?.checked&&id==='tap')id='solo';
   radios.forEach(x=>x.closest('.nx-product-card').classList.toggle('is-recommended',x.value===id));addons.forEach(x=>x.closest('.nx-addon-card').classList.toggle('is-recommended',recommended.includes(x.value)));
   note.innerHTML=`<strong>Empfehlung:</strong> ${text}`;choose(id);
  }
  [need,useCase,receipt,withoutPhone].filter(Boolean).forEach(el=>el.addEventListener('change',recommend));radios.forEach(r=>r.addEventListener('change',()=>choose(r.value)));addons.forEach(a=>a.addEventListener('change',()=>a.closest('.nx-addon-card').classList.toggle('is-selected',a.checked)));recommend();
  document.addEventListener('submit',e=>{if(e.target?.id!=='feeCheckForm'||e.target.dataset.nxEntryMode!=='new')return;const product=PRODUCTS[radios.find(r=>r.checked)?.value||'lite'];const selectedAddons=addons.filter(a=>a.checked||a.closest('.nx-addon-card').classList.contains('is-recommended')).map(a=>ADDONS[a.value]);const msg=e.target.elements.namedItem('message');if(msg){const extra=['Ausgewählte/empfohlene SumUp-Lösung: '+product.name+' · '+product.price,selectedAddons.length?'Zusatzlösungen: '+selectedAddons.map(a=>a.name+' ('+a.price+')').join(', '):'',need.value!=='auto'?'Geschäftsbedarf: '+need.options[need.selectedIndex].text:''].filter(Boolean).join('\n');msg.value=extra+(msg.value?'\n'+msg.value:'');}},true);
  return true;
 }
 if(!init()){const o=new MutationObserver(()=>{if(init())o.disconnect()});o.observe(document.documentElement,{childList:true,subtree:true});setTimeout(()=>o.disconnect(),15000)}
})();