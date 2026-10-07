(()=>{
// Google Ads base tag for the main neXaro website. Consent defaults to denied
// for EEA users; a consent manager can update these states after consent.
window.dataLayer=window.dataLayer||[];
window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};
gtag('consent','default',{ad_storage:'denied',analytics_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});
if(!document.querySelector('script[src*="googletagmanager.com/gtag/js?id=AW-18472432420"]')){
 const googleTag=document.createElement('script');
 googleTag.async=true;
 googleTag.src='https://www.googletagmanager.com/gtag/js?id=AW-18472432420';
 document.head.appendChild(googleTag);
}
gtag('js',new Date());
gtag('config','AW-18472432420');

document.querySelectorAll('#mainNav a[href="#software"],.nx-header-software[href="#software"],.hero a[href="#software"],.nx-announcement[href="#software"]').forEach(a=>a.setAttribute('href','/crm/'));

// The main hero used to send visitors to another generic section first. Replace that detour
// with one customer-specific decision that routes directly to the relevant next step.
const solutionCta=document.querySelector('.hero .actions a.btn[href="#welten"]');
if(solutionCta&&!document.getElementById('nxSolutionDialog')){
 const dialog=document.createElement('div');dialog.id='nxSolutionDialog';dialog.className='nx-solution-dialog';dialog.hidden=true;dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','nxSolutionTitle');
 dialog.innerHTML=`<div class="nx-solution-backdrop" data-close></div><div class="nx-solution-sheet"><button class="nx-solution-close" type="button" aria-label="Auswahl schließen" data-close>×</button><span class="nx-solution-eyebrow">PASSENDE LÖSUNG · DIREKTER EINSTIEG</span><h2 id="nxSolutionTitle">Was möchtest du konkret lösen?</h2><p>Wähle deine Ausgangslage. Du landest direkt beim passenden nächsten Schritt – ohne weitere Umwege.</p><div class="nx-solution-grid"><a href="/sumup-beratung.html?payment_mode=existing#vergleich"><b>01</b><strong>Ich nutze bereits Kartenzahlung</strong><span>Bestehende Lösung oder Abrechnung direkt vergleichen.</span></a><a href="/sumup-beratung.html?payment_mode=new#vergleich"><b>02</b><strong>Ich nutze noch keine Kartenzahlung</strong><span>Kosten, Tarif und passende Hardware für den Einstieg berechnen.</span></a><a href="/crm/"><b>03</b><strong>Vertrieb & CRM verbessern</strong><span>Leads, Kunden, Aufgaben und Follow-ups strukturieren.</span></a><a href="/b2b-handel.html"><b>04</b><strong>B2B / Fachhandel</strong><span>Gewerbliche Sortiments- oder Händleranfrage direkt starten.</span></a></div><a class="nx-solution-phone" href="tel:+491719098831">Lieber direkt persönlich sprechen →</a></div>`;
 document.body.appendChild(dialog);
 const style=document.createElement('style');style.textContent=`.nx-solution-dialog[hidden]{display:none!important}.nx-solution-dialog{position:fixed;inset:0;z-index:999;display:grid;place-items:center;padding:18px}.nx-solution-backdrop{position:absolute;inset:0;background:#111c16aa;backdrop-filter:blur(6px)}.nx-solution-sheet{position:relative;width:min(760px,100%);max-height:min(760px,92vh);overflow:auto;padding:30px;border-radius:26px;background:#fff;box-shadow:0 35px 90px #0e181155}.nx-solution-close{position:absolute;right:16px;top:14px;width:40px;height:40px;border:1px solid #dfe7dc;border-radius:12px;background:#fff;font-size:25px;line-height:1;cursor:pointer}.nx-solution-eyebrow{font-size:10px;letter-spacing:1.6px;font-weight:900;color:#cb5d27}.nx-solution-sheet h2{font-size:clamp(28px,5vw,43px);margin:10px 44px 8px 0;letter-spacing:-.05em}.nx-solution-sheet>p{color:#647066;line-height:1.6}.nx-solution-grid{display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-top:20px}.nx-solution-grid a{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;padding:18px;border:1px solid #dfe7dc;border-radius:16px;background:#fbfdf9;text-decoration:none;color:#1d2820}.nx-solution-grid a:hover{border-color:#a7cb77;background:#f3fae9}.nx-solution-grid b{grid-row:1/3;display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:#f36b29;color:#fff;font-size:10px}.nx-solution-grid strong{font-size:14px}.nx-solution-grid span{font-size:11px;line-height:1.45;color:#667268}.nx-solution-phone{display:block;margin-top:15px;text-align:center;font-size:12px;font-weight:850;color:#253329;text-decoration:none}.nx-solution-dialog.is-open{display:grid}.nx-solution-dialog.is-open .nx-solution-sheet{animation:nxSolutionIn .18s ease-out}@keyframes nxSolutionIn{from{opacity:0;transform:translateY(10px) scale(.99)}to{opacity:1;transform:none}}@media(max-width:620px){.nx-solution-dialog{padding:10px;place-items:end center}.nx-solution-sheet{padding:24px 16px 20px;border-radius:23px 23px 16px 16px;max-height:89vh}.nx-solution-grid{grid-template-columns:1fr}.nx-solution-grid a{padding:15px}.nx-solution-sheet h2{font-size:29px}}@media(prefers-reduced-motion:reduce){.nx-solution-dialog.is-open .nx-solution-sheet{animation:none}}`;document.head.appendChild(style);
 let previousFocus=null;const close=()=>{dialog.hidden=true;dialog.classList.remove('is-open');document.body.style.overflow='';previousFocus?.focus?.()};const open=event=>{event.preventDefault();previousFocus=document.activeElement;dialog.hidden=false;dialog.classList.add('is-open');document.body.style.overflow='hidden';dialog.querySelector('.nx-solution-close')?.focus()};
 solutionCta.addEventListener('click',open);dialog.querySelectorAll('[data-close]').forEach(el=>el.addEventListener('click',close));document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!dialog.hidden)close()});
}

