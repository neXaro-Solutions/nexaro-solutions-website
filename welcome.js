/* neXaro Payment navigation + comparison flow. */
(() => {
 const header=document.querySelector('.top .wrap');
 if(!header||!document.getElementById('check')||document.getElementById('nxPaymentMenuButton'))return;
 const oldAction=header.querySelector('.top-action');
 const nav=document.createElement('nav');nav.className='nx-payment-nav';nav.id='nxPaymentNav';nav.setAttribute('aria-label','Payment Navigation');
 nav.innerHTML='<a href="./">Startseite</a><a href="./sumup-gastronomie.html">Gastronomie</a><a href="./sumup-einzelhandel.html">Einzelhandel</a><a href="./sumup-dienstleister.html">Dienstleister</a><a href="./crm/">CRM</a><a class="nx-payment-cta" href="#vergleich">Payment-Lösung prüfen ↗</a>';
 const button=document.createElement('button');button.id='nxPaymentMenuButton';button.className='nx-payment-menu';button.type='button';button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls','nxPaymentNav');button.setAttribute('aria-label','Menü öffnen');button.innerHTML='<span></span><span></span><span></span>';
 oldAction?.remove();header.append(nav,button);
 const style=document.createElement('style');style.textContent=`
 .nx-payment-nav{display:flex;align-items:center;gap:18px;margin-left:auto}.nx-payment-nav a{font-size:12px;font-weight:800;text-decoration:none;color:#314238;white-space:nowrap}.nx-payment-nav a:hover{color:#f36b29}.nx-payment-cta{padding:12px 16px;border-radius:12px;background:#18251c;color:#fff!important}.nx-payment-menu{display:none;width:46px;height:46px;border:1px solid #dbe5d6;border-radius:13px;background:#fff;align-items:center;justify-content:center;flex-direction:column;gap:5px;cursor:pointer;box-shadow:0 8px 20px #18251c0d}.nx-payment-menu span{display:block;width:20px;height:2px;border-radius:2px;background:#18251c;transition:transform .2s,opacity .2s}.nx-payment-menu[aria-expanded="true"] span:nth-child(1){transform:translateY(7px) rotate(45deg)}.nx-payment-menu[aria-expanded="true"] span:nth-child(2){opacity:0}.nx-payment-menu[aria-expanded="true"] span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
 @media(max-width:900px){.top .wrap{position:relative}.nx-payment-menu{display:flex;margin-left:auto}.nx-payment-nav{display:none;position:absolute;left:18px;right:18px;top:calc(100% + 8px);padding:12px;border:1px solid #dfe7db;border-radius:17px;background:#fff;box-shadow:0 18px 45px #18251c20;flex-direction:column;align-items:stretch;gap:4px}.nx-payment-nav.is-open{display:flex}.nx-payment-nav a{padding:12px 13px;border-radius:10px;font-size:13px}.nx-payment-nav a:not(.nx-payment-cta):hover{background:#f5f9f1}.nx-payment-cta{text-align:center;margin-top:4px;padding:14px!important}.brand{position:relative;z-index:1}}
 @media(max-width:550px){.top .wrap{padding-left:18px;padding-right:18px}.brand{width:138px;height:58px}.nx-payment-menu{width:44px;height:44px}.nx-payment-nav{left:12px;right:12px}}
 @media(min-width:901px) and (max-width:1080px){.nx-payment-nav{gap:11px}.nx-payment-nav a{font-size:11px}.nx-payment-cta{padding:11px 13px}}
 @media(prefers-reduced-motion:reduce){.nx-payment-menu span{transition:none!important}}
 .content,.contact{content-visibility:auto;contain-intrinsic-size:1px 760px}
 `;document.head.append(style);
 const close=()=>{nav.classList.remove('is-open');button.setAttribute('aria-expanded','false');button.setAttribute('aria-label','Menü öffnen')};
 button.addEventListener('click',()=>{const open=!nav.classList.contains('is-open');nav.classList.toggle('is-open',open);button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',open?'Menü schließen':'Menü öffnen')});
 nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
 document.addEventListener('click',e=>{if(!header.contains(e.target))close()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
 const brandImg=header.querySelector('.brand img');if(brandImg){brandImg.decoding='async';brandImg.fetchPriority='high'}
 document.querySelectorAll('.hero-x img,.footer-logo').forEach(img=>{img.decoding='async';img.loading='lazy'});
})();

/* Customer-friendly SumUp comparison: upload statement OR enter data manually. */
(() => {
 const check=document.getElementById('check'),sumup=document.getElementById('sumup');
 if(!check||!sumup||document.getElementById('vergleich'))return;
 const intakeEndpoint='https://hbuqzdmjqvgybwohfnqy.supabase.co/functions/v1/nx-public-intake';
 const statementEndpoint='https://hbuqzdmjqvgybwohfnqy.supabase.co/functions/v1/nx-public-statement';
 const section=document.createElement('section');section.id='vergleich';section.className='area nx-fee-check';
 section.innerHTML=`<div class="wrap">
  <div class="nx-compare-card">
   <div class="nx-compare-head"><span class="eyebrow"><span class="line"></span> SUMUP · KONDITIONSVERGLEICH</span><h2>Direktes <em>Vergleichsangebot</em></h2><p>Wähle einfach den Weg, der für dich passt. Mit Abrechnung übernehmen wir die Auswertung. Ohne Abrechnung kannst du deine aktuellen Daten direkt eingeben.</p></div>
   <div class="nx-mode-switch" role="tablist" aria-label="Art der Vergleichsanfrage">
    <button type="button" class="nx-mode-btn is-active" data-mode="upload" role="tab" aria-selected="true"><span>↥</span><strong>Abrechnung hochladen</strong><small>Am einfachsten: Datei senden, wir lesen die Daten aus.</small></button>
    <button type="button" class="nx-mode-btn" data-mode="manual" role="tab" aria-selected="false"><span>✎</span><strong>Daten manuell erfassen</strong><small>Wenn du keine Abrechnung zur Hand hast.</small></button>
   </div>
   <form class="nx-fee-form" id="feeCheckForm" enctype="multipart/form-data">
    <div class="nx-mode-panel" data-panel="upload">
     <div class="nx-panel-intro"><strong>Abrechnung hochladen</strong><span>PDF oder Foto auswählen – die relevanten Vergleichsdaten werden beim sicheren Upload automatisch ausgelesen.</span></div>
     <label class="nx-file-drop" for="feeStatement"><span class="nx-file-icon">↥</span><strong id="feeFileLabel">Abrechnung auswählen</strong><small>PDF, JPG, PNG oder WebP · maximal 8 MB</small><input id="feeStatement" name="statement" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"></label>
     <div class="nx-upload-note"><b>✓</b><span><strong>Elektronisch &amp; datenschutzkonform ausgelesen.</strong><small>Deine Abrechnung wird ausschließlich für den angeforderten Vergleich verarbeitet. Die Verarbeitung erfolgt zweckgebunden gemäß unseren Datenschutzhinweisen.</small></span></div>
    </div>
    <div class="nx-mode-panel" data-panel="manual" hidden>
     <div class="nx-panel-intro"><strong>Vergleichsdaten manuell eingeben</strong><span>Trage die Werte ein, die dir vorliegen. Unbekannte Angaben kannst du frei lassen.</span></div>
     <div class="nx-fee-fields nx-manual-fields"><label>Bisheriger Anbieter<input name="current_provider" maxlength="100" placeholder="z. B. PAYONE, Worldline, VR Payment"></label><label>Monatlicher Kartenumsatz<input name="monthly_volume" type="number" min="0" max="100000000" step="0.01" inputmode="decimal" placeholder="z. B. 15000"></label><label>Transaktionen pro Monat<input name="transaction_count" type="number" min="0" max="10000000" step="1" inputmode="numeric" placeholder="z. B. 450"></label><label>Debit-/EC-Gebühr<input name="debit_fee" maxlength="40" inputmode="decimal" placeholder="z. B. 0,9 %"></label><label>Kreditkarten-Gebühr<input name="credit_fee" maxlength="40" inputmode="decimal" placeholder="z. B. 1,5 %"></label><label>Fixkosten pro Monat<input name="monthly_fixed_cost" maxlength="40" inputmode="decimal" placeholder="z. B. 29,90 €"></label></div>
    </div>
    <div class="nx-form-step-title"><b>1</b><span><strong>Deine Kontaktdaten</strong><small>Damit wir deinen Vergleich zuordnen und dir das Angebot senden können.</small></span></div>
    <div class="nx-fee-fields"><label>Unternehmen / Geschäft<input name="company" required maxlength="200" autocomplete="organization" placeholder="Firma oder Geschäftsbezeichnung"></label><label>Ansprechpartner<input name="contact" required maxlength="160" autocomplete="name" placeholder="Dein Name"></label><label>Ort<input name="city" required maxlength="120" autocomplete="address-level2" placeholder="Stadt / Ort"></label><label>E-Mail-Adresse<input name="email" type="email" required maxlength="254" autocomplete="email" placeholder="name@firma.de"></label><label>Telefon (optional)<input name="phone" type="tel" maxlength="40" autocomplete="tel" placeholder="Telefonnummer"></label></div>
    <label class="nx-message-label">Weitere Hinweise (optional)<textarea name="message" maxlength="1200" rows="3" placeholder="Gibt es etwas, das wir beim Vergleich berücksichtigen sollen?"></textarea></label>
    <div class="nx-offer-promise"><b>2</b><span><strong>Wir bereiten deinen persönlichen Ist-/Soll-Vergleich vor.</strong><small>Du erhältst eine nachvollziehbare Gegenüberstellung deiner aktuellen Kosten und der passenden SumUp-Konditionen.</small></span></div>
    <label class="nx-fee-consent"><input name="consent" type="checkbox" required><span>Ich bin mit der Verarbeitung meiner Angaben zur Bearbeitung meines gewünschten Konditionsvergleichs und zur Kontaktaufnahme hierzu einverstanden. Die <a href="./datenschutz.html" target="_blank" rel="noopener">Datenschutzhinweise</a> habe ich zur Kenntnis genommen. Keine Einwilligung in Werbung.</span></label>
    <div class="honeypot" aria-hidden="true"><label>Dieses Feld leer lassen<input name="website" type="text" tabindex="-1" autocomplete="off"></label></div>
    <button id="feeCheckSubmit" class="btn dark" type="submit">Vergleich anfordern ↗</button><p id="feeCheckStatus" class="nx-fee-status" role="status" aria-live="polite"></p>
   </form>
  </div>
 </div>`;
 check.before(section);
 const style=document.createElement('style');style.textContent=`
 .nx-fee-check{position:relative;overflow:hidden;background:#fff;padding:54px 0;content-visibility:auto;contain-intrinsic-size:1px 980px}.nx-fee-check:before{content:"X";position:absolute;right:-110px;bottom:-330px;font-size:620px;font-weight:950;font-style:italic;line-height:1;color:#f36b2907;pointer-events:none}
 .nx-compare-card{position:relative;max-width:900px;margin:0 auto;border:1px solid #e1e8dc;border-radius:28px;background:#fbfdf8;box-shadow:0 22px 60px #20331b10;overflow:hidden}.nx-compare-head{padding:34px 38px 20px;text-align:left}.nx-compare-head h2{font-size:clamp(34px,4vw,48px);margin:12px 0 8px}.nx-compare-head p{max-width:690px;margin:0;color:var(--muted);font-size:14px}
 .nx-mode-switch{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 38px 22px}.nx-mode-btn{display:grid;grid-template-columns:auto 1fr;column-gap:12px;align-items:center;text-align:left;padding:16px;border:1px solid #d8e1d1;border-radius:16px;background:#fff;color:#1e2521}.nx-mode-btn>span{grid-row:1/3;display:grid;place-items:center;width:38px;height:38px;border-radius:11px;background:#eef6e7;font-size:19px}.nx-mode-btn strong{font-size:13px}.nx-mode-btn small{font-size:10.5px;line-height:1.4;color:#6b776d}.nx-mode-btn.is-active{background:#ecffd0;border-color:#a9cf6e;box-shadow:0 0 0 2px #baff3733}.nx-mode-btn.is-active>span{background:#baff37}
 .nx-fee-form{padding:28px 38px 38px;border-top:1px solid #e3e9df;background:#fff}.nx-panel-intro{display:flex;flex-direction:column;gap:4px;margin-bottom:14px}.nx-panel-intro strong{font-size:17px}.nx-panel-intro span{font-size:12px;color:#68746a;line-height:1.55}.nx-fee-form label{display:block;font-size:12px;font-weight:800;color:#2b342d}.nx-fee-form input,.nx-fee-form textarea{width:100%;margin-top:7px;padding:12px 13px;border:1px solid #cfd9c8;border-radius:10px;background:#fff;color:#18221c;box-sizing:border-box}.nx-fee-form input:focus,.nx-fee-form textarea:focus{outline:3px solid #f36b2933;border-color:#f36b29}
 .nx-fee-fields{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:15px}.nx-file-drop{position:relative;display:grid!important;grid-template-columns:auto 1fr;column-gap:13px;align-items:center;padding:18px!important;margin-bottom:12px;border:1.5px dashed #93ad7e!important;border-radius:15px;background:#f3fae9;color:#1d2a20!important;cursor:pointer}.nx-file-drop:hover{background:#ebf8dc}.nx-file-drop input{position:absolute!important;inset:0;opacity:0;cursor:pointer;margin:0!important}.nx-file-drop strong,.nx-file-drop small{grid-column:2}.nx-file-drop small{font-size:11px;color:#64725f;font-weight:500;margin-top:2px}.nx-file-icon{grid-row:1/3;display:grid;place-items:center;width:43px;height:43px;border-radius:12px;background:#baff37;font-size:25px;color:#18221c}
 .nx-upload-note{display:flex;gap:11px;padding:13px 14px;border-radius:13px;background:#f6fbef;border:1px solid #e0ecd4;margin-bottom:22px}.nx-upload-note>b{display:grid;place-items:center;width:25px;height:25px;flex:none;border-radius:8px;background:#82b92d;color:#fff;font-size:11px}.nx-upload-note span{display:flex;flex-direction:column;gap:2px}.nx-upload-note strong{font-size:12px}.nx-upload-note small{font-size:10.5px;color:#6d786d;line-height:1.5}
 .nx-form-step-title,.nx-offer-promise{display:flex;gap:11px;align-items:flex-start;margin:18px 0 13px}.nx-form-step-title b,.nx-offer-promise b{display:grid;place-items:center;width:28px;height:28px;flex:none;border-radius:8px;background:#1c2920;color:#fff;font-size:11px}.nx-form-step-title span,.nx-offer-promise span{display:flex;flex-direction:column;gap:2px}.nx-form-step-title strong,.nx-offer-promise strong{font-size:13px}.nx-form-step-title small,.nx-offer-promise small{font-size:11px;color:#6d786d;line-height:1.5}.nx-offer-promise{padding:14px;border-radius:13px;background:#edf8df;border:1px solid #d4e9bb}.nx-offer-promise b{background:#82b92d}.nx-message-label{margin-top:4px}
 .nx-fee-consent{display:flex!important;gap:10px;align-items:flex-start;margin:17px 0;font-size:11px!important;font-weight:600!important;line-height:1.55}.nx-fee-consent input{width:18px!important;flex:none;margin:2px 0 0!important}.nx-fee-consent a{text-decoration:underline;color:#b64f20}.nx-fee-form .btn{width:100%}.nx-fee-status{min-height:1.5em;font-size:12px;font-weight:700;margin:11px 0 0}.nx-fee-status[data-state=success]{color:#377516}.nx-fee-status[data-state=error]{color:#a32716}
 @media(max-width:700px){.nx-fee-check{padding:28px 0}.nx-compare-card{border-radius:20px}.nx-compare-head{padding:25px 22px 16px}.nx-compare-head h2{font-size:34px}.nx-compare-head p{font-size:12px}.nx-mode-switch{grid-template-columns:1fr;padding:0 20px 18px}.nx-fee-form{padding:22px 20px 26px}.nx-fee-fields{grid-template-columns:1fr}.nx-mode-btn{padding:14px}.nx-panel-intro strong{font-size:16px}}
 `;document.head.append(style);
 const feeLink=document.createElement('a');feeLink.href='#vergleich';feeLink.className='text-link';feeLink.innerHTML='Direktes Vergleichsangebot anfordern <span aria-hidden="true">↗</span>';sumup.querySelector('.benefit')?.append(feeLink);
 const form=section.querySelector('#feeCheckForm'),fileInput=section.querySelector('#feeStatement'),fileLabel=section.querySelector('#feeFileLabel'),submit=section.querySelector('#feeCheckSubmit'),status=section.querySelector('#feeCheckStatus');
 const modeButtons=[...section.querySelectorAll('.nx-mode-btn')],panels=[...section.querySelectorAll('.nx-mode-panel')];
 let mode='upload',challenge=null,receivedAt=0,busy=false,intakeCreated=false,statementExtraction=null;
 async function loadChallenge(){const r=await fetch(intakeEndpoint,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('Die sichere Verbindung ist momentan nicht erreichbar.');challenge=await r.json();receivedAt=Date.now();intakeCreated=false}
 function fail(message){status.dataset.state='error';status.textContent=message}
 function setMode(next){mode=next;modeButtons.forEach(btn=>{const active=btn.dataset.mode===mode;btn.classList.toggle('is-active',active);btn.setAttribute('aria-selected',String(active))});panels.forEach(panel=>panel.hidden=panel.dataset.panel!==mode);fileInput.required=mode==='upload';status.textContent='';delete status.dataset.state;submit.textContent=mode==='upload'?'Vergleich anfordern ↗':'Manuellen Vergleich anfordern ↗'}
 modeButtons.forEach(btn=>btn.addEventListener('click',()=>setMode(btn.dataset.mode)));
 import('/statement-reader.js?v=20261002c').then(m=>m.attachStatementReader({form,fileInput,status,fileLabel,onExtracted:data=>{statementExtraction=data}})).catch(()=>{});
 fileInput.addEventListener('change',()=>{const file=fileInput.files?.[0];statementExtraction=null;fileLabel.textContent=file?file.name:'Abrechnung auswählen';if(file&&file.size>8388608){fileInput.value='';fileLabel.textContent='Abrechnung auswählen';fail('Die Datei ist größer als 8 MB. Bitte wähle eine kleinere PDF- oder Bilddatei.')}else if(file){status.textContent='';delete status.dataset.state}});
 void loadChallenge().catch(()=>{});
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy||!form.reportValidity())return;
  const file=fileInput.files?.[0];
  if(mode==='upload'){
   if(!file)return fail('Bitte wähle eine Abrechnung aus.');
   if(file.size<1||file.size>8388608)return fail('Die Datei muss kleiner als 8 MB sein.');
   const allowed=new Set(['application/pdf','image/jpeg','image/png','image/webp']);if(!allowed.has(file.type))return fail('Bitte verwende eine PDF-, JPG-, PNG- oder WebP-Datei.');
  }
  busy=true;submit.disabled=true;submit.textContent=mode==='upload'?(intakeCreated?'Abrechnung wird übertragen …':'Vergleich wird angelegt …'):'Vergleich wird angelegt …';status.textContent='';delete status.dataset.state;
  try{
   if(!challenge||Date.now()-receivedAt>3500000)await loadChallenge();const pause=Math.max(0,2200-(Date.now()-receivedAt));if(pause)await new Promise(resolve=>setTimeout(resolve,pause));const d=new FormData(form);
   if(!intakeCreated){
    const detected=statementExtraction||{};
    const manualDetails=mode==='manual'?[['Transaktionen pro Monat',d.get('transaction_count')],['Debit-/EC-Gebühr',d.get('debit_fee')],['Kreditkarten-Gebühr',d.get('credit_fee')],['Fixkosten pro Monat',d.get('monthly_fixed_cost')]].filter(([,value])=>String(value||'').trim()).map(([label,value])=>label+': '+String(value).trim()).join('\n'):'';
    const detectedDetails=mode==='upload'?[['Erkennungsquelle',detected.source],['Erkennungssicherheit',detected.confidence!==undefined?Math.round(Number(detected.confidence)*100)+' %':'']].filter(([,value])=>String(value||'').trim()).map(([label,value])=>label+': '+String(value).trim()).join('\n'):'';
    const freeText=String(d.get('message')||'').trim(),extra=[manualDetails,detectedDetails,freeText].filter(Boolean).join('\n');
    const payload={interest:'sumup',request_type:mode==='upload'?'sumup_fee_check':'sumup_fee_check_manual',company:String(d.get('company')||'').trim(),contact:String(d.get('contact')||'').trim(),city:String(d.get('city')||'').trim(),email:String(d.get('email')||'').trim(),phone:String(d.get('phone')||'').trim(),current_provider:mode==='manual'?String(d.get('current_provider')||'').trim():'',monthly_volume:mode==='manual'?String(d.get('monthly_volume')||'').trim():'',message:'Quelle: neXaro Landingpage · Konditionsvergleich · '+(mode==='upload'?'Abrechnungsupload':'manuelle Datenerfassung')+'\n\n'+(extra||'Keine zusätzlichen Angaben'),consent:d.get('consent')==='on'};
    const intake=await fetch(intakeEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({payload,website:String(d.get('website')||''),challenge}),signal:AbortSignal.timeout(25000)});
    if(!intake.ok){if(intake.status===429)throw Error('Zu viele Anfragen in kurzer Zeit. Bitte versuche es später erneut.');if(intake.status===400){challenge=null;throw Error('Bitte prüfe deine Angaben und versuche es erneut.')}throw Error('Der Vergleich konnte gerade nicht angelegt werden. Deine Eingaben bleiben erhalten. Bitte versuche es erneut.')}intakeCreated=true;
   }
   if(mode==='upload'){
    submit.textContent='Abrechnung wird sicher übertragen …';const upload=new FormData();upload.append('statement',file,file.name);upload.append('challenge',JSON.stringify(challenge));if(statementExtraction)upload.append('extraction',JSON.stringify(statementExtraction));
    const sent=await fetch(statementEndpoint,{method:'POST',body:upload,signal:AbortSignal.timeout(55000)});
    if(!sent.ok&&sent.status!==409){if(sent.status===413)throw Error('Die Datei ist zu groß. Bitte verwende eine Datei bis maximal 8 MB.');if(sent.status===400)throw Error('Die Datei konnte nicht sicher geprüft werden. Bitte verwende eine unveränderte PDF-, JPG-, PNG- oder WebP-Datei.');throw Error('Deine Anfrage ist bereits angelegt, aber die Abrechnung konnte noch nicht übertragen werden. Bitte klicke erneut auf „Vergleich anfordern“.')}
   }
   status.dataset.state='success';status.textContent=mode==='upload'?'Geschafft! Deine Abrechnung ist sicher übermittelt. Wir bereiten jetzt deinen persönlichen Vergleich vor.':'Geschafft! Deine Vergleichsdaten sind übermittelt. Wir bereiten jetzt deinen persönlichen Vergleich vor.';
   form.reset();fileLabel.textContent='Abrechnung auswählen';challenge=null;intakeCreated=false;statementExtraction=null;void loadChallenge().catch(()=>{});
  }catch(error){fail(error instanceof Error&&error.name!=='TimeoutError'&&error.name!=='TypeError'?error.message:'Die Verbindung ist gerade nicht verfügbar. Deine Angaben bleiben erhalten. Bitte versuche es erneut.')}
  finally{busy=false;submit.disabled=false;submit.textContent=mode==='upload'?'Vergleich anfordern ↗':'Manuellen Vergleich anfordern ↗'}
 });
})();