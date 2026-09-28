(()=>{
const form=document.getElementById('softwareRequestForm');if(!form)return;
const endpoint='https://hbuqzdmjqvgybwohfnqy.supabase.co/functions/v1/nx-software-sales';
const button=form.querySelector('button[type=submit]'),status=document.getElementById('softwareRequestStatus');let challenge=null,pending=null,busy=false;
async function prepare(){if(challenge&&Date.now()-challenge.issued<3500000)return challenge;if(pending)return pending;pending=fetch(endpoint,{cache:'no-store',signal:AbortSignal.timeout(20000)}).then(async r=>{if(!r.ok)throw Error('Der Dienst ist gerade nicht verfügbar.');challenge=await r.json();return challenge}).finally(()=>{pending=null});return pending}
form.addEventListener('focusin',()=>{void prepare().catch(()=>{})});
document.querySelectorAll('[data-software-kind]').forEach(a=>a.addEventListener('click',()=>{form.elements.namedItem('request_kind').value=a.dataset.softwareKind}));
form.addEventListener('submit',async e=>{
 e.preventDefault();if(busy||!form.reportValidity())return;busy=true;button.disabled=true;status.textContent='Deine Anfrage wird übermittelt …';
 try{const c=await prepare();const wait=Math.max(0,1700-(Date.now()-c.issued));if(wait)await new Promise(r=>setTimeout(r,wait));const data=new FormData(form),payload={};for(const k of ['company','contact','email','phone','city','industry','users_count','request_kind','message'])payload[k]=String(data.get(k)||'').trim();const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'submit',challenge:c,website:String(data.get('website')||''),consent:data.get('consent')==='on',payload}),signal:AbortSignal.timeout(25000)});const result=await r.json();if(!r.ok){if(r.status===400||r.status===403)challenge=null;throw Error(result.error||'Die Anfrage konnte nicht bestätigt werden.')}
 status.textContent='Vielen Dank! Deine Software-Anfrage ist eingegangen. Wir melden uns persönlich bei dir.';form.reset();challenge=null;
 }catch(error){status.textContent=(error.name==='TypeError'||error.name==='TimeoutError'?'Die Verbindung ist gerade nicht verfügbar. Deine Angaben bleiben erhalten. Bitte versuche es erneut.':error.message)}finally{busy=false;button.disabled=false}
});
})();
