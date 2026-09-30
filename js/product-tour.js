(() => {
  const trigger = document.querySelector('[data-product-tour]');
  if (!trigger || !window.HTMLDialogElement?.prototype.showModal) return;
  trigger.setAttribute('aria-haspopup', 'dialog');
  let active;

  trigger.addEventListener('click', event => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (active) return;

    const dialog = document.createElement('dialog');
    active = dialog;
    dialog.className = 'product-tour-dialog';
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'product-tour-title');
    dialog.setAttribute('aria-describedby', 'product-tour-note');
    const header = document.createElement('div');
    header.className = 'product-tour-heading';
    const title = document.createElement('h2');
    title.id = 'product-tour-title';
    title.textContent = 'Product tour';
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'product-tour-close';
    close.setAttribute('aria-label', 'Close product tour');
    close.autofocus = true;
    close.textContent = '×';
    header.append(title, close);

    const video = document.createElement('video');
    video.preload = 'none';
    video.controls = true;
    video.playsInline = true;
    video.muted = true;
    video.autoplay = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    video.setAttribute('aria-label', 'Elite Dental Force product tour');
    video.poster = 'images/motion/product-tour-poster.jpg';
    for (const extension of ['webm', 'mp4']) {
      const source = document.createElement('source');
      source.src = `videos/edf-product-tour-720p.${extension}`;
      source.type = `video/${extension}`;
      video.append(source);
    }
    const note = document.createElement('p');
    note.id = 'product-tour-note';
    note.textContent = 'Figures from one practice beta audit of 2,399 claims.';
    const first = document.createElement('span'), last = document.createElement('span');
    for (const guard of [first, last]) {
      guard.tabIndex = 0;
      guard.className = 'product-tour-focus-guard';
    }
    first.addEventListener('focus', () => video.focus());
    last.addEventListener('focus', () => close.focus());
    dialog.append(first, header, video, note, last);

    const root = document.documentElement, body = document.body;
    const previous = { root: root.style.overflow, body: body.style.overflow, padding: body.style.paddingRight };
    const gutter = innerWidth - root.clientWidth;
    if (gutter) body.style.paddingRight = `${parseFloat(getComputedStyle(body).paddingRight) + gutter}px`;
    root.style.overflow = body.style.overflow = 'hidden';
    document.body.append(dialog);
    dialog.addEventListener('close', () => {
      video.pause();
      video.autoplay = false;
      video.removeAttribute('src');
      video.removeAttribute('poster');
      video.replaceChildren();
      video.load();
      dialog.remove();
      root.style.overflow = previous.root;
      body.style.overflow = previous.body;
      body.style.paddingRight = previous.padding;
      active = null;
      trigger.focus({ preventScroll: true });
    }, { once: true });
    close.addEventListener('click', () => dialog.close());
    dialog.showModal();
    if (video.autoplay) video.play().catch(() => {});
  });
})();
