(() => {
  const article = document.querySelector('article.article-content');
  if (!article) return;
  const headings = [...article.querySelectorAll('h2,h3')];
  const nav = document.querySelector('.journal-toc nav');
  const entries = headings.map((heading, index) => {
    if (!heading.id) heading.id = `article-section-${index + 1}`;
    const link = document.createElement('a');
    link.className = `toc-link toc-${heading.tagName.toLowerCase()}`;
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent.trim();
    return link;
  });
  nav.replaceChildren(...entries);
  const links = entries;
  const progress = document.querySelector('.reading-progress span');
  let frame = 0;
  const update = () => {
    frame = 0;
    let active = headings[0];
    for (const heading of headings) { if (Math.floor(heading.getBoundingClientRect().top) <= 160) active = heading; }
    links.forEach(link => {
      if (link.hash === `#${active?.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    const rect = article.getBoundingClientRect();
    const value = Math.max(0, Math.min(1, (160 - rect.top) / Math.max(1, rect.height - innerHeight + 160)));
    progress.style.transform = `scaleX(${value})`;
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  addEventListener('pagehide', () => { cancelAnimationFrame(frame); frame = 0; });
  const details = document.querySelector('.journal-toc');
  const desktop = matchMedia('(min-width: 1100px)');
  const expand = () => { details.open = desktop.matches; };
  desktop.addEventListener('change', expand);
  expand();
  links.forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (matchMedia('(max-width: 1099px)').matches) details.open = false;
    const heading = document.getElementById(link.hash.slice(1));
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
      history.replaceState(null, '', link.hash);
      heading.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }
  }, true));
  document.querySelector('[data-copy-link]').addEventListener('click', async () => {
    const status = document.querySelector('[data-share-status]');
    try { await navigator.clipboard.writeText(document.querySelector('link[rel="canonical"]')?.href || location.href); status.textContent = 'Link copied'; }
    catch { status.textContent = 'Copy the address from your browser to share this article.'; }
  });
  update();
})();
