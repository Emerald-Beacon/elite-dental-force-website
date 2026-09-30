import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js';

const yieldTask = () => new Promise(resolve => setTimeout(resolve, 0));

export async function createLaptopScene({ canvas, textureUrl }) {
  // Inline procedural helpers keep all runtime library requests on cdnjs.
  class RoundedBoxGeometry extends THREE.ExtrudeGeometry {
    constructor(w, h, d, segments, radius) {
      const vertical = d < h;
      const a = w, b = vertical ? h : d, thickness = vertical ? d : h;
      const r = Math.min(radius, a / 4, b / 4);
      const shape = new THREE.Shape();
      shape.moveTo(-a / 2 + r, -b / 2);
      shape.lineTo(a / 2 - r, -b / 2);
      shape.quadraticCurveTo(a / 2, -b / 2, a / 2, -b / 2 + r);
      shape.lineTo(a / 2, b / 2 - r);
      shape.quadraticCurveTo(a / 2, b / 2, a / 2 - r, b / 2);
      shape.lineTo(-a / 2 + r, b / 2);
      shape.quadraticCurveTo(-a / 2, b / 2, -a / 2, b / 2 - r);
      shape.lineTo(-a / 2, -b / 2 + r);
      shape.quadraticCurveTo(-a / 2, -b / 2, -a / 2 + r, -b / 2);
      const bevel = Math.min(.006, thickness * .18);
      super(shape, { depth: thickness - 2 * bevel, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: bevel, bevelThickness: bevel, curveSegments: segments });
      this.translate(0, 0, -(thickness - 2 * bevel) / 2);
      if (!vertical) this.rotateX(-Math.PI / 2);
    }
  }
  class RoomEnvironment extends THREE.Scene {
    constructor() {
      super();
      const room = new THREE.Mesh(new THREE.BoxGeometry(20, 12, 20), new THREE.MeshStandardMaterial({ color: 0x505057, side: THREE.BackSide, roughness: 1 }));
      this.add(room);
      this.add(new THREE.PointLight(0xffffff, 70, 0, 2));
      for (const [x, y, z, w, h, d, strength] of [[-5, 3, 3, .1, 5, 8, 6], [4, 4, -3, .1, 3, 7, 4], [0, 5.5, 0, 8, .1, 4, 5], [0, 1, 8, 7, 2, .1, 2]]) {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color: new THREE.Color().setScalar(strength) }));
        panel.position.set(x, y, z);
        this.add(panel);
      }
    }
    dispose() { this.traverse(object => { object.geometry?.dispose(); object.material?.dispose(); }); }
  }
  const screenTexture = await new Promise((resolve, reject) => {
    const image = new Image();
    const timer = setTimeout(() => { image.src = ''; reject(new Error('Texture timeout')); }, 8000);
    image.onload = () => { clearTimeout(timer); resolve(new THREE.Texture(image)); };
    image.onerror = () => { clearTimeout(timer); reject(new Error('Texture unavailable')); };
    image.src = textureUrl;
  });
  screenTexture.needsUpdate = true;
  const mobile = false;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' }); }
  catch (error) { screenTexture.dispose(); throw error; }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  try {
    await yieldTask();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, .05, 100);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, .04);
    scene.environment = environment.texture;
    room.dispose();
    pmrem.dispose();
    await yieldTask();
    scene.add(new THREE.HemisphereLight(0xe5e7ef, 0x030139, .4));
    function light(color, intensity, x, y, z) {
      const source = new THREE.DirectionalLight(color, intensity);
      source.position.set(x, y, z);
      scene.add(source);
    }
    light(0xfff7eb, 2.8, -3, 6, 5);
    light(0x4ba8f0, 3.2, 4, 4, -3);
    light(0xd3edfc, .7, -5, 1, -2);

    const grainData = new Uint8Array(128 * 128 * 4);
    let seed = 47;
    for (let y = 0; y < 128; y++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const shade = 165 + (seed % 55);
      for (let x = 0; x < 128; x++) {
        const i = (y * 128 + x) * 4;
        grainData[i] = grainData[i + 1] = grainData[i + 2] = shade;
        grainData[i + 3] = 255;
      }
    }
    const grain = new THREE.DataTexture(grainData, 128, 128);
    grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
    grain.repeat.set(1, 5);
    grain.needsUpdate = true;
    const aluminum = new THREE.MeshPhysicalMaterial({ color: 0x585c65, metalness: .98, roughness: .36, bumpMap: mobile ? null : grain, bumpScale: .00009, clearcoat: mobile ? 0 : .12, clearcoatRoughness: .4, envMapIntensity: 1.1 });
    const edge = new THREE.MeshStandardMaterial({ color: 0x555a63, metalness: 1, roughness: .28 });
    const black = new THREE.MeshStandardMaterial({ color: 0x05070a, roughness: .53, metalness: .05 });
    const keyMaterial = new THREE.MeshStandardMaterial({ color: 0x14151a, metalness: .08, roughness: .57, bumpMap: mobile ? null : grain, bumpScale: .00007 });
    const laptop = new THREE.Group();
    scene.add(laptop);
    const layers = {};
    for (const name of ['base', 'deck', 'display', 'lid']) {
      layers[name] = new THREE.Group();
      layers[name].name = name;
      laptop.add(layers[name]);
    }
    function box(parent, w, h, d, radius, material, x = 0, y = 0, z = 0) {
      const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, mobile ? 2 : 3, radius), material);
      mesh.position.set(x, y, z);
      parent.add(mesh);
      return mesh;
    }
    box(layers.base, 3.34, .15, 2.22, .075, aluminum, 0, -.008);
    box(layers.deck, 3.23, .007, 2.1, .06, aluminum, 0, .068);
    box(layers.deck, 2.94, .009, 1.19, .035, black, 0, .073, -.32);
    await yieldTask();
    const rows = [
      ['esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', '●'],
      ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', ['delete', 1.7]],
      [['tab', 1.45], 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', ['\\', 1.25]],
      [['caps', 1.7], 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", ['return', 2]],
      [['shift', 2.1], 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', ['shift', 2.6]],
      ['fn', 'ctrl', 'alt', ['cmd', 1.3], ['', 5.4], ['cmd', 1.3], 'alt', '◀', '▲', '▶'],
    ];
    const keyGeometry = new RoundedBoxGeometry(1, .018, .16, 2, .055);
    const keyCount = rows.reduce((sum, row) => sum + row.length, 0);
    const keys = new THREE.InstancedMesh(keyGeometry, keyMaterial, keyCount);
    const legendCanvas = document.createElement('canvas');
    legendCanvas.width = 1536;
    legendCanvas.height = 640;
    const legendContext = legendCanvas.getContext('2d');
    legendContext.textAlign = 'center';
    legendContext.textBaseline = 'middle';
    legendContext.fillStyle = '#bac0c9';
    const transform = new THREE.Object3D();
    let keyIndex = 0;
    for (let row = 0; row < rows.length; row++) {
      const specs = rows[row].map(entry => Array.isArray(entry) ? entry : [entry, 1]);
      const unit = (2.8 - .022 * (specs.length - 1)) / specs.reduce((sum, item) => sum + item[1], 0);
      let x = -1.4;
      for (const [legend, units] of specs) {
        const w = unit * units;
        const z = -.805 + row * .19;
        transform.position.set(x + w / 2, .083, z);
        transform.scale.set(w, 1, row === 0 ? .67 : 1);
        transform.updateMatrix();
        keys.setMatrixAt(keyIndex++, transform.matrix);
        legendContext.font = `${legend.length > 1 ? 14 : 19}px sans-serif`;
        legendContext.fillText(legend, (x + w / 2 + 1.47) / 2.94 * 1536, (z + .915) / 1.19 * 640);
        x += w + .022;
      }
    }
    layers.deck.add(keys);
    const legendTexture = new THREE.CanvasTexture(legendCanvas);
    legendTexture.colorSpace = THREE.SRGBColorSpace;
    const legends = new THREE.Mesh(new THREE.PlaneGeometry(2.94, 1.19), new THREE.MeshBasicMaterial({ map: legendTexture, transparent: true, depthWrite: false }));
    legends.rotation.x = -Math.PI / 2;
    legends.position.set(0, .094, -.32);
    layers.deck.add(legends);
    await yieldTask();
    const trackpadMaterial = new THREE.MeshPhysicalMaterial({ color: 0x383b42, metalness: .35, roughness: .24, clearcoat: mobile ? 0 : .85, clearcoatRoughness: .12 });
    box(layers.deck, 1.29, .002, .64, .028, black, 0, .073, .67);
    box(layers.deck, 1.276, .002, .626, .024, trackpadMaterial, 0, .074, .67);
    box(layers.base, .012, .028, .15, .005, black, -1.673, .008, -.59);
    box(layers.base, .012, .028, .15, .005, black, -1.673, .008, -.31);
    const hinge = new THREE.Mesh(new THREE.CylinderGeometry(.028, .028, 2.7, 20), edge);
    hinge.rotation.z = Math.PI / 2;
    hinge.position.set(0, .075, -1.035);
    layers.base.add(hinge);
    // Both lid groups share a fixed open angle; separation changes only world Y.
    const lidAngle = -.16;
    const panelCenter = new THREE.Vector3(0, 1.024, -1.177);
    for (const [name, thickness, zOffset, material] of [['lid', .028, -.013, aluminum], ['display', .01, .008, black]]) {
      const mesh = box(layers[name], 3.31, 2.025, thickness, .055, material);
      mesh.position.copy(panelCenter);
      mesh.position.z += zOffset;
      mesh.rotation.x = lidAngle;
    }
    const emblemMaterial = new THREE.MeshPhysicalMaterial({ color: 0x777c84, metalness: 1, roughness: .28 });
    for (const side of [-1, 1]) {
      const emblem = new THREE.Group();
      const arc = new THREE.Mesh(new THREE.TorusGeometry(.135, .018, 6, 36, Math.PI * 1.72), emblemMaterial);
      arc.rotation.z = .05;
      emblem.add(arc);
      box(emblem, .255, .025, .006, .004, emblemMaterial, -.007, .008, .012);
      emblem.position.copy(panelCenter);
      emblem.position.z += side === -1 ? -.03 : .002;
      emblem.scale.z = .17;
      emblem.rotation.x = lidAngle;
      if (side === -1) emblem.rotation.y = Math.PI;
      layers.lid.add(emblem);
    }
    screenTexture.colorSpace = THREE.SRGBColorSpace;
    screenTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(3.10, 1.86), new THREE.MeshBasicMaterial({ map: screenTexture, toneMapped: false }));
    screen.position.copy(panelCenter);
    screen.position.z += .017;
    screen.rotation.x = lidAngle;
    layers.display.add(screen);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(3.15, 1.91), new THREE.MeshPhysicalMaterial({ color: 0xa6c8ed, metalness: .05, roughness: .12, transparent: true, opacity: .02, clearcoat: mobile ? 0 : 1, clearcoatRoughness: .08, depthWrite: false }));
    glass.position.copy(screen.position);
    glass.position.z += .002;
    glass.rotation.x = lidAngle;
    layers.display.add(glass);
    const webcam = new THREE.Mesh(new THREE.SphereGeometry(.012, 8, 6), black);
    webcam.position.set(0, 2.015, -1.286);
    layers.display.add(webcam);
    await yieldTask();
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = shadowCanvas.height = 128;
    const shadowContext = shadowCanvas.getContext('2d');
    const gradient = shadowContext.createRadialGradient(64, 64, 3, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(0,0,8,.55)');
    gradient.addColorStop(.5, 'rgba(0,0,8,.22)');
    gradient.addColorStop(1, 'rgba(0,0,8,0)');
    shadowContext.fillStyle = gradient;
    shadowContext.fillRect(0, 0, 128, 128);
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 3.8), new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false, opacity: .7 }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, -.25, .1);
    scene.add(shadow);

    const rest = { base: 0, deck: 0, display: 0, lid: 0, cx: 5.8, cy: 3.8, cz: 7.3, tx: 0, ty: .85, tz: 0, bank: 0 };
    const separated = { ...rest, deck: .8, display: 1.6, lid: 3.9, cx: 7.6, cy: 4.7, cz: 11.5, ty: 2.6 };
    const ar = { ...separated, cx: 2.4, cy: 3.7, cz: 6.8, tx: -.3, ty: 2.8, tz: -.7, bank: -.035 };
    const claims = { ...ar, cx: -2.6, cy: 3.6, cz: 6.6, tx: .3, ty: 2.6, bank: .03 };
    const eligibility = { ...ar, cx: 1.3, cy: 3.5, cz: 6.5, tx: -.35, ty: 2.85, tz: -.8, bank: -.025 };
    const tracked = { ...claims, cx: -1.8, cy: 3.2, cz: 6.8, ty: 2.65, tz: -.8, bank: .025 };
    const final = { ...rest, cx: 2.1, cy: 2.65, cz: 8.8, ty: .7 };
    const frames = [[0, rest], [.12, rest], [.28, separated], [.31, ar], [.37, ar], [.41, claims], [.47, claims], [.51, eligibility], [.57, eligibility], [.61, tracked], [.68, tracked], [.73, separated], [.88, final], [1, final]];
    const anchors = [[.884, .24], [.635, .779], [.487, .491], [.091, .667]];
    const layerBounds = Object.values(layers).map(layer => {
      const bounds = new THREE.Box3().setFromObject(layer);
      const corners = [];
      for (const x of [bounds.min.x, bounds.max.x])
        for (const y of [bounds.min.y, bounds.max.y])
          for (const z of [bounds.min.z, bounds.max.z]) corners.push(new THREE.Vector3(x, y, z));
      return { layer, corners };
    });
    let progress = 0, disposed = false, width = 1, height = 1;
    const point = new THREE.Vector3();
    const target = new THREE.Vector3();
    const fitPoint = new THREE.Vector3();
    const viewDirection = new THREE.Vector3();
    function render() {
      if (disposed || document.hidden) return;
      const upper = frames.findIndex(([p]) => p > progress);
      const [a, from] = frames[Math.max(0, upper < 0 ? frames.length - 1 : upper - 1)];
      const [b, to] = frames[upper < 0 ? frames.length - 1 : upper];
      const t = b === a ? 0 : THREE.MathUtils.smoothstep(progress, a, b);
      const state = {};
      for (const key in rest) state[key] = THREE.MathUtils.lerp(from[key], to[key], t);
      for (const key in layers) layers[key].position.y = state[key];
      target.set(state.tx, state.ty, state.tz);
      camera.position.set(state.cx, state.cy, state.cz).sub(target).multiplyScalar(.91).add(target);
      camera.up.set(Math.sin(state.bank), Math.cos(state.bank), 0);
      camera.lookAt(target);
      camera.updateMatrixWorld();
      scene.updateMatrixWorld(true);
      // Fit every rigid layer with 24px of breathing room, including between stops.
      const vertical = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const horizontal = vertical * camera.aspect;
      const safeX = Math.max(.1, 1 - 48 / width), safeY = Math.max(.1, 1 - 48 / height);
      let retreat = 0;
      for (const { layer, corners } of layerBounds) {
        for (const corner of corners) {
          fitPoint.copy(corner).applyMatrix4(layer.matrixWorld).applyMatrix4(camera.matrixWorldInverse);
          retreat = Math.max(retreat, Math.abs(fitPoint.x) / (horizontal * safeX) + fitPoint.z,
            Math.abs(fitPoint.y) / (vertical * safeY) + fitPoint.z, fitPoint.z + camera.near + .05);
        }
      }
      if (retreat > 0) {
        camera.getWorldDirection(viewDirection);
        camera.position.addScaledVector(viewDirection, -retreat);
        camera.updateMatrixWorld();
      }
      renderer.render(scene, camera);
      const index = progress >= .31 && progress < .68 ? Math.min(3, Math.floor((progress - .28) / .1)) : -1;
      let anchor = null;
      if (index >= 0) {
        const [u, v] = anchors[index];
        point.set((u - .5) * 3.1, (.5 - v) * 1.86, .003);
        screen.localToWorld(point);
        point.project(camera);
        anchor = { x: (point.x * .5 + .5) * width, y: (-point.y * .5 + .5) * height, visible: Math.abs(point.x) <= 1 && Math.abs(point.y) <= 1 && Math.abs(point.z) <= 1 };
      }
      canvas.dataset.progress = progress.toFixed(5);
      canvas.dataset.layers = JSON.stringify(Object.values(layers).map(layer => layer.position.toArray()));
      canvas.dataset.camera = camera.position.toArray().join(',');
      canvas.dataset.triangles = renderer.info.render.triangles;
      canvas.dataset.drawCalls = renderer.info.render.calls;
      canvas.dataset.frames = String(Number(canvas.dataset.frames || 0) + 1);
      canvas.dispatchEvent(new CustomEvent('laptopframe', { detail: { progress, index, anchor } }));
    }
    function setProgress(p) {
      if (!Number.isFinite(p)) return;
      progress = THREE.MathUtils.clamp(p, 0, 1);
      render();
    }
    function resize() {
      if (disposed) return;
      width = Math.max(1, canvas.clientWidth);
      height = Math.max(1, canvas.clientHeight);
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      render();
    }
    function dispose() {
      if (disposed) return;
      disposed = true;
      const geometries = new Set(), materials = new Set();
      scene.traverse(object => {
        if (object.geometry) geometries.add(object.geometry);
        for (const material of [object.material].flat()) if (material) materials.add(material);
        if (object.isInstancedMesh) object.dispose();
      });
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      for (const texture of [screenTexture, grain, legendTexture, shadowTexture]) texture.dispose();
      environment.dispose();
      scene.environment = null;
      renderer.dispose();
      renderer.forceContextLoss();
    }
    await yieldTask();
    await renderer.compileAsync(scene, camera);
    await yieldTask();
    resize();
    await yieldTask();
    return { setProgress, resize, dispose };
  } catch (error) {
    screenTexture.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    throw error;
  }
}

