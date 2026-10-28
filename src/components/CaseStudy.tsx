import { ArrowLeft, ArrowRight } from 'lucide-react';
import { dir, lang, sectionHref, t } from '../i18n';
import { CallVisual, Demo, DemoPlayer, IconKey, PipelineVisual, VoiceVisual, VideoSlot, iconFor } from './AgentVisuals';

// One short story per project: the problem, the solution, how it works. Plain words, no jargon.
type Case = {
  name: string;
  title: string;
  intro: string;
  problem: string;
  solution: string;
  steps: { title: string; text: string }[];
  note?: string; // honest limits, e.g. the language it works in
  visual?: 'pipeline' | 'voice' | 'call';
  demo?: Demo;
  // Optional extra sections (used by the voice agent)
  shows?: { heading: string; items: { icon: IconKey; title: string; text: string }[] };
  built?: { heading: string; intro: string; items: { icon: IconKey; title: string; text: string }[] };
  why?: { heading: string; text: string };
  videoSoon?: boolean; // show the "video coming soon" slot until the recorded demo is added
};

// Address (without the language prefix) → story
export const caseStudies: Record<string, Case> = {
  '/work/content-agent': t<Case>({
    ar: {
      name: 'وكيل المحتوى',
      title: 'تكتب الفكرة، والوكيل يكمّل الباقي لين ينزل المنشور',
      intro: 'بنينا لوكالة إعلانات وكيل ذكاء اصطناعي يستلم فكرة المنشور، ويكتب النص، ويسوي الصورة، وينشر على إنستغرام.',
      problem:
        'وكالة إعلانات كانت تحتاج تنزّل منشورات باستمرار على إنستغرام. وكل منشور يمر بنفس الخطوات: فكرة، وكتابة، وتصميم صورة، ثم النشر. هذا الشغل المتكرر ياخذ من وقت الفريق، وكانت تبي طريقة أسرع.',
      solution: 'بنينا لهم وكيل واحد يمشي الخطوات كلها بالترتيب. فريق الوكالة يعطيه الفكرة بس، وهو يجهّز المنشور وينشره.',
      steps: [
        { title: 'فكرة المنشور', text: 'فريق الوكالة يكتب الموضوع اللي يبي ينشر عنه.' },
        { title: 'كتابة النص', text: 'الوكيل يكتب نص المنشور على حسب الفكرة.' },
        { title: 'تصميم الصورة', text: 'يولّد صورة تناسب المنشور بالذكاء الاصطناعي.' },
        { title: 'النشر', text: 'ينشر المنشور على إنستغرام.' },
      ],
      visual: 'pipeline',
    },
    en: {
      name: 'Content agent',
      title: 'You write the idea, the agent does the rest until the post is live',
      intro: 'We built an AI agent for an advertising agency. It takes a post idea, writes the copy, creates the image, and publishes to Instagram.',
      problem:
        'An advertising agency needed to publish posts steadily on Instagram. Every post went through the same steps: an idea, copy, an image, then publishing. That repetitive work took up the team’s time, and the agency wanted a faster way.',
      solution: 'We built them one agent that runs every step in order. The agency’s team only gives it the idea, and it prepares and publishes the post.',
      steps: [
        { title: 'Post idea', text: 'The agency’s team types the topic they want to post about.' },
        { title: 'Copy', text: 'The agent writes the post text based on the idea.' },
        { title: 'Image', text: 'It generates an image that fits the post with AI.' },
        { title: 'Publish', text: 'It publishes the post to Instagram.' },
      ],
      visual: 'pipeline',
    },
  }),
  '/work/voice-agent': t<Case>({
    ar: {
      name: 'الوكيل الصوتي',
      title: 'مكالمة كاملة يديرها الذكاء الاصطناعي: من «ألو» إلى حجز الموعد',
      intro:
        'نظام عرض بنيته لعميل، يستخدمه ليوري عملاءه المحتملين كيف يتكلم وكيل ذكاء اصطناعي في مكالمة هاتفية طبيعية، ويحجز مواعيد، ويحوّل المكالمة.',
      problem:
        'المكالمات الفائتة فرص ضايعة، والفريق ما يقدر يرد على كل اتصال في كل وقت. وصاحب العمل اللي يسمع عن «وكلاء الصوت» صعب عليه يتخيل كيف تكون المكالمة فعليًا، فيحتاج يسمعها بنفسه.',
      solution:
        'بنيت عرضًا حيًا يوضح الفكرة. في التسجيل التجريبي، الوكيل يشتغل موظف استقبال لعيادة علاج طبيعي (كايروبراكتك)، ويتغير السيناريو حسب مجال العميل المحتمل.',
      steps: [
        { title: 'المتصل يسأل', text: 'الوكيل يرد على المتصل ويجاوب أسئلته بصوت طبيعي.' },
        { title: 'يشوف المواعيد', text: 'يسترجع المواعيد المتاحة من التقويم ويعرضها على المتصل.' },
        { title: 'يحجز الموعد', text: 'يوري مسار حجز الموعد من أول الطلب إلى التأكيد.' },
        { title: 'يحوّل المكالمة', text: 'يحوّل المكالمة عبر أداة موصولة بالنظام لما الحاجة تتطلب.' },
        { title: 'يعرض الخدمة', text: 'ينتقل من السيناريو التجريبي إلى عرض ما يقدمه العميل من وكلاء صوتيين.' },
      ],
      shows: {
        heading: 'وش يوريه العرض',
        items: [
          { icon: 'chat', title: 'مكالمة طبيعية', text: 'يرد على أسئلة المتصل بدون قوالب جامدة.' },
          { icon: 'calendar', title: 'مواعيد متاحة', text: 'يطلع على التقويم ويقترح أوقات.' },
          { icon: 'check', title: 'مسار الحجز', text: 'يوضح كيف يتحول الطلب إلى موعد.' },
          { icon: 'transfer', title: 'تحويل المكالمة', text: 'يمرر المكالمة لجهة ثانية عند الحاجة.' },
        ],
      },
      built: {
        heading: 'وش بنيت',
        intro: 'ثلاث قطع تشتغل مع بعض:',
        items: [
          { icon: 'voice', title: 'Vapi', text: 'تجربة الوكيل الصوتي والمكالمة نفسها.' },
          { icon: 'flow', title: 'n8n', text: 'يربط الوكيل بأدواته ويدير سير العمل.' },
          { icon: 'calendar', title: 'Google Calendar', text: 'عقد التقويم في سير العمل للمواعيد. الأدوات: المواعيد المتاحة، وتحويل المكالمة، وإنهاؤها.' },
        ],
      },
      why: {
        heading: 'ليش يهم صاحب العمل',
        text: 'بدل ما تشرح لعميلك المحتمل وش يسوي وكيل الصوت، تخليه يسمعه. المكالمة التجريبية تختصر الشرح، وتخلي الفكرة ملموسة قبل أي نقاش عن الأسعار أو التفاصيل التقنية.',
      },
      note: 'هذا عرض توضيحي، مو عيادة حقيقية. المحادثة بالإنجليزي، وما أدّعي إن كل جزء مجرَّب في بيئة تشغيل فعلية.',
      visual: 'call',
      videoSoon: true,
    },
    en: {
      name: 'Voice agent',
      title: 'A whole phone call run by AI: from “hello” to a booked appointment',
      intro:
        'A demo system I built for a client to show prospects what an AI voice agent sounds like on a natural phone call: answering questions, booking appointments, and transferring the call.',
      problem:
        'Missed calls are missed opportunities, and no team can pick up every call at every hour. And a business owner who hears about “voice agents” has a hard time picturing what the call is really like, so they need to hear one.',
      solution:
        'I built a live demo that makes the idea concrete. In the recorded example the agent plays the receptionist of a chiropractic clinic, and the scenario changes to match each prospect’s industry.',
      steps: [
        { title: 'Caller asks', text: 'The agent answers the caller and responds to their questions in a natural voice.' },
        { title: 'Checks availability', text: 'It pulls open appointment times from the calendar and offers them.' },
        { title: 'Books the slot', text: 'It demonstrates the booking flow from request to confirmation.' },
        { title: 'Transfers the call', text: 'It hands the call over through a connected tool when needed.' },
        { title: 'Pitches the offer', text: 'It moves from the sample scenario into a demo of the client’s voice-agent offering.' },
      ],
      shows: {
        heading: 'What the demo shows',
        items: [
          { icon: 'chat', title: 'A natural call', text: 'Answers the caller’s questions without stiff scripts.' },
          { icon: 'calendar', title: 'Open times', text: 'Looks at the calendar and suggests slots.' },
          { icon: 'check', title: 'Booking flow', text: 'Shows how a request turns into an appointment.' },
          { icon: 'transfer', title: 'Call transfer', text: 'Passes the call on to someone else when needed.' },
        ],
      },
      built: {
        heading: 'What I built',
        intro: 'Three pieces working together:',
        items: [
          { icon: 'voice', title: 'Vapi', text: 'The voice agent and the phone-call experience itself.' },
          { icon: 'flow', title: 'n8n', text: 'Connects the agent to its tools and runs the workflow.' },
          { icon: 'calendar', title: 'Google Calendar', text: 'Calendar nodes in the workflow for scheduling. Tools: check availability, transfer the call, end it.' },
        ],
      },
      why: {
        heading: 'Why a business owner would care',
        text: 'Instead of explaining to a prospect what a voice agent does, you let them hear one. A demo call shortens the explanation and makes the idea tangible before any talk of pricing or technical details.',
      },
      note: 'This is a demonstration, not a deployed clinic receptionist. The call is in English, and I’m not claiming every part has been tested in a live production setup.',
      visual: 'call',
      videoSoon: true,
    },
  }),
};

