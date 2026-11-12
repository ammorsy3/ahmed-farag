import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Bot, BrainCircuit, Code2, Workflow, type LucideIcon } from 'lucide-react';

// The hero portrait with four wordless icons of what Ahmed builds (AI agent, code, automation, AI),
// so the hero reads as "the work", not just "the person". Two per side; they stay still and
// light up in a zigzag along dashed connectors that pass behind the portrait.

const STEP_MS = 1100;
const HOLD_STEPS = 2; // beats with everything lit before the loop restarts

// Phones/tablets: top pair by the head, bottom pair low. Desktop (lg): top pair a bit lower, just above
// the head; bottom pair raised to chest height.
const nodes: { icon: LucideIcon; pos: string }[] = [
  { icon: Bot, pos: 'top-[6%] left-[2%] lg:top-[14%]' },
  { icon: Code2, pos: 'top-[6%] right-[2%] lg:top-[14%]' },
  { icon: Workflow, pos: 'bottom-[6%] left-[2%] lg:bottom-auto lg:top-[57%]' },
  {
    icon: BrainCircuit,
    pos: 'bottom-[6%] right-[2%] lg:bottom-auto lg:top-[57%]',
  },
];

// Connectors in a 0–100 box: agent → code → automation → AI (one set per layout above)
const paths = ['M 10 12 C 35 2, 65 2, 90 12', 'M 90 12 C 70 40, 30 60, 10 88', 'M 10 88 C 35 98, 65 98, 90 88'];
const pathsLg = ['M 10 20 C 35 8, 65 8, 90 20', 'M 90 20 C 70 42, 30 46, 10 63', 'M 10 63 C 35 75, 65 75, 90 63'];

export default function HeroWorkflow({ src, alt }: { src: string; alt: string }) {
  const reduceMotion = useReducedMotion();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => setTick((n) => (n + 1) % (nodes.length + HOLD_STEPS)), STEP_MS);
    return () => clearInterval(id);
  }, [reduceMotion]);
  const active = reduceMotion ? nodes.length : Math.min(tick, nodes.length);

  return (
    <div
      dir="ltr"
      className="relative mx-auto h-[23rem] w-full max-w-[22rem] sm:h-[28rem] sm:max-w-[30rem] lg:h-[min(70vh,34rem)] lg:max-w-[34rem]"
    >
      {[
        { set: paths, cls: 'lg:hidden' },
        { set: pathsLg, cls: 'hidden lg:block' },
      ].map(({ set, cls }) => (
        <svg
          key={cls}
          aria-hidden="true"
          className={`absolute inset-0 h-full w-full ${cls}`}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          fill="none"
        >
          {set.map((d, i) => (
            <g key={d}>
              <path d={d} stroke="rgb(255 255 255 / 0.12)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
              <path
                d={d}
                className="hero-flow"
                stroke="rgb(126 217 87)"
                strokeWidth="1.6"
                strokeDasharray="4 6"
                vectorEffect="non-scaling-stroke"
                style={{
                  opacity: active > i ? 0.9 : 0,
                  transition: 'opacity 600ms',
                }}
              />
            </g>
          ))}
        </svg>
      ))}

      {/* Portrait — waist-up cutout with a white sticker outline baked in */}
      <img
        src={src}
        alt={alt}
        className="absolute bottom-[6%] left-1/2 z-10 h-[80%] w-auto max-w-none -translate-x-1/2 drop-shadow-[0_20px_30px_rgba(0,0,0,0.35)]"
      />

      {nodes.map(({ icon: Icon, pos }, i) => {
        const lit = i <= active;
        return (
          <span
            key={i}
            aria-hidden="true"
            className={`absolute z-20 flex h-12 w-12 items-center justify-center rounded-2xl ring-1 shadow-[0_12px_30px_rgb(0_0_0/0.35)] transition-all duration-500 sm:h-16 sm:w-16 ${pos} ${
              lit ? 'scale-105 bg-primary text-white ring-lime/60' : 'bg-heading/85 text-white/60 ring-white/10'
            }`}
          >
            <Icon className="h-6 w-6 sm:h-8 sm:w-8" strokeWidth={1.75} />
          </span>
        );
      })}
    </div>
  );
}