const form=document.getElementById('softwareRequestForm');if(!form)return;
const requestedKind=new URLSearchParams(location.search).get('software_kind');if(['consultation','demo','pilot'].includes(requestedKind||''))form.elements.namedItem('request_kind').value=requestedKind;
const endpoint='https://hbuqzdmjqvgybwohfnqy.supabase.co/functions/v1/nx-software-sales';
const button=form.querySelector('button[type=submit]'),status=document.getElementById('softwareRequestStatus');let challenge=null,pending=null,busy=false;
async function prepare(){if(challenge&&Date.now()-challenge.issued<3500000)return challenge;if(pending)return pending;pending=fetch(endpoint,{cache:'no-store',signal:AbortSignal.timeout(20000)}).then(async r=>{if(!r.ok)throw Error('Der Dienst ist gerade nicht verfügbar.');challenge=await r.json();return challenge}).finally(()=>{pending=null});return pending}
form.addEventListener('focusin',()=>{void prepare().catch(()=>{})});
document.querySelectorAll('[data-software-kind]').forEach(a=>a.addEventListener('click',()=>{form.elements.namedItem('request_kind').value=a.dataset.softwareKind}));
form.addEventListener('submit',async e=>{
 e.preventDefault();if(busy||!form.reportValidity())return;busy=true;button.disabled=true;status.textContent='Deine Anfrage wird übermittelt …';
 try{const c=await prepare();const wait=Math.max(0,1700-(Date.now()-c.issued));if(wait)await new Promise(r=>setTimeout(r,wait));const data=new FormData(form),payload={};for(const k of ['company','contact','email','phone','city','industry','users_count','request_kind','message'])payload[k]=String(data.get(k)||'').trim();payload.language=localStorage.getItem('nexaro-language')==='en'?'en':'de';const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'submit',challenge:c,website:String(data.get('website')||''),consent:data.get('consent')==='on',payload}),signal:AbortSignal.timeout(25000)});const result=await r.json();if(!r.ok){if(r.status===400||r.status===403)challenge=null;throw Error(result.error||'Die Anfrage konnte nicht bestätigt werden.')}
 status.textContent='Vielen Dank! Deine Software-Anfrage ist eingegangen. Wir melden uns persönlich bei dir.';form.reset();challenge=null;
 }catch(error){status.textContent=(error.name==='TypeError'||error.name==='TimeoutError'?'Die Verbindung ist gerade nicht verfügbar. Deine Angaben bleiben erhalten. Bitte versuche es erneut.':error.message)}finally{busy=false;button.disabled=false}
});
})();
import('/comparison-ui.js?v=20261001a').catch(()=>{});
