import { createServer } from 'node:http';
import { readFile, stat, mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/elite/Desktop/edifi-demo-video/node_modules/playwright');
const root = resolve(import.meta.dirname, '../..');
const output = resolve(root, 'design/showroom');
const assets = JSON.parse(await readFile(resolve(output, 'asset-manifest.json'), 'utf8'));
await mkdir(resolve(output, 'shots'), { recursive: true });
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp4': 'video/mp4' };
const server = createServer(async (req, res) => {
  try {
    const path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (!path.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    const data = await readFile(path);
    const headers = { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-store' };
    const range = req.headers.range?.match(/bytes=(\d+)-(\d*)/);
    if (range) {
      const start = Number(range[1]), end = range[2] ? Math.min(Number(range[2]), data.length - 1) : data.length - 1;
      res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${data.length}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 }).end(data.subarray(start, end + 1));
    } else res.writeHead(200, { ...headers, 'Content-Length': data.length }).end(data);
  } catch { res.writeHead(404).end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;
const profile = await mkdtemp(resolve(tmpdir(), 'edf-showroom-qa-'));
const report = { date: new Date().toISOString(), directory: root, command: 'node design/showroom/verify.mjs', browser: 'Playwright Chromium, headless, fresh temporary user data directory', profile, labOnly: true, scenarios: [], lighthouse: { available: existsSync('C:/Users/elite/Desktop/edifi-demo-video/node_modules/lighthouse'), run: false } };
report.sha256 = Object.fromEntries(await Promise.all(['pages/showroom.html', 'css/showroom.css', 'js/showroom.js', 'media/showroom/tour.mp4'].map(async path => [path, createHash('sha256').update(await readFile(resolve(root, path))).digest('hex')])));
let context;
try {
  context = await chromium.launchPersistentContext(profile, { headless: true, viewport: { width: 1440, height: 1000 } });
  for (const scenario of [{ width: 1440, height: 900, js: true, reduce: false }, { width: 390, height: 844, js: true, reduce: false }, { width: 1440, height: 650, js: true, reduce: false }, { width: 1440, height: 900, js: true, reduce: true }, { width: 390, height: 844, js: true, reduce: true }, { width: 1440, height: 900, js: false, reduce: false }, { width: 390, height: 844, js: false, reduce: false }]) {
    const page = await context.newPage();
    const result = { ...scenario, errors: [], httpErrors: [], failedRequests: [], externalRequests: [], videoRequestsBeforeOpen: 0, rooms: [] };
    let opened = false;
    const requests = [];
    page.on('console', message => { if (message.type() === 'error') result.errors.push(message.text()); });
    page.on('pageerror', error => result.errors.push(error.message));
    page.on('requestfailed', request => result.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
    page.on('response', response => { if (response.status() >= 400) result.httpErrors.push({ url: response.url(), status: response.status() }); });
    page.on('request', request => { requests.push(request.url()); if (/\.mp4(?:\?|$)/.test(request.url()) && !opened) result.videoRequestsBeforeOpen++; });
    await page.route('**/*', route => { const url = route.request().url(); if (url.startsWith(origin) || url.startsWith('data:')) return route.continue(); result.externalRequests.push(url); return route.abort(); });
    await page.setViewportSize({ width: scenario.width, height: scenario.height });
    await page.emulateMedia({ reducedMotion: scenario.reduce ? 'reduce' : 'no-preference' });
    const cdp = await context.newCDPSession(page);
    if (!scenario.js) await cdp.send('Emulation.setScriptExecutionDisabled', { value: true });
    await page.addInitScript(() => {
      window.__qa = { shifts: [], longTasks: [] };
      new PerformanceObserver(list => list.getEntries().forEach(e => { if (!e.hadRecentInput) window.__qa.shifts.push({ value: e.value, time: e.startTime }); })).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver(list => list.getEntries().forEach(e => window.__qa.longTasks.push({ duration: e.duration, time: e.startTime }))).observe({ type: 'longtask', buffered: true });
    });
    await page.goto(`${origin}/pages/showroom.html`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const roomSelector = '.tour-room';
    const rooms = page.locator(roomSelector);
    const count = await rooms.count();
    if (count !== 7) throw new Error(`Expected seven ${roomSelector} rooms; found ${count}`);
    result.initialVideoRequests = result.videoRequestsBeforeOpen;
    for (let i = 0; i < count; i++) {
      await rooms.nth(i).evaluate(el => window.scrollTo({ top: el.offsetTop + Math.max(0, (el.offsetHeight - innerHeight) / 2), behavior: 'instant' }));
      await page.waitForTimeout(220);
      await rooms.nth(i).locator('img').evaluateAll(images => Promise.all(images.map(img => img.decode().catch(() => {}))));
      const room = await rooms.nth(i).evaluate(el => ({ id: el.id, heading: el.querySelector('h1,h2')?.textContent.trim(), background: getComputedStyle(el).backgroundColor, position: getComputedStyle(el.firstElementChild).position, text: el.innerText, overflow: document.documentElement.scrollWidth > innerWidth, images: [...el.querySelectorAll('img')].map(img => ({ src: img.getAttribute('src'), currentSrc: img.currentSrc, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight, boxWidth: img.clientWidth, boxHeight: img.clientHeight, complete: img.complete, visible: !!img.getClientRects().length })) }));
      const suffix = scenario.js ? (scenario.reduce ? '-reduced' : '') : '-nojs';
      room.readability = await rooms.nth(i).evaluate(el => ({ hiddenCopy: [...el.querySelectorAll('.room-copy h1,.room-copy h2,.room-copy p')].filter(node => { let check = node; while (check && check !== document.body) { const style = getComputedStyle(check); if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return true; check = check.parentElement; } return false; }).map(node => node.textContent), sticky: getComputedStyle(el.querySelector('.room-inner')).position === 'sticky' }));
      if (!suffix) await page.screenshot({ path: resolve(output, `shots/${scenario.width}${scenario.height === 650 ? '-short' : ''}-${String(i + 1).padStart(2, '0')}-${room.id}.png`) });
      result.rooms.push(room);
    }
    result.bodyBackground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    result.visibleCopy = await page.locator('body').innerText();
    result.copyViolations = { dashes: result.visibleCopy.match(/[\u2013\u2014]|\b\w+-\w+\b/g) || [], prohibited: result.visibleCopy.match(/call insurance|ask caller|writes? back|write to open dental|pinboard/gi) || [], prices: result.visibleCopy.match(/\$\s*\d|\b\d+\s*\/\s*month\b/gi) || [] };
    result.uniqueLocalResources = [...new Set(requests.filter(url => url.startsWith(origin) && !/\.mp4(?:\?|$)/.test(url)))].map(url => new URL(url).pathname);
    result.resourceBytesExcludingVideo = (await Promise.all(result.uniqueLocalResources.map(async path => (await stat(resolve(root, '.' + path)).catch(() => ({size: 0}))).size))).reduce((a, b) => a + b, 0);
    result.measuredTransferBytesExcludingVideo = await page.evaluate(() => [...performance.getEntriesByType('navigation'), ...performance.getEntriesByType('resource')].filter(entry => !/\.mp4(?:\?|$)/.test(entry.name)).reduce((sum, entry) => sum + entry.transferSize, 0));
    result.imageSizingViolations = result.rooms.flatMap(room => room.images.flatMap(img => {
      const path = img.currentSrc ? new URL(img.currentSrc).pathname.slice(1) : '';
      const asset = assets.find(entry => entry.file === path);
      if (asset && img.visible && img.boxWidth && (asset.width > img.boxWidth * 2 + 2 || asset.height > img.boxHeight * 2 + 2)) return [{ room: room.id, ...img, fileWidth: asset.width, fileHeight: asset.height }];
      return [];
    }));
    if (scenario.js) {
      result.performance = await page.evaluate(async () => {
        const gaps = [];
        let previous;
        await new Promise(done => {
          let frame = 0;
          const end = document.documentElement.scrollHeight - innerHeight;
          const tick = time => { if (previous) gaps.push(time - previous); previous = time; window.scrollTo({ top: end * (frame / 180), behavior: 'instant' }); if (++frame <= 180) requestAnimationFrame(tick); else done(); };
          requestAnimationFrame(tick);
        });
        const sorted = [...gaps].sort((a, b) => a - b);
        return { cls: window.__qa.shifts.reduce((sum, e) => sum + e.value, 0), shifts: window.__qa.shifts, longTasks: window.__qa.longTasks, scrollFrameMedianMs: sorted[Math.floor(sorted.length / 2)], scrollFrameP95Ms: sorted[Math.floor(sorted.length * .95)], scrollFrameMaxMs: Math.max(...gaps), framesOver50ms: gaps.filter(gap => gap > 50).length };
      });
    }
    if (scenario.js && !scenario.reduce && scenario.width === 1440) {
      result.metadata = await page.evaluate(() => ({ title: document.title, description: document.querySelector('meta[name="description"]')?.content, canonical: document.querySelector('link[rel="canonical"]')?.href, og: document.querySelector('meta[property="og:image"]')?.content }));
      const rail = page.locator('.tour-rail a');
      result.keyboard = { railCount: await rail.count() };
      if (await rail.count()) {
        await rail.nth(2).focus();
        await page.keyboard.press('Enter');
        await page.waitForTimeout(800);
        result.keyboard.activatedHash = new URL(page.url()).hash;
        result.keyboard.focusAfterRail = await page.evaluate(() => ({ tag: document.activeElement.tagName, id: document.activeElement.id, text: document.activeElement.textContent.trim().slice(0, 100) }));
        await rail.nth(2).focus();
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(800);
        result.keyboard.arrowNext = await rail.nth(3).evaluate(el => document.activeElement === el);
        result.keyboard.arrowHash = new URL(page.url()).hash;
        await page.keyboard.press('Home');
        result.keyboard.home = await rail.first().evaluate(el => document.activeElement === el);
        await page.keyboard.press('End');
        result.keyboard.end = await rail.last().evaluate(el => document.activeElement === el);
      }
      const trigger = page.locator('[data-watch]');
      if (await trigger.count()) {
        await trigger.first().focus();
        opened = true;
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
        result.dialog = await page.evaluate(() => ({ open: !!document.querySelector('dialog[open]'), focusInside: document.activeElement.closest('dialog') !== null, preload: document.querySelector('video')?.preload }));
        await page.locator('video').evaluate(async video => { await video.play(); });
        await page.waitForTimeout(800);
        result.dialog.playback = await page.locator('video').evaluate(video => ({ width: video.videoWidth, height: video.videoHeight, duration: video.duration, currentTime: video.currentTime, error: video.error?.message || null, playing: !video.paused }));
        result.dialog.backgroundFocusBlocked = await page.evaluate(() => { document.querySelector('.tour-header a').focus(); return document.activeElement.closest('dialog') !== null; });
        result.dialog.tabFocus = [];
        for (let n = 0; n < 5; n++) { await page.keyboard.press('Tab'); result.dialog.tabFocus.push(await page.evaluate(() => ({ tag: document.activeElement.tagName, inside: document.activeElement.closest('dialog') !== null, backgroundControl: !!document.activeElement.closest('header,main,nav,footer') }))); }
        await page.keyboard.press('Escape');
        result.dialog.escapeClosed = await page.locator('dialog[open]').count() === 0;
        result.dialog.focusRestored = await trigger.first().evaluate(el => document.activeElement === el);
      }
    }
    if (!scenario.js || scenario.reduce) await page.screenshot({ path: resolve(output, `shots/${scenario.width}-${scenario.js ? 'reduced' : 'nojs'}-last-room.png`) });
    delete result.visibleCopy;
    report.scenarios.push(result);
    await page.close();
  }
  report.entryLinkSmoke = [];
  for (const path of ['/index.html', '/pages/platform.html']) for (const width of [1440, 390]) {
    const page = await context.newPage();
    const externalBlocked = [];
    await page.route('**/*', route => { const url = route.request().url(); if (url.startsWith(origin) || url.startsWith('data:')) return route.continue(); externalBlocked.push(url); return route.abort(); });
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.goto(origin + path, { waitUntil: 'networkidle' });
    const link = page.getByRole('link', { name: 'Take the tour', exact: true });
    const bounds = await link.boundingBox();
    report.entryLinkSmoke.push({ path, width, count: await link.count(), visible: await link.isVisible(), bounds, horizontalOverflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), externalRequestsBlocked: externalBlocked.length });
    await page.screenshot({ path: resolve(output, `shots/${width}-${path.includes('platform') ? 'platform' : 'home'}-entry.png`) });
    await page.close();
  }
  const assetManifest = JSON.parse(await readFile(resolve(output, 'asset-manifest.json'), 'utf8'));
  report.newImageBytes = assetManifest.reduce((sum, entry) => sum + entry.bytes, 0);
  const imageFiles = new Set(assetManifest.map(entry => '/' + entry.file.replaceAll('\\', '/')));
  const sharedAndDocumentPaths = [...new Set(report.scenarios.flatMap(s => s.uniqueLocalResources))].filter(path => !imageFiles.has(path));
  report.conservativeBytesExcludingVideo = report.newImageBytes + (await Promise.all(sharedAndDocumentPaths.map(async path => (await stat(resolve(root, '.' + path))).size))).reduce((sum, n) => sum + n, 0);
  report.failures = [];
  for (const s of report.scenarios) {
    const label = `${s.width}x${s.height} js=${s.js} reduced=${s.reduce}`;
    if (s.errors.length || s.httpErrors.length || s.failedRequests.length || s.externalRequests.length) report.failures.push(`${label}: network/runtime errors`);
    if (s.rooms.some(r => r.overflow || r.readability.hiddenCopy.length)) report.failures.push(`${label}: overflow or hidden copy`);
    if (s.videoRequestsBeforeOpen) report.failures.push(`${label}: eager video request`);
    if (s.performance?.cls >= .05) report.failures.push(`${label}: CLS threshold`);
    if (Object.values(s.copyViolations).some(values => values.length)) report.failures.push(`${label}: prohibited copy`);
    if (s.imageSizingViolations?.length) report.failures.push(`${label}: image sizing`);
    if (s.dialog && (!s.dialog.open || !s.dialog.backgroundFocusBlocked || !s.dialog.escapeClosed || !s.dialog.focusRestored || !s.dialog.playback.playing || s.dialog.tabFocus.some(f => f.backgroundControl))) report.failures.push(`${label}: dialog interaction`);
    if (s.keyboard && (!s.keyboard.arrowNext || !s.keyboard.home || !s.keyboard.end || s.keyboard.activatedHash !== '#patient')) report.failures.push(`${label}: keyboard rail`);
  }
  if (report.conservativeBytesExcludingVideo >= 6000000) report.failures.push('Page weight exceeds six megabytes');
  if (report.entryLinkSmoke.some(s => s.count !== 1 || !s.visible || s.horizontalOverflow || s.bounds.x < 0 || s.bounds.x + s.bounds.width > s.width)) report.failures.push('Entry link layout');
  if (report.failures.length) process.exitCode = 1;
} catch (error) { report.fatal = error.stack; process.exitCode = 1; }
finally { if (context) await context.close(); await new Promise(done => server.close(done)); await writeFile(resolve(output, 'verification.json'), JSON.stringify(report, null, 2)); }
console.log(JSON.stringify({ fatal: report.fatal, failures: report.failures, conservativeBytesExcludingVideo: report.conservativeBytesExcludingVideo, entryLinkSmoke: report.entryLinkSmoke, scenarios: report.scenarios.map(s => ({ width: s.width, height: s.height, js: s.js, reduce: s.reduce, errors: s.errors.length, httpErrors: s.httpErrors.length, overflow: s.rooms.some(r => r.overflow), cls: s.performance?.cls, bytes: s.resourceBytesExcludingVideo, videoRequestsBeforeOpen: s.videoRequestsBeforeOpen, copyViolations: s.copyViolations, keyboard: s.keyboard, dialog: s.dialog })) }, null, 2));
