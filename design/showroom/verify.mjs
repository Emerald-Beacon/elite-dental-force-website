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
const manifestPaths = ['asset-manifest.json', 'round2-asset-manifest.json'].filter(path => existsSync(resolve(output,path)));
const assets = [...new Map((await Promise.all(manifestPaths.map(async path => JSON.parse(await readFile(resolve(output,path),'utf8'))))).flat().map(entry => [entry.file,entry])).values()];
await mkdir(resolve(output, 'shots'), { recursive: true });
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp4': 'video/mp4' };
const server = createServer(async (req, res) => {
  try {
    let requested = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (requested.endsWith('/')) requested += 'index.html';
    const path = resolve(root, '.' + requested);
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
if (existsSync(resolve(output,'navigation-equivalence.json'))) report.navigationEquivalence = JSON.parse(await readFile(resolve(output,'navigation-equivalence.json'),'utf8'));
report.sha256 = Object.fromEntries(await Promise.all(['pages/showroom.html', 'css/showroom.css', 'js/showroom.js', 'media/showroom/tour.mp4'].map(async path => [path, createHash('sha256').update(await readFile(resolve(root, path))).digest('hex')])));
report.assetSha256 = Object.fromEntries(await Promise.all(assets.map(async asset => [asset.file, createHash('sha256').update(await readFile(resolve(root,asset.file))).digest('hex')])));
let context;
async function motionSample(page, id, progress, settleMs = 350) {
  const room = page.locator(`#${id}`);
  await room.evaluate((el, p) => {
    const top = parseFloat(getComputedStyle(el.querySelector('.room-inner')).top) || 0;
    const span = el.offsetHeight - innerHeight + top;
    scrollTo({ top: el.offsetTop - top + Math.max(0, span) * p, behavior: 'instant' });
  }, progress);
  await page.waitForTimeout(settleMs);
  return room.evaluate(el => ({
    scrollY, progress: el.dataset.progress || el.style.getPropertyValue('--progress'),
    verified: el.querySelector('[data-verified-count]')?.textContent,
    nodes: [...el.querySelectorAll('.screen-plane,.camera-plane,.camera-frame,.camera-wide,.camera-focus,.patient-camera,.lift,.orbit-word,.room-stage img,[data-lift],[data-focus],[data-detach],.chaos-cloud span,.morning-door,.morning-resolution,.diagram-connectors')].map((node, index) => {
      const style = getComputedStyle(node), box = node.getBoundingClientRect();
      return { index, tag: node.tagName, class: node.className, src: node.getAttribute('src'), currentSrc: node.currentSrc, origin: node.getAttribute('data-origin-id'), liftStart: node.getAttribute('data-lift-start'), liftEnd: node.getAttribute('data-lift-end'), transform: style.transform, opacity: style.opacity, filter: style.filter, background: style.backgroundColor, borderColor: style.borderColor, top: box.top, left: box.left, width: box.width, height: box.height };
    }),
    cropAlignment: [...el.querySelectorAll('[data-detach]')].map(piece => {
      const source = el.querySelector(`[data-origin="${piece.dataset.originId}"]`);
      if (!source) return { origin: piece.dataset.originId, missing: true };
      const [x,y,w,h] = piece.dataset.originBox.split(',').map(Number);
      const sourceBox = source.getBoundingClientRect(), pieceBox = (piece.querySelector('img') || piece).getBoundingClientRect();
      const expected = { left: sourceBox.left + sourceBox.width*x, top: sourceBox.top + sourceBox.height*y, width: sourceBox.width*w, height: sourceBox.height*h };
      return { origin: piece.dataset.originId, src: piece.querySelector('img')?.getAttribute('src'), sourceSrc: source.getAttribute('src'), sourceFractions: [x,y,w,h], expected, actual: { left: pieceBox.left, top: pieceBox.top, width: pieceBox.width, height: pieceBox.height }, deltaLeft: pieceBox.left-expected.left, deltaTop: pieceBox.top-expected.top, deltaWidth: pieceBox.width-expected.width, deltaHeight: pieceBox.height-expected.height };
    }),
  }));
}

async function round3Snapshot(page) {
  return page.evaluate(() => {
    const rect = node => { const r = node.getBoundingClientRect(); return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}; };
    const overlaps = (a,b) => Math.min(a.right,b.right)-Math.max(a.left,b.left)>1 && Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1;
    const opacity = node => { let value=1; for(let el=node;el;el=el.parentElement) value*=Number(getComputedStyle(el).opacity); return value; };
    const stage=rect(document.querySelector('#morning .room-stage'));
    const copy=[...document.querySelectorAll('#morning .room-copy h1,#morning .room-copy p,#morning .room-copy a')].map(rect);
    const pills=[...document.querySelectorAll('.chaos-cloud span')].map(node=>{ const box=rect(node), alpha=opacity(node); return {text:node.textContent,box,opacity:alpha,withinStage:box.left>=stage.left-1&&box.right<=stage.right+1&&box.top>=stage.top-1&&box.bottom<=stage.bottom+1,copyCollision:copy.some(c=>overlaps(c,box))}; });
    const flag=document.querySelector('.frequency-detail figcaption'), flagBox=rect(flag);
    const midFlag={text:flag.innerText,opacity:opacity(flag),box:flagBox,visible:opacity(flag)>=.9&&flagBox.top>=80&&flagBox.bottom<=innerHeight&&flagBox.left>=0&&flagBox.right<=innerWidth};
    const tightPieces=[...document.querySelectorAll('.appointment-piece,.frequency-detail')].map(piece=>{
      const imageWrapper=piece.querySelector('.appointment-image');
      const imgs=[...(imageWrapper||piece).querySelectorAll('img')].map(img=>({box:rect(img),opacity:opacity(img),src:img.currentSrc}));
      const wrapper=imageWrapper?rect(imageWrapper):null;
      const visible=imgs.filter(img=>img.opacity>.1);
      const emptyImageBand=wrapper&&visible.length?Math.max(0,wrapper.bottom-Math.max(...visible.map(img=>Math.min(wrapper.bottom,img.box.bottom)))):0;
      const label=piece.querySelector('figcaption'), labelBox=rect(label), box=rect(piece);
      const excessFrameHeight=Math.max(0,box.height-(imageWrapper?wrapper.height:imgs[0].box.height)-labelBox.height);
      return {class:piece.className,opacity:opacity(piece),box,images:imgs,labelOpacity:opacity(label),emptyImageBand,excessFrameHeight};
    });
    return {stage,pills,midFlag,tightPieces};
  });
}

async function anchorSnapshot(page, id, method) {
  return page.locator(`#${id}`).evaluate((el, method) => {
    const heading = el.querySelector('h1,h2').getBoundingClientRect();
    const eyebrow = el.querySelector('.overline').getBoundingClientRect();
    const overlays = [...document.querySelectorAll('header,.tour-rail')].map(node => ({ position: getComputedStyle(node).position, rect: node.getBoundingClientRect() })).filter(({ position, rect }) => ['fixed','sticky'].includes(position) && rect.top < innerHeight && rect.bottom > 0);
    const obstructionBottom = Math.max(0, ...overlays.map(({ rect }) => rect.bottom));
    return { method, room: el.id, hash: location.hash, headingTop: heading.top, headingBottom: heading.bottom, eyebrowTop: eyebrow.top, obstructionBottom, viewportHeight:innerHeight, clear: heading.top >= obstructionBottom - 1 && eyebrow.top >= obstructionBottom - 1 && heading.bottom <= innerHeight };
  }, method);
}
async function settleScroll(page) {
  let previous = await page.evaluate(()=>scrollY), stable=0;
  for (let attempt=0;attempt<40;attempt++) {
    await page.waitForTimeout(100);
    const current=await page.evaluate(()=>scrollY);
    stable=Math.abs(current-previous)<.1 ? stable+1 : 0;
    if (stable>=2) return;
    previous=current;
  }
  throw new Error('Scroll did not settle within four seconds');
}
try {
  context = await chromium.launchPersistentContext(profile, { headless: true, args:['--headless=new'], viewport: { width: 1440, height: 1000 } });
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
      new PerformanceObserver(list => list.getEntries().forEach(e => { if (!e.hadRecentInput) window.__qa.shifts.push({ value: e.value, time: e.startTime, navigationStart: performance.timeOrigin, sources: e.value > .0001 ? e.sources.map(source=>({tag:source.node?.tagName,class:typeof source.node?.className==='string'?source.node.className:'',previous:{x:source.previousRect.x,y:source.previousRect.y,width:source.previousRect.width,height:source.previousRect.height},current:{x:source.currentRect.x,y:source.currentRect.y,width:source.currentRect.width,height:source.currentRect.height}})) : [] }); })).observe({ type: 'layout-shift', buffered: true });
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
      await rooms.nth(i).evaluate((el, width) => { if (width === 390) el.scrollIntoView({block:'start',behavior:'instant'}); else window.scrollTo({ top: el.offsetTop + Math.max(0, (el.offsetHeight - innerHeight) / 2), behavior: 'instant' }); }, scenario.width);
      await page.waitForTimeout(220);
      await page.waitForFunction(() => [...document.querySelectorAll('.room-stage img')].filter(img => { const r=img.getBoundingClientRect(); return r.width>0 && r.height>0 && r.top<innerHeight && r.bottom>0 && getComputedStyle(img).visibility!=='hidden'; }).every(img=>img.complete && img.naturalWidth>0), null, {timeout:10000});
      await rooms.nth(i).locator('img').evaluateAll(images => Promise.all(images.filter(img=>img.complete && img.naturalWidth).map(img => img.decode().catch(() => {}))));
      const room = await rooms.nth(i).evaluate(el => ({ id: el.id, heading: el.querySelector('h1,h2')?.textContent.trim(), background: getComputedStyle(el).backgroundColor, position: getComputedStyle(el.firstElementChild).position, text: el.innerText, overflow: document.documentElement.scrollWidth > innerWidth, images: [...el.querySelectorAll('img')].map(img => ({ src: img.getAttribute('src'), currentSrc: img.currentSrc, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight, boxWidth: img.clientWidth, boxHeight: img.clientHeight, complete: img.complete, visible: !!img.getClientRects().length })) }));
      const suffix = scenario.js ? (scenario.reduce ? '-reduced' : '') : '-nojs';
      room.readability = await rooms.nth(i).evaluate(el => ({ hiddenCopy: [...el.querySelectorAll('.room-copy h1,.room-copy h2,.room-copy p')].filter(node => { let check = node; while (check && check !== document.body) { const style = getComputedStyle(check); if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return true; check = check.parentElement; } return false; }).map(node => node.textContent), sticky: getComputedStyle(el.querySelector('.room-inner')).position === 'sticky' }));
      if (!scenario.js || scenario.reduce || scenario.width === 390) room.readability.hiddenPieceLabels = await rooms.nth(i).locator('[data-piece-label]').evaluateAll(labels => labels.filter(node => { let check = node; while (check && check !== document.body) { const style = getComputedStyle(check); if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return true; check = check.parentElement; } return false; }).map(node => node.textContent));
      if (!suffix) await page.screenshot({ path: resolve(output, `shots/${scenario.width}${scenario.height === 650 ? '-short' : ''}-${String(i + 1).padStart(2, '0')}-${room.id}.png`) });
      result.rooms.push(room);
    }
    if (scenario.js && !scenario.reduce && scenario.width === 1440 && scenario.height === 900) {
      result.motion = [];
      for (const id of ['morning', 'schedule', 'patient', 'sources', 'week', 'groups', 'people']) {
        const samples = {};
        for (const [name, progress] of [['docked', 0], ['early', .12], ['mid', .5], ['late', .9], ['reverseMid', .5], ['reverseEarly', .12]]) {
          samples[name] = await motionSample(page, id, progress);
          if (!name.startsWith('reverse')) await page.screenshot({ path: resolve(output, `shots/1440-motion-${id}-${name}.png`) });
        }
        const signature = sample => JSON.stringify(sample.nodes.map(({ index, transform, opacity, filter, background }) => ({ index, transform, opacity, filter, background })));
        const cropProvenance = samples.docked.cropAlignment.filter(crop => crop.src && crop.sourceSrc).map(crop => {
          const piece = assets.find(asset => asset.file === crop.src.replace('../',''));
          const source = assets.find(asset => asset.file === crop.sourceSrc.replace('../',''));
          if (!piece?.source_crop || !source?.source_crop || piece.source !== source.source) return { src: crop.src, sourceSrc: crop.sourceSrc, sharedSource: false };
          const [x1,y1,x2,y2] = piece.source_crop, [a,b,c,d] = source.source_crop;
          const expected = [(x1-a)/(c-a),(y1-b)/(d-b),(x2-x1)/(c-a),(y2-y1)/(d-b)];
          return { src: crop.src, sourceSrc: crop.sourceSrc, sharedSource: true, expected, declared: crop.sourceFractions, matches: expected.every((value,index) => Math.abs(value-crop.sourceFractions[index]) < .002) };
        });
        result.motion.push({ room: id, changed: signature(samples.early) !== signature(samples.late), reverseMidMatches: signature(samples.mid) === signature(samples.reverseMid), reverseEarlyMatches: signature(samples.early) === signature(samples.reverseEarly), cropProvenance, samples });
      }
    }
    if (scenario.js && !scenario.reduce && scenario.width === 1440) {
      result.round3 = { morningSweep: [], tightPieceSamples: [] };
      for (let step=0;step<=100;step++) {
        const progress=step/100;
        await motionSample(page,'morning',progress,100);
        const snapshot=await round3Snapshot(page);
        result.round3.morningSweep.push({progress,stage:snapshot.stage,pills:snapshot.pills});
      }
      await motionSample(page,'morning',.25);
      await page.locator('.chaos-cloud span').first().evaluate(el=>{el.dataset.qaOriginalStyle=el.getAttribute('style')||'';el.style.setProperty('transform','translateX(-1000px)','important');el.style.opacity='1';});
      const broken=await round3Snapshot(page);
      result.round3.guardDetectsEscapedPill=broken.pills.some(pill=>pill.opacity>.01&&!pill.withinStage);
      await page.locator('.chaos-cloud span').first().evaluate(el=>{el.setAttribute('style',el.dataset.qaOriginalStyle);delete el.dataset.qaOriginalStyle;});
      result.round3.weekCaptionStability=[];
      for(let step=0;step<=10;step++) {
        const progress=step/10;
        await motionSample(page,'week',progress,100);
        const geometry=await page.locator('.week-panels').evaluate(grid=>({height:grid.clientHeight,captionDisplays:[...grid.querySelectorAll('figcaption')].map(label=>getComputedStyle(label).display)}));
        result.round3.weekCaptionStability.push({progress,...geometry});
      }
      result.round3.weekGridHeightRange=Math.max(...result.round3.weekCaptionStability.map(s=>s.height))-Math.min(...result.round3.weekCaptionStability.map(s=>s.height));
      result.round3.patientCaptionThreshold=[];
      for(let step=0;step<=30;step++) {
        const progress=.36+step*.001;
        await motionSample(page,'patient',progress,100);
        const geometry=await page.locator('.frequency-detail').evaluate(piece=>{const image=piece.querySelector('img').getBoundingClientRect();return {imageTop:image.top,imageLeft:image.left,imageHeight:image.height,labelDisplay:getComputedStyle(piece.querySelector('figcaption')).display};});
        result.round3.patientCaptionThreshold.push({progress,...geometry});
      }
      result.round3.patientCaptionMaxStep=Math.max(...result.round3.patientCaptionThreshold.slice(1).map((sample,index)=>Math.abs(sample.imageTop-result.round3.patientCaptionThreshold[index].imageTop)));
      for (const id of ['schedule','patient']) for (const progress of [.35,.5,.6,.75,.9]) {
        await motionSample(page,id,progress);
        const snapshot=await round3Snapshot(page);
        result.round3.tightPieceSamples.push({room:id,progress,pieces:snapshot.tightPieces.filter(piece=>id==='schedule'?piece.class.includes('appointment'):piece.class.includes('frequency'))});
        if(id==='patient'&&progress===.5) result.round3.midFlag=snapshot.midFlag;
      }
    }
    result.navigation = { header: await page.locator('header.header').count(), footer: await page.locator('footer.footer').count() };
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    if (result.navigation.header) {
      if (scenario.width === 390 && scenario.js) {
        const toggle = page.locator('.mobile-toggle');
        await toggle.focus();
        await page.keyboard.press('Enter');
        result.navigation.mobileOpened = await toggle.getAttribute('aria-expanded') === 'true';
        const platform = page.locator('.nav .has-dropdown').first().locator('.nav-link');
        await platform.focus();
        await page.keyboard.press('Enter');
        result.navigation.submenuKeyboardVisible = await page.locator('.nav .dropdown').first().locator('a').first().isVisible();
        await page.keyboard.press('Escape');
        result.navigation.mobileClosed = await toggle.getAttribute('aria-expanded') === 'false';
        result.navigation.mobileFocusRestored = await toggle.evaluate(el => document.activeElement === el);
      } else {
        const trigger = page.locator('.nav .has-dropdown').first().locator('.nav-link');
        await trigger.focus();
        result.navigation.submenuKeyboardVisible = await page.locator('.nav .dropdown').first().locator('a').first().isVisible();
        await page.keyboard.press('Tab');
        result.navigation.submenuTabReachable = await page.locator('.nav .dropdown').first().evaluate(el=>el.contains(document.activeElement));
        if (!scenario.js && scenario.width === 390) result.navigation.staticNavUsable = await page.locator('.nav .nav-link').evaluateAll(links => links.every(link => { const style = getComputedStyle(link); return link.getBoundingClientRect().width > 0 && style.visibility !== 'hidden' && style.display !== 'none'; }));
      }
    }
    result.navigation.footerLinks = await page.locator('footer.footer a').evaluateAll(links => links.map(link => ({ text: link.textContent.trim() || link.getAttribute('aria-label'), href: link.getAttribute('href') })));
    if (scenario.js && !scenario.reduce && scenario.height !== 650 && result.navigation.footer) await page.locator('footer.footer').screenshot({ path: resolve(output, `shots/${scenario.width}-standard-footer.png`) });
    result.navigation.missingLocalFooterLinks = [];
    for (const link of result.navigation.footerLinks) {
      if (!link.href || /^(?:https?:|mailto:|tel:|#)/.test(link.href)) continue;
      const url = new URL(link.href, `${origin}/pages/showroom.html`);
      const local = url.pathname === '/' ? '/index.html' : url.pathname;
      if (!existsSync(resolve(root, '.' + local))) result.navigation.missingLocalFooterLinks.push(link);
    }
    if (scenario.width === 390) {
      result.mobileAnchors = [];
      for (const [method, id] of [['click', 'patient'], ['keyboard', 'week'], ['directHash', 'sources'], ['restoredHash', 'sources']]) {
        const link = page.locator(`.tour-rail a[href="#${id}"]`);
        if (method === 'click') await link.click();
        else if (method === 'keyboard') { await link.focus(); await page.keyboard.press('Enter'); }
        else {
          if (scenario.js) {
            const observations = await page.evaluate(() => window.__qa);
            result.preHashPerformance ||= {shifts:[],longTasks:[]};
            result.preHashPerformance.shifts.push(...observations.shifts);
            result.preHashPerformance.longTasks.push(...observations.longTasks);
          }
          if (method === 'directHash') { await page.goto('about:blank'); await page.goto(`${origin}/pages/showroom.html#${id}`, { waitUntil: 'networkidle' }); }
          else await page.reload({ waitUntil: 'networkidle' });
        }
        await settleScroll(page);
        result.mobileAnchors.push(await anchorSnapshot(page, id, method));
        if (scenario.js && !scenario.reduce) await page.screenshot({ path: resolve(output, `shots/390-anchor-${method}-${id}.png`) });
      }
    }
    result.bodyBackground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    result.visibleCopy = await page.locator('body').innerText();
    result.copyViolations = { dashes: result.visibleCopy.match(/[\u2013\u2014]|\b\w+-\w+\b/g) || [], prohibited: result.visibleCopy.match(/call insurance|ask caller|writes? back|write to open dental|pinboard|CodeGroupNum|BenefitNum|Not writable/gi) || [], prices: result.visibleCopy.match(/\$\s*\d|\b\d+\s*\/\s*month\b/gi) || [] };
    result.uniqueLocalResources = [...new Set(requests.filter(url => url.startsWith(origin) && !/\.mp4(?:\?|$)/.test(url)).map(url => new URL(url).pathname))];
    result.resourceBytesExcludingVideo = (await Promise.all(result.uniqueLocalResources.map(async path => (await stat(resolve(root, '.' + path)).catch(() => ({size: 0}))).size))).reduce((a, b) => a + b, 0);
    result.measuredTransferBytesExcludingVideo = await page.evaluate(() => [...performance.getEntriesByType('navigation'), ...performance.getEntriesByType('resource')].filter(entry => !/\.mp4(?:\?|$)/.test(entry.name)).reduce((sum, entry) => sum + entry.transferSize, 0));
    const maximumImageBoxes = new Map();
    result.rooms.flatMap(room => room.images).filter(img => img.currentSrc).forEach(img => { const previous = maximumImageBoxes.get(img.currentSrc) || {width: 0,height: 0}; maximumImageBoxes.set(img.currentSrc, {width: Math.max(previous.width,img.boxWidth),height: Math.max(previous.height,img.boxHeight)}); });
    result.motion?.flatMap(room => Object.values(room.samples).flatMap(sample => sample.nodes)).filter(node => node.tag === 'IMG' && node.currentSrc && Number(node.opacity) > 0).forEach(node => { const previous = maximumImageBoxes.get(node.currentSrc) || {width:0,height:0}; maximumImageBoxes.set(node.currentSrc, {width:Math.max(previous.width,node.width),height:Math.max(previous.height,node.height)}); });
    result.imageSizingBoxes = [...maximumImageBoxes].map(([url,box]) => ({file: new URL(url).pathname.slice(1), ...box}));
    result.imageSizingViolations = result.rooms.flatMap(room => room.images.flatMap(img => {
      const path = img.currentSrc ? new URL(img.currentSrc).pathname.slice(1) : '';
      const asset = assets.find(entry => entry.file === path);
      const maximum = maximumImageBoxes.get(img.currentSrc);
      if (asset && img.visible && img.boxWidth && (asset.width > maximum.width * 2 + 2 || asset.height > maximum.height * 2 + 2)) return [{ room: room.id, ...img, maximumBox: maximum, fileWidth: asset.width, fileHeight: asset.height }];
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
      if (result.preHashPerformance) {
        result.performance.cls += result.preHashPerformance.shifts.reduce((sum, entry) => sum + entry.value, 0);
        result.performance.shifts.unshift(...result.preHashPerformance.shifts);
        result.performance.longTasks.unshift(...result.preHashPerformance.longTasks);
        result.performance.includesFreshHashReload = true;
      }
    }
    if (result.performance) {
      const sessions=[];
      for (const shift of result.performance.shifts) {
        let session=sessions.at(-1);
        if (!session || session.navigationStart!==shift.navigationStart || shift.time-session.last>=1000 || shift.time-session.start>=5000) {
          session={navigationStart:shift.navigationStart,start:shift.time,last:shift.time,value:0,count:0};
          sessions.push(session);
        }
        session.last=shift.time; session.value+=shift.value; session.count++;
      }
      result.performance.cumulativeShiftSum=result.performance.shifts.reduce((sum,shift)=>sum+shift.value,0);
      result.performance.cls=Math.max(0,...sessions.map(session=>session.value));
      result.performance.clsSessions=sessions;
      result.performance.clsMethod='Maximum session window: less than 1 second between shifts and less than 5 seconds from first shift; separate document visits.';
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
        result.dialog.backgroundFocusBlocked = await page.evaluate(() => { document.querySelector('header a').focus(); return document.activeElement.closest('dialog') !== null; });
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
  const assetManifest = assets;
  report.newImageBytes = assetManifest.reduce((sum, entry) => sum + entry.bytes, 0);
  const imageFiles = new Set(assetManifest.map(entry => '/' + entry.file.replaceAll('\\', '/')));
  const sharedAndDocumentPaths = [...new Set(report.scenarios.flatMap(s => s.uniqueLocalResources))].filter(path => !imageFiles.has(path));
  report.conservativeBytesExcludingVideo = report.newImageBytes + (await Promise.all(sharedAndDocumentPaths.map(async path => (await stat(resolve(root, '.' + path))).size))).reduce((sum, n) => sum + n, 0);
  const finalImageBoxes = new Map();
  report.scenarios.flatMap(s => s.imageSizingBoxes).forEach(box => { const previous = finalImageBoxes.get(box.file) || {width:0,height:0}; finalImageBoxes.set(box.file, {width:Math.max(box.width,previous.width),height:Math.max(box.height,previous.height)}); });
  for (const scenario of report.scenarios) scenario.imageSizingViolations = scenario.imageSizingBoxes.filter(box => { const asset = assets.find(a => a.file === box.file), finalBox = finalImageBoxes.get(box.file); return asset && finalBox.width && (asset.width > finalBox.width*2+2 || asset.height > finalBox.height*2+2); }).map(box => ({file:box.file, maximumAcrossResponsiveAndMotion:finalImageBoxes.get(box.file), asset:assets.find(a => a.file === box.file)}));
  report.failures = [];
  for (const s of report.scenarios) {
    const label = `${s.width}x${s.height} js=${s.js} reduced=${s.reduce}`;
    if (s.errors.length || s.httpErrors.length || s.failedRequests.length || s.externalRequests.length) report.failures.push(`${label}: network/runtime errors`);
    if (s.rooms.some(r => r.overflow || r.readability.hiddenCopy.length || r.readability.hiddenPieceLabels?.length)) report.failures.push(`${label}: overflow or hidden copy`);
    if (s.videoRequestsBeforeOpen) report.failures.push(`${label}: eager video request`);
    if (s.performance?.cls >= .05) report.failures.push(`${label}: CLS threshold`);
    if (Object.values(s.copyViolations).some(values => values.length)) report.failures.push(`${label}: prohibited copy`);
    if (s.imageSizingViolations?.length) report.failures.push(`${label}: image sizing`);
    if (s.dialog && (!s.dialog.open || !s.dialog.backgroundFocusBlocked || !s.dialog.escapeClosed || !s.dialog.focusRestored || !s.dialog.playback.playing || s.dialog.tabFocus.some(f => f.backgroundControl))) report.failures.push(`${label}: dialog interaction`);
    if (s.keyboard && (!s.keyboard.arrowNext || !s.keyboard.home || !s.keyboard.end || s.keyboard.activatedHash !== '#patient')) report.failures.push(`${label}: keyboard rail`);
    if (s.motion?.some(room => !room.changed || !room.reverseMidMatches || !room.reverseEarlyMatches)) report.failures.push(`${label}: reversible room motion`);
    if (s.motion?.some(room => room.cropProvenance.some(crop => crop.sharedSource && !crop.matches))) report.failures.push(`${label}: source crop coordinates`);
    if (s.round3?.morningSweep.some(sample=>sample.pills.some(pill=>!pill.withinStage||(pill.opacity>.01&&pill.copyCollision)))) report.failures.push(`${label}: morning pill bounds or copy collision`);
    if (s.round3?.weekGridHeightRange>1 || s.round3?.weekCaptionStability.some(sample=>sample.captionDisplays.some(display=>display==='none'))) report.failures.push(`${label}: Week caption grid changes height`);
    if (s.round3?.patientCaptionMaxStep>3) report.failures.push(`${label}: frequency caption appearance jumps image`);
    if (s.round3 && !s.round3.guardDetectsEscapedPill) report.failures.push(`${label}: pill guard sensitivity`);
    if (s.round3 && (!s.round3.midFlag.visible || !/Frequency already used/.test(s.round3.midFlag.text) || !/Review before treatment/.test(s.round3.midFlag.text))) report.failures.push(`${label}: patient mid flag not readable`);
    if (s.round3?.tightPieceSamples.some(sample=>sample.pieces.some(piece=>piece.opacity>.1&&(piece.emptyImageBand>3||piece.excessFrameHeight>4)))) report.failures.push(`${label}: empty lifted piece bands`);
    if (s.mobileAnchors?.some(anchor => !anchor.clear)) report.failures.push(`${label}: obscured mobile anchor`);
    if (s.navigation.header !== 1 || s.navigation.footer !== 1 || !s.navigation.submenuKeyboardVisible || s.navigation.missingLocalFooterLinks.length || (s.width === 390 && s.js && (!s.navigation.mobileOpened || !s.navigation.mobileClosed || !s.navigation.mobileFocusRestored)) || (s.width === 390 && !s.js && !s.navigation.staticNavUsable)) report.failures.push(`${label}: standard navigation`);
  }
  if (report.conservativeBytesExcludingVideo >= 6000000) report.failures.push('Page weight exceeds six megabytes');
  if (report.navigationEquivalence && (!report.navigationEquivalence.header.same || !report.navigationEquivalence.footer.same)) report.failures.push('Standard navigation differs from platform');
  if (report.entryLinkSmoke.some(s => s.count !== 1 || !s.visible || s.horizontalOverflow || s.bounds.x < 0 || s.bounds.x + s.bounds.width > s.width)) report.failures.push('Entry link layout');
  if (report.failures.length) process.exitCode = 1;
} catch (error) { report.fatal = error.stack; process.exitCode = 1; }
finally { if (context) await context.close(); await new Promise(done => server.close(done)); await writeFile(resolve(output, 'verification.json'), JSON.stringify(report, null, 2)); }
console.log(JSON.stringify({ fatal: report.fatal, failures: report.failures, conservativeBytesExcludingVideo: report.conservativeBytesExcludingVideo, entryLinkSmoke: report.entryLinkSmoke, scenarios: report.scenarios.map(s => ({ width: s.width, height: s.height, js: s.js, reduce: s.reduce, errors: s.errors.length, httpErrors: s.httpErrors.length, overflow: s.rooms.some(r => r.overflow), cls: s.performance?.cls, bytes: s.resourceBytesExcludingVideo, videoRequestsBeforeOpen: s.videoRequestsBeforeOpen, copyViolations: s.copyViolations, keyboard: s.keyboard, dialog: s.dialog })) }, null, 2));