const libraryLoads = new Map();
const gsapUrl = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js';
const triggerUrl = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/ScrollTrigger.min.js';
let runtime;

function loadScript(url, global) {
  if (window[global]) return Promise.resolve();
  if (libraryLoads.has(url)) return libraryLoads.get(url);
  const promise = new Promise((resolve, reject) => {
    const existing = [...document.scripts].find(script => script.src === url);
    const script = existing || document.createElement('script');
    const finish = error => {
      clearTimeout(timer);
      script.removeEventListener('load', loaded);
      script.removeEventListener('error', failed);
      if (error) { if (!existing) script.remove(); reject(error); }
      else resolve();
    };
    const loaded = () => finish(window[global] ? null : new Error('Library unavailable'));
    const failed = () => finish(new Error('Library unavailable'));
    const timer = setTimeout(() => finish(new Error('Library timeout')), 8000);
    script.addEventListener('load', loaded);
    script.addEventListener('error', failed);
    if (!existing) { script.src = url; document.head.append(script); }
  });
  libraryLoads.set(url, promise);
  promise.catch(() => libraryLoads.delete(url));
  return promise;
}

async function acquireRuntime() {
  if (!runtime) runtime = { users: 0, active: false, ownGsap: !window.gsap && ![...document.scripts].some(script => script.src === gsapUrl),
    ownTrigger: !window.ScrollTrigger && ![...document.scripts].some(script => script.src === triggerUrl), cleanups: [] };
  const shared = runtime;
  shared.users++;
  const release = () => {
    if (--shared.users || !shared.active) return;
    const { gsap, ScrollTrigger } = window;
    // ScrollTrigger keeps two passive wheel listeners (its scroll tween guard) that no public API removes;
    // they are created once per page and do not grow with mount cycles.
    // Never stop a preexisting plugin or another feature's triggers/ticker work.
    if (shared.ownTrigger && ScrollTrigger.getAll().length === 0) {
      ScrollTrigger.disable(true);
      shared.cleanups.splice(0).reverse().forEach(cleanup => cleanup());
      shared.active = false;
      if (shared.ownGsap && gsap.globalTimeline.getChildren().length === 0 &&
          gsap.ticker._listeners.every(listener => listener === gsap.updateRoot)) gsap.ticker.sleep();
    }
  };
  try {
    await loadScript(gsapUrl, 'gsap');
    if (!shared.active) {
      if (!shared.loading) shared.loading = (async () => {
        const { gsap } = window;
        const originalMedia = gsap.matchMedia, originalEvent = gsap.addEventListener, originalDelay = gsap.delayedCall;
        let enabling = false;
        const owned = () => shared.ownTrigger && (enabling || document.currentScript?.src === triggerUrl);
        // 3.13 enable() adds orientation media, GSAP hooks and delayed calls without
        // returning cleanup handles. Capture only registrations made by this plugin.
        gsap.matchMedia = function (...args) {
          if (!owned()) return originalMedia.apply(this, args);
          return { add(query, setup) {
            const media = matchMedia(query);
            let undo;
            const update = () => { undo?.(); undo = media.matches ? setup() : undefined; };
            media.addEventListener('change', update);
            update();
            shared.cleanups.push(() => { media.removeEventListener('change', update); undo?.(); });
            return this;
          } };
        };
        gsap.addEventListener = function (name, callback) {
          if (owned()) shared.cleanups.push(() => gsap.removeEventListener(name, callback));
          return originalEvent.call(this, name, callback);
        };
        gsap.delayedCall = function (...args) {
          const tween = originalDelay.apply(this, args);
          if (owned()) shared.cleanups.push(() => tween.kill());
          return tween;
        };
        try {
          if (!window.ScrollTrigger) await loadScript(triggerUrl, 'ScrollTrigger');
          else if (shared.ownTrigger) { enabling = true; window.ScrollTrigger.enable(); }
          shared.active = true;
        } finally {
          gsap.matchMedia = originalMedia;
          gsap.addEventListener = originalEvent;
          gsap.delayedCall = originalDelay;
        }
      })().finally(() => { shared.loading = null; });
      await shared.loading;
    }
    return release;
  } catch (error) { release(); throw error; }
}

