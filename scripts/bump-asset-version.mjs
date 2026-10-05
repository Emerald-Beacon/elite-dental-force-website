import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Change this token for each release, then run this script from any directory.
const RELEASE = '20261005d';
const root = fileURLToPath(new URL('../', import.meta.url));
const files = execFileSync('git', ['ls-files', '-z', '*.html'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
let changed = 0;
for (const file of files) {
  const path = new URL(file, new URL('../', import.meta.url));
  const original = readFileSync(path, 'utf8');
  const updated = original.replace(/<(?:link|script)\b[^>]*>/gi, tag => {
    const script = /^<script\b/i.test(tag);
    if (!script && !/\brel\s*=\s*(["'])stylesheet\1/i.test(tag)) return tag;
    return tag.replace(script ? /\bsrc\s*=\s*(["'])(.*?)\1/i : /\bhref\s*=\s*(["'])(.*?)\1/i, (attr, quote, value) => {
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value)) return attr;
      const resolved = new URL(value, `https://assets.local/${file}`);
      if (!/^\/(?:css|js|3d)\//.test(resolved.pathname) && !(file.startsWith('pages/') && resolved.pathname.endsWith('.css'))) return attr;
      const [withoutHash, hash] = value.split('#');
      const [pathname, query] = withoutHash.split('?');
      const params = new URLSearchParams(query);
      params.set('v', RELEASE);
      const versioned = `${pathname}?${params}${hash === undefined ? '' : `#${hash}`}`;
      return attr.replace(`${quote}${value}${quote}`, `${quote}${versioned}${quote}`);
    });
  });
  if (updated !== original) { writeFileSync(path, updated); changed++; }
}
const motion = new URL('../js/home-motion.js', import.meta.url);
const source = readFileSync(motion, 'utf8');
if (!/const ASSET_VERSION = '[^']+';/.test(source)) throw new Error('Missing home-motion ASSET_VERSION');
const updated = source.replace(/const ASSET_VERSION = '[^']+';/, `const ASSET_VERSION = '${RELEASE}';`);
if (updated !== source) writeFileSync(motion, updated);
console.log(`Asset version ${RELEASE}: ${changed} HTML files updated; dynamic loader synchronized.`);
