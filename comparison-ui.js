(() => {
 const INTAKE_ENDPOINT='https://hbuqzdmjqvgybwohfnqy.supabase.co/functions/v1/nx-public-intake';

 const setupEntryMode=section=>{
  const form=section.querySelector('#feeCheckForm');
  if(!form||form.dataset.entryModeReady==='1')return;
  form.dataset.entryModeReady='1';
  form.dataset.entryMode='upload';
  const fileInput=form.querySelector('#feeStatement');
  const fileDrop=form.querySelector('.nx-file-drop');
  const status=form.querySelector('#feeCheckStatus');
  const submit=form.querySelector('#feeCheckSubmit');
  const dataTitle=form.querySelector('.nx-form-step-title-data');
  if(!fileInput||!fileDrop||!status||!submit||!dataTitle)return;

  const chooser=document.createElement('div');
  chooser.className='nx-entry-choice';
  chooser.innerHTML=`
   <button type="button" class="nx-entry-option is-active" data-mode="upload"><span>↥</span><b>Abrechnung hochladen</b><small>Wir lesen die Daten automatisch aus.</small></button>
   <button type="button" class="nx-entry-option" data-mode="manual"><span>✎</span><b>Daten manuell erfassen</b><small>Anbieter, Umsatz und Gebühren selbst eintragen.</small></button>`;
  fileDrop.before(chooser);

  const intro=form.querySelector('.nx-fee-intro');
  const originalIntro=intro?.textContent||'';
  const applyMode=mode=>{
   form.dataset.entryMode=mode;
   chooser.querySelectorAll('.nx-entry-option').forEach(btn=>btn.classList.toggle('is-active',btn.dataset.mode===mode));
   fileInput.required=mode==='upload';
   if(mode==='manual'){
    fileInput.value='';
    const label=form.querySelector('#feeFileLabel');if(label)label.textContent='1. Abrechnung auswählen';
    if(intro)intro.textContent='Trage die Daten deiner aktuellen Payment-Lösung ein. Ein Upload ist in diesem Weg nicht nötig.';
    submit.textContent='Daten senden & Angebot anfordern ↗';
    status.textContent='';delete status.dataset.state;
   }else{
    if(intro)intro.textContent='Abrechnung auswählen – die Vergleichsdaten werden automatisch ausgelesen. Du musst Gebühren und Anbieter nicht zusätzlich eintippen.';
    submit.textContent='Abrechnung senden & Angebot anfordern ↗';
    status.textContent='';delete status.dataset.state;
   }
  };
  chooser.addEventListener('click',e=>{const btn=e.target.closest('.nx-entry-option');if(btn)applyMode(btn.dataset.mode)});
  applyMode('upload');

  form.addEventListener('submit',async event=>{
   if(form.dataset.entryMode!=='manual')return;
   event.preventDefault();event.stopImmediatePropagation();
   if(!form.reportValidity())return;
   submit.disabled=true;submit.textContent='Vergleich wird angelegt …';status.textContent='';delete status.dataset.state;
   try{
    const challengeRes=await fetch(INTAKE_ENDPOINT,{signal:AbortSignal.timeout(20000)});
    if(!challengeRes.ok)throw Error('Die sichere Verbindung ist momentan nicht erreichbar.');
    const challenge=await challengeRes.json();
    const wait=Math.max(0,2200-(Date.now()-Number(challenge.issued||0)));if(wait)await new Promise(r=>setTimeout(r,wait));
    const d=new FormData(form);
    const details=[
     ['Bisheriger Anbieter',d.get('current_provider')],
     ['Monatlicher Kartenumsatz',d.get('monthly_volume')],
     ['Transaktionen pro Monat',d.get('transaction_count')],
     ['Debit-/EC-Gebühr',d.get('debit_fee')],
     ['Kreditkarten-Gebühr',d.get('credit_fee')],
     ['Fixkosten pro Monat',d.get('monthly_fixed_cost')]
    ].filter(([,v])=>String(v||'').trim()).map(([k,v])=>k+': '+String(v).trim()).join('\n');
    const note=String(d.get('message')||'').trim();
    const payload={
     interest:'sumup',request_type:'sumup_fee_check',company:String(d.get('company')||'').trim(),contact:String(d.get('contact')||'').trim(),city:String(d.get('city')||'').trim(),email:String(d.get('email')||'').trim(),phone:String(d.get('phone')||'').trim(),current_provider:String(d.get('current_provider')||'').trim(),monthly_volume:String(d.get('monthly_volume')||'').trim(),message:'Quelle: neXaro Landingpage · Konditionsvergleich · manuelle Datenerfassung\n\nManuell erfasste Vergleichsdaten:\n'+(details||'keine zusätzlichen Vergleichsdaten')+(note?'\n\nWeitere Angaben:\n'+note:''),consent:d.get('consent')==='on'
    };
    const intake=await fetch(INTAKE_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({payload,website:String(d.get('website')||''),challenge}),signal:AbortSignal.timeout(25000)});
    if(!intake.ok){if(intake.status===429)throw Error('Zu viele Anfragen in kurzer Zeit. Bitte versuche es später erneut.');if(intake.status===400)throw Error('Bitte prüfe deine Angaben und versuche es erneut.');throw Error('Der Vergleich konnte gerade nicht angelegt werden. Deine Eingaben bleiben erhalten.');}
    status.dataset.state='success';status.textContent='Geschafft! Deine Daten sind sicher übermittelt. Wir bereiten daraus deinen persönlichen Vergleich vor.';
    form.reset();applyMode('upload');
   }catch(error){status.dataset.state='error';status.textContent=error instanceof Error?error.message:'Die Verbindung ist gerade nicht verfügbar. Bitte versuche es erneut.'}
   finally{submit.disabled=false;if(form.dataset.entryMode==='manual')submit.textContent='Daten senden & Angebot anfordern ↗'}
  },true);

  const style=document.createElement('style');
  style.textContent=`
   .nx-entry-choice{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 0 18px}.nx-entry-option{display:grid;grid-template-columns:auto 1fr;column-gap:10px;align-items:center;text-align:left;padding:14px;border:1px solid #d8e1d2;border-radius:14px;background:#fff;color:#273229}.nx-entry-option span{grid-row:1/3;display:grid;place-items:center;width:38px;height:38px;border-radius:10px;background:#edf7e1;font-size:19px;font-weight:900}.nx-entry-option b{font-size:12px}.nx-entry-option small{font-size:10px;color:#6a7669;line-height:1.35}.nx-entry-option.is-active{border-color:#9ccf58;background:#f3ffe5;box-shadow:0 0 0 2px #baff3730}.nx-entry-option.is-active span{background:#baff37}
   #feeCheckForm[data-entry-mode="upload"] .nx-form-step-title-data,#feeCheckForm[data-entry-mode="upload"] .nx-form-step-title-data + .nx-fee-fields{display:none!important}
   #feeCheckForm[data-entry-mode="manual"] .nx-file-drop,#feeCheckForm[data-entry-mode="manual"] .nx-statement-readout{display:none!important}
   #feeCheckForm[data-entry-mode="manual"] .nx-form-step-title-data{margin-top:8px;border-top:0;padding-top:0}
   @media(max-width:560px){.nx-entry-choice{grid-template-columns:1fr}}
  `;
  document.head.append(style);
 };

 const setupComparison=()=>{
  const section=document.getElementById('vergleich');
  if(!section||section.dataset.foldReady==='1')return false;
  setupEntryMode(section);
  section.dataset.foldReady='1';
  const wrap=section.querySelector('.wrap');
  if(!wrap)return false;

  const details=document.createElement('details');
  details.className='nx-comparison-fold';
  details.id='vergleichDetails';
  const summary=document.createElement('summary');
  summary.className='nx-comparison-summary';
  summary.innerHTML=`<span class="nx-comparison-summary-icon">↗</span><span class="nx-comparison-summary-copy"><small>SUMUP · VERGLEICHSANGEBOT</small><strong>Direktes Vergleichsangebot anfordern</strong><span>Abrechnung hochladen oder Daten manuell erfassen.</span></span><span class="nx-comparison-summary-action">Jetzt öffnen <b aria-hidden="true">⌄</b></span>`;
  const content=document.createElement('div');
  content.className='nx-comparison-content';
  while(wrap.firstChild)content.append(wrap.firstChild);
  details.append(summary,content);
  wrap.append(details);

  const style=document.createElement('style');
  style.textContent=`
   .nx-fee-check{padding:34px 0!important;background:#fff!important}
   .nx-comparison-fold{border:1px solid #dfe7d8;border-radius:24px;background:#fff;box-shadow:0 14px 38px #20331b0d;overflow:hidden}
   .nx-comparison-summary{list-style:none;display:grid;grid-template-columns:auto 1fr auto;gap:16px;align-items:center;padding:22px 24px;cursor:pointer;background:linear-gradient(120deg,#fbfff7,#f3fbe8);transition:background .2s,box-shadow .2s}
   .nx-comparison-summary::-webkit-details-marker{display:none}.nx-comparison-summary:hover{background:#effbdc}
   .nx-comparison-summary-icon{display:grid;place-items:center;width:44px;height:44px;border-radius:13px;background:#baff37;color:#18221c;font-size:22px;font-weight:900}
   .nx-comparison-summary-copy{display:flex;flex-direction:column;gap:3px;min-width:0}.nx-comparison-summary-copy small{font-size:9px;letter-spacing:1.5px;font-weight:900;color:#c85b25}.nx-comparison-summary-copy strong{font-size:18px;letter-spacing:-.02em}.nx-comparison-summary-copy>span{font-size:12px;color:#667268;line-height:1.45}
   .nx-comparison-summary-action{font-size:12px;font-weight:850;white-space:nowrap;color:#223026}.nx-comparison-summary-action b{display:inline-block;margin-left:6px;font-size:16px;transition:transform .25s}.nx-comparison-fold[open] .nx-comparison-summary-action b{transform:rotate(180deg)}
   .nx-comparison-content{border-top:1px solid #e5ebdf}.nx-comparison-content>.nx-fee-head{padding:42px 42px 0}.nx-comparison-content>.nx-fee-grid{margin:34px 42px 42px}
   .nx-wizard-next{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:15px}.nx-wizard-next .btn{width:100%;text-align:center}.nx-wizard-next .nx-consult-btn{background:#fff;border:1px solid #cfd9c8;color:#1e2521}
   @media(max-width:800px){.nx-comparison-summary{grid-template-columns:auto 1fr}.nx-comparison-summary-action{grid-column:2}.nx-comparison-content>.nx-fee-head{padding:30px 24px 0}.nx-comparison-content>.nx-fee-grid{margin:26px 20px 24px}.nx-wizard-next{grid-template-columns:1fr}}
   @media(max-width:480px){.nx-fee-check{padding:22px 0!important}.nx-comparison-summary{padding:18px 16px;gap:12px}.nx-comparison-summary-icon{width:40px;height:40px}.nx-comparison-summary-copy strong{font-size:16px}.nx-comparison-summary-copy>span{font-size:11px}}
  `;
  document.head.append(style);
  return true;
 };

 const openComparison=()=>{const details=document.getElementById('vergleichDetails');if(!details)return;details.open=true;requestAnimationFrame(()=>document.getElementById('vergleich')?.scrollIntoView({behavior:'smooth',block:'start'}))};
 const enhanceWizard=()=>{
  const body=document.getElementById('wizardBody');if(!body)return;
  const apply=()=>{const result=body.querySelector('.wizard-result');if(!result||result.dataset.choiceReady==='1')return;result.dataset.choiceReady='1';const existing=result.querySelector('a.btn');if(!existing)return;const actions=document.createElement('div');actions.className='nx-wizard-next';const compare=document.createElement('button');compare.type='button';compare.className='btn dark';compare.textContent='Direktes Vergleichsangebot anfordern ↗';compare.addEventListener('click',openComparison);existing.textContent='Persönliche Beratung vereinbaren ↗';existing.classList.add('nx-consult-btn');existing.replaceWith(actions);actions.append(compare,existing)};
  new MutationObserver(apply).observe(body,{childList:true,subtree:true});apply();
 };
 if(!setupComparison()){const observer=new MutationObserver(()=>{if(setupComparison())observer.disconnect()});observer.observe(document.body,{childList:true,subtree:true})}
 enhanceWizard();
})();