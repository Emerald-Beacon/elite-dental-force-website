const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), os = require('node:os'), assert = require('node:assert/strict'), { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..'), deps = process.argv.find(x => x.startsWith('--deps='))?.slice(7), breaking = process.argv.find(x => x.startsWith('--break='))?.slice(8);
const puppeteer = deps ? require(path.join(path.resolve(deps), 'puppeteer-core')) : require('puppeteer-core');
const output = path.join(root, 'docs/evidence/r10'), results = [], opened = [], pending = new Set(), pageErrors = [];
const expectedCopy = 'This tour uses screenshots. A live demo is 30 minutes with our team, built around how your office handles eligibility and billing today. Bring your questions. No patient information needed, and no commitment required.';
const code = fs.readFileSync(path.join(root, 'js/booking-modal.js'), 'utf8'), oldCode = execFileSync('git', ['show', 'e145e9b:js/booking-modal.js'], { cwd: root, encoding: 'utf8' });
const htmlFiles = execFileSync('git', ['ls-files', '*.html'], { cwd: root, encoding: 'utf8' }).trim().split(/\r?\n/);
const pages = htmlFiles.filter(file => fs.readFileSync(path.join(root, file), 'utf8').includes('booking-modal.js'));
const bookingLinks = htmlFiles.flatMap(file => [...fs.readFileSync(path.join(root, file), 'utf8').matchAll(/href=["'](https:\/\/marketing\.elitedentalforce\.com\/book\/[^"']*)["']/g)].map(match => match[1]));
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webp': 'image/webp', '.ico': 'image/x-icon', '.mp4': 'video/mp4' };
let browser, server, proxy, base, proxyDenials = 0, failures = 0;
fs.mkdirSync(output, { recursive: true });
async function check(name, fn) {
  try { await fn(); results.push({ name, pass: true }); console.log('PASS ' + name); }
  catch (error) { failures++; results.push({ name, pass: false, error: error.name }); console.log('FAIL ' + name + ': ' + error.name); }
}
const isBooking = value => { try { const url = new URL(value); return url.hostname === 'marketing.elitedentalforce.com' && url.pathname.startsWith('/book/'); } catch { return false; } };
const attached = new WeakMap();
function attach(page) {
  if (attached.has(page)) return attached.get(page);
  const ready = (async () => {
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = request.url();
      if (url.startsWith(base + '/') || url.startsWith('data:') || url.startsWith('blob:')) return request.continue().catch(() => {});
      if (isBooking(url)) opened.push(url);
      request.respond({ status: 200, contentType: request.isNavigationRequest() ? 'text/html' : 'text/plain', body: request.isNavigationRequest() ? '<!doctype html><title>Synthetic booking destination</title><p>Local test only</p>' : '' }).catch(() => {});
    });
    page.on('pageerror', error => pageErrors.push(error.message));
  })(); attached.set(page, ready); return ready;
}
async function clickBooking(page, selector, expected) {
  const before = opened.length;
  await page.$eval(selector, link => { link.scrollIntoView({ block: 'center' }); link.click(); });
  const deadline = Date.now() + 5000;
  while (opened.length === before && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 50));
  assert.ok(opened.slice(before).some(value => value === expected), 'Actual booking target must open directly');
  assert.equal(await page.$('#edf-bm-card'), null);
  await page.bringToFront();
}
(async () => {
  await check('inventory-and-bytes', async () => {
    assert.equal(pages.length, 42); assert.equal(bookingLinks.length, 68);
    for (const file of [...pages, 'js/booking-modal.js']) {
      const now = fs.readFileSync(path.join(root, file)), before = execFileSync('git', ['show', 'e145e9b:' + file], { cwd: root });
      assert.equal(now.subarray(0, 3).equals(Buffer.from([239, 187, 191])), before.subarray(0, 3).equals(Buffer.from([239, 187, 191])));
      assert.equal(now.toString().split('\n').length, now.toString().split('\r\n').length);
      if (file.endsWith('.html')) assert.ok(now.toString().includes('booking-modal.js?v=20261019r10'));
      if (!['pages/demo.html', 'js/booking-modal.js'].includes(file)) assert.equal(now.toString().replaceAll('20261019r10', '20261019a').replaceAll('\r\n', '\n'), before.toString().replaceAll('\r\n', '\n'));
    }
    const demo = fs.readFileSync(path.join(root, 'pages/demo.html')); assert.ok(demo.subarray(0, 3).equals(Buffer.from([239, 187, 191]))); assert.ok(demo.toString().includes(expectedCopy));
    assert.ok(!/fetch\(|XMLHttpRequest|booking_modal_submit|preventDefault/.test(code));
  });
  server = http.createServer((req, res) => {
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); return res.end(); }
    let file;
    try { file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://local').pathname)); } catch { res.writeHead(400); return res.end(); }
    const relative = path.relative(root, file); if (relative.startsWith('..') || path.isAbsolute(relative)) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) { res.writeHead(404); return res.end(); }
    let content = fs.readFileSync(file);
    if (file === path.join(root, 'js/booking-modal.js')) {
      if (breaking === 'modal') content = Buffer.from(oldCode);
      if (breaking === 'utm') { assert.ok(code.includes('el.href = url.toString();')); content = Buffer.from(code.replace('el.href = url.toString();', '')); }
    }
    if (breaking === 'copy' && file === path.join(root, 'pages/demo.html')) content = Buffer.from(content.toString().replace(expectedCopy, 'This tour uses screenshots. A live demo uses your data.'));
    res.writeHead(200, { 'content-type': mime[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' }); res.end(req.method === 'HEAD' ? undefined : content);
  });
  proxy = http.createServer((_req, res) => { proxyDenials++; res.writeHead(502); res.end(); });
  proxy.on('connect', (_req, socket) => { proxyDenials++; socket.on('error', () => {}); socket.end('HTTP/1.1 502 Local test blocks external transport\r\n\r\n'); });
  for (const srv of [server, proxy]) await new Promise(resolve => srv.listen(0, '127.0.0.1', resolve));
  base = 'http://127.0.0.1:' + server.address().port;
  const executablePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe'; assert.ok(fs.existsSync(executablePath));
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'edf-r10-chrome-'));
  browser = await puppeteer.launch({ executablePath, headless: true, userDataDir: profile, args: ['--headless=new', '--user-data-dir=' + profile, '--no-first-run', '--disable-background-networking', '--proxy-server=http://127.0.0.1:' + proxy.address().port] });
  const actualArgs = browser.process().spawnargs; assert.ok(actualArgs.includes('--headless=new') && actualArgs.includes('--user-data-dir=' + profile));
  const watch = target => {
    if (isBooking(target.url())) opened.push(target.url());
    if (target.type() !== 'page') return;
    const task = target.page().then(page => page && attach(page)).catch(error => pageErrors.push(error.name)); pending.add(task); task.finally(() => pending.delete(task));
  };
  browser.on('targetcreated', watch); browser.on('targetchanged', target => { if (isBooking(target.url())) opened.push(target.url()); });
  for (const width of [1280, 390]) {
    const context = await browser.createBrowserContext(), page = await context.newPage(); await attach(page); await page.setViewport({ width, height: width === 390 ? 844 : 900 });
    await check('home-direct-with-utm-' + width, async () => {
      await page.goto(base + '/index.html?utm_source=google&utm_medium=cpc&utm_campaign=fall_eligibility&utm_content=header&utm_term=dental', { waitUntil: 'domcontentloaded' });
      assert.ok(await page.evaluate(() => sessionStorage.getItem('edf_utm')));
      const url = new URL('https://marketing.elitedentalforce.com/book/demo'); for (const [key, value] of Object.entries({ utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'fall_eligibility', utm_content: 'header', utm_term: 'dental' })) url.searchParams.set(key, value);
      await clickBooking(page, 'a[href*="marketing.elitedentalforce.com/book/"]', url.href);
      if (!breaking) await page.screenshot({ path: path.join(output, 'home-direct-' + width + '.png') });
    });
    await check('demo-retains-campaign-and-copy-B-' + width, async () => {
      await page.goto(base + '/pages/demo.html', { waitUntil: 'domcontentloaded' });
      const card = await page.$('.after-tour'); await card.evaluate(node => node.scrollIntoView({ block: 'center' })); await new Promise(resolve => setTimeout(resolve, 650));
      assert.equal(await page.$eval('.after-tour h2', node => node.textContent.replace(/\s+/g, ' ').trim()), 'See EDiFi Live With Our Team');
      assert.equal(await page.$eval('.after-tour p', node => node.textContent.replace(/\s+/g, ' ').trim()), expectedCopy);
      assert.ok(!/[\u2013\u2014]/.test(await card.evaluate(node => node.textContent)));
      const expected = 'https://marketing.elitedentalforce.com/book/demo?utm_source=google&utm_medium=cpc&utm_campaign=fall_eligibility&utm_content=header&utm_term=dental';
      await clickBooking(page, '.after-tour a[href*="/book/demo"]', expected);
      if (!breaking) await card.screenshot({ path: path.join(output, 'demo-copy-B-' + width + '.png') });
    });
    await check('all-booking-links-and-dynamic-link-' + width, async () => {
      const seen = await page.evaluate(links => {
        const out = []; document.addEventListener('click', event => { const link = event.target.closest('a[data-r10]'); if (link) { out.push({ href: link.href, intercepted: event.defaultPrevented }); event.preventDefault(); } });
        for (const href of links) { const link = document.createElement('a'); link.dataset.r10 = '1'; link.href = href; link.innerHTML = '<span>Book</span>'; document.body.append(link); link.firstChild.click(); link.remove(); }
        return out;
      }, [...bookingLinks, 'https://marketing.elitedentalforce.com/book/demo?utm_source=explicit']);
      assert.equal(seen.length, bookingLinks.length + 1); assert.ok(seen.every(link => !link.intercepted));
      for (const link of seen) { const url = new URL(link.href); assert.equal(url.searchParams.get('utm_campaign'), 'fall_eligibility'); assert.ok(['google', 'explicit'].includes(url.searchParams.get('utm_source'))); }
      assert.equal(new URL(seen.at(-1).href).searchParams.get('utm_source'), 'explicit'); assert.equal(await page.$('#edf-bm-card'), null);
    });
    await context.close();
    const plain = await browser.createBrowserContext(), fresh = await plain.newPage(); await attach(fresh); await fresh.setViewport({ width, height: 844 });
    await check('no-campaign-direct-' + width, async () => { await fresh.goto(base + '/index.html', { waitUntil: 'domcontentloaded' }); await clickBooking(fresh, 'a[href*="marketing.elitedentalforce.com/book/"]', 'https://marketing.elitedentalforce.com/book/demo'); });
    await plain.close();
  }
  await Promise.allSettled([...pending]);
  console.log(results.filter(row => row.pass).length + '/' + results.length + ' R10 website groups passed');
  fs.writeFileSync(path.join(output, breaking ? 'break-' + breaking + '.json' : 'results.json'), JSON.stringify({ cwd: root, base: 'loopback ephemeral static server', browser: { headless: true, freshProfile: true, flagsVerified: true }, externalTransport: 'request interception with a deny-only loopback proxy', proxyDenials, pageErrors, loaderPages: pages, bookingLinkCount: bookingLinks.length, opened: [...new Set(opened)], results }, null, 2) + '\n');
  if (failures) process.exitCode = 1;
})().catch(error => { console.log('FAIL setup: ' + error.name); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close(); for (const srv of [server, proxy]) if (srv) { srv.closeAllConnections(); await new Promise(resolve => srv.close(resolve)); }
});
