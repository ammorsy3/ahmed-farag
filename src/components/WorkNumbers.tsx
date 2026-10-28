import { dir, lang, t } from '../i18n';
import Reveal from './Reveal';

// Edit these to update the figures shown in the section (keep both languages in sync).
const numbers = t({
  ar: [
    { value: '+200,000', unit: 'ريال', description: 'مبيعات حققها العميل' },
    { value: '+70,000', unit: 'ريال', description: 'مبيعات خلال شهرين' },
  ],
  en: [
    { value: '+200,000', unit: 'SAR', description: 'in sales for a client' },
    { value: '+70,000', unit: 'SAR', description: 'in sales in two months' },
  ],
});

export default function WorkNumbers() {
  return (
    <section id="numbers" className="py-20 lg:py-24 bg-mint" dir={dir} lang={lang}>
      <Reveal className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-heading text-center leading-snug mb-12 lg:mb-14">
          {t({ ar: 'من شغلي بالأرقام', en: 'My work in numbers' })}
        </h2>

        <div className={`grid sm:grid-cols-2 sm:divide-x divide-primary/20 ${dir === 'rtl' ? 'sm:divide-x-reverse' : ''}`}>
          {numbers.map((item, index) => (
            <div
              key={index}
              className={`text-center py-8 sm:py-2 sm:px-8 ${index > 0 ? 'border-t border-primary/20 sm:border-t-0' : ''}`}
            >
              <div className="flex items-baseline justify-center gap-2 mb-3">
                {/* LTR so the "+" stays in front of the number inside the RTL layout */}
                <span dir="ltr" className="text-5xl lg:text-6xl font-bold text-heading tracking-tight">
                  {item.value}
                </span>
                <span className="text-xl lg:text-2xl font-semibold text-primary">{item.unit}</span>
              </div>
              <p className="text-lg text-body">{item.description}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
