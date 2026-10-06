/* Customer-specific entry for existing payment users vs. businesses that do not yet accept cards. */
(() => {
 const money=value=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(Number(value)||0);
 const num=value=>{const n=Number(String(value??'').replace(',','.'));return Number.isFinite(n)?n:0};
 const desired=new URLSearchParams(location.search).get('payment_mode');

 function setup(){
  const section=document.getElementById('vergleich');
  const form=document.getElementById('feeCheckForm');
  const switcher=section?.querySelector('.nx-mode-switch');
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

  const newBtn=document.createElement('button');
  newBtn.type='button';newBtn.className='nx-mode-btn';newBtn.dataset.mode='new';newBtn.setAttribute('role','tab');newBtn.setAttribute('aria-selected','false');
  newBtn.innerHTML='<span>＋</span><strong>Ich nutze noch keine Kartenzahlung</strong><small>Kosten, Tarif und passende Hardware für den Einstieg berechnen.</small>';
  switcher.appendChild(newBtn);

  const newPanel=document.createElement('div');newPanel.className='nx-mode-panel nx-new-payment-panel';newPanel.dataset.panel='new';newPanel.hidden=true;
  newPanel.innerHTML=`
   <div class="nx-panel-intro"><strong>Dein Einstieg in die Kartenzahlung</strong><span>Hier vergleichen wir nicht mit erfundenen Alt-Kosten. Wir rechnen ausschließlich mit deinem erwarteten Einsatz und zeigen dir transparente SumUp-Kosten.</span></div>
   <div class="nx-new-payment-note"><b>✓</b><span><strong>Keine Vergleichswerte nötig.</strong><small>Du nutzt heute noch keine Kartenzahlung. Deshalb gibt es keine „bisherigen Gebühren“ und keine künstlich berechnete Ersparnis.</small></span></div>
   <div class="nx-fee-fields nx-new-fields">
    <label>Erwarteter Kartenumsatz / Monat<input name="new_monthly_volume" type="number" min="1" max="100000000" step="0.01" inputmode="decimal" placeholder="z. B. 3500"></label>
    <label>Erwartete Transaktionen / Monat<input name="new_transaction_count" type="number" min="0" max="10000000" step="1" inputmode="numeric" placeholder="z. B. 150"></label>
    <label>Wie möchtest du kassieren?<select name="new_use_case"><option value="simple">Einfach starten / gelegentliche Zahlungen</option><option value="mobile">Mobil beim Kunden / unterwegs</option><option value="counter">Fester Tresen / Laden</option><option value="busy">Gastronomie / höherer Durchsatz</option><option value="pos">Komplette Kassenlösung</option></select></label>
    <label>Planungsanteil berechtigte Karten für Plus (%)<input name="new_eligible_share" type="number" min="0" max="100" step="1" inputmode="numeric" value="90"></label>
   </div>
   <div class="nx-new-checks"><label><input name="new_without_phone" type="checkbox"> Ohne gekoppeltes Smartphone kassieren</label><label><input name="new_receipt" type="checkbox"> Gedruckte Belege direkt am Gerät wichtig</label></div>
   <div class="nx-new-costs" aria-live="polite"><div><span>Umsatzbasiert</span><strong data-cost="standard">–</strong><small>1,39 % · 0 € monatliche Tarifgrundgebühr</small></div><div><span>Zahlungen Plus</span><strong data-cost="plus">–</strong><small>0,79 % angenommene berechtigte Karten + 1,39 % sonstige + 19 €/Monat</small></div><div><span>Hardware-Empfehlung</span><strong data-cost="hardware">–</strong><small data-hardware-note>abhängig von deinem Einsatz</small></div></div>
   <p class="nx-new-recommendation" data-cost="recommendation">Gib deinen erwarteten Kartenumsatz ein, um eine erste Kostenorientierung zu erhalten.</p>
   <p class="nx-new-source">Preisstand 06.10.2026. Aktionspreise und Kartenklassifizierung bitte vor Abschluss nochmals prüfen.</p>`;
  manualPanel.after(newPanel);

  const style=document.createElement('style');style.textContent=`
   .nx-mode-switch{grid-template-columns:repeat(3,1fr)!important}.nx-new-payment-note{display:flex;gap:11px;padding:13px 14px;border-radius:13px;background:#f6fbef;border:1px solid #dceacd;margin-bottom:18px}.nx-new-payment-note>b{display:grid;place-items:center;width:25px;height:25px;flex:none;border-radius:8px;background:#82b92d;color:#fff}.nx-new-payment-note span{display:flex;flex-direction:column;gap:2px}.nx-new-payment-note strong{font-size:12px}.nx-new-payment-note small{font-size:10.5px;line-height:1.5;color:#687568}.nx-new-fields select{width:100%;margin-top:7px;padding:12px 13px;border:1px solid #cfd9c8;border-radius:10px;background:#fff;color:#18221c}.nx-new-checks{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:3px 0 16px}.nx-new-checks label{display:flex!important;align-items:center;gap:9px;padding:12px;border:1px solid #dce5d6;border-radius:12px;background:#fbfdf9}.nx-new-checks input{width:18px!important;margin:0!important;flex:none}.nx-new-costs{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:15px 0}.nx-new-costs>div{display:flex;flex-direction:column;gap:4px;padding:15px;border:1px solid #dde6d6;border-radius:14px;background:#f8fbf5}.nx-new-costs span{font-size:10px;font-weight:900;letter-spacing:.5px;text-transform:uppercase;color:#657267}.nx-new-costs strong{font-size:18px}.nx-new-costs small{font-size:10px;line-height:1.4;color:#6b776d}.nx-new-recommendation{padding:13px 14px;border-radius:13px;background:#fff5eb;border:1px solid #f4d7bf;font-size:12px!important;color:#374339!important}.nx-new-source{font-size:10px!important;color:#768078!important}.nx-mode-btn[data-mode="new"]>span{background:#fff0e5}.nx-mode-btn[data-mode="new"].is-active>span{background:#f36b29;color:#fff}
   @media(max-width:760px){.nx-mode-switch{grid-template-columns:1fr!important}.nx-new-checks,.nx-new-costs{grid-template-columns:1fr}.nx-new-costs>div{padding:13px}}
  `;document.head.append(style);

  const volume=newPanel.querySelector('[name="new_monthly_volume"]');
  const tx=newPanel.querySelector('[name="new_transaction_count"]');
  const useCase=newPanel.querySelector('[name="new_use_case"]');
  const share=newPanel.querySelector('[name="new_eligible_share"]');
  const withoutPhone=newPanel.querySelector('[name="new_without_phone"]');
  const receipt=newPanel.querySelector('[name="new_receipt"]');
  const standardOut=newPanel.querySelector('[data-cost="standard"]');
  const plusOut=newPanel.querySelector('[data-cost="plus"]');
  const hardwareOut=newPanel.querySelector('[data-cost="hardware"]');
  const hardwareNote=newPanel.querySelector('[data-hardware-note]');
  const recommendation=newPanel.querySelector('[data-cost="recommendation"]');

  const hardware=()=>{
   if(useCase.value==='pos')return {name:'SumUp Kasse',price:399,note:'zwei Displays · komplette Kassenlösung'};
   if(receipt.checked||useCase.value==='busy')return {name:'Terminal',price:139,note:'eigenständig · integrierter Belegdruck'};
   if(withoutPhone.checked||useCase.value==='counter')return {name:'Solo',price:59,note:'eigenständig · WLAN/Mobilfunk'};
   if(useCase.value==='mobile')return {name:'Tap to Pay',price:0,note:'direkt auf kompatiblem Smartphone'};
   return {name:'Solo Lite',price:22,note:'günstiger Einstieg · Smartphone gekoppelt'};
  };
  function recalc(){
   const v=Math.max(0,num(volume.value)),eligible=Math.min(100,Math.max(0,num(share.value)));
   const standard=v*.0139,plus=v*(eligible/100)*.0079+v*((100-eligible)/100)*.0139+19;
   standardOut.textContent=v?money(standard)+' / Monat':'–';plusOut.textContent=v?money(plus)+' / Monat':'–';
   const h=hardware();hardwareOut.textContent=h.name+(h.price===0?' · 0 €':' · '+money(h.price));hardwareNote.textContent=h.note;
   if(!v){recommendation.textContent='Gib deinen erwarteten Kartenumsatz ein, um eine erste Kostenorientierung zu erhalten.';return}
   if(v>=10000)recommendation.innerHTML='<strong>Ausgangsbasis: individuelle Konditionen anfragen.</strong> SumUp nennt ab 10.000 € monatlichem Umsatz maßgeschneiderte Gebühren. Die Standard-/Plus-Werte bleiben nur eine Orientierung.';
   else if(v>=3500&&plus<standard)recommendation.innerHTML='<strong>Ausgangsbasis: Zahlungen Plus prüfen.</strong> Unter den gewählten Annahmen liegt die modellierte Monatsbelastung unter dem Standardtarif. Die tatsächliche Kartenberechtigung entscheidet.';
   else recommendation.innerHTML='<strong>Ausgangsbasis: umsatzbasiertes Zahlen.</strong> Keine monatliche Tarifgrundgebühr; du zahlst 1,39 % pro verarbeiteter Vor-Ort-Kartenzahlung.';
  }
  [volume,share,useCase,withoutPhone,receipt].forEach(el=>el.addEventListener('input',recalc));recalc();

  function visualNew(){
   switcher.querySelectorAll('.nx-mode-btn').forEach(btn=>{const active=btn===newBtn;btn.classList.toggle('is-active',active);btn.setAttribute('aria-selected',String(active))});
   uploadPanel.hidden=true;manualPanel.hidden=true;newPanel.hidden=false;file.required=false;submit.textContent='Einstiegskalkulation anfordern ↗';status.textContent='';delete status.dataset.state;form.dataset.nxEntryMode='new';
  }
  function leaveNew(){newPanel.hidden=true;delete form.dataset.nxEntryMode}
  newBtn.addEventListener('click',visualNew);
  uploadBtn.addEventListener('click',leaveNew);
  manualBtn.addEventListener('click',leaveNew);

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
   const h=hardware(),v=num(volume.value),eligible=Math.min(100,Math.max(0,num(share.value))),standard=v*.0139,plus=v*(eligible/100)*.0079+v*((100-eligible)/100)*.0139+19;
   const details=[
    'Ausgangslage: Ich nutze noch keine Kartenzahlung.',
    'Erwarteter Kartenumsatz: '+money(v)+' / Monat',
    'Erwartete Transaktionen: '+(tx.value||'nicht angegeben')+' / Monat',
    'Einsatz: '+useCase.options[useCase.selectedIndex].text,
    'Ohne Smartphone: '+(withoutPhone.checked?'ja':'nein'),
    'Belegdruck am Gerät: '+(receipt.checked?'ja':'nein'),
    'Planungsannahme berechtigte Karten für Plus: '+eligible+' %',
    'Kostenorientierung umsatzbasiert: '+money(standard)+' / Monat',
    'Kostenorientierung Zahlungen Plus: '+money(plus)+' / Monat',
    'Hardware-Empfehlung: '+h.name+' · '+money(h.price),
    'Hinweis: Keine Ersparnis gegenüber einem Bestandsanbieter ausgewiesen, weil keine Vergleichsbasis vorhanden ist.'
   ].join('\n');
   if(message)message.value=details+(message.value?'\n\nWeitere Hinweise:\n'+message.value:'');
   // Re-use the battle-tested manual submit path so challenge, validation and CRM ingestion remain identical.
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