export default function CaseStudy({ story }: { story: Case }) {
  const Back = dir === 'rtl' ? ArrowRight : ArrowLeft;
  return (
    <main dir={dir} lang={lang}>
      {/* Dark band so the fixed header stays readable; same gradient, grid and glows as the hero (no particles) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-heading via-forest to-primary-hover pt-32 pb-16 lg:pt-40 lg:pb-20">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="
              absolute inset-0
              bg-[linear-gradient(to_right,rgba(126,217,87,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(126,217,87,0.10)_1px,transparent_1px)]
              bg-[size:26px_26px]
              [mask-image:radial-gradient(120%_100%_at_50%_50%,#000_55%,transparent)]
              [-webkit-mask-image:radial-gradient(120%_100%_at_50%_50%,#000_55%,transparent)]
            "
          />
          <div className="absolute inset-0 bg-[radial-gradient(800px_500px_at_50%_45%,rgba(47,191,63,0.18),transparent_70%)]" />
          <div className="absolute -top-24 -left-24 w-[32rem] h-[32rem] rounded-full bg-primary/25 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-[32rem] h-[32rem] rounded-full bg-lime/20 blur-3xl" />
          <div className="absolute inset-0 shadow-[inset_0_0_140px_rgba(0,0,0,0.5)]" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <a
            href={sectionHref('#work')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            <Back className="w-4 h-4" />
            {t({ ar: 'المشاريع', en: 'Case studies' })}
          </a>
          <p className="mt-8 text-lime font-semibold">{story.name}</p>
          <h1 className="mt-3 text-3xl sm:text-5xl font-bold text-white leading-snug">{story.title}</h1>
          <p className="mt-6 text-lg sm:text-xl text-white/80 leading-relaxed">{story.intro}</p>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          {story.demo ? (
            <div className="overflow-hidden rounded-xl border border-line-strong">
              <DemoPlayer demo={story.demo} label={t({ ar: 'فيديو يوضح الوكيل وهو يشتغل', en: 'Video of the agent at work' })} />
            </div>
          ) : (
            <>
              {story.visual === 'pipeline' ? <PipelineVisual /> : story.visual === 'voice' ? <VoiceVisual /> : story.visual === 'call' ? <CallVisual /> : null}
              {story.videoSoon && <VideoSlot />}
            </>
          )}

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-heading mb-4">{t({ ar: 'المشكلة', en: 'The problem' })}</h2>
            <p className="text-lg text-body leading-relaxed">{story.problem}</p>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-heading mb-4">{t({ ar: 'الحل', en: 'The solution' })}</h2>
            <p className="text-lg text-body leading-relaxed">{story.solution}</p>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-heading mb-6">{t({ ar: 'كيف يشتغل', en: 'How it works' })}</h2>
            <ol className="space-y-4">
              {story.steps.map((step, i) => (
                <li key={step.title} className="flex gap-4 rounded-xl border border-line bg-surface p-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-bold text-heading">{step.title}</h3>
                    <p className="mt-1 text-body leading-relaxed">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {story.shows && (
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-heading mb-6">{story.shows.heading}</h2>
              <ul className="grid gap-4 sm:grid-cols-2">
                {story.shows.items.map((item) => {
                  const Icon = iconFor(item.icon);
                  return (
                    <li key={item.title} className="rounded-xl border border-line bg-surface p-5">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint text-primary-hover ring-1 ring-inset ring-primary/20">
                        <Icon className="h-5 w-5" strokeWidth={1.75} />
                      </span>
                      <h3 className="mt-3 font-bold text-heading">{item.title}</h3>
                      <p className="mt-1 text-body leading-relaxed">{item.text}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {story.built && (
            <div className="rounded-2xl bg-gradient-to-b from-forest to-heading p-6 sm:p-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">{story.built.heading}</h2>
              <p className="text-white/70 mb-6">{story.built.intro}</p>
              <ul className="grid gap-3 sm:grid-cols-3">
                {story.built.items.map((item) => {
                  const Icon = iconFor(item.icon);
                  return (
                    <li key={item.title} className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                      <Icon className="h-5 w-5 text-lime" strokeWidth={1.75} />
                      <h3 className="mt-3 font-bold text-white">{item.title}</h3>
                      <p className="mt-1 text-sm text-white/70 leading-relaxed">{item.text}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {story.why && (
            <div className="border-s-4 border-primary ps-5">
              <h2 className="text-2xl sm:text-3xl font-bold text-heading mb-4">{story.why.heading}</h2>
              <p className="text-lg text-body leading-relaxed">{story.why.text}</p>
            </div>
          )}

          {story.note && (
            <p className="rounded-xl border border-line-strong bg-mint px-5 py-4 text-heading">{story.note}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 border-t border-line pt-10">
            <a
              href={sectionHref('#talk')}
              className="bg-heading hover:bg-forest text-white px-8 py-4 rounded-xl text-lg sm:text-xl font-bold shadow-lg transition-colors"
            >
              {t({ ar: 'تبي شي مثله لشركتك؟ ارسل لي طلبك', en: 'Want something like this for your company? Tell me about it' })}
            </a>
            <a href={sectionHref('#work')} className="font-semibold text-primary hover:text-primary-hover transition-colors">
              {t({ ar: 'شوف باقي المشاريع', en: 'See other case studies' })}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
