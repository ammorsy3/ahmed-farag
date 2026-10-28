import { ArrowLeft, ArrowRight, ArrowUpLeft, ArrowUpRight } from 'lucide-react';
import { dir, href, lang, t } from '../i18n';
import { Demo, DemoPlayer, VideoSlot } from './AgentVisuals';
import Reveal from './Reveal';

type Project = {
  title: string;
  description: string; // one short line
  tags: string[];
  url?: string;
  image?: { src: string; alt: string }; // add a real screenshot here when available
  note?: string; // honest limits, e.g. the language an agent works in
  caseHref?: string; // the project's story page
  badge?: boolean; // 'Case Study' label; shown by default when there is a story page
  visual?: 'video'; // 'video' shows an empty video spot until `demo` is added
  demo?: Demo; // recorded demo; replaces the visual when added
};

const projects: Project[] = t<Project[]>({
  ar: [
    {
      title: 'بِد',
      description: 'منصة مشتريات تنشر فيها طلب عروض أسعار، وتدعو الموردين، وتقارن العروض بصيغة موحّدة.',
      tags: ['نشر طلبات العروض', 'دعوة الموردين', 'عروض موحّدة', 'أسئلة الموردين', 'مدعوم بالذكاء الاصطناعي', 'سوق مناقصات'],
      url: 'https://www.bidapp.sa/',
      image: { src: '/work/bid.webp', alt: 'شاشة ترحيب منصة بِد: أهلًا بك في Bid' },
    },
    {
      title: 'وكيل المحتوى',
      description: 'تعطيه فكرة المنشور، فيكتب النص ويصمم الصورة ويحفظهما وينشرهما على إنستغرام.',
      tags: ['كتابة المنشور', 'توليد الصورة', 'سجل كامل لكل منشور', 'إنستغرام'],
      caseHref: '/work/content-agent',
      visual: 'video',
    },
    {
      title: 'الوكيل الصوتي',
      description: 'نظام عرض يوري العملاء المحتملين كيف يرد وكيل ذكاء اصطناعي على مكالمة، ويحجز موعدًا، ويحوّل المكالمة.',
      tags: ['ما يفوتك اتصال', 'مواعيد تنحجز تلقائيًا', 'تحويل للفريق'],
      caseHref: '/work/voice-agent',
      badge: false,
      visual: 'video',
    },
  ],
  en: [
    {
      title: 'Bid',
      description: 'A procurement platform where you publish a request for quotation, invite suppliers, and compare their offers in one unified format.',
      tags: ['Publish RFQs', 'Invite suppliers', 'Unified proposals', 'Supplier questions', 'AI-powered', 'Tenders marketplace'],
      url: 'https://www.bidapp.sa/',
      image: { src: '/work/bid-en.webp', alt: 'Bid welcome screen: Welcome to Bid' },
    },
    {
      title: 'Content agent',
      description: 'Give it a post idea and it writes the copy, designs the image, saves both, and publishes them to Instagram.',
      tags: ['Post writing', 'Image generation', 'Full history of every post', 'Instagram'],
      caseHref: '/work/content-agent',
      visual: 'video',
    },
    {
      title: 'Voice agent',
      description: 'A demo system that shows prospects how an AI agent answers a call, books an appointment, and transfers the call.',
      tags: ['Never miss a call', 'Auto-booked appointments', 'Hands off to your team'],
      caseHref: '/work/voice-agent',
      badge: false,
      visual: 'video',
    },
  ],
});

export default function SelectedWork() {
  return (
    <section id="work" className="py-20 lg:py-28 bg-white" dir={dir} lang={lang}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
        <h2 className="text-3xl sm:text-4xl font-bold text-heading text-center leading-snug mb-14 lg:mb-16">
          {t({ ar: 'مشاريع اشتغلت عليها', en: 'Case studies' })}
        </h2>
        </Reveal>

        <div className="space-y-6">
          {projects.map((project) => (
            <Reveal as="article" key={project.title} className="rounded-2xl border border-line-strong bg-surface p-6 sm:p-10">
              {project.caseHref && project.badge !== false && (
                <span className="mb-4 inline-block rounded-full bg-mint px-3 py-1 text-xs font-semibold text-primary-hover ring-1 ring-inset ring-primary/20">
                  {t({ ar: 'دراسة حالة', en: 'Case Study' })}
                </span>
              )}
              <h3 className="text-4xl sm:text-5xl font-bold text-heading mb-4">{project.title}</h3>
              <p className="text-lg sm:text-xl text-body leading-relaxed max-w-2xl mb-6">{project.description}</p>

              <ul className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <li key={tag} className="rounded-md border border-line-strong bg-white px-3 py-1.5 text-sm text-body">
                    {tag}
                  </li>
                ))}
              </ul>

              {project.note && <p className="mt-4 text-sm text-muted">{project.note}</p>}

              {project.caseHref && (
                <a
                  href={href(project.caseHref)}
                  className="inline-flex items-center gap-1.5 mt-6 font-semibold text-primary hover:text-primary-hover transition-colors"
                >
                  {t({ ar: 'اعرف أكثر', en: 'Learn more' })}
                  {dir === 'rtl' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </a>
              )}

              {project.demo ? (
                <div className="mt-8 overflow-hidden rounded-xl border border-line-strong">
                  <DemoPlayer demo={project.demo} label={t({ ar: `عرض ${project.title}`, en: `${project.title} demo` })} />
                </div>
              ) : (
                project.visual && (
                  <div className="mt-8"><VideoSlot /></div>
                )
              )}

              {project.url && (
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-6 font-semibold text-primary hover:text-primary-hover transition-colors"
                >
                  {t({ ar: 'زيارة الموقع', en: 'Visit site' })}
                  {dir === 'rtl' ? <ArrowUpLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                </a>
              )}

              {project.image && (
                // Frame: a browser window with macOS-style traffic lights and the project's address
                <div className="mt-8 w-full overflow-hidden rounded-xl border border-line-strong bg-white shadow-[0_18px_40px_-20px_rgb(var(--color-heading)/0.35)]">
                  <div dir="ltr" className="flex items-center gap-3 border-b border-line bg-surface px-3.5 py-2.5">
                    {/* Real macOS window-control colors, not brand tokens */}
                    <span className="flex shrink-0 gap-1.5" aria-hidden="true">
                      <span className="h-3 w-3 rounded-full bg-[#FF5F57] ring-1 ring-inset ring-black/10" />
                      <span className="h-3 w-3 rounded-full bg-[#FEBC2E] ring-1 ring-inset ring-black/10" />
                      <span className="h-3 w-3 rounded-full bg-[#28C840] ring-1 ring-inset ring-black/10" />
                    </span>
                    {project.url && (
                      <span className="min-w-0 flex-1 truncate rounded-md border border-line bg-white px-2 py-1 text-center text-xs text-muted">
                        {new URL(project.url).hostname.replace(/^www\./, '')}
                      </span>
                    )}
                  </div>
                  {/* Full card width; on wider screens a 16:10 crop keeps it from getting too tall (the subject stays centered) */}
                  <img
                    src={project.image.src}
                    alt={project.image.alt}
                    className="aspect-square w-full object-cover sm:aspect-[16/10]"
                    loading="lazy"
                  />
                </div>
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
