import React, { useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Problems from './components/Problems';
import Solution from './components/Solution';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import Testimonials from './components/Testimonials';
import About from './components/About';
import CTA from './components/CTA';
import Footer from './components/Footer';

function App() {
  useEffect(() => {
    /* ---------- CONFIG ---------- */
    const STIFFNESS = 0.14;        // spring stiffness
    const DAMPING = 0.92;          // damping ratio
    const MAX_VEL = 4_000;         // px / s velocity cap
    const ARROW_STEP = 80;         // Arrow key delta
    const PAGE_STEP_MULT = 0.9;    // PageUp/PageDown multiplier
    const WHEEL_MULT = 1.0;        // wheel sensitivity

    /* ---------- EARLY EXIT FOR REDUCED-MOTION USERS ---------- */
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    /* ---------- STATE ---------- */
    let rafId: number | null = null;
    let currentY = window.scrollY;
    let targetY = currentY;
    let velocity = 0;
    let lastT = performance.now();

    /* ---------- HELPERS ---------- */
    const root = document.documentElement;
    const maxScroll = () => root.scrollHeight - window.innerHeight;
    const clamp = (v: number) => Math.max(0, Math.min(v, maxScroll()));
    const isTyping = () => {
      const ae = document.activeElement as HTMLElement | null;
      if (!ae) return false;
      return ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable;
    };
    const hasScrollableAncestor = (el: Element | null) => {
      while (el && el !== document.body) {
        const { overflowY } = window.getComputedStyle(el);
        if (['auto', 'scroll', 'overlay'].includes(overflowY)) {
          const h = (el as HTMLElement).scrollHeight;
          const ch = (el as HTMLElement).clientHeight;
          if (h > ch) return true;              // nested scroll region
        }
        if ((el as HTMLElement).dataset?.scrollIgnore === 'true') return true;
        el = el.parentElement!;
      }
      return false;
    };
    const normalizeWheel = (e: WheelEvent) => {
      const lineHeight = 24;                    // px per “line”
      const base = e.deltaMode === 1 ? e.deltaY * lineHeight : e.deltaY;
      return base * WHEEL_MULT;
    };

    /* ---------- MAIN RAF STEP ---------- */
    const step = (now: number) => {
      const dt = Math.max(0.001, Math.min(0.05, (now - lastT) / 1_000));
      lastT = now;

      const k = STIFFNESS * 1_000;
      const c = (1 - DAMPING) * 1_000;
      const dist = targetY - currentY;
      const accel = k * dist - c * velocity;

      velocity = Math.max(-MAX_VEL, Math.min(MAX_VEL, velocity + accel * dt));
      currentY += velocity * dt;

      const maxY = maxScroll();
      if (currentY < 0 || currentY > maxY) {
        currentY = clamp(currentY);
        velocity = 0;
      }

      window.scrollTo(0, Math.round(currentY));

      if (Math.abs(targetY - currentY) < 0.5 && Math.abs(velocity) < 5) {
        window.scrollTo(0, Math.round(targetY));
        rafId = null;
        velocity = 0;
        currentY = targetY;
        return;
      }
      rafId = requestAnimationFrame(step);
    };
    const ensureRAF = () => {
      if (rafId == null) {
        lastT = performance.now();
        rafId = requestAnimationFrame(step);
      }
    };

    /* ---------- EVENT HANDLERS ---------- */
    const onNativeScroll = () => {
      if (rafId == null) currentY = targetY = window.scrollY;
    };
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return;                    // allow pinch-zoom
      if (hasScrollableAncestor(e.target as Element)) return;
      e.preventDefault();
      const delta = normalizeWheel(e);
      const boost = Math.abs(delta) > 150 ? 1.5 : 1;
      targetY = clamp(targetY + delta * boost);
      ensureRAF();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTyping()) return;
      let delta = 0;
      switch (e.key) {
        case 'ArrowDown': delta = ARROW_STEP; break;
        case 'ArrowUp':   delta = -ARROW_STEP; break;
        case 'PageDown':  delta = window.innerHeight * PAGE_STEP_MULT; break;
        case 'PageUp':    delta = -window.innerHeight * PAGE_STEP_MULT; break;
        case 'Home':      targetY = 0; break;
        case 'End':       targetY = maxScroll(); break;
        case ' ':         delta = window.innerHeight * PAGE_STEP_MULT; break;
        default: return;
      }
      e.preventDefault();
      if (delta) targetY = clamp(targetY + delta);
      ensureRAF();
    };
    const onAnchorClick = (e: Event) => {
      const link = e.currentTarget as HTMLAnchorElement;
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      const dest = document.querySelector(href);
      if (!dest) return;
      e.preventDefault();
      const y = dest.getBoundingClientRect().top + window.scrollY;
      targetY = clamp(y);
      ensureRAF();
    };
    const onResize = () => {
      targetY = clamp(targetY);
      currentY = clamp(currentY);
    };

    /* ---------- LISTENER REGISTRATION ---------- */
    window.addEventListener('scroll', onNativeScroll, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'));
    anchors.forEach(a => a.addEventListener('click', onAnchorClick));

    /* ---------- CLEANUP ---------- */
    return () => {
      window.removeEventListener('scroll', onNativeScroll);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
      anchors.forEach(a => a.removeEventListener('click', onAnchorClick));
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <Header />
      <Hero />
      <Problems />
      <Solution />
      <Features />
      <HowItWorks />
      <Testimonials />
      <About />
      <CTA />
      <Footer />
    </>
  );
}

export default App;
