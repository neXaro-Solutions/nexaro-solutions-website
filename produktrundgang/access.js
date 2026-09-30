/* The public site contains no invitation values or protected presentation. */
(()=>{
const form=document.getElementById('produktdemo');if(!form)return;
const input=document.getElementById('nxDemoCode'),status=document.getElementById('nxDemoError'),button=form.querySelector('button[type=submit]');
const endpoint='https://hbuqzdmjqvgybwohfnqy.supabase.co/functions/v1/nx-demo-access';
let code='',expiry=0,checkTimer=null,expiryTimer=null,viewer=null,frame=null,checking=false;
async function request(action,value){const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,code:value}),cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(20000)});const data=await r.json();if(!r.ok)throw Error(data.error||'Der Zugang konnte nicht bestätigt werden.');return data}
function close(message='Vorführung beendet. Du kannst dich erneut mit deinem gültigen Einladungscode anmelden.'){
 clearInterval(checkTimer);clearInterval(expiryTimer);code='';expiry=0;if(frame){frame.srcdoc='';frame.remove();frame=null}viewer?.remove();viewer=null;document.body.style.overflow='';status.textContent=message;input.focus();
}
async function validate(){if(!code||checking)return;if(Date.now()>=expiry){close('Deine Einladung ist abgelaufen. Bitte frage einen neuen Code an.');return}checking=true;try{await request('check',code)}catch{close('Der Zugang kann nicht mehr bestätigt werden. Bitte melde dich erneut an.')}finally{checking=false}}
form.addEventListener('submit',async event=>{
 event.preventDefault();if(button.disabled||!form.reportValidity())return;
 const candidate=input.value.trim();button.disabled=true;status.textContent='Einladung wird geprüft …';input.removeAttribute('aria-invalid');
 try{const data=await request('open',candidate);const end=Date.parse(data.expires_at);if(!data.html||!Number.isFinite(end)||end<=Date.now())throw Error('Die Einladung ist abgelaufen.');
 code=candidate;expiry=end;input.value='';status.textContent='';
 viewer=document.createElement('section');viewer.className='nx-viewer';viewer.setAttribute('role','dialog');viewer.setAttribute('aria-modal','true');viewer.setAttribute('aria-label','Geschützte neXaro Produktvorführung');
 const bar=document.createElement('div');bar.className='nx-viewer-bar';const label=document.createElement('span');label.textContent='Geschützte Demo · Experience 2.0 · bis '+new Date(end).toLocaleDateString('de-DE',{timeZone:'Europe/Berlin'});label.title='Experience 2.0 · gültig bis '+new Date(end).toLocaleString('de-DE',{timeZone:'Europe/Berlin'})+' Uhr (Berlin)';const leave=document.createElement('button');leave.type='button';leave.textContent='Schließen ×';leave.onclick=()=>close();bar.append(label,leave);
 frame=document.createElement('iframe');frame.title='neXaro Produktvorführung · Experience 2.0';frame.setAttribute('sandbox','allow-scripts allow-popups allow-popups-to-escape-sandbox');frame.setAttribute('allow','fullscreen *; autoplay *');frame.allowFullscreen=true;frame.referrerPolicy='no-referrer';frame.srcdoc=data.html;viewer.append(bar,frame);document.body.append(viewer);document.body.style.overflow='hidden';leave.focus();
 checkTimer=setInterval(validate,30000);expiryTimer=setInterval(()=>{if(expiry&&Date.now()>=expiry)close('Deine Einladung ist abgelaufen. Bitte frage einen neuen Code an.')},1000);
 }catch(error){status.textContent=error.name==='TimeoutError'||error.name==='TypeError'?'Die Verbindung ist gerade nicht verfügbar. Bitte versuche es erneut.':error.message;input.setAttribute('aria-invalid','true');input.focus()}finally{button.disabled=false}
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)validate()});
window.addEventListener('pagehide',()=>{if(viewer)close()});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&viewer)close()});
})();
