// What a visitor wants help with. The service CTAs pick one, and the contact form starts with it selected.
import { href, page, t } from '../i18n';

export const needs = ['automation', 'ai-tool', 'app', 'website', 'other'] as const;
export type Need = (typeof needs)[number];

// Short labels for the choice chips in the form
export const needLabels: Record<Need, string> = t({
  ar: {
    automation: 'أتمتة شغلي بالذكاء الاصطناعي',
    'ai-tool': 'أداة ذكاء اصطناعي',
    app: 'تطبيق أو برنامج',
    website: 'موقع إلكتروني',
    other: 'شي ثاني',
  },
  en: {
    automation: 'Automate my workflow with AI',
    'ai-tool': 'An AI tool',
    app: 'An app or software',
    website: 'A website',
    other: 'Something else',
  },
});

export const isNeed = (v: unknown): v is Need => needs.includes(v as Need);

const EVENT = 'consult:need';

// Link to the contact form with a need chosen. From other pages it goes home with ?need=…
export function talkHref(need: Need): string {
  return page ? `${href('')}?need=${need}#talk` : '#talk';
}

// Call from the CTA's click: tells the form on this page which need to select
export function pickNeed(need: Need) {
  window.dispatchEvent(new CustomEvent<Need>(EVENT, { detail: need }));
}

export function onNeedPicked(cb: (need: Need) => void): () => void {
  const handler = (e: Event) => {
    const need = (e as CustomEvent).detail;
    if (isNeed(need)) cb(need);
  };
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

// A need passed in the address (?need=website), e.g. from a project page or a shared link
export function needFromUrl(): Need | '' {
  const v = new URLSearchParams(window.location.search).get('need');
  return isNeed(v) ? v : '';
}
