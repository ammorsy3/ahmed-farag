import { Linkedin, Mail } from 'lucide-react';
import { dir, lang, sectionHref, t } from '../i18n';
import Reveal from './Reveal';

const EMAIL = 'business@ahmad-farag.com';
const LINKEDIN = 'https://www.linkedin.com/in/ads-with-ahmed/';
const X_URL = 'https://x.com/ahmorsy07';

const copy = t({
  ar: {
    name: 'أحمد فرج',
    tagline: 'أبني برامج وأدوات كنت أتمنى تكون موجودة، غالباً بالذكاء الاصطناعي.',
    links: [
      { href: '#numbers', label: 'أرقامي' },
      { href: '#reviews', label: 'وش قالوا عني' },
      { href: '#help', label: 'كيف أقدر أساعدك' },
      { href: '#work', label: 'شغلي' },
      { href: '#talk', label: 'تواصل معي' },
    ],
    linkedin: 'لينكدإن',
  },
  en: {
    name: 'Ahmed Farag',
    tagline: 'I build the software and tools I wish already existed, usually with AI.',
    links: [
      { href: '#numbers', label: 'Numbers' },
      { href: '#reviews', label: 'Reviews' },
      { href: '#help', label: 'How I can help' },
      { href: '#work', label: 'Work' },
      { href: '#talk', label: 'Get in touch' },
    ],
    linkedin: 'LinkedIn',
  },
});

const sectionLinkClass = 'font-medium text-primary underline decoration-primary/40 underline-offset-4 transition-colors duration-200 hover:text-primary-hover hover:decoration-primary-hover';
const linkClass = 'text-body transition-colors duration-200 hover:text-primary';

export default function Footer() {
  return (
    <footer className="bg-white text-heading" dir={dir} lang={lang}>
      <Reveal className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="border-t border-line-strong pt-10 md:pt-12">
        <div className="grid gap-8 md:gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="mb-3 text-2xl font-bold">{copy.name}</p>
            <p className="max-w-sm leading-relaxed text-body">{copy.tagline}</p>
          </div>

          <nav aria-label={t({ ar: 'أقسام الموقع', en: 'Site sections' })}>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 md:block md:space-y-3">
              {copy.links.map((link) => (
                <li key={link.href}>
                  <a href={sectionHref(link.href)} className={sectionLinkClass}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <ul className="flex flex-wrap gap-x-6 gap-y-3 md:block md:space-y-3">
            <li>
              <a href={`mailto:${EMAIL}`} className={`inline-flex items-center gap-2.5 ${linkClass}`}>
                <Mail className="h-5 w-5 shrink-0" />
                <span dir="ltr">{EMAIL}</span>
              </a>
            </li>
            <li>
              <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2.5 ${linkClass}`}>
                <Linkedin className="h-5 w-5 shrink-0" />
                {copy.linkedin}
              </a>
            </li>
            <li>
              <a href={X_URL} aria-label="X" target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2.5 ${linkClass}`}>
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0 fill-current">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </li>
          </ul>
        </div>

        </div>
      </Reveal>
    </footer>
  );
}
