import React from 'react';
import { motion } from 'framer-motion';
import { dir, lang, t } from '../i18n';

export default function Hero() {
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
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-lime/50 shadow-[0_0_6px_rgba(126,217,87,0.6)]"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 2}px`,  // randomized size 2–5px
              height: `${Math.random() * 3 + 2}px`,
            }}
            animate={{
              y: [-30, -140],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2, // faster: 2–5s
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
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
            {/* Badge */}
            <div className="inline-flex items-center px-5 py-2.5 bg-white/20 ring-1 ring-inset ring-white/40 backdrop-blur-sm rounded-full text-white text-lg sm:text-xl font-bold mb-8 animate-fadeIn">
              <span className="w-2 h-2 bg-lime rounded-full me-2 animate-pulse"></span>
              {t({ ar: 'أهلاً، أنا', en: <>Hi, I<span className="font-[system-ui]">’</span>m</> })}
            </div>

            {/* Main Headline — extra line-height so Arabic marks (e.g. the shadda) aren't clipped */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.35] animate-slideUp">
              <span className="inline-block px-3 -mx-3 py-4 -my-4 text-transparent bg-clip-text bg-gradient-to-l from-lime to-bright">
                {t({ ar: 'أحمد فرج.', en: 'Ahmed Farag.' })}
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-white/90 max-w-xl mx-auto lg:mx-0 leading-loose animate-slideUp delay-200">
              {t({
                ar: 'أبني برامج وأدوات كنت أتمنى تكون موجودة، غالباً بالذكاء الاصطناعي.',
                en: 'I build the software and tools I wish already existed, usually with AI.',
              })}
            </p>
          </div>

          {/* Portrait — waist-up, background-removed cutout (from AHMED2.jpg) with a white sticker outline baked in */}
          <div className="shrink-0 animate-fadeIn">
            <img
              src="/ahmed-cutout.png"
              alt={t({ ar: 'أحمد فرج', en: 'Ahmed Farag' })}
              className="h-72 sm:h-80 lg:h-[min(65vh,32rem)] w-auto drop-shadow-[0_20px_30px_rgba(0,0,0,0.35)]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
