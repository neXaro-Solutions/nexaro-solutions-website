/* Automatic, decorative arrival. No storage, tracking or requests. */
(() => {
 const hero=document.querySelector('.hero');if(!hero)return;
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 let timer,pending,frame,visible=false,ready=document.readyState==='complete',played=false;
 function stop(){clearTimeout(timer);clearTimeout(pending);hero.classList.remove('nx-arrival','nx-arrival-motion');frame?.remove();frame=null}
 function play(){
  stop();if(document.hidden||!visible)return;
  played=true;frame=document.createElement('div');frame.className='nx-arrival-frame';frame.setAttribute('aria-hidden','true');
  frame.innerHTML='<i></i><i></i><span></span>';hero.append(frame);
  hero.classList.add('nx-arrival');if(!motion.matches)hero.classList.add('nx-arrival-motion');
  timer=setTimeout(stop,motion.matches?2200:4800);
 }
 function schedule(){clearTimeout(pending);if(ready&&visible&&!played&&!document.hidden)pending=setTimeout(play,450)}
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule()},{threshold:.12}).observe(hero);
 window.addEventListener('load',()=>{ready=true;schedule()},{once:true});
 window.addEventListener('pageshow',e=>{if(e.persisted)played=false;schedule()});
 window.addEventListener('pagehide',stop);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){if(frame)played=false;stop()}else schedule()});
 motion.addEventListener('change',stop);schedule();
})();

/* Secure SumUp fee comparison request. The public intake creates the CRM lead first;
   the statement is then attached to that exact intake receipt through the protected upload endpoint. */
