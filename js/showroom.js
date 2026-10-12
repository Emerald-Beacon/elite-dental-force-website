(() => {
  const rooms = [...document.querySelectorAll('.tour-room')];
  const links = [...document.querySelectorAll('.tour-rail a')];
  const motion = matchMedia('(min-width: 1025px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let current = 0;
  const clamp = value => Math.max(0, Math.min(1, value));
  const rows = [...document.querySelectorAll('[data-verify]')];
  const count = document.querySelector('[data-verified-count]');

  function update() {
    frame = 0;
    let active = 0;
    rooms.forEach((room, index) => {
      const rect = room.getBoundingClientRect();
      if (rect.top < innerHeight * .45) active = index;
      if (!motion.matches || rect.bottom < 0 || rect.top > innerHeight) return;
      const progress = clamp((80 - rect.top) / Math.max(1, rect.height - innerHeight + 80));
      room.style.setProperty('--screen-y', `${12 - progress * 24}px`);
      room.style.setProperty('--screen-x', `${7 - progress * 6}deg`);
      room.style.setProperty('--screen-ry', `${-12 + progress * 12}deg`);
      room.style.setProperty('--screen-z', `${1 - progress}deg`);
      room.style.setProperty('--screen-scale', 1 + progress * .035);
      room.style.setProperty('--lift-x', `${24 * (1 - progress)}px`);
      room.style.setProperty('--lift-y', `${18 - progress * 40}px`);
      room.style.setProperty('--orbit-opacity', 1 - progress * .8);
      if (room.id === 'schedule') {
        const verified = Math.min(3, Math.floor(progress * 5));
        count.textContent = verified;
        rows.forEach((row, number) => {
          row.classList.toggle('verified', number < verified);
          row.querySelector('.verify-status').firstChild.textContent = number < verified ? 'Verified ' : 'Pending ';
        });
      }
    });
    if (active !== current) {
      current = active;
      links.forEach((link, index) => index === active ? link.setAttribute('aria-current', 'step') : link.removeAttribute('aria-current'));
    }
  }

  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  function modeChanged() {
    rooms.forEach(room => room.removeAttribute('style'));
    if (!motion.matches) {
      count.textContent = '3';
      rows.forEach(row => {
        row.classList.add('verified');
        row.querySelector('.verify-status').firstChild.textContent = 'Verified ';
      });
    }
    schedule();
  }

  document.documentElement.classList.add('js-motion');
  update();
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  motion.addEventListener('change', modeChanged);

  document.querySelector('.tour-rail').addEventListener('keydown', event => {
    const focused = links.indexOf(document.activeElement);
    if (focused < 0) return;
    let next;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = Math.min(6, focused + 1);
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = Math.max(0, focused - 1);
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = 6;
    if (next === undefined) return;
    event.preventDefault();
    links[next].focus({ preventScroll: true });
    rooms[next].scrollIntoView({ behavior: reduce.matches ? 'instant' : 'smooth' });
    history.replaceState(null, '', links[next].hash);
  });

  const dialog = document.querySelector('.tour-video-dialog');
  const video = dialog.querySelector('video');
  let opener;
  if (typeof dialog.showModal === 'function') {
    document.querySelectorAll('[data-watch]').forEach(link => {
      link.setAttribute('aria-haspopup', 'dialog');
      link.addEventListener('click', event => {
        event.preventDefault();
        opener = link;
        if (!video.getAttribute('src')) video.src = video.dataset.videoSrc;
        dialog.showModal();
        dialog.querySelector('[data-close-video]').focus();
      });
    });
    dialog.querySelector('[data-close-video]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      video.pause();
      opener?.focus({ preventScroll: true });
    });
  }
})();
