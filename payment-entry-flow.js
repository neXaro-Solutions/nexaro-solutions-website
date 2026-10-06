/* Customer-specific entry for existing payment users vs. businesses that do not yet accept cards. */
(() => {
 const money=value=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(Number(value)||0);
 const num=value=>{const n=Number(String(value??'').replace(',','.'));return Number.isFinite(n)?n:0};
 const desired=new URLSearchParams(location.search).get('payment_mode');

 function setup(){
  const section=document.getElementById('vergleich');
  const form=document.getElementById('feeCheckForm');
  const switcher=section?.querySelector('.nx-mode-switch');
  const compareHead=section?.querySelector('.nx-compare-head');
  if(!section||!form||!switcher||section.dataset.entryFlowReady==='1')return false;
  section.dataset.entryFlowReady='1';
  const uploadBtn=switcher.querySelector('[data-mode="upload"]');
  const manualBtn=switcher.querySelector('[data-mode="manual"]');
  const uploadPanel=form.querySelector('[data-panel="upload"]');
  const manualPanel=form.querySelector('[data-panel="manual"]');
  const file=form.querySelector('#feeStatement');
  const submit=form.querySelector('#feeCheckSubmit');
  const status=form.querySelector('#feeCheckStatus');
  if(!uploadBtn||!manualBtn||!uploadPanel||!manualPanel||!file||!submit||!status)return false;

  const originalHead=compareHead?compareHead.innerHTML:'';
  const newBtn=document.createElement('button');
  newBtn.type='button';newBtn.className='nx-mode-btn';newBtn.dataset.mode='new';newBtn.setAttribute('role','tab');newBtn.setAttribute('aria-selected','false');
  newBtn.innerHTML='<span>＋</span><strong>Ich nutze noch keine Kartenzahlung</strong><small>Tarif, Kosten und passende Hardware für den Einstieg berechnen.</small>';
  switcher.appendChild(newBtn);

  const newPanel=document.createElement('div');newPanel.className='nx-mode-panel nx-new-payment-panel';newPanel.dataset.panel='new';newPanel.hidden=true;
  newPanel.innerHTML=`
   <div class="nx-panel-intro"><strong>Dein Einstieg in die Kartenzahlung</strong><span>Du brauchst keine alte Abrechnung und keine bisherigen Gebühren. Wir planen nur das, was du künftig wirklich benötigst.</span></div>
   <div class="nx-new-payment-note"><b>✓</b><span><strong>Keine Vergleichswerte nötig.</strong><small>Wir berechnen keine künstliche Ersparnis gegenüber einem Anbieter, den du heute gar nicht nutzt.</small></span></div>
   <div class="nx-fee-fields nx-new-fields">
    <label>Erwarteter Kartenumsatz / Monat<input name="new_monthly_volume" type="number" min="1" max="100000000" step="0.01" inputmode="decimal" placeholder="z. B. 3500"></label>
    <label>Erwartete Transaktionen / Monat<input name="new_transaction_count" type="number" min="0" max="10000000" step="1" inputmode="numeric" placeholder="z. B. 150"></label>
    <label>Wie möchtest du kassieren?<select name="new_use_case"><option value="simple">Einfach starten / gelegentliche Zahlungen</option><option value="mobile">Mobil beim Kunden / unterwegs</option><option value="counter">Fester Tresen / Laden</option><option value="busy">Gastronomie / höherer Durchsatz</option><option value="pos">Komplette Kassenlösung</option></select></label>
   </div>
   <fieldset class="nx-tariff-choice"><legend>Welche Gebührenstruktur passt besser zu dir?</legend>
    <label class="nx-tariff-card is-selected"><input type="radio" name="new_tariff" value="standard" checked><span class="nx-tariff-rate">1,39 %</span><span><strong>Umsatzbasiertes Zahlen</strong><small>0 € monatliche Tarifgebühr. Für Vor-Ort-Zahlungen mit anderen Karten gilt grundsätzlich 1,39 %. Ideal bei schwankendem oder niedrigerem Kartenumsatz und wenn du keine monatliche Fixgebühr möchtest.</small></span></label>
    <label class="nx-tariff-card"><input type="radio" name="new_tariff" value="plus"><span class="nx-tariff-rate">0,79 %</span><span><strong>Zahlungen Plus</strong><small>19 € monatlich oder 199 € jährlich. 0,79 % gelten für Vor-Ort-Zahlungen mit im EWR ausgestellten Verbraucherkarten. Nicht-EWR-, Firmen- und Premiumkarten bleiben bei 1,39 %. SumUp nennt Plus besonders bei regelmäßigem Kartenumsatz ab etwa 3.500 € pro Monat als interessant.</small></span></label>
   </fieldset>
   <div class="nx-tariff-info"><strong>Wichtig:</strong> Die 0,79 % gelten nicht automatisch für jede Karte. Entscheidend sind Kartenart und Kartenherkunft. Online-Zahlungen werden separat berechnet.</div>
   <div class="nx-new-checks"><label><input name="new_without_phone" type="checkbox"> Ohne gekoppeltes Smartphone kassieren</label><label><input name="new_receipt" type="checkbox"> Gedruckte Belege direkt am Gerät wichtig</label></div>
   <div class="nx-new-costs" aria-live="polite"><div><span>Gewählter Tarif</span><strong data-cost="tariff">1,39 %</strong><small data-tariff-note>0 € monatliche Tarifgebühr</small></div><div><span>Kostenorientierung</span><strong data-cost="selected">–</strong><small data-selected-note>Erwarteten Kartenumsatz eingeben</small></div><div><span>Hardware-Empfehlung</span><strong data-cost="hardware">–</strong><small data-hardware-note>abhängig von deinem Einsatz</small></div></div>
   <p class="nx-new-recommendation" data-cost="recommendation">Gib deinen erwarteten Kartenumsatz ein, um eine erste Kostenorientierung zu erhalten.</p>
   <p class="nx-new-source">Preisstand 06.10.2026. Bei Zahlungen Plus ist die Kostenanzeige eine Orientierung unter der Annahme, dass die betrachteten Vor-Ort-Zahlungen für 0,79 % berechtigt sind. Andere Karten werden mit 1,39 % berechnet; Online-Zahlungen separat. Aktuelle Konditionen bitte vor Abschluss nochmals prüfen.</p>
   <button type="button" class="nx-change-payment-path">Ich nutze doch bereits Kartenzahlung → zum Vergleich</button>`;
  manualPanel.after(newPanel);

  const style=document.createElement('style');style.textContent=`
   .nx-mode-switch{grid-template-columns:repeat(3,1fr)!important}.nx-new-payment-note{display:flex;gap:11px;padding:13px 14px;border-radius:13px;background:#f6fbef;border:1px solid #dceacd;margin-bottom:18px}.nx-new-payment-note>b{display:grid;place-items:center;width:25px;height:25px;flex:none;border-radius:8px;background:#82b92d;color:#fff}.nx-new-payment-note span{display:flex;flex-direction:column;gap:2px}.nx-new-payment-note strong{font-size:12px}.nx-new-payment-note small{font-size:10.5px;line-height:1.5;color:#687568}.nx-new-fields select{width:100%;margin-top:7px;padding:12px 13px;border:1px solid #cfd9c8;border-radius:10px;background:#fff;color:#18221c}.nx-new-checks{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 0}.nx-new-checks label{display:flex!important;align-items:center;gap:9px;padding:12px;border:1px solid #dce5d6;border-radius:12px;background:#fbfdf9}.nx-new-checks input{width:18px!important;margin:0!important;flex:none}.nx-new-costs{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:15px 0}.nx-new-costs>div{display:flex;flex-direction:column;gap:4px;padding:15px;border:1px solid #dde6d6;border-radius:14px;background:#f8fbf5}.nx-new-costs span{font-size:10px;font-weight:900;letter-spacing:.5px;text-transform:uppercase;color:#657267}.nx-new-costs strong{font-size:18px}.nx-new-costs small{font-size:10px;line-height:1.4;color:#6b776d}.nx-new-recommendation{padding:13px 14px;border-radius:13px;background:#fff5eb;border:1px solid #f4d7bf;font-size:12px!important;color:#374339!important}.nx-new-source{font-size:10px!important;color:#768078!important}.nx-mode-btn[data-mode="new"]>span{background:#fff0e5}.nx-mode-btn[data-mode="new"].is-active>span{background:#f36b29;color:#fff}.nx-new-only .nx-mode-switch{display:none!important}.nx-new-only .nx-compare-head{padding-bottom:10px}.nx-tariff-choice{border:0;padding:0;margin:8px 0 12px}.nx-tariff-choice legend{font-size:13px;font-weight:900;margin-bottom:10px;color:#263029}.nx-tariff-card{position:relative;display:grid!important;grid-template-columns:auto 76px 1fr;gap:12px;align-items:flex-start;padding:16px!important;margin-bottom:10px;border:1px solid #d9e3d2!important;border-radius:15px;background:#fff;color:#253027!important;cursor:pointer}.nx-tariff-card.is-selected{border-color:#93c74a!important;background:#f2ffe1;box-shadow:0 0 0 2px #baff3726}.nx-tariff-card input{width:18px!important;margin:4px 0 0!important}.nx-tariff-rate{font-size:22px;font-weight:950;color:#f36b29;line-height:1}.nx-tariff-card>span:last-child{display:flex;flex-direction:column;gap:4px}.nx-tariff-card strong{font-size:13px}.nx-tariff-card small{font-size:11px;line-height:1.5;color:#667269;font-weight:500}.nx-tariff-info{padding:12px 14px;border-radius:12px;background:#fff7ef;border:1px solid #f2d4bd;font-size:11px;line-height:1.55;color:#465047}.nx-change-payment-path{border:0;background:transparent;color:#52605a;font-size:11px;font-weight:800;text-decoration:underline;cursor:pointer;padding:8px 0}.nx-new-only .nx-compare-head h2{margin-bottom:8px}
   @media(max-width:760px){.nx-mode-switch{grid-template-columns:1fr!important}.nx-new-checks,.nx-new-costs{grid-template-columns:1fr}.nx-new-costs>div{padding:13px}.nx-tariff-card{grid-template-columns:auto 64px 1fr;padding:14px!important}.nx-tariff-rate{font-size:19px}}
  `;document.head.append(style);

  const volume=newPanel.querySelector('[name="new_monthly_volume"]');
  const tx=newPanel.querySelector('[name="new_transaction_count"]');
  const useCase=newPanel.querySelector('[name="new_use_case"]');
  const tariffInputs=[...newPanel.querySelectorAll('[name="new_tariff"]')];
  const withoutPhone=newPanel.querySelector('[name="new_without_phone"]');
  const receipt=newPanel.querySelector('[name="new_receipt"]');
  const tariffOut=newPanel.querySelector('[data-cost="tariff"]');
  const tariffNote=newPanel.querySelector('[data-tariff-note]');
  const selectedOut=newPanel.querySelector('[data-cost="selected"]');
  const selectedNote=newPanel.querySelector('[data-selected-note]');
  const hardwareOut=newPanel.querySelector('[data-cost="hardware"]');
  const hardwareNote=newPanel.querySelector('[data-hardware-note]');
  const recommendation=newPanel.querySelector('[data-cost="recommendation"]');
  const changePath=newPanel.querySelector('.nx-change-payment-path');

  const selectedTariff=()=>tariffInputs.find(input=>input.checked)?.value||'standard';
  const hardware=()=>{
   if(useCase.value==='pos')return {name:'SumUp Kasse',price:399,note:'zwei Displays · komplette Kassenlösung'};
   if(receipt.checked||useCase.value==='busy')return {name:'Terminal',price:139,note:'eigenständig · integrierter Belegdruck'};
   if(withoutPhone.checked||useCase.value==='counter')return {name:'Solo',price:59,note:'eigenständig · WLAN/Mobilfunk'};
   if(useCase.value==='mobile')return {name:'Tap to Pay',price:0,note:'direkt auf kompatiblem Smartphone'};
   return {name:'Solo Lite',price:22,note:'günstiger Einstieg · Smartphone gekoppelt'};
  };
  function recalc(){
   const v=Math.max(0,num(volume.value)),tariff=selectedTariff();
   tariffInputs.forEach(input=>input.closest('.nx-tariff-card')?.classList.toggle('is-selected',input.checked));
   const standard=v*.0139;
   const plusEligible=v*.0079+19;
   if(tariff==='plus'){
    tariffOut.textContent='0,79 %';tariffNote.textContent='für berechtigte EWR-Verbraucherkarten · 19 € / Monat';
    selectedOut.textContent=v?money(plusEligible)+' / Monat*':'–';
    selectedNote.textContent='*Orientierung bei ausschließlich für 0,79 % berechtigten Vor-Ort-Zahlungen';
   }else{
    tariffOut.textContent='1,39 %';tariffNote.textContent='0 € monatliche Tarifgebühr';
    selectedOut.textContent=v?money(standard)+' / Monat':'–';selectedNote.textContent='für Vor-Ort-Kartenzahlungen im Standardtarif';
   }
   const h=hardware();hardwareOut.textContent=h.name+(h.price===0?' · 0 €':' · '+money(h.price));hardwareNote.textContent=h.note;
   if(!v){recommendation.textContent='Gib deinen erwarteten Kartenumsatz ein, um eine erste Kostenorientierung zu erhalten.';return}
   if(v>=10000)recommendation.innerHTML='<strong>Hinweis: individuelle Konditionen prüfen.</strong> SumUp nennt ab 10.000 € monatlichem Umsatz maßgeschneiderte Gebühren. Die gewählte Standard-/Plus-Variante bleibt bis zu einer individuellen Freigabe nur die Ausgangsbasis.';
   else if(tariff==='plus')recommendation.innerHTML='<strong>Gewählt: Zahlungen Plus.</strong> 0,79 % gelten für berechtigte EWR-Verbraucherkarten bei Vor-Ort-Zahlungen. Nicht-EWR-, Firmen- und Premiumkarten werden mit 1,39 % berechnet. Dazu kommen 19 € monatlich bzw. alternativ 199 € jährlich.';
   else recommendation.innerHTML='<strong>Gewählt: Umsatzbasiertes Zahlen.</strong> Keine monatliche Tarifgebühr; für Vor-Ort-Zahlungen mit anderen Karten gilt grundsätzlich 1,39 % pro Transaktion.';
  }
  [volume,useCase,withoutPhone,receipt,...tariffInputs].forEach(el=>el.addEventListener('input',recalc));recalc();

  function setNewHead(){if(compareHead)compareHead.innerHTML='<span class="eyebrow"><span class="line"></span> SUMUP · NEUE KARTENZAHLUNG</span><h2>Kartenzahlung <em>einfach starten.</em></h2><p>Wähle deinen Tarif, beschreibe kurz deinen Einsatz und erhalte eine klare Kosten- und Hardwareorientierung. Keine alte Abrechnung nötig.</p>'}
  function restoreHead(){if(compareHead&&originalHead)compareHead.innerHTML=originalHead}
  function visualNew(){
   section.classList.add('nx-new-only');setNewHead();
   switcher.querySelectorAll('.nx-mode-btn').forEach(btn=>{const active=btn===newBtn;btn.classList.toggle('is-active',active);btn.setAttribute('aria-selected',String(active))});
   uploadPanel.hidden=true;manualPanel.hidden=true;newPanel.hidden=false;file.required=false;submit.textContent='Einstiegskalkulation anfordern ↗';status.textContent='';delete status.dataset.state;form.dataset.nxEntryMode='new';
  }
  function leaveNew(){section.classList.remove('nx-new-only');restoreHead();newPanel.hidden=true;delete form.dataset.nxEntryMode}
  newBtn.addEventListener('click',visualNew);
  uploadBtn.addEventListener('click',leaveNew);
  manualBtn.addEventListener('click',leaveNew);
  changePath.addEventListener('click',()=>{leaveNew();uploadBtn.click();requestAnimationFrame(()=>section.scrollIntoView({behavior:'smooth',block:'start'}))});

  form.addEventListener('submit',event=>{
   if(form.dataset.nxEntryMode!=='new')return;
   if(!volume.value||num(volume.value)<=0){event.preventDefault();event.stopImmediatePropagation();status.dataset.state='error';status.textContent='Bitte gib deinen erwarteten Kartenumsatz pro Monat ein.';volume.focus();return}
   const currentProvider=form.elements.namedItem('current_provider');
   const monthlyVolume=form.elements.namedItem('monthly_volume');
   const transactionCount=form.elements.namedItem('transaction_count');
   const message=form.elements.namedItem('message');
   if(currentProvider)currentProvider.value='Noch keine Kartenzahlung';
   if(monthlyVolume)monthlyVolume.value=String(volume.value||'');
   if(transactionCount)transactionCount.value=String(tx.value||'');
   const h=hardware(),v=num(volume.value),tariff=selectedTariff(),standard=v*.0139,plusEligible=v*.0079+19;
   const tariffText=tariff==='plus'?'Zahlungen Plus · 0,79 % für berechtigte EWR-Verbraucherkarten · andere Karten 1,39 % · 19 € monatlich':'Umsatzbasiertes Zahlen · 1,39 % · 0 € monatliche Tarifgebühr';
   const details=[
    'Ausgangslage: Ich nutze noch keine Kartenzahlung.',
    'Erwarteter Kartenumsatz: '+money(v)+' / Monat',
    'Erwartete Transaktionen: '+(tx.value||'nicht angegeben')+' / Monat',
    'Gewählter Zahlungstarif: '+tariffText,
    tariff==='plus'?'Kostenorientierung bei ausschließlich berechtigten EWR-Verbraucherkarten: '+money(plusEligible)+' / Monat':'Kostenorientierung: '+money(standard)+' / Monat',
    'Einsatz: '+useCase.options[useCase.selectedIndex].text,
    'Ohne Smartphone: '+(withoutPhone.checked?'ja':'nein'),
    'Belegdruck am Gerät: '+(receipt.checked?'ja':'nein'),
    'Hardware-Empfehlung: '+h.name+' · '+money(h.price),
    'Hinweis: Keine Ersparnis gegenüber einem Bestandsanbieter ausgewiesen, weil keine Vergleichsbasis vorhanden ist.'
   ].join('\n');
   if(message)message.value=details+(message.value?'\n\nWeitere Hinweise:\n'+message.value:'');
   // Re-use the established manual submit path for challenge, validation and CRM ingestion.
   manualBtn.click();
   visualNew();
  },true);

  if(desired==='new'){
   visualNew();
   requestAnimationFrame(()=>section.scrollIntoView({behavior:'smooth',block:'start'}));
  }else if(desired==='existing'){
   uploadBtn.click();
   requestAnimationFrame(()=>section.scrollIntoView({behavior:'smooth',block:'start'}));
  }
  return true;
 }
 if(!setup()){
  const observer=new MutationObserver(()=>{if(setup())observer.disconnect()});observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(()=>observer.disconnect(),12000);
 }
})();
