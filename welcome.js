/* Decorative only: no storage, tracking or network requests. */
(() => {
 const hero=document.querySelector('.hero'), replay=document.getElementById('nxReplayEffect'), status=document.getElementById('nxEffectStatus');
 if(!hero||!replay)return;
 replay.hidden=false;
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 let timer,pending,glow,visible=false,ready=document.readyState==='complete',played=false;
 function stop(){clearTimeout(timer);clearTimeout(pending);hero.classList.remove('nx-welcome');glow?.remove();glow=null}
 function play(manual=false){
  stop();if(document.hidden)return;
  if(motion.matches){if(manual)status.textContent='„Bewegung reduzieren“ ist aktiviert. Die Animation bleibt ausgeschaltet.';return}
  played=true;glow=document.createElement('div');glow.className='nx-welcome-glow';glow.setAttribute('aria-hidden','true');hero.append(glow);
  void hero.offsetWidth;hero.classList.add('nx-welcome');status.textContent=manual?'Neon-Effekt läuft.':'';
  timer=setTimeout(()=>{stop();status.textContent=''},3900);
 }
 function schedule(){clearTimeout(pending);if(ready&&visible&&!played&&!document.hidden&&!motion.matches)pending=setTimeout(()=>play(),700)}
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule()},{threshold:.15});observer.observe(hero);
 replay.addEventListener('click',()=>play(true));
 window.addEventListener('load',()=>{ready=true;schedule()},{once:true});
 window.addEventListener('pageshow',event=>{if(event.persisted)played=false;schedule()});
 window.addEventListener('pagehide',stop);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else schedule()});
 motion.addEventListener('change',()=>{stop();schedule()});schedule();
})();
