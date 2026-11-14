// Fills a LinkedIn template with slide data and returns one full HTML document
// (one 1080×1350 page per slide). Plain JS with no imports, so the same file runs in the
// browser preview, in Node (export script) and pasted into an n8n Code node.
//
// Template syntax, kept tiny on purpose:
//   {{field}}            escaped text; ==word== inside text becomes a highlight (<mark>)
//   {{#list}}…{{/list}}  repeats for each item of an array ({{.}} is the item, {{n}} its 1-based number),
//                        or renders once when the value is truthy
//   {{^field}}…{{/field}} renders when the value is empty/false

export const SIZE = { width: 1080, height: 1350 };

// Max characters per field, so text always fits the layouts
export const LIMITS = {
  kicker: 24,
  title: 64,
  subtitle: 120,
  bullet: 64,
  bullets: 5,
  body: 170,
  text: 160,
  by: 40,
  value: 10,
  label: 70,
  note: 100,
  action: 40,
};

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// escape, then turn ==word== into a highlight and new lines into <br>
const rich = (s) => esc(s).replace(/==(.+?)==/g, '<mark>$1</mark>').replace(/\n/g, '<br>');

function lookup(ctx, key) {
  if (key === '.') return ctx['.'];
  return key.split('.').reduce((v, k) => (v == null ? undefined : v[k]), ctx);
}

export function fill(tpl, ctx) {
  // sections first (supports nesting of different keys)
  tpl = tpl.replace(/\{\{([#^])([\w.]+)\}\}([\s\S]*?)\{\{\/\2\}\}/g, (_, kind, key, inner) => {
    const v = lookup(ctx, key);
    const empty = v == null || v === false || v === '' || (Array.isArray(v) && v.length === 0);
    if (kind === '^') return empty ? fill(inner, ctx) : '';
    if (empty) return '';
    if (Array.isArray(v))
      return v
        .map((item, i) => fill(inner, { ...ctx, ...(typeof item === 'object' ? item : {}), '.': item, n: i + 1, nn: String(i + 1).padStart(2, '0') }))
        .join('');
    return fill(inner, ctx);
  });
  return tpl.replace(/\{\{([\w.]+)\}\}/g, (_, key) => rich(lookup(ctx, key)));
}

// "s" / "m" / "l" so layouts can shrink long titles
const lenClass = (s) => {
  const n = String(s || '').replace(/==/g, '').length;
  return n <= 28 ? 's' : n <= 46 ? 'm' : 'l';
};

// A template can tighten limits for its layout, e.g. limits: { bullets: 4 }
export const limitsFor = (template) => ({ ...LIMITS, ...(template && template.limits) });

// Returns a list of problems (empty = fits)
export function check(template, data) {
  const L = limitsFor(template);
  const out = [];
  (data.slides || []).forEach((s, i) => {
    if (!template.slides[s.type]) out.push(`slide ${i + 1}: this template has no "${s.type}" slide`);
    for (const [k, v] of Object.entries(s)) {
      if (k === 'bullets' && Array.isArray(v)) {
        if (v.length > L.bullets) out.push(`slide ${i + 1}: max ${L.bullets} bullets`);
        v.forEach((b, j) => String(b).length > L.bullet && out.push(`slide ${i + 1}, bullet ${j + 1}: max ${L.bullet} chars`));
      } else if (typeof v === 'string' && L[k] && v.replace(/==/g, '').length > L[k]) {
        out.push(`slide ${i + 1}, ${k}: max ${L[k]} chars`);
      }
    }
  });
  return out;
}

// brandCss: from brand.js (fonts + tokens + footer). Returns the whole document.
export function renderDoc(template, data, brandCss) {
  const slides = data.slides || [];
  const total = slides.length;
  const body = slides
    .map((s, i) => {
      const ctx = {
        ...s,
        author: data.author,
        index: i + 1,
        total,
        page: `${i + 1}/${total}`,
        first: i === 0,
        last: i === total - 1,
        multi: total > 1,
        more: total > 1 && i < total - 1,
      };
      const inner = fill(template.slides[s.type] || '', ctx);
      const foot = template.footer === false ? '' : fill(FOOTER, ctx);
      // "dense" = lots of bullet text; layouts tighten spacing for it
      const bulletChars = (s.bullets || []).join('').length;
      const dense = (s.bullets || []).length >= 5 || bulletChars > 170 ? ' data-dense' : '';
      return `<section class="slide slide--${s.type}" data-len="${lenClass(s.title || s.text)}"${dense}>${inner}${foot}</section>`;
    })
    .join('\n');
  // dir="rtl" goes on <body>, not <html>: an RTL root makes headless Chrome (Gotenberg) place the
  // 1080px page at the right edge of a wider viewport, so screenshots came out blank (tested).
  return `<!doctype html><html lang="ar"><head><meta charset="utf-8">
<style>${brandCss}\n${template.css}</style></head>
<body dir="rtl" class="tpl-${template.id}">${body}</body></html>`;
}

const FOOTER = `<footer class="foot">
  <div class="foot-who"><strong>{{author.ar}}</strong><span>{{author.en}}</span></div>
  {{#multi}}<div class="foot-end">{{#more}}<span class="foot-swipe">اسحب <i>←</i></span>{{/more}}<span class="foot-page">{{page}}</span></div>{{/multi}}
</footer>`;
