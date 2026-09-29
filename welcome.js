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
