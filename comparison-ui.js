(() => {
 const setupComparison=()=>{
  const section=document.getElementById('vergleich');
  if(!section||section.dataset.foldReady==='1')return false;
  section.dataset.foldReady='1';
  const wrap=section.querySelector('.wrap');
  if(!wrap)return false;

  const details=document.createElement('details');
  details.className='nx-comparison-fold';
  details.id='vergleichDetails';
  const summary=document.createElement('summary');
  summary.className='nx-comparison-summary';
  summary.innerHTML=`<span class="nx-comparison-summary-icon">↗</span><span class="nx-comparison-summary-copy"><small>SUMUP · VERGLEICHSANGEBOT</small><strong>Direktes Vergleichsangebot anfordern</strong><span>Abrechnung hochladen oder aktuelle Daten direkt eingeben.</span></span><span class="nx-comparison-summary-action">Jetzt öffnen <b aria-hidden="true">⌄</b></span>`;
  const content=document.createElement('div');
  content.className='nx-comparison-content';
  while(wrap.firstChild)content.append(wrap.firstChild);
  details.append(summary,content);
  wrap.append(details);

  const style=document.createElement('style');
  style.textContent=`
   .nx-fee-check{padding:30px 0!important;background:#fff!important}
   .nx-comparison-fold{border:1px solid #dfe7d8;border-radius:24px;background:#fff;box-shadow:0 14px 38px #20331b0d;overflow:hidden}
   .nx-comparison-summary{list-style:none;display:grid;grid-template-columns:auto 1fr auto;gap:16px;align-items:center;padding:22px 24px;cursor:pointer;background:linear-gradient(120deg,#fbfff7,#f3fbe8);transition:background .2s,box-shadow .2s}
   .nx-comparison-summary::-webkit-details-marker{display:none}.nx-comparison-summary:hover{background:#effbdc}
   .nx-comparison-summary-icon{display:grid;place-items:center;width:44px;height:44px;border-radius:13px;background:#baff37;color:#18221c;font-size:22px;font-weight:900}
   .nx-comparison-summary-copy{display:flex;flex-direction:column;gap:3px;min-width:0}.nx-comparison-summary-copy small{font-size:9px;letter-spacing:1.5px;font-weight:900;color:#c85b25}.nx-comparison-summary-copy strong{font-size:18px;letter-spacing:-.02em}.nx-comparison-summary-copy>span{font-size:12px;color:#667268;line-height:1.45}
   .nx-comparison-summary-action{font-size:12px;font-weight:850;white-space:nowrap;color:#223026}.nx-comparison-summary-action b{display:inline-block;margin-left:6px;font-size:16px;transition:transform .25s}.nx-comparison-fold[open] .nx-comparison-summary-action b{transform:rotate(180deg)}
   .nx-comparison-content{padding:24px;border-top:1px solid #e5ebdf;background:#fafcf7}.nx-comparison-content>.nx-compare-card{margin:0 auto;box-shadow:none}
   .nx-wizard-next{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:15px}.nx-wizard-next .btn{width:100%;text-align:center}.nx-wizard-next .nx-consult-btn{background:#fff;border:1px solid #cfd9c8;color:#1e2521}
   @media(max-width:800px){.nx-comparison-summary{grid-template-columns:auto 1fr}.nx-comparison-summary-action{grid-column:2}.nx-comparison-content{padding:14px}.nx-wizard-next{grid-template-columns:1fr}}
   @media(max-width:480px){.nx-fee-check{padding:20px 0!important}.nx-comparison-summary{padding:18px 16px;gap:12px}.nx-comparison-summary-icon{width:40px;height:40px}.nx-comparison-summary-copy strong{font-size:16px}.nx-comparison-summary-copy>span{font-size:11px}.nx-comparison-content{padding:8px}.nx-comparison-content>.nx-compare-card{border-radius:17px}}
  `;
  document.head.append(style);
  return true;
 };

 const openComparison=()=>{
  const details=document.getElementById('vergleichDetails');
  if(!details)return;
  details.open=true;
  requestAnimationFrame(()=>document.getElementById('vergleich')?.scrollIntoView({behavior:'smooth',block:'start'}));
 };

 const enhanceWizard=()=>{
  const body=document.getElementById('wizardBody');if(!body)return;
  const apply=()=>{
   const result=body.querySelector('.wizard-result');
   if(!result||result.dataset.choiceReady==='1')return;
   result.dataset.choiceReady='1';
   const existing=result.querySelector('a.btn');if(!existing)return;
   const actions=document.createElement('div');actions.className='nx-wizard-next';
   const compare=document.createElement('button');compare.type='button';compare.className='btn dark';compare.textContent='Direktes Vergleichsangebot anfordern ↗';compare.addEventListener('click',openComparison);
   existing.textContent='Persönliche Beratung vereinbaren ↗';existing.classList.add('nx-consult-btn');existing.replaceWith(actions);actions.append(compare,existing);
  };
  new MutationObserver(apply).observe(body,{childList:true,subtree:true});apply();
 };

 if(!setupComparison()){
  const observer=new MutationObserver(()=>{if(setupComparison())observer.disconnect()});
  observer.observe(document.body,{childList:true,subtree:true});
 }
 enhanceWizard();
})();
