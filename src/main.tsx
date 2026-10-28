import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { href, lang, t } from './i18n';

document.documentElement.lang = lang;
document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

const title = t({
  ar: 'أحمد فرج | Ahmed Farag',
  en: 'Ahmed Farag',
});
const description = t({
  ar: 'أبني برامج وأدوات كنت أتمنى تكون موجودة، غالباً بالذكاء الاصطناعي.',
  en: 'I build the software and tools I wish already existed, usually with AI.',
});
const url = `https://ahmad-farag.com${href('')}`.replace(/\/$/, lang === 'ar' ? '/' : '');

// Keep the page title, description, link-preview tags and canonical address in step with the language
document.title = title;
const setMeta = (selector: string, attr: 'name' | 'property', key: string, value: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = value;
};
setMeta('meta[name="description"]', 'name', 'description', description);
setMeta('meta[property="og:title"]', 'property', 'og:title', title);
setMeta('meta[property="og:description"]', 'property', 'og:description', description);
setMeta('meta[property="og:url"]', 'property', 'og:url', url);
setMeta('meta[property="og:locale"]', 'property', 'og:locale', lang === 'ar' ? 'ar_SA' : 'en_US');
setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', url);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