export async function mountHeroMotion(hero, eligible, atTop) {
  const canvas = hero.querySelector('.hero-laptop');
  const visual = hero.querySelector('.hero-visual');
  const stage = hero.querySelector('.hero-stage');
  const header = document.querySelector('.header');
  const skip = hero.querySelector('.hero-skip');
  const badges = [...hero.querySelectorAll('.hero-stat-badge')];
  const leader = hero.querySelector('.hero-leader');
  const path = leader.querySelector('path'), dot = leader.querySelector('circle');
  let scene, trigger, timeline, pinRefresh, observer, releaseRuntime, stopped = false;
  let reveal = [], pendingFocus, badgeOrigin;
  const heroFocus = () => {
    const active = document.activeElement;
    return active && active !== document.body && hero.contains(active) ? active : null;
  };
  // Rebuilding or removing the pin reparents the stage, which drops keyboard focus; put it back
  // on the same control (or its nearest visible sibling) without moving the page.
  function refocus(element) {
    if (!element?.isConnected) return null;
    const target = element === skip && skip.hidden ? [...hero.querySelectorAll('.hero-actions a')].at(-1) : element;
    if (document.activeElement !== target) target.focus({ preventScroll: true });
    return target;
  }
  function scrollIntoReach(target) {
    const top = header.offsetHeight + 12, box = target.getBoundingClientRect();
    const overflow = box.top < top ? box.top - top : box.bottom > innerHeight - 12 ? box.bottom - innerHeight + 12 : 0;
    if (overflow) scrollTo({ top: scrollY + overflow, behavior: 'instant' });
  }
  // Unpinned poster: geometry is final, so correct the scroll right away.
  const revealFocus = element => { const target = refocus(element); if (target) scrollIntoReach(target); };
  // Active pin: the pin restores its own scroll and progress, and mid rebuild rectangles are transient.
  // Scroll only if the control is still out of view once the geometry has settled.
  function settleFocus(element) {
    const target = refocus(element);
    if (target) requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!stopped && !resizing && target.isConnected) scrollIntoReach(target);
    }));
  }
  let resizing = false;
  let visible = true, lastProgress = 0, slowFrames = 0;
  const listeners = new AbortController();
  const options = { signal: listeners.signal };
  const scrollStyle = document.documentElement.style.scrollBehavior;
  const killPin = () => {
    // Timeline pins schedule an initial delayed update that trigger.kill() leaves alive.
    if (pinRefresh) window.gsap.killTweensOf(pinRefresh);
    trigger?.kill(true);
    timeline?.kill();
  };
  function restore(reason = 'fallback', toPoster = false) {
    if (stopped) return;
    stopped = true;
    const focused = pendingFocus || heroFocus();
    pendingFocus = null;
    const distance = trigger ? Math.max(0, Math.min(scrollY - trigger.start, trigger.end - trigger.start)) : 0;
    listeners.abort();
    observer?.disconnect();
    reveal.forEach(animation => animation.cancel());
    killPin();
    scene?.dispose();
    releaseRuntime?.();
    document.documentElement.style.scrollBehavior = scrollStyle;
    if (!scene) (canvas.getContext('webgl2') || canvas.getContext('webgl'))?.getExtension('WEBGL_lose_context')?.loseContext();
    hero.classList.remove('motion-ready', 'motion-separating');
    hero.style.removeProperty('--motion-top');
    hero.style.removeProperty('--motion-bottom');
    hero.dataset.motion = reason;
    skip.hidden = true;
    leader.style.visibility = '';
    for (const badge of badges) badge.removeAttribute('style');
    if (toPoster && trigger) scrollTo({ top: Math.max(0, visual.getBoundingClientRect().top + scrollY - header.offsetHeight - 12), behavior: 'instant' });
    else if (distance) scrollTo({ top: Math.max(0, scrollY - distance), behavior: 'instant' });
    if (reason !== 'skipped') revealFocus(focused);
  }
  function update({ detail: { progress, index, anchor } }) {
    hero.dataset.progress = progress.toFixed(5);
    const hold = progress < .28 || progress >= .88;
    hero.classList.toggle('motion-separating', progress >= .12 && progress < .28);
    for (const [i, badge] of badges.entries()) {
      badge.style.visibility = hold ? (i < 2 ? 'visible' : 'hidden') : (i === index ? 'visible' : 'hidden');
      badge.style.transform = '';
      badge.style.left = badge.style.right = badge.style.top = badge.style.bottom = '';
    }
    leader.style.visibility = index < 0 || !anchor?.visible ? 'hidden' : 'visible';
    if (index < 0) return;
    const badge = badges[index];
    const x = Math.max(12, Math.min(visual.clientWidth - badge.offsetWidth - 12, index % 2 ? visual.clientWidth - badge.offsetWidth - 16 : 16));
    const y = Math.max(12, Math.min(visual.clientHeight - badge.offsetHeight - 12, 28));
    Object.assign(badge.style, { left: '0', right: 'auto', top: '0', bottom: 'auto', transform: `translate(${x}px,${y}px)` });
    const lineX = x + badge.offsetWidth / 2, lineY = y + badge.offsetHeight + 6;
    path.setAttribute('d', `M${lineX},${lineY} V${lineY + 12} L${anchor.x},${anchor.y}`);
    dot.setAttribute('cx', anchor.x);
    dot.setAttribute('cy', anchor.y);
  }
  const draw = p => {
    if (resizing) return;
    lastProgress = p;
    if (!visible || document.hidden || stopped) return;
    const start = performance.now();
    try { scene.setProgress(p); }
    catch { return restore(); }
    slowFrames = performance.now() - start > 50 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
    if (slowFrames >= 30) restore('slow-renderer');
  };
  try {
    document.documentElement.style.scrollBehavior = 'auto';
    releaseRuntime = await acquireRuntime();
    if (!eligible() || !atTop()) return restore();
    if (stage.offsetHeight > innerHeight - header.offsetHeight - 24) return restore('short-viewport');
    canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); restore(); }, options);
    scene = await createLaptopScene({ canvas, textureUrl: 'images/motion/edifi-dashboard-v1.webp' });
    if (stopped || !eligible() || !atTop()) { scene.dispose(); return restore(); }
    const { gsap, ScrollTrigger } = window;
    const measurePadding = () => {
      badgeOrigin ||= badges.slice(0, 2).map(badge => badge.getBoundingClientRect());
      hero.classList.remove('motion-ready');
      hero.style.removeProperty('--motion-top');
      hero.style.removeProperty('--motion-bottom');
      const heroBounds = hero.getBoundingClientRect(), stageBounds = stage.getBoundingClientRect();
      hero.style.setProperty('--motion-top', `${stageBounds.top - heroBounds.top}px`);
      hero.style.setProperty('--motion-bottom', `${heroBounds.bottom - stageBounds.bottom}px`);
      hero.classList.add('motion-ready');
    };
    const mountFocus = heroFocus();
    measurePadding();
    const createPin = () => {
      const state = { p: 0 };
      timeline = gsap.timeline({ paused: true }).to(state, { p: 1, duration: 1, ease: 'none', onUpdate: () => draw(state.p) });
      trigger = ScrollTrigger.create({ trigger: hero, pin: stage, pinSpacing: true,
        start: () => hero.getBoundingClientRect().top + scrollY + parseFloat(hero.style.getPropertyValue('--motion-top')) - header.offsetHeight - 12,
        end: () => `+=${innerHeight * 1.8}`, animation: timeline, scrub: .5 });
      pinRefresh = trigger.update;
    };
    createPin();
    canvas.addEventListener('laptopframe', update, options);
    hero.dataset.motion = 'ready';
    skip.hidden = false;
    scene.setProgress(0);
    ScrollTrigger.refresh();
    settleFocus(mountFocus);
    // Scripted animations survive ScrollTrigger reparenting the stage during refresh.
    // The poster and first 3D frame differ in silhouette (measured overlap 0.44, best camera only 0.68),
    // so the window where both are visible is kept to 200ms; the badges ease over their own 650ms.
    const fade = { duration: 200, easing: 'ease-in-out' };
    const glide = { duration: 650, easing: 'ease-in-out' };
    reveal = [canvas.animate({ opacity: [0, 1] }, fade),
      hero.querySelector('.product-visual img').animate({ opacity: [1, 0] }, fade)];
    // The ready class changes the badge offsets; start each badge exactly where the poster state
    // left it and ease to the new offset (transform only).
    badges.slice(0, 2).forEach((badge, i) => {
      const now = badge.getBoundingClientRect(), dx = badgeOrigin[i].left - now.left, dy = badgeOrigin[i].top - now.top;
      if (Math.hypot(dx, dy) > .5) reveal.push(badge.animate({ transform: [`translate(${dx}px,${dy}px)`, 'translate(0px,0px)'] }, glide));
    });
    const resize = () => {
      if (stopped || resizing) return;
      if (!eligible()) return restore('fallback', true);
      const progress = lastProgress;
      pendingFocus = heroFocus();
      const beforePin = Math.max(0, trigger.start - scrollY), afterPin = Math.max(0, scrollY - trigger.end);
      resizing = true;
      try {
        killPin();
        scrollTo({ top: 0, behavior: 'instant' });
        measurePadding();
        if (stage.offsetHeight > innerHeight - header.offsetHeight - 24) return restore('short-viewport', true);
        scene.resize();
        createPin();
        ScrollTrigger.refresh();
        const position = afterPin ? trigger.end + afterPin : beforePin ? Math.max(0, trigger.start - beforePin) : trigger.start + progress * (trigger.end - trigger.start);
        scrollTo({ top: position, behavior: 'instant' });
        trigger.update();
        trigger.getTween()?.pause();
        timeline.progress(progress);
        settleFocus(pendingFocus);
        pendingFocus = null;
      } catch { restore('fallback', true); }
      finally { resizing = false; pendingFocus = null; if (!stopped) draw(progress); }
    };
    addEventListener('resize', resize, { ...options, capture: true });
    const media = matchMedia('(min-width: 1025px) and (min-height: 760px) and (prefers-reduced-motion: no-preference)');
    media.addEventListener('change', () => { if (!eligible()) restore('fallback', true); }, options);
    navigator.connection?.addEventListener('change', () => { if (!eligible()) restore(); }, options);
    addEventListener('offline', () => restore(), options);
    addEventListener('pagehide', () => restore(), options);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) draw(lastProgress); }, options);
    observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible && !stopped) { scene.resize(); draw(lastProgress); } });
    observer.observe(stage);
    skip.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      restore('skipped');
      const destination = document.querySelector('#after-hero');
      destination.focus({ preventScroll: true });
      scrollTo({ top: destination.getBoundingClientRect().top + scrollY - header.offsetHeight, behavior: 'instant' });
    }, { ...options, capture: true });
  } catch { restore(); }
}