(() => {
 const check=document.getElementById('check');
 const sumup=document.getElementById('sumup');
 if(!check||!sumup||document.getElementById('vergleich'))return;
 const intakeEndpoint='https://hbuqzdmjqvgybwohfnqy.supabase.co/functions/v1/nx-public-intake';
 const statementEndpoint='https://hbuqzdmjqvgybwohfnqy.supabase.co/functions/v1/nx-public-statement';
 const section=document.createElement('section');
 section.id='vergleich';section.className='area nx-fee-check';
 section.innerHTML=`<div class="wrap">
  <div class="nx-fee-head"><div><span class="eyebrow"><span class="line"></span> SUMUP · KONDITIONSVERGLEICH</span><h2>Deine Abrechnung.<br><em>Unser persönlicher Vergleich.</em></h2></div><p>Lade eine aktuelle Abrechnung deines bisherigen Zahlungsanbieters sicher hoch. Wir prüfen die vorhandenen Konditionen und bereiten auf dieser Grundlage einen individuellen SumUp-Vergleich für dein Geschäft vor.</p></div>
  <div class="nx-fee-grid">
   <div class="nx-fee-story">
    <span class="nx-fee-badge">🔒 GESCHÜTZTE ÜBERTRAGUNG</span><h3>Direkt zur konkreten Angebotsprüfung.</h3><p>Statt Gebühren abzuschätzen, können wir deine tatsächliche Abrechnung als Grundlage verwenden. So entsteht ein nachvollziehbarer Vergleich auf Basis deiner eingereichten Unterlagen.</p>
    <div class="nx-fee-steps"><article><b>01</b><span><strong>Abrechnung hochladen</strong><small>PDF oder Foto, maximal 8 MB.</small></span></article><article><b>02</b><span><strong>Konditionen prüfen</strong><small>Die Datei wird deinem CRM-Vorgang geschützt zugeordnet.</small></span></article><article><b>03</b><span><strong>Persönliches Angebot erhalten</strong><small>Nach Prüfung kann dein individuelles Angebot per E-Mail versendet werden.</small></span></article></div>
    <p class="nx-fee-security">Private Dokumentablage · keine öffentliche Datei-URL · keine automatische Tarifentscheidung</p>
   </div>
   <form class="nx-fee-form" id="feeCheckForm" enctype="multipart/form-data">
    <h3>Konditionsvergleich anfordern</h3><p class="nx-fee-intro">Bitte lade eine aktuelle Abrechnung hoch und ergänze die Kontaktdaten für die persönliche Auswertung.</p>
    <label class="nx-file-drop" for="feeStatement"><span class="nx-file-icon">↥</span><strong id="feeFileLabel">Abrechnung auswählen</strong><small>PDF, JPG, PNG oder WebP · maximal 8 MB</small><input id="feeStatement" name="statement" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" required></label>
    <div class="nx-fee-fields"><label>Unternehmen / Geschäft<input name="company" required maxlength="200" autocomplete="organization" placeholder="Firma oder Geschäftsbezeichnung"></label><label>Ansprechpartner<input name="contact" required maxlength="160" autocomplete="name" placeholder="Dein Name"></label><label>Ort<input name="city" required maxlength="120" autocomplete="address-level2" placeholder="Stadt / Ort"></label><label>E-Mail-Adresse<input name="email" type="email" required maxlength="254" autocomplete="email" placeholder="name@firma.de"></label><label>Telefon (optional)<input name="phone" type="tel" maxlength="40" autocomplete="tel" placeholder="Telefonnummer"></label><label>Bisheriger Anbieter (optional)<input name="current_provider" maxlength="100" placeholder="z. B. bisheriger Zahlungsanbieter"></label><label>Monatlicher Kartenumsatz (optional)<input name="monthly_volume" type="number" min="0" max="100000000" step="0.01" inputmode="decimal" placeholder="z. B. 12000"></label></div>
    <label>Hinweis (optional)<textarea name="message" maxlength="1200" rows="3" placeholder="Was sollen wir beim Vergleich besonders berücksichtigen?"></textarea></label>
    <label class="nx-fee-consent"><input name="consent" type="checkbox" required><span>Ich bin mit der Verarbeitung meiner Angaben und der hochgeladenen Abrechnung zur Bearbeitung meines gewünschten Konditionsvergleichs und zur Kontaktaufnahme hierzu einverstanden. Die <a href="./datenschutz.html" target="_blank" rel="noopener">Datenschutzhinweise</a> habe ich zur Kenntnis genommen. Keine Einwilligung in Werbung.</span></label>
    <div class="honeypot" aria-hidden="true"><label>Dieses Feld leer lassen<input name="website" type="text" tabindex="-1" autocomplete="off"></label></div>
    <button id="feeCheckSubmit" class="btn dark" type="submit">Vergleich anfordern &amp; sicher senden ↗</button><p id="feeCheckStatus" class="nx-fee-status" role="status" aria-live="polite"></p>
   </form>
  </div>
 </div>`;
 check.before(section);
 const style=document.createElement('style');
 style.textContent=`.nx-fee-check{position:relative;overflow:hidden;background:#fff}.nx-fee-check:before{content:"X";position:absolute;left:-90px;bottom:-290px;font-size:620px;font-weight:950;font-style:italic;line-height:1;color:#f36b2909;pointer-events:none}.nx-fee-head{position:relative;display:grid;grid-template-columns:1.08fr .92fr;gap:48px;align-items:end;margin-bottom:38px}.nx-fee-head>p{color:var(--muted);margin:0;max-width:470px}.nx-fee-grid{position:relative;display:grid;grid-template-columns:.9fr 1.1fr;border:1px solid #e3e9de;border-radius:30px;overflow:hidden;box-shadow:0 25px 65px #20331b12;background:#fff}.nx-fee-story{padding:46px;background:radial-gradient(circle at 15% 10%,#455d3b,#1b2a20 58%);color:#fff}.nx-fee-story h3{font-size:34px;letter-spacing:-.05em;line-height:1.12;margin:18px 0}.nx-fee-story>p{color:#ced8cc}.nx-fee-badge{display:inline-flex;padding:9px 12px;border:1px solid #baff3755;background:#baff3712;color:#cffa82;border-radius:10px;font-size:10px;letter-spacing:1.2px;font-weight:900}.nx-fee-steps{display:grid;gap:11px;margin:30px 0}.nx-fee-steps article{display:flex;gap:13px;align-items:flex-start;padding:15px;border:1px solid #ffffff1d;background:#ffffff09;border-radius:13px}.nx-fee-steps b{display:grid;place-items:center;width:30px;height:30px;flex:none;border-radius:9px;background:#baff37;color:#18221c;font-size:11px}.nx-fee-steps span{display:flex;flex-direction:column;gap:4px}.nx-fee-steps strong{font-size:14px}.nx-fee-steps small,.nx-fee-security{color:#aebdac;font-size:11px;line-height:1.55}.nx-fee-form{padding:40px 42px;background:#fbfdf8}.nx-fee-form h3{font-size:29px;letter-spacing:-.04em;margin:0 0 7px}.nx-fee-intro{font-size:13px;color:var(--muted);margin:0 0 20px}.nx-fee-form label{display:block;font-size:12px;font-weight:800;color:#2b342d}.nx-fee-form input,.nx-fee-form textarea{width:100%;margin-top:7px;padding:12px 13px;border:1px solid #cfd9c8;border-radius:10px;background:#fff;color:#18221c;box-sizing:border-box}.nx-fee-form input:focus,.nx-fee-form textarea:focus{outline:3px solid #f36b2933;border-color:#f36b29}.nx-fee-fields{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}.nx-file-drop{position:relative;display:grid!important;grid-template-columns:auto 1fr;column-gap:13px;align-items:center;padding:18px!important;margin-bottom:16px;border:1.5px dashed #93ad7e!important;border-radius:15px;background:#f0f9e5;color:#1d2a20!important;cursor:pointer}.nx-file-drop:hover{background:#e9f8d8}.nx-file-drop input{position:absolute!important;inset:0;opacity:0;cursor:pointer;margin:0!important}.nx-file-drop strong,.nx-file-drop small{grid-column:2}.nx-file-drop small{font-size:11px;color:#64725f;font-weight:500;margin-top:2px}.nx-file-icon{grid-row:1/3;display:grid;place-items:center;width:43px;height:43px;border-radius:12px;background:#baff37;font-size:25px;color:#18221c}.nx-fee-consent{display:flex!important;gap:10px;align-items:flex-start;margin:17px 0;font-size:11px!important;font-weight:600!important;line-height:1.55}.nx-fee-consent input{width:18px!important;flex:none;margin:2px 0 0!important}.nx-fee-consent a{text-decoration:underline;color:#b64f20}.nx-fee-form .btn{width:100%}.nx-fee-status{min-height:1.5em;font-size:12px;font-weight:700;margin:11px 0 0}.nx-fee-status[data-state=success]{color:#377516}.nx-fee-status[data-state=error]{color:#a32716}@media(max-width:800px){.nx-fee-head,.nx-fee-grid{grid-template-columns:1fr}.nx-fee-story,.nx-fee-form{padding:30px}.nx-fee-fields{grid-template-columns:1fr}}@media(max-width:480px){.nx-fee-story,.nx-fee-form{padding:24px 20px}.nx-fee-story h3{font-size:28px}}`;
 document.head.append(style);
 const feeLink=document.createElement('a');feeLink.href='#vergleich';feeLink.className='text-link';feeLink.innerHTML='Eigene Abrechnung vergleichen lassen <span aria-hidden="true">↗</span>';
 const firstBenefit=sumup.querySelector('.benefit');if(firstBenefit)firstBenefit.append(feeLink);
 const form=section.querySelector('#feeCheckForm');
 const fileInput=section.querySelector('#feeStatement');
 const fileLabel=section.querySelector('#feeFileLabel');
 const submit=section.querySelector('#feeCheckSubmit');
 const status=section.querySelector('#feeCheckStatus');
 let challenge=null,receivedAt=0,busy=false,intakeCreated=false;
 async function loadChallenge(){const r=await fetch(intakeEndpoint,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('Die sichere Verbindung ist momentan nicht erreichbar.');challenge=await r.json();receivedAt=Date.now();intakeCreated=false}
 function fail(message){status.dataset.state='error';status.textContent=message}
 fileInput.addEventListener('change',()=>{const file=fileInput.files?.[0];fileLabel.textContent=file?file.name:'Abrechnung auswählen';if(file&&file.size>8388608){fileInput.value='';fileLabel.textContent='Abrechnung auswählen';fail('Die Datei ist größer als 8 MB. Bitte wähle eine kleinere PDF- oder Bilddatei.')}else if(file){status.textContent='';delete status.dataset.state}});
 void loadChallenge().catch(()=>{});
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy||!form.reportValidity())return;
  const file=fileInput.files?.[0];if(!file)return fail('Bitte wähle eine Abrechnung aus.');
  if(file.size<1||file.size>8388608)return fail('Die Datei muss kleiner als 8 MB sein.');
  const allowed=new Set(['application/pdf','image/jpeg','image/png','image/webp']);if(!allowed.has(file.type))return fail('Bitte verwende eine PDF-, JPG-, PNG- oder WebP-Datei.');
  busy=true;submit.disabled=true;submit.textContent=intakeCreated?'Abrechnung wird erneut sicher übertragen …':'Vergleich wird angelegt …';status.textContent='';delete status.dataset.state;
  try{
   if(!challenge||Date.now()-receivedAt>3500000)await loadChallenge();
   const pause=Math.max(0,2200-(Date.now()-receivedAt));if(pause)await new Promise(resolve=>setTimeout(resolve,pause));
   const d=new FormData(form);
   if(!intakeCreated){
    const payload={interest:'sumup',request_type:'sumup_fee_check',company:String(d.get('company')||'').trim(),contact:String(d.get('contact')||'').trim(),city:String(d.get('city')||'').trim(),email:String(d.get('email')||'').trim(),phone:String(d.get('phone')||'').trim(),current_provider:String(d.get('current_provider')||'').trim(),monthly_volume:String(d.get('monthly_volume')||'').trim(),message:'Quelle: neXaro Landingpage · Konditionsvergleich mit sicherer Abrechnung\n\n'+String(d.get('message')||'').trim(),consent:d.get('consent')==='on'};
    const intake=await fetch(intakeEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({payload,website:String(d.get('website')||''),challenge}),signal:AbortSignal.timeout(25000)});
    if(!intake.ok){if(intake.status===429)throw Error('Zu viele Anfragen in kurzer Zeit. Bitte versuche es später erneut.');if(intake.status===400){challenge=null;throw Error('Bitte prüfe deine Angaben und versuche es erneut.')}throw Error('Der Vergleich konnte gerade nicht angelegt werden. Deine Eingaben bleiben erhalten. Bitte versuche es erneut.')}
    intakeCreated=true;submit.textContent='Abrechnung wird sicher übertragen …';
   }
   const upload=new FormData();upload.append('statement',file,file.name);upload.append('challenge',JSON.stringify(challenge));
   const sent=await fetch(statementEndpoint,{method:'POST',body:upload,signal:AbortSignal.timeout(40000)});
   if(!sent.ok&&sent.status!==409){if(sent.status===413)throw Error('Die Datei ist zu groß. Bitte verwende eine Datei bis maximal 8 MB.');if(sent.status===400)throw Error('Die Datei konnte nicht sicher geprüft werden. Bitte verwende eine unveränderte PDF-, JPG-, PNG- oder WebP-Datei.');throw Error('Deine Anfrage ist bereits im CRM angelegt, aber die Abrechnung konnte noch nicht übertragen werden. Bitte klicke erneut auf „sicher senden“.')}
   status.dataset.state='success';status.textContent='Vielen Dank! Deine Anfrage und Abrechnung wurden sicher übermittelt. Wir prüfen deine Konditionen und melden uns persönlich mit den nächsten Schritten.';form.reset();fileLabel.textContent='Abrechnung auswählen';challenge=null;intakeCreated=false;void loadChallenge().catch(()=>{});
  }catch(error){fail(error instanceof Error&&error.name!=='TimeoutError'&&error.name!=='TypeError'?error.message:'Die Verbindung ist gerade nicht verfügbar. Deine Angaben bleiben erhalten. Bitte versuche es erneut.')}
  finally{busy=false;submit.disabled=false;submit.textContent='Vergleich anfordern & sicher senden ↗'}
 });
})();
