import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT = '/tmp/claude-0/-home-user-Machine-course/557e61f3-f30a-5e33-a3ac-8981f34ac244/scratchpad/review';
const BASE = 'http://localhost:4321';
const pages = [
  ['catalog', '/'],
  ['foundations', '/foundations/'],
  ['v1-linreg', '/foundations/bridge/linear-regression/'],
  ['i4-matrix', '/foundations/linear-algebra/matrix-as-map/'],
  ['iii3-bayes', '/foundations/probability/bayes/'],
  ['game-matrix', '/games/matrix-puzzle/'],
  ['game-bayes', '/games/bayes-detective/'],
  ['lab', '/lab/'],
];
const configs = [
  { tag: 'd1440', viewport: { width: 1440, height: 900 }, colorScheme: 'light' },
  { tag: 'm390', viewport: { width: 390, height: 844 }, colorScheme: 'dark', isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
];
const axeSrc = fs.readFileSync(path.resolve('node_modules/axe-core/axe.min.js'), 'utf8');
const report = {};
const browser = await chromium.launch();
for (const cfg of configs) {
  const ctx = await browser.newContext({ viewport: cfg.viewport, colorScheme: cfg.colorScheme, isMobile: cfg.isMobile, hasTouch: cfg.hasTouch, deviceScaleFactor: cfg.deviceScaleFactor ?? 1, locale: 'ru-RU' });
  for (const [name, url] of pages) {
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', m => { if (m.type() === 'error' || m.type()==='warning') errors.push(m.type()+': '+m.text()); });
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    await page.goto(BASE + url, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
    const vh = cfg.viewport.height;
    let H = await page.evaluate(() => document.documentElement.scrollHeight);
    const step = Math.round(vh * 0.9);
    let i = 0, y = 0;
    const files = [];
    while (true) {
      await page.evaluate(yy => window.scrollTo(0, yy), y);
      await page.waitForTimeout(450);
      const f = `${name}-${cfg.tag}-${String(i).padStart(2,'0')}.png`;
      await page.screenshot({ path: path.join(OUT, f) });
      files.push(f);
      H = await page.evaluate(() => document.documentElement.scrollHeight);
      if (y + vh >= H || i > 40) break;
      y += step; i++;
    }
    // метрики
    const metrics = await page.evaluate(() => {
      const iw = window.innerWidth;
      const out = { scrollWidth: document.documentElement.scrollWidth, innerWidth: iw, height: document.documentElement.scrollHeight };
      const over = [];
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none') continue;
        if (r.right > iw + 1 || r.left < -1) {
          // пропускаем, если предок прячет переполнение
          let p = el.parentElement, clipped = false;
          while (p && p !== document.body) { const s = getComputedStyle(p); if (/(auto|scroll|hidden|clip)/.test(s.overflowX)) { clipped = true; break; } p = p.parentElement; }
          if (!clipped) over.push(`${el.tagName.toLowerCase()}.${(el.className && el.className.baseVal === undefined ? el.className : '').toString().slice(0,60)} [${Math.round(r.left)}..${Math.round(r.right)}]`);
        }
      }
      out.overflowing = over.slice(0, 15);
      // внутренние прокрутки
      const scrollers = [];
      for (const el of document.querySelectorAll('body *')) {
        if (el.scrollWidth > el.clientWidth + 2) {
          const s = getComputedStyle(el);
          if (/(auto|scroll)/.test(s.overflowX)) scrollers.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0,50)} sw=${el.scrollWidth} cw=${el.clientWidth}`);
        }
      }
      out.scrollers = scrollers.slice(0, 20);
      // цели касания
      const small = [];
      for (const el of document.querySelectorAll('a, button, input, select, textarea, [role=button], [role=slider], [tabindex]:not([tabindex="-1"]), summary, label')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden') continue;
        // ссылки внутри текста абзаца не считаем (inline)
        if (el.tagName === 'A' && cs.display === 'inline' && el.closest('p, li')) continue;
        if (r.height < 24 || r.width < 24) small.push(`${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label')||el.textContent||'').trim().slice(0,30)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
      out.smallTargets = small.slice(0, 25);
      out.smallCount = small.length;
      return out;
    });
    await page.addScriptTag({ content: axeSrc });
    const axe = await page.evaluate(async () => {
      const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa'] } });
      return r.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, nodes: v.nodes.slice(0,4).map(n => n.target.join(' ') + ' :: ' + (n.failureSummary||'').replace(/\s+/g,' ').slice(0,200)) }));
    });
    report[`${name}-${cfg.tag}`] = { files: files.length, metrics, axe, errors: errors.slice(0,10) };
    await page.close();
  }
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
console.log('done');
