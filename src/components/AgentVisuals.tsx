import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { AudioLines, CalendarCheck, CalendarClock, ImageIcon, Lightbulb, MessageCircle, PenLine, Play, PhoneForwarded, PhoneOff, Send, Workflow, type LucideIcon } from 'lucide-react';
import { dir, t } from '../i18n';

// A recorded demo: either an embed address (e.g. YouTube's https://www.youtube.com/embed/<id>)
// or a file in /public/work. `subtitlesAr` is a WebVTT file with Arabic subtitles for a file
// (the agents themselves work in English).
export type Demo = { embed?: string; src?: string; poster?: string; subtitlesAr?: string; audioOnly?: boolean };

export function DemoPlayer({ demo, label }: { demo: Demo; label: string }) {
  if (demo.embed) {
    return (
      <iframe
        src={demo.embed}
        title={label}
        className="aspect-video w-full bg-heading"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
      />
    );
  }
  if (demo.audioOnly) {
    return <audio controls preload="none" src={demo.src} aria-label={label} className="w-full" />;
  }
  return (
    <video
      controls
      preload="none"
      poster={demo.poster}
      aria-label={label}
      className="aspect-video w-full bg-heading object-cover"
    >
      <source src={demo.src} />
      {demo.subtitlesAr && <track kind="subtitles" srcLang="ar" label="العربية" src={demo.subtitlesAr} default />}
    </video>
  );
}

// Where a demo video goes until it's added
export function VideoSlot() {
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl border border-line-strong bg-gradient-to-b from-forest to-heading">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
        <Play className="h-6 w-6 text-white" fill="currentColor" />
      </span>
      <span className="text-sm text-white/70">{t({ ar: 'الفيديو قريب', en: 'Video coming soon' })}</span>
    </div>
  );
}

// Content agent: the steps it runs, lit one after another from the idea to the published post
const pipelineIcons = [[Lightbulb], [PenLine], [ImageIcon], [Send]];
const STEP_MS = 1000;
const HOLD_STEPS = 2; // beats to keep everything lit before the loop restarts

