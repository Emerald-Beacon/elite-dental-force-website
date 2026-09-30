(() => {
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
      const module = await import('../3d/laptop-scene.js');
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
