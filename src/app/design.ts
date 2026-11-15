// Carousel design helpers for /app: per-slide templates, layouts, switches and "auto rhythm".
import { SHARED_OPTIONS, limitsFor, slideKey, slideTemplate, type OptionDef, type SlideData, type TemplateLike } from './linkedin-templates/engine.js';

export type DesignTemplate = TemplateLike & { kind: 'carousel' | 'image' | 'ranking' | 'gif'; nameAr: string };
export type Opts = Record<string, boolean>;

const DARK = 'forest-dark';

// All switches a slide in this template has (shared ones first)
export function optionDefs(t: TemplateLike): OptionDef[] {
  return [...(t.options || []), ...SHARED_OPTIONS];
}

// Layouts a slide type has in a template: [{ variant: '' (default) | 'big' …, label }]
export function layoutsFor(t: TemplateLike, type: string): { variant: string; label: string }[] {
  const names = t.variants || {};
  return [
    { variant: '', label: 'الأساسي' },
    ...Object.keys(t.slides)
      .filter((k) => k.startsWith(`${type}~`))
      .map((k) => ({ variant: k.split('~')[1], label: names[k] || k.split('~')[1] })),
  ];
}

// Whether a slide's text fits a layout's limits (so auto rhythm never picks one that would block publishing)
export function fitsLayout(t: TemplateLike, s: SlideData, variant: string): boolean {
  const L = limitsFor(t, slideKey(t, { ...s, variant }));
  const bullets = Array.isArray(s.bullets) ? (s.bullets as string[]) : [];
  return bullets.length <= L.bullets && bullets.every((b) => String(b).replace(/==/g, '').length <= L.bullet);
}

// The doc-level switch value shown in the carousel panel
export function docSwitchOn(def: OptionDef, docOpts: Opts): boolean {
  if (def.key in docOpts) return docOpts[def.key];
  return def.default === true;
}

// Flip a doc-level switch. Turning it back to the template's default removes the override,
// so e.g. "window dots" off returns to "cover only" in the cards template.
export function toggleDocSwitch(def: OptionDef, docOpts: Opts): Opts {
  const next = { ...docOpts };
  const on = !docSwitchOn(def, docOpts);
  if (on === (def.default === true) || (!on && Array.isArray(def.default))) delete next[def.key];
  else next[def.key] = on;
  return next;
}

/**
 * Auto rhythm: mixes looks so a carousel doesn't feel like one slide repeated.
 *  - cover + closing slide → dark forest (or cards when the carousel is already dark)
 *  - number and quote slides → a contrasting template
 *  - every 2nd step → the big-number layout
 *  - points slides rotate list → grid → chat → workflow (only layouts the text fits)
 *  - no big background number on the cover
 */
export function applyRhythm(slides: SlideData[], docTplId: string, byId: Record<string, DesignTemplate>): SlideData[] {
  const doc = byId[docTplId];
  if (!doc || doc.kind !== 'carousel') return slides;
  const has = (id: string) => !!byId[id];
  const docDark = docTplId === DARK;
  const ends = docDark ? (has('cards') ? 'cards' : '') : has(DARK) ? DARK : '';
  const contrastStat = docTplId === 'mint-clean' ? (has('cards') ? 'cards' : '') : has('mint-clean') ? 'mint-clean' : '';
  const contrastQuote = docDark ? (has('cards') ? 'cards' : '') : has(DARK) ? DARK : '';
  const bulletOrder = ['', 'grid', 'chat', 'flow'];
  let steps = 0;
  let points = 0;
  return slides.map((raw) => {
    const s: SlideData = clearRhythm([raw])[0];
    let tpl = '';
    if (s.type === 'cover' || s.type === 'cta') tpl = ends;
    else if (s.type === 'stat') tpl = contrastStat;
    else if (s.type === 'quote') tpl = contrastQuote;
    const t = slideTemplate(doc, { ...s, tpl }, byId);
    const out: SlideData = { ...s };
    if (tpl && tpl !== docTplId) out.tpl = tpl;
    if (s.type === 'step') {
      if (steps % 2 === 1 && t.slides['step~big']) out.variant = 'big';
      steps++;
    }
    if (s.type === 'bullets') {
      // try the layout for this turn, then the next ones, then the plain list
      const start = points % bulletOrder.length;
      for (let k = 0; k < bulletOrder.length; k++) {
        const v = bulletOrder[(start + k) % bulletOrder.length];
        if (!v || (t.slides[`bullets~${v}`] && fitsLayout(t, s, v))) {
          if (v) out.variant = v;
          break;
        }
      }
      points++;
    }
    if (s.type === 'cover') out.o = { ...(out.o || {}), bignum: false };
    return out;
  });
}

// Back to one template and the default layouts (keeps the user's own switches except the rhythm's)
export function clearRhythm(slides: SlideData[]): SlideData[] {
  return slides.map(({ tpl: _tpl, variant: _variant, ...s }) => {
    const o = { ...((s.o as Opts) || {}) };
    if (s.type === 'cover' && o.bignum === false) delete o.bignum;
    const out: SlideData = { ...s };
    if (Object.keys(o).length) out.o = o;
    else delete out.o;
    return out;
  });
}
