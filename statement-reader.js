/* neXaro statement upload UI.
   The authoritative extraction happens server-side during the secure upload.
   This module deliberately avoids browser OCR so the customer experience is
   consistent across iOS, Android, Windows and macOS. */

export function attachStatementReader({form,fileInput,status,fileLabel,onExtracted}){
  if(!form||!fileInput||form.dataset.statementUiReady==='1') return;
  form.dataset.statementUiReady='1';

  /* Remove readout panels left by an older cached OCR implementation. */
  form.querySelectorAll('.nx-statement-readout').forEach(el=>el.remove());

  const loader=document.createElement('div');
  loader.className='nx-payment-upload-loader';
  loader.hidden=true;
  loader.setAttribute('role','status');
  loader.setAttribute('aria-live','polite');
  loader.setAttribute('aria-busy','true');
  loader.innerHTML=`
    <div class="nx-pay-visual" aria-hidden="true">
      <div class="nx-pay-terminal">
        <div class="nx-pay-screen"><i></i></div>
        <div class="nx-pay-card"><span></span></div>
        <div class="nx-pay-wave nx-pay-wave-1"></div>
        <div class="nx-pay-wave nx-pay-wave-2"></div>
        <div class="nx-pay-wave nx-pay-wave-3"></div>
      </div>
    </div>
    <div class="nx-pay-copy">
      <strong>Abrechnung wird sicher übertragen …</strong>
      <small>Elektronische Verarbeitung läuft. Deine Datei wird geschützt übertragen und für den Vergleich ausgelesen.</small>
    </div>`;

  const submit=form.querySelector('#feeCheckSubmit');
  if(submit) submit.before(loader); else status?.before(loader);

  const style=document.createElement('style');
  style.textContent=`
    .nx-payment-upload-loader[hidden]{display:none!important}
    .nx-payment-upload-loader{display:flex;align-items:center;gap:15px;margin:14px 0;padding:15px 16px;border:1px solid #d7e6ca;border-radius:15px;background:linear-gradient(135deg,#f8fcf3,#edf8e2);box-shadow:0 10px 24px #20331b0d}
    .nx-pay-visual{width:72px;height:72px;display:grid;place-items:center;flex:none}
    .nx-pay-terminal{position:relative;width:62px;height:62px;overflow:hidden;border-radius:18px;background:linear-gradient(155deg,#2b3b31,#17211b);box-shadow:0 10px 20px #18221c28}
    .nx-pay-screen{position:absolute;left:11px;top:10px;width:40px;height:12px;border-radius:6px;background:linear-gradient(90deg,#baff37,#e3ffa5);box-shadow:0 0 14px #baff3766;animation:nxPayScreen 1.35s ease-in-out infinite}
    .nx-pay-screen i{display:block;width:13px;height:3px;margin:4px auto 0;border-radius:2px;background:#1c2a20aa}
    .nx-pay-card{position:absolute;left:-13px;top:31px;width:30px;height:20px;border-radius:6px;background:linear-gradient(135deg,#baff37,#efffc8);box-shadow:0 5px 12px #baff374f;animation:nxPayCard 1.75s ease-in-out infinite}
    .nx-pay-card:before{content:"";position:absolute;left:5px;top:5px;width:8px;height:6px;border-radius:2px;background:#26332966}.nx-pay-card span{position:absolute;right:4px;bottom:4px;width:8px;height:2px;border-radius:2px;background:#26332955}
    .nx-pay-wave{position:absolute;border:2px solid #baff37;border-left:0;border-bottom:0;border-radius:0 18px 0 0;opacity:0;transform-origin:left bottom}
    .nx-pay-wave-1{right:10px;top:28px;width:7px;height:7px;animation:nxPayWave 1.75s ease-out infinite}
    .nx-pay-wave-2{right:7px;top:24px;width:13px;height:13px;animation:nxPayWave 1.75s ease-out .18s infinite}
    .nx-pay-wave-3{right:3px;top:20px;width:20px;height:20px;animation:nxPayWave 1.75s ease-out .36s infinite}
    .nx-pay-copy{display:flex;flex-direction:column;gap:4px;min-width:0}.nx-pay-copy strong{font-size:13px;color:#1d2820}.nx-pay-copy small{font-size:11px;color:#667268;line-height:1.45}
    .nx-statement-ready{margin:-3px 0 14px;padding:11px 13px;border:1px solid #dce9d0;border-radius:12px;background:#f7fbf2;color:#526151;font-size:11px;line-height:1.45}
    .nx-upload-security{margin:10px 0 15px;padding:15px 16px;border:1px solid #dce7d4;border-radius:14px;background:linear-gradient(135deg,#fff,#f8fbf4);box-shadow:0 8px 20px #20331b08}
    .nx-upload-security-head{display:flex;align-items:center;gap:9px;margin-bottom:8px;color:#1d2820}.nx-upload-security-head b{font-size:13px}.nx-upload-security-icon{display:grid;place-items:center;width:28px;height:28px;border-radius:9px;background:#eaffc4;font-size:15px}
    .nx-upload-security p{margin:0 0 8px;color:#5c695f;font-size:11px;line-height:1.5}.nx-upload-security-list{display:grid;grid-template-columns:1fr 1fr;gap:6px 12px}.nx-upload-security-list span{font-size:10.5px;line-height:1.4;color:#455348;font-weight:700}.nx-upload-security-list span:before{content:"✓";margin-right:6px;color:#61a524}.nx-upload-security a{display:inline-block;margin-top:9px;font-size:10.5px;font-weight:800;color:#a84a22;text-decoration:none}
    @keyframes nxPayCard{0%{transform:translateX(0);opacity:.2}18%{opacity:1}55%{transform:translateX(25px);opacity:1}73%{transform:translateX(30px);opacity:1}100%{transform:translateX(47px);opacity:.12}}
    @keyframes nxPayWave{0%{opacity:0;transform:scale(.65)}30%{opacity:.95}100%{opacity:0;transform:scale(1.18)}}
    @keyframes nxPayScreen{0%,100%{opacity:.58}50%{opacity:1}}
    @media(max-width:700px){.nx-payment-upload-loader{align-items:flex-start;padding:14px}.nx-pay-visual{width:62px;height:62px}.nx-pay-terminal{width:56px;height:56px}.nx-pay-screen{width:35px}.nx-pay-copy strong{font-size:12.5px}.nx-upload-security-list{grid-template-columns:1fr}}
    @media(prefers-reduced-motion:reduce){.nx-pay-screen,.nx-pay-card,.nx-pay-wave{animation:none!important}.nx-pay-card{left:12px;opacity:1}.nx-pay-wave{opacity:.55}}
  `;
  document.head.append(style);

  const drop=fileInput.closest('.nx-file-drop');
  if(drop&&!form.querySelector('.nx-upload-security')){
    const security=document.createElement('div');
    security.className='nx-upload-security';
    security.setAttribute('role','note');
    security.innerHTML=`
      <div class="nx-upload-security-head"><span class="nx-upload-security-icon" aria-hidden="true">🔒</span><b>Deine Abrechnung wird geschützt verarbeitet.</b></div>
      <p>Der Upload ist technisch vom internen CRM getrennt. Nur gültige Upload-Vorgänge von der neXaro-Seite werden akzeptiert und die Auswertung erfolgt serverseitig für deinen Payment-Vergleich.</p>
      <div class="nx-upload-security-list">
        <span>Dateityp, Dateigröße und Dateisignatur werden geprüft</span>
        <span>Upload nur mit gültiger, zeitlich begrenzter Sicherheits-Challenge</span>
        <span>Auswertung erfolgt serverseitig statt offen im Browser</span>
        <span>Verarbeitung zweckgebunden für Anfrage und Vergleich</span>
      </div>
      <a href="/datenschutz.html">Mehr zum Datenschutz →</a>`;
    drop.insertAdjacentElement('afterend',security);
  }

  const ready=document.createElement('div');
  ready.className='nx-statement-ready';
  ready.hidden=true;
  (form.querySelector('.nx-upload-security')||drop)?.insertAdjacentElement('afterend',ready);

  const setReady=()=>{
    const file=fileInput.files?.[0];
    loader.hidden=true;
    if(!file){ready.hidden=true;return;}
    ready.hidden=false;
    ready.textContent='✓ Abrechnung ausgewählt. Die elektronische Auswertung startet beim sicheren Absenden.';
    if(status){status.textContent='';delete status.dataset.state;}
    onExtracted?.({version:3,source:'server-on-upload',confidence:null,review_required:true});
  };
  fileInput.addEventListener('change',setReady);

  form.addEventListener('submit',()=>{
    if(!form.reportValidity()) return;
    const mode=form.closest('#vergleich')?.querySelector('.nx-mode-btn.is-active')?.dataset.mode||'upload';
    if(mode!=='upload') return;
    if(!fileInput.files?.[0]) return;
    ready.hidden=true;
    loader.hidden=false;
  },true);

  if(status){
    new MutationObserver(()=>{
      if(status.dataset.state==='success'||status.dataset.state==='error') loader.hidden=true;
    }).observe(status,{attributes:true,attributeFilter:['data-state'],childList:true,subtree:true});
  }
}
