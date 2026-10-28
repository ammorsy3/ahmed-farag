import { AppWindow, AudioLines, Workflow, type LucideIcon } from 'lucide-react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { dir, lang, sectionHref, t } from '../i18n';
import Reveal from './Reveal';

type Item = { title: string; description: string; icon: LucideIcon };

const items: Item[] = t<Item[]>({
  ar: [
    { title: 'أوتوميشن', description: 'لو فيه شغل تعيده كل يوم، أخلّيه يشتغل لحاله.', icon: Workflow },
    { title: 'أنظمة ذكاء اصطناعي', description: 'لو تبي تستفيد من الذكاء الاصطناعي بس ما تدري من وين تبدأ، أبني لك أدوات جاهزة.', icon: AudioLines },
    { title: 'تطبيقات وبرامج', description: 'لو ما لقيت برنامج يسوي اللي تحتاجه، أبنيه لك.', icon: AppWindow },
  ],
  en: [
    { title: 'AI automation', description: 'If you keep doing the same task every day, I make it run on its own.', icon: Workflow },
    { title: 'AI systems', description: 'If you want to use AI but don’t know where to start, I build you ready-made tools.', icon: AudioLines },
    { title: 'Apps & software', description: 'If you can’t find software that does what you need, I build it for you.', icon: AppWindow },
  ],
});

function Card({ item, delay = 0 }: { item: Item; delay?: number }) {
  const Icon = item.icon;
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;
  return (
    <Reveal delay={delay} className="group relative overflow-hidden rounded-3xl border border-line bg-surface p-8 sm:p-10 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-white hover:shadow-[0_18px_40px_-24px_rgb(var(--color-forest)/0.5)]">
      <span className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-forest to-heading text-lime shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]">
        <Icon className="h-7 w-7" strokeWidth={1.75} />
      </span>
      <h3 className="mb-3 text-2xl sm:text-3xl font-bold text-heading">{item.title}</h3>
      <p className="mb-8 text-lg text-body leading-relaxed">{item.description}</p>
      <a
        href={sectionHref('#talk')}
        className="inline-flex items-center gap-1.5 border-b border-primary/40 pb-0.5 font-semibold text-primary transition-colors hover:border-primary-hover hover:text-primary-hover"
      >
        {t({ ar: 'خلّنا نتكلم', en: 'Let’s talk' })}
        <Arrow className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
      </a>
    </Reveal>
  );
}

export default function HowCanIHelp() {
  const [first, ...rest] = t({ ar: ['كيف أقدر', 'أساعدك؟'], en: ['How can', 'I help you?'] });
  return (
    <section id="help" className="py-20 lg:py-28 bg-white overflow-x-clip" dir={dir} lang={lang}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Two columns on wide screens (heading + first card on one side, the other two on the other); one column on phones */}
        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          <div className="space-y-6 md:space-y-8">
            <Reveal>
            <h2 className="pb-4 md:pb-8 text-3xl sm:text-5xl lg:text-6xl font-bold text-heading leading-[1.35]">
              {first}{' '}
              <br className="hidden sm:block" />
              <span className="relative inline-block px-2 -mx-2">
                {rest.join(' ')}
                {/* Hand-drawn ring around the last words */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 200 80"
                  preserveAspectRatio="none"
                  className="pointer-events-none absolute -inset-x-1 -inset-y-1 h-[calc(100%+0.5rem)] w-[calc(100%+0.5rem)] sm:-inset-x-3 sm:w-[calc(100%+1.5rem)] text-primary/70"
                >
                  <path
                    d="M100 5C45 4 6 20 6 42c0 22 42 33 96 32 55-1 93-14 92-35C193 18 150 4 96 8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </span>
            </h2>
            </Reveal>
            <Card item={items[0]} delay={0.1} />
          </div>
          <div className="space-y-6 md:space-y-8">
            <Card item={items[1]} />
            <Card item={items[2]} delay={0.1} />
          </div>
        </div>
      </div>
    </section>
  );
}
