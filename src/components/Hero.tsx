import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { dir, lang, t } from '../i18n';
import HeroWorkflow from './HeroWorkflow';

// Phrases typed under the name. Framework: "I [do X]" = what I do + qualification + who I've helped.
const PHRASES = {
  ar: [
    'أبني أنظمة وأدوات كنت أتمنى تكون موجودة، غالباً بالذكاء الاصطناعي.',
    'أتخصص بالذكاء الاصطناعي، وأخلّيه يشتغل لصالحك.',
    'أسوي أنظمة وأدوات بالذكاء الاصطناعي تختصر عليك ساعات من الشغل.',
  ],
  en: [
    'I build the systems and tools I wish already existed, usually with AI.',
    'I specialize in AI, and I make it work in your favor.',
    'I build AI-powered systems and tools that save you hours of work.',
  ],
};

function useTypewriter(phrases: string[]) {
  const [text, setText] = useState('');
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setText(phrases[0]);
      return;
    }
    let i = 0;
    let n = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const full = phrases[i];
      n += deleting ? -1 : 1;
      setText(full.slice(0, n));
      let delay = deleting ? 44 : 55; // deleting takes 0.8x the time per character (a bit faster)
      if (!deleting && n === full.length) {
        deleting = true;
        delay = 2200;
      } else if (deleting && n === 0) {
        deleting = false;
        i = (i + 1) % phrases.length;
        delay = 400;
      }
      timer = setTimeout(tick, delay);
    };
    timer = setTimeout(tick, 600);
    return () => clearTimeout(timer);
  }, [phrases]);
  return text;
}

export default function Hero() {
  const typed = useTypewriter(PHRASES[lang]);
  // Generated once: the typewriter re-renders this component on every keystroke,
  // so random values computed inline would make the particles jump each time.
  const particles = useMemo(
    () =>
      [...Array(15)].map(() => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: Math.random() * 3 + 2,
        duration: Math.random() * 3 + 2,
        delay: Math.random() * 2,
      })),
    [],
  );
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-heading via-forest to-primary-hover -z-10">
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* -- Edge polish (sexy edges like purple version) -------------------------------- */}
      <div className="absolute inset-0 pointer-events-none -z-0">
        {/* Clean grid with edge fade */}
        <div
          className="
            absolute inset-0
            bg-[linear-gradient(to_right,rgba(126,217,87,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(126,217,87,0.10)_1px,transparent_1px)]
            bg-[size:26px_26px]
            [mask-image:radial-gradient(120%_100%_at_50%_50%,#000_55%,transparent)]
            [-webkit-mask-image:radial-gradient(120%_100%_at_50%_50%,#000_55%,transparent)]
          "
        />

        {/* Subtle center glow */}
        <div className="absolute inset-0 bg-[radial-gradient(800px_500px_at_50%_45%,rgba(47,191,63,0.18),transparent_70%)]" />

        {/* Corner glows */}
        <div className="absolute -top-24 -left-24 w-[32rem] h-[32rem] rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-[32rem] h-[32rem] rounded-full bg-lime/20 blur-3xl" />

        {/* Inner vignette */}
        <div className="absolute inset-0 shadow-[inset_0_0_140px_rgba(0,0,0,0.5)]" />

        {/* Top/bottom edge light */}
        <div className="absolute inset-0 bg-[radial-gradient(1000px_240px_at_50%_-120px,rgba(255,255,255,0.08),transparent),radial-gradient(1000px_240px_at_50%_calc(100%+120px),rgba(255,255,255,0.07),transparent)]" />
      </div>
      {/* ------------------------------------------------------------------------ */}

      {/* Floating particles (bolder + faster) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-lime/50 shadow-[0_0_6px_rgba(126,217,87,0.6)]"
            style={{ left: p.left, top: p.top, width: `${p.size}px`, height: `${p.size}px` }}
            animate={{ y: [-30, -140], opacity: [0, 1, 0] }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 lg:py-24 w-full">
        <div
          className="flex flex-col-reverse lg:flex-row items-center gap-10 lg:gap-16 text-center lg:text-start"
          dir={dir}
          lang={lang}
        >
          {/* Introduction (on the reading side: right in Arabic, left in English) */}
          <div className="flex-1 min-w-0">
            {/* Name (desktop) — extra line-height so Arabic marks (e.g. the shadda) aren't clipped.
                On phones it shows above the portrait instead (see below); only one is ever displayed. */}
            <h1 className="hidden lg:block text-6xl font-bold text-white mb-6 leading-[1.35] animate-slideUp">
              <span className="inline-block px-3 -mx-3 py-4 -my-4 text-transparent bg-clip-text bg-gradient-to-l from-lime to-bright">
                {t({ ar: 'أحمد فرج.', en: 'Ahmed Farag.' })}
              </span>
            </h1>

            {/* Typing line — fixed min-height so the layout doesn't jump while typing */}
            <p
              className="text-lg sm:text-xl text-white/90 max-w-xl mx-auto lg:mx-0 leading-loose min-h-[5.5rem] sm:min-h-[6rem] animate-slideUp delay-200"
              aria-label={PHRASES[lang][0]}
            >
              <span aria-hidden="true">{typed}</span>
              <span
                aria-hidden="true"
                className="inline-block w-[2px] h-[1.1em] align-middle bg-lime ms-1 animate-pulse"
              />
            </p>
          </div>

          {/* Portrait inside a live automation flow, so the hero is about the work, not only the face */}
          <div className="w-full lg:w-[30rem] xl:w-[34rem] lg:shrink-0">
            {/* Name (phones and tablets): sits above the portrait */}
            <h1 className="lg:hidden text-center text-4xl sm:text-5xl font-bold text-white mb-2 leading-[1.35] animate-slideUp">
              <span className="inline-block px-3 -mx-3 py-4 -my-4 text-transparent bg-clip-text bg-gradient-to-l from-lime to-bright">
                {t({ ar: 'أحمد فرج.', en: 'Ahmed Farag.' })}
              </span>
            </h1>
            <div className="animate-fadeIn">
              <HeroWorkflow src="/ahmed-cutout.png" alt={t({ ar: 'أحمد فرج', en: 'Ahmed Farag' })} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
