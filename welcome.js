/* neXaro payment bootstrap. Keep the established flow intact, then layer customer-specific enhancements on top. */
(() => {
  if (document.readyState === 'loading') {
    document.write('<script src="./welcome-core.js?v=20261006a"><\/script>');
  } else {
    const core=document.createElement('script');
    core.src='./welcome-core.js?v=20261006a';
    core.async=false;
    document.head.appendChild(core);
  }
  const loadEnhancement=async()=>{
    try{
      await import('/payment-entry-flow.js?v=20261006b');
      await import('/payment-solutions-enhancement.js?v=20261006a');
    }catch{}
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadEnhancement,{once:true});
  else loadEnhancement();
})();
