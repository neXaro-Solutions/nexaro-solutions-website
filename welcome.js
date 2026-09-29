/* Local, decorative welcome. No tracking, requests or visitor identifier. */
(() => {
  const hero = document.querySelector('.hero');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const navigation = performance.getEntriesByType('navigation')[0];
  if (!hero || motion.matches || location.hash || (navigation && navigation.type !== 'navigate')) return;
  let timer, glow;
  function stop() {
    clearTimeout(timer);
    hero.classList.remove('nx-welcome');
    glow?.remove();
    motion.removeEventListener('change', stop);
    window.removeEventListener('pagehide', stop);
  }
  function start() {
    if (document.hidden) return;
    document.removeEventListener('visibilitychange', start);
    if (motion.matches) return;
    glow = document.createElement('div');
    glow.className = 'nx-welcome-glow';
    glow.setAttribute('aria-hidden', 'true');
    hero.append(glow);
    hero.classList.add('nx-welcome');
    motion.addEventListener('change', stop);
    window.addEventListener('pagehide', stop);
    timer = setTimeout(stop, 2200);
  }
  if (document.hidden) document.addEventListener('visibilitychange', start);
  else start();
})();
