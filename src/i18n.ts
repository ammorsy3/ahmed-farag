// The site's language comes from the address: "/…" is Arabic (default), "/en/…" is English.
// Switching language is a normal link to the other address, so this is read once on load.
export type Lang = 'ar' | 'en';

const path = window.location.pathname.replace(/\/+$/, '');

export const lang: Lang = path === '/en' || path.startsWith('/en/') ? 'en' : 'ar';

export const dir = lang === 'ar' ? 'rtl' : 'ltr';

// Current page without the language prefix: '' is the home page, e.g. '/work/content-agent'
export const page = lang === 'en' ? path.slice(3) : path;

// Address of a page in the current language: href('/work/content-agent')
export function href(pagePath: string): string {
  return lang === 'en' ? `/en${pagePath}` : pagePath || '/';
}

// Link to a home-page section (e.g. '#work') that also works from other pages
export function sectionHref(hash: string): string {
  return page ? href('') + hash : hash;
}

// Address of the same page in the other language.
export const otherLangHref = lang === 'ar' ? `/en${page}` : page || '/';

// Pick the copy for the current language: t({ ar: '…', en: '…' })
export function t<T>(copy: Record<Lang, T>): T {
  return copy[lang];
}
