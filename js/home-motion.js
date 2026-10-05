(() => {
  const ASSET_VERSION = '20261005a';
  const hero = document.querySelector('[data-home-motion]');
  if (!hero) return;
  const media = matchMedia('(min-width: 1025px) and (min-height: 760px) and (prefers-reduced-motion: no-preference)');
  const eligible = () => media.matches && !navigator.connection?.saveData && !['slow-2g', '2g'].includes(navigator.connection?.effectiveType) && navigator.onLine;
  const atTop = () => scrollY < 40 && !document.hidden;
  hero.dataset.motion = 'poster';
  async function boot() {
    if (!eligible() || !atTop()) return;
    let gl, timeout;
    const release = () => gl?.getExtension('WEBGL_lose_context')?.loseContext();
    try {
      await hero.querySelector('.product-visual img').decode();
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      if (!eligible() || !atTop()) return;
      const canvas = hero.querySelector('.hero-laptop');
      const attributes = { alpha: true, antialias: true, failIfMajorPerformanceCaveat: true };
      gl = canvas.getContext('webgl2', attributes) || canvas.getContext('webgl', attributes);
      if (!gl) return;
      const info = gl.getExtension('WEBGL_debug_renderer_info');
      const renderer = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
      if (/SwiftShader|llvmpipe|Software|Microsoft Basic Render/i.test(renderer)) {
        release();
        return;
      }
      let expired = false;
      timeout = setTimeout(() => { expired = true; hero.dataset.motion = 'fallback'; release(); }, 8000);
      const module = await import(`../3d/laptop-scene.js?v=${ASSET_VERSION}`);
      clearTimeout(timeout);
      if (expired || !eligible() || !atTop()) {
        release();
        return;
      }
      await module.mountHeroMotion(hero, eligible, atTop);
    } catch {
      clearTimeout(timeout);
      hero.dataset.motion = 'fallback';
      release();
    }
  }
  const schedule = () => {
    if (!eligible() || !atTop()) return;
    if ('requestIdleCallback' in window) requestIdleCallback(boot, { timeout: 1800 });
    else setTimeout(boot, 200);
  };
  if (document.readyState === 'complete') schedule();
  else addEventListener('load', schedule, { once: true });
})();

(() => {
  const platform = document.querySelector('#enterprise-modules');
  if (!platform) return;
  const action = document.querySelector('#platform-action');
  const workflow = document.querySelector('#revenue-workflow');
  const steps = workflow?.querySelector('.workflow-steps');
  const nodes = workflow ? [...workflow.querySelectorAll('.workflow-step')] : [];
  const cards = action?.querySelector('.pia-cards');
  const pointer = matchMedia('(hover: hover) and (pointer: fine)');
  const media = matchMedia('(min-width: 1025px) and (prefers-reduced-motion: no-preference)');
  const visible = new Set(), animations = new Set(), revealed = new WeakSet();
  let observer, frame = 0, pointerX = 0, pointerY = 2;
  const update = () => {
    frame = 0;
    if (document.hidden) return;
    for (const section of visible) {
      const rect = section.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (innerHeight - rect.top) / (innerHeight + rect.height)));
      if (section === platform) section.style.setProperty('--section-drift', `${(progress - .5) * 24}px`);
      if (section === action) {
        section.style.setProperty('--pointer-x', `${pointerX}deg`);
        section.style.setProperty('--pointer-y', `${pointerY}deg`);
      }
      if (section === workflow) {
        const top = steps.getBoundingClientRect().top;
        const fill = Math.max(0, Math.min(1, (innerHeight * .8 - top) / (innerHeight * .65)));
        workflow.style.setProperty('--workflow-progress', fill);
        nodes.forEach((node, index) => node.style.setProperty('--node-lit', fill >= index / 3 ? 1 : 0));
      }
    }
  };
  const schedule = () => { if (!frame && visible.size && !document.hidden) frame = requestAnimationFrame(update); };
  const move = event => {
    if (!pointer.matches || !visible.has(action)) return;
    const rect = cards.getBoundingClientRect();
    pointerX = Math.max(-3, Math.min(3, (event.clientX - rect.left) / rect.width * 6 - 3));
    pointerY = Math.max(-1, Math.min(5, 5 - (event.clientY - rect.top) / rect.height * 6));
    schedule();
  };
  const resetPointer = () => { pointerX = 0; pointerY = 2; schedule(); };
  const stop = () => {
    observer?.disconnect();
    visible.clear();
    cancelAnimationFrame(frame);
    frame = 0;
    removeEventListener('scroll', schedule);
    removeEventListener('resize', schedule);
    for (const animation of animations) animation.cancel();
    animations.clear();
    platform.style.removeProperty('--section-drift');
    cards?.removeEventListener('pointermove', move);
    cards?.removeEventListener('pointerleave', resetPointer);
    action?.style.removeProperty('--pointer-x');
    action?.style.removeProperty('--pointer-y');
    pointerX = 0;
    pointerY = 2;
    workflow?.style.removeProperty('--workflow-progress');
    nodes.forEach(node => node.style.removeProperty('--node-lit'));
  };
  const start = () => {
    stop();
    if (!media.matches || !('IntersectionObserver' in window)) return;
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          visible.add(entry.target);
          if (!revealed.has(entry.target)) {
            revealed.add(entry.target);
            entry.target.querySelectorAll('[data-section-reveal]').forEach((target, index) => {
              const animation = target.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 500, delay: Math.min(index * 80, 240), easing: 'ease-out' });
              animations.add(animation);
              animation.onfinish = () => animations.delete(animation);
            });
          }
        } else visible.delete(entry.target);
      }
      if (visible.size) {
        addEventListener('scroll', schedule, { passive: true });
        addEventListener('resize', schedule, { passive: true });
        schedule();
      } else {
        removeEventListener('scroll', schedule);
        removeEventListener('resize', schedule);
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });
    observer.observe(platform);
    if (workflow) observer.observe(workflow);
    if (action) {
      observer.observe(action);
      cards.addEventListener('pointermove', move, { passive: true });
      cards.addEventListener('pointerleave', resetPointer);
    }
  };
  media.addEventListener('change', start);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else schedule(); });
  addEventListener('pagehide', stop);
  addEventListener('pageshow', start);
  start();
})();
