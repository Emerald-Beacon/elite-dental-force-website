(() => {
  const rooms = [...document.querySelectorAll('.tour-room')];
  const links = [...document.querySelectorAll('.tour-rail a')];
  const motion = matchMedia('(min-width: 1025px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 1024px)');
  const clamp = value => Math.max(0, Math.min(1, value));
  const segment = (p, start, end) => clamp((p - start) / (end - start));
  const ease = p => p * p * (3 - 2 * p);
  const pieces = [...document.querySelectorAll('[data-detach]')];
  let frame = 0, current = 0;

  function layoutBox(piece, stage) {
    let x = 0, y = 0, node = piece;
    while (node && node !== stage) {
      x += node.offsetLeft;
      y += node.offsetTop;
      node = node.offsetParent;
    }
    return { x, y, width: piece.offsetWidth };
  }

  function detach(room, progress) {
    const stageElement = room.querySelector('.room-stage');
    const stage = stageElement.getBoundingClientRect();
    room.querySelectorAll('[data-detach]').forEach(piece => {
      const source = room.querySelector(`[data-origin="${piece.dataset.originId}"]`);
      if (!source) return;
      const raw = segment(progress, Number(piece.dataset.liftStart), Number(piece.dataset.liftEnd));
      piece.toggleAttribute('data-label-visible', raw >= .55);
      if (piece.classList.contains('appointment-piece')) piece.dataset.cardState = raw >= .7 ? 'verified' : 'pending';
      const target = layoutBox(piece, stageElement);
      const origin = source.getBoundingClientRect();
      const [x, y, width] = piece.dataset.originBox.split(',').map(Number);
      const lift = ease(raw);
      const dx = origin.left - stage.left + origin.width * x - target.x;
      const dy = origin.top - stage.top + origin.height * y - target.y;
      const scale = origin.width * width / target.width;
      piece.style.setProperty('--piece-x', `${dx * (1 - lift)}px`);
      piece.style.setProperty('--piece-y', `${dy * (1 - lift)}px`);
      piece.style.setProperty('--piece-z', `${Math.sin(lift * Math.PI) * 85}px`);
      piece.style.setProperty('--piece-scale', scale + (1 - scale) * lift);
      piece.style.setProperty('--piece-opacity', segment(progress, Number(piece.dataset.liftStart) - .04, Number(piece.dataset.liftStart)));
      piece.style.setProperty('--piece-shadow', `${lift * 36}px`);
      piece.style.setProperty('--verified-border', raw > .8 ? '#76e6be' : '#6685ad');
      piece.dataset.detached = raw.toFixed(3);
      if (x === 0 && y === 0 && width === 1) source.style.opacity = 1 - segment(raw, .1, .65);
    });
  }

  function update() {
    frame = 0;
    let active = 0;
    rooms.forEach((room, index) => {
      const rect = room.getBoundingClientRect();
      if (rect.top < innerHeight * .45) active = index;
      if (!motion.matches || rect.bottom < 0 || rect.top > innerHeight) return;
      const p = clamp((80 - rect.top) / Math.max(1, rect.height - innerHeight + 80));
      room.dataset.progress = p.toFixed(3);
      const push = ease(segment(p, .02, .38));
      const focus = ease(segment(p, .22, .42));
      room.style.setProperty('--camera-zoom', 1 + push * (room.id === 'schedule' ? 1.75 : .9));
      room.style.setProperty('--camera-pan', room.id === 'week' ? `${push * -14}%` : '0%');
      room.style.setProperty('--wide-opacity', 1 - focus);
      room.style.setProperty('--focus-opacity', focus);
      room.style.setProperty('--focus-zoom', 1.2 - focus * .2);
      room.style.setProperty('--plane-tilt', `${-7 + ease(segment(p, 0, .35)) * 7}deg`);
      room.style.setProperty('--patient-zoom', 1 + ease(segment(p, .22, .66)) * .55);
      room.style.setProperty('--patient-pan', `${ease(segment(p, .22, .66)) * -350}px`);
      room.style.setProperty('--close-opacity', ease(segment(p, .6, .78)));
      room.style.setProperty('--close-zoom', 1.25 - ease(segment(p, .6, .87)) * .25);
      room.style.setProperty('--stage-width', `${room.querySelector('.room-stage').clientWidth}px`);
      room.style.setProperty('--frame-width', `${100 - ease(segment(p, .42, .83)) * 45}%`);
      room.style.setProperty('--connector-opacity', segment(p, .5, .8));
      if (room.id === 'morning') {
        room.style.setProperty('--door-opacity', .2 + ease(segment(p, .18, .72)) * .8);
        room.style.setProperty('--door-scale', .83 + ease(segment(p, .18, .8)) * .2);
        room.style.setProperty('--door-tilt', `${-18 + ease(segment(p, .18, .8)) * 18}deg`);
        room.style.setProperty('--resolution-opacity', segment(p, .6, .85));
        room.querySelectorAll('.chaos-cloud span').forEach((pill, number) => {
          const release = ease(segment(p, .1 + number * .055, .52 + number * .055));
          const side = number % 2 ? 1 : -1;
          const stage = room.querySelector('.room-stage');
          const width = pill.offsetWidth, height = pill.offsetHeight;
          const angle = (6 * Math.PI) / 180;
          const boundWidth = width * Math.cos(angle) + height * Math.sin(angle);
          const boundHeight = height * Math.cos(angle) + width * Math.sin(angle);
          const starts = [[.12, .1], [.9, .3], [.16, .72], [.86, .92], [.5, .47]];
          const cx = starts[number][0] + (.5 - starts[number][0]) * release;
          const cy = starts[number][1] + (.5 - starts[number][1]) * release;
          const centerX = 24 + boundWidth / 2 + cx * Math.max(0, stage.clientWidth - 48 - boundWidth);
          const centerY = 24 + boundHeight / 2 + cy * Math.max(0, stage.clientHeight - 48 - boundHeight);
          pill.style.setProperty('--chaos-opacity', 1 - release);
          pill.style.setProperty('--chaos-x', `${centerX - width / 2}px`);
          pill.style.setProperty('--chaos-y', `${centerY - height / 2}px`);
          pill.style.setProperty('--chaos-scale', 1 - release * .15);
          pill.style.setProperty('--chaos-rotate', `${side * 6 * (1 - release)}deg`);
        });
      }
      if (room.id === 'schedule') {
        const verified = [...room.querySelectorAll('[data-lift-end]')].filter(piece => p >= Number(piece.dataset.liftEnd) - .03).length;
        room.querySelector('[data-verified-count]').textContent = verified;
      }
      detach(room, p);
    });
    if (active !== current) {
      current = active;
      links.forEach((link, index) => index === active ? link.setAttribute('aria-current', 'step') : link.removeAttribute('aria-current'));
    }
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  function reset() {
    document.documentElement.classList.toggle('tour-cinematic', motion.matches);
    if (!motion.matches) {
      rooms.forEach(room => room.removeAttribute('style'));
      pieces.forEach(piece => piece.removeAttribute('style'));
      document.querySelectorAll('.chaos-cloud span').forEach(pill => pill.removeAttribute('style'));
      document.querySelectorAll('[data-origin]').forEach(source => source.removeAttribute('style'));
      document.querySelector('[data-verified-count]').textContent = '3';
    }
    update();
  }
  document.documentElement.classList.add('js-motion');
  document.documentElement.classList.toggle('tour-cinematic', motion.matches);
  update();
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', reset, { passive: true });
  addEventListener('load', reset, { once: true });
  document.fonts.ready.then(reset);
  document.querySelectorAll('.room-stage img').forEach(img => img.addEventListener('load', reset, { once: true }));
  motion.addEventListener('change', reset);

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
    rooms[next].scrollIntoView({ behavior: reduce.matches || compact.matches ? 'instant' : 'smooth' });
    history.replaceState(null, '', links[next].hash);
  });

  const nav = document.querySelector('.header .nav');
  const toggle = document.querySelector('.mobile-toggle');
  nav.id = 'showroom-navigation';
  nav.setAttribute('aria-label', 'Main navigation');
  toggle.setAttribute('aria-controls', nav.id);
  toggle.setAttribute('aria-expanded', 'false');
  const dropdowns = [...nav.querySelectorAll('.has-dropdown')];
  function closeMenus(focus = false) {
    nav.classList.remove('active');
    toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    dropdowns.forEach(parent => {
      parent.classList.remove('is-open');
      parent.querySelector('.nav-link').setAttribute('aria-expanded', 'false');
    });
    if (focus) toggle.focus();
  }
  toggle.addEventListener('click', () => {
    const open = !nav.classList.contains('active');
    closeMenus();
    nav.classList.toggle('active', open);
    toggle.classList.toggle('active', open);
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
    if (open) nav.querySelector('.nav-link').focus();
  });
  dropdowns.forEach((parent, index) => {
    const trigger = parent.querySelector('.nav-link');
    const dropdown = parent.querySelector('.dropdown');
    dropdown.id ||= `showroom-dropdown-${index}`;
    trigger.setAttribute('aria-controls', dropdown.id);
    trigger.setAttribute('aria-expanded', 'false');
    trigger.addEventListener('click', event => {
      if (!compact.matches && trigger.tagName !== 'BUTTON') return;
      event.preventDefault();
      const open = !parent.classList.contains('is-open');
      dropdowns.forEach(other => {
        other.classList.toggle('is-open', other === parent && open);
        other.querySelector('.nav-link').setAttribute('aria-expanded', String(other === parent && open));
      });
    });
    parent.addEventListener('focusin', () => { if (!compact.matches) trigger.setAttribute('aria-expanded', 'true'); });
    parent.addEventListener('focusout', event => { if (!compact.matches && !parent.contains(event.relatedTarget)) trigger.setAttribute('aria-expanded', 'false'); });
    dropdown.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenus()));
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Tab' && nav.classList.contains('active')) {
      const focusable = [...nav.querySelectorAll('a,button'), toggle].filter(el => el.getBoundingClientRect().width && getComputedStyle(el).visibility !== 'hidden');
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    if (event.key !== 'Escape') return;
    if (nav.classList.contains('active')) closeMenus(true);
    else if (nav.contains(document.activeElement)) {
      const trigger = document.activeElement.closest('.has-dropdown')?.querySelector('.nav-link');
      closeMenus();
      trigger?.focus();
    }
  });
  compact.addEventListener('change', () => closeMenus());
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
