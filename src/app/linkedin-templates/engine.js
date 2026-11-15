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

// A template can tighten limits for its layout, e.g. limits: { bullets: 4 },
// and a layout variant can tighten them further: variantLimits: { 'bullets~grid': { bullets: 4 } }
export const limitsFor = (template, key) => ({
  ...LIMITS,
  ...(template && template.limits),
  ...(template && key && template.variantLimits && template.variantLimits[key]),
});

// Design switches every template supports (the engine draws them). Templates add their own in `options`.
// default: true/false, or a list of slide types it's on for
export const SHARED_OPTIONS = [
  { key: 'progress', label: 'شريط التقدّم', default: false },
  { key: 'bignum', label: 'رقم كبير في الخلفية', default: false },
  { key: 'swipe', label: '«اسحب ←»', default: true },
  { key: 'pagenum', label: 'رقم الصفحة', default: true },
];

// Per-slide pieces: which template, which layout key, which switches are on
export function slideTemplate(template, s, templatesById) {
  return (s && s.tpl && templatesById && templatesById[s.tpl]) || template;
}
export function slideKey(template, s) {
  const k = s.variant ? `${s.type}~${s.variant}` : s.type;
  return template.slides[k] ? k : s.type;
}
export function slideOptions(template, s, docOpts) {
  const o = {};
  for (const opt of [...SHARED_OPTIONS, ...(template.options || [])]) {
    o[opt.key] = Array.isArray(opt.default) ? opt.default.includes(s.type) : !!opt.default;
  }
  return { ...o, ...(docOpts || {}), ...(s.o || {}) };
}

// Returns a list of problems (empty = fits). templatesById: other templates single slides can use.
export function check(template, data, templatesById) {
  const out = [];
  (data.slides || []).forEach((s, i) => {
    const t = slideTemplate(template, s, templatesById);
    const L = limitsFor(t, slideKey(t, s));
    if (!t.slides[s.type]) out.push(`slide ${i + 1}: this template has no "${s.type}" slide`);
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
// Each slide can use another template (slide.tpl), a layout variant (slide.variant) and its own
// switches (slide.o, over data.opts). Every slide sits in <div class="sw tpl-<id>">, so each
// template's CSS (all scoped to .tpl-<id>) only touches its own slides.
export function renderDoc(template, data, brandCss, templatesById) {
  const slides = data.slides || [];
  const total = slides.length;
  const used = new Map([[template.id, template]]);
  const body = slides
    .map((s, i) => {
      const t = slideTemplate(template, s, templatesById);
      used.set(t.id, t);
      const key = slideKey(t, s);
      const o = slideOptions(t, s, data.opts);
      // the engine draws window dots itself unless the template places them (ownDots)
      const ctx = {
        ...s,
        author: data.author,
        index: i + 1,
        nn: String(i + 1).padStart(2, '0'),
        total,
        page: `${i + 1}/${total}`,
        progress: Math.round(((i + 1) / total) * 1000) / 10,
        first: i === 0,
        last: i === total - 1,
        multi: total > 1,
        more: total > 1 && i < total - 1,
        // ownDots: true, or the layout keys that draw their own dots
        o: { ...o, xdots: o.dots && !(t.ownDots === true || (Array.isArray(t.ownDots) && t.ownDots.includes(key))) },
        // list items as "name | note | value" (note and value optional), for ranking layouts:
        // items = all, top = first 3, rest = the others; each keeps its rank ("01"…)
        ...rankedItems(s.bullets),
      };
      const inner = fill(t.slides[key] || '', ctx);
      const foot = t.footer === false ? '' : fill(FOOTER, ctx);
      const extras = fill(EXTRAS, ctx);
      // "dense" = lots of bullet text; layouts tighten spacing for it
      const bulletChars = (s.bullets || []).join('').length;
      const dense = (s.bullets || []).length >= 5 || bulletChars > 170 ? ' data-dense' : '';
      const variant = key !== s.type ? ` slide--${key.replace('~', '--')}` : '';
      return `<div class="sw tpl-${t.id}"><section class="slide slide--${s.type}${variant}" data-len="${lenClass(s.title || s.text)}"${dense}>${extras}${inner}${foot}</section></div>`;
    })
    .join('\n');
  const css = [...used.values()].map((t) => t.css).join('\n');
  // dir="rtl" goes on <body>, not <html>: an RTL root makes headless Chrome (Gotenberg) place the
  // 1080px page at the right edge of a wider viewport, so screenshots came out blank (tested).
  return `<!doctype html><html lang="ar"><head><meta charset="utf-8">
<style>${brandCss}\n${css}</style></head>
<body dir="rtl" class="doc">${body}</body></html>`;
}

function rankedItems(bullets) {
  if (!Array.isArray(bullets)) return {};
  const items = bullets.map((b, i) => {
    const [raw = '', note = '', value = ''] = String(b).split('|').map((x) => x.trim());
    // "💬 name": a leading emoji is the item's icon
    const m = raw.match(/^(\p{Extended_Pictographic}(?:\p{Variation_Selector}|\p{Emoji_Modifier}|\p{Join_Control}\p{Extended_Pictographic})*)\s*/u);
    const name = m ? raw.slice(m[0].length) : raw;
    return { name, note, value, icon: m ? m[1] : '', rank: String(i + 1).padStart(2, '0'), initial: Array.from(name.replace(/==/g, '').trim())[0] || '' };
  });
  return { items, top: items.slice(0, 3), rest: items.slice(3) };
}

// Shared extras the engine draws on top of any template (switched by slide options)
const EXTRAS = `{{#o.progress}}<div class="x-progress"><i style="width:{{progress}}%"></i></div>{{/o.progress}}{{#o.bignum}}<div class="x-bignum">{{nn}}</div>{{/o.bignum}}{{#o.xdots}}<span class="x-dots"><i></i><i></i><i></i></span>{{/o.xdots}}`;

const FOOTER = `<footer class="foot">
  <div class="foot-who"><strong>{{author.ar}}</strong><span>{{author.en}}</span></div>
  {{#multi}}<div class="foot-end">{{#more}}{{#o.swipe}}<span class="foot-swipe">اسحب <i>←</i></span>{{/o.swipe}}{{/more}}{{#o.pagenum}}<span class="foot-page">{{page}}</span>{{/o.pagenum}}</div>{{/multi}}
</footer>`;