export function PipelineVisual() {
  const steps = t({
    ar: ['الفكرة', 'النص', 'الصورة', 'إنستغرام'],
    en: ['Idea', 'Copy', 'Image', 'Instagram'],
  });
  const reduceMotion = useReducedMotion();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => setTick((n) => (n + 1) % (steps.length + HOLD_STEPS)), STEP_MS);
    return () => clearInterval(id);
  }, [reduceMotion, steps.length]);
  const active = reduceMotion ? steps.length - 1 : Math.min(tick, steps.length - 1);

  return (
    <div className="rounded-xl bg-gradient-to-b from-forest to-heading px-4 py-8 shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] sm:px-8 sm:py-10">
      <ol className="grid grid-cols-4 items-start gap-1 sm:gap-2">
        {steps.map((step, i) => {
          const Icons = pipelineIcons[i];
          const last = i === steps.length - 1;
          const lit = i <= active;
          return (
            <li key={step} className="relative flex flex-col items-center text-center">
              {!last && (
                // Connector to the next step (to the left in Arabic, to the right in English); fills as the flow passes
                <span
                  aria-hidden="true"
                  className={`absolute top-6 h-0.5 w-full overflow-hidden rounded-full bg-white/15 sm:top-7 ${
                    dir === 'rtl' ? 'right-1/2' : 'left-1/2'
                  }`}
                >
                  <span
                    className="block h-full w-full bg-lime transition-transform duration-700 ease-out"
                    style={{
                      transform: i < active ? 'scaleX(1)' : 'scaleX(0)',
                      transformOrigin: dir === 'rtl' ? 'right' : 'left',
                    }}
                  />
                </span>
              )}
              <span
                className={`relative z-10 flex h-12 w-12 items-center justify-center gap-0.5 rounded-2xl ring-1 transition-all duration-500 sm:h-14 sm:w-14 ${
                  lit ? 'scale-105 bg-primary text-white ring-lime/60' : 'bg-heading text-white/50 ring-white/15'
                }`}
              >
                {Icons.map((Icon, k) => (
                  <Icon key={k} className={Icons.length > 1 ? 'h-4 w-4 sm:h-5 sm:w-5' : 'h-5 w-5 sm:h-6 sm:w-6'} strokeWidth={1.75} />
                ))}
              </span>
              <span
                className={`mt-3 text-[11px] font-medium leading-tight transition-colors duration-500 sm:text-sm ${
                  lit ? 'text-white' : 'text-white/50'
                }`}
              >
                {step}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// Voice agent: a dark, tactile "speaker" panel with a waveform and a glossy knob (decorative)
const bars = [3, 6, 10, 5, 14, 8, 18, 11, 22, 9, 16, 24, 12, 20, 7, 15, 10, 19, 6, 12, 4, 9, 5, 3];

export function VoiceVisual() {
  return (
    <div className="rounded-xl bg-gradient-to-b from-forest to-heading p-5 sm:p-8 shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]">
      <div
        dir="ltr"
        className="flex items-center gap-4 rounded-full bg-heading/80 py-3 pl-6 pr-3 shadow-[inset_0_2px_8px_rgb(0_0_0/0.6),0_1px_0_rgb(255_255_255/0.06)] sm:py-4 sm:pl-8"
      >
        <div className="flex h-12 flex-1 items-center justify-center gap-[3px] sm:gap-1" aria-hidden="true">
          {bars.map((h, i) => (
            <span
              key={i}
              className="animate-pulse w-[3px] rounded-full bg-lime/90"
              style={{ height: `${h * 2}px`, animationDelay: `${(i % 8) * 0.12}s` }}
            />
          ))}
        </div>
        {/* Glossy knob */}
        <span
          aria-hidden="true"
          className="h-12 w-12 shrink-0 rounded-full bg-[radial-gradient(circle_at_35%_30%,rgb(255_255_255/0.55),rgb(var(--color-forest))_45%,rgb(var(--color-heading))_75%)] shadow-[0_6px_14px_rgb(0_0_0/0.5),inset_0_-2px_4px_rgb(0_0_0/0.5)] ring-1 ring-white/10 sm:h-14 sm:w-14"
        />
      </div>
    </div>
  );
}

// Small icon set for the case-study cards
export type IconKey = 'chat' | 'calendar' | 'check' | 'transfer' | 'voice' | 'flow';
const iconMap: Record<IconKey, LucideIcon> = {
  chat: MessageCircle,
  calendar: CalendarClock,
  check: CalendarCheck,
  transfer: PhoneForwarded,
  voice: AudioLines,
  flow: Workflow,
};
export const iconFor = (key: IconKey): LucideIcon => iconMap[key];

// Voice agent: a sketch of a call, line by line, with the tool the agent reaches for between lines.
// Illustrative only (the real recording is a separate demo); the agent speaks English.
type CallLine = { who: 'caller' | 'agent'; text: string } | { who: 'tool'; text: string; icon: LucideIcon };
const callLines: CallLine[] = [
  { who: 'caller', text: 'Hi, do you have anything open Thursday afternoon?' },
  { who: 'tool', text: 'Check availability', icon: CalendarClock },
  { who: 'agent', text: 'I have 2:30 or 4:00 on Thursday. Which works better?' },
  { who: 'caller', text: '2:30, please.' },
  { who: 'tool', text: 'Book appointment', icon: CalendarCheck },
  { who: 'agent', text: 'You’re all set for Thursday at 2:30.' },
  { who: 'tool', text: 'End call', icon: PhoneOff },
];
const LINE_MS = 1300;

export function CallVisual() {
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(callLines.length);
  useEffect(() => {
    if (reduceMotion) return;
    setShown(1);
    const id = setInterval(() => setShown((n) => (n >= callLines.length + 2 ? 1 : n + 1)), LINE_MS);
    return () => clearInterval(id);
  }, [reduceMotion]);

  return (
    <figure className="rounded-xl bg-gradient-to-b from-forest to-heading p-4 sm:p-8 shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]">
      <div dir="ltr" className="mx-auto max-w-md space-y-3" aria-label="Sample call">
        {callLines.map((line, i) => {
          const visible = i < shown;
          const base = `transition-all duration-500 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`;
          if (line.who === 'tool') {
            const Icon = line.icon;
            return (
              <div key={i} className={`flex justify-center ${base}`}>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-lime/15 px-3 py-1 text-xs font-medium text-lime ring-1 ring-lime/30">
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                  {line.text}
                </span>
              </div>
            );
          }
          const agent = line.who === 'agent';
          return (
            <div key={i} className={`flex ${agent ? 'justify-end' : 'justify-start'} ${base}`}>
              <p
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed sm:text-base ${
                  agent ? 'rounded-br-sm bg-primary text-white' : 'rounded-bl-sm bg-white/10 text-white'
                }`}
              >
                {line.text}
              </p>
            </div>
          );
        })}
      </div>
      <figcaption className="mt-6 text-center text-xs text-white/60">
        {t({ ar: 'رسم توضيحي لسير مكالمة، مو نص التسجيل الفعلي', en: 'An illustrative sketch of a call, not a transcript of the recording' })}
      </figcaption>
    </figure>
  );
}
