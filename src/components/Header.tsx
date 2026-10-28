import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { dir, lang, otherLangHref, sectionHref, t } from '../i18n';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = t({
    ar: [
      { href: '#numbers', label: 'أرقامي' },
      { href: '#work', label: 'شغلي' },
      { href: '#reviews', label: 'وش قالوا عني' },
    ],
    en: [
      { href: '#numbers', label: 'Numbers' },
      { href: '#work', label: 'Work' },
      { href: '#reviews', label: 'Reviews' },
    ],
  });
  const bookCall = t({ ar: 'احجز مكالمة', en: 'Book a call' });
  // Label is written in the language it switches to
  const switchLabel = t({ ar: 'English', en: 'عربي' });
  const switchLang = lang === 'ar' ? 'en' : 'ar';

  return (
    <header className={`fixed w-full top-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/95 backdrop-blur-sm shadow-lg' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4 lg:py-6" dir={dir} lang={lang}>
          <div className="flex-shrink-0">
            <h1 className={`text-2xl font-bold transition-colors duration-300 ${
              isScrolled ? 'text-heading' : 'text-white'
            }`}>
              Ahmed Farag
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={sectionHref(link.href)}
                className={`font-medium hover:scale-105 transition-all duration-200 ${
                  isScrolled 
                    ? 'text-body hover:text-primary' 
                    : 'text-white/90 hover:text-white'
                }`}
              >
                {link.label}
              </a>
            ))}
            <a
              href={otherLangHref}
              lang={switchLang}
              className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors duration-200 ${
                isScrolled
                  ? 'border-line-strong text-body hover:border-primary hover:text-primary'
                  : 'border-white/30 text-white/90 hover:border-white hover:text-white'
              }`}
            >
              {switchLabel}
            </a>
            <a href="https://calendly.com/ahmorsy07/ai-booking-demo" target="_blank" rel="noopener noreferrer" className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg">
              {bookCall}
            </a>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`lg:hidden p-2 rounded-md transition-colors duration-300 ${
              isScrolled ? 'text-body' : 'text-white'
            }`}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden bg-white rounded-lg shadow-xl border border-line mt-2 mb-4" dir={dir} lang={lang}>
            <nav className="px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={sectionHref(link.href)}
                  className="block text-body hover:text-primary font-medium transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <a
                href={otherLangHref}
                lang={switchLang}
                className="block text-body hover:text-primary font-medium transition-colors duration-200"
              >
                {switchLabel}
              </a>
              <a href="https://calendly.com/ahmorsy07/ai-booking-demo" target="_blank" rel="noopener noreferrer" className="block w-full bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 text-center">
                {bookCall}
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}