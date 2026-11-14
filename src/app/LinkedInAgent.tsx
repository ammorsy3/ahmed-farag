import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { renderDoc, check, limitsFor } from './linkedin-templates/engine.js';
import { brandCss, AUTHOR } from './linkedin-templates/brand.js';
import fatimahRegular from './linkedin-templates/fonts/FatimahArabic-Regular.woff?url';
import fatimahHeavy from './linkedin-templates/fonts/FatimahArabic-Heavy.woff?url';
import inter400 from './linkedin-templates/fonts/Inter-400.woff2?url';
import inter600 from './linkedin-templates/fonts/Inter-600.woff2?url';
import inter800 from './linkedin-templates/fonts/Inter-800.woff2?url';

// Ported from agent-demos/src/LinkedInAgent.tsx (same logic); here it lives at ahmad-farag.com/app.
// Drives the n8n "LinkedIn content agent" workflow (through the Vercel function at /api/linkedin, which
// checks the session cookie and adds the webhook key):
// templates → draft (Claude) → [AI picture] → edit with a live preview → render (Gotenberg) → publish or schedule.
// The preview uses the same template engine n8n uses, so what you see is what gets posted.
// Nothing reaches LinkedIn until the publish button is pressed.

type PostType = 'text' | 'image' | 'carousel';
type Slide = { type: string; [field: string]: string | string[] | undefined };
type Template = { id: string; name: string; nameAr: string; kind: 'carousel' | 'image'; css: string; slides: Record<string, string>; limits: Record<string, number> };
type TemplateRow = { template_id: string; name: string; name_ar: string; kind: 'carousel' | 'image'; css: string; slides_json: string; limits_json: string };
type Draft = { post_text: string; doc_title: string; image_brief: string; template_id: string; slides: Slide[]; issues: string[] };
type Rendered = { file_b64: string; mime: string; kind: string; slide_count: number; issues: string[]; bytes: number };
type HistoryRow = { ref?: string; post_type?: string; template_id?: string; idea?: string; post_text?: string; status?: string; post_url?: string; scheduled_at?: string; createdAt?: string };
type StepKey = 'draft' | 'picture' | 'render' | 'publish';
type StepState = { status: 'pending' | 'active' | 'done' | 'error'; startedAt?: number; ms?: number };
type Phase = 'idle' | 'working' | 'review' | 'publishing' | 'published' | 'scheduled';

const STEP_LABELS: Record<StepKey, string> = {
  draft: 'كتابة المنشور',
  picture: 'توليد الصورة',
  render: 'تجهيز الملف',
  publish: 'النشر على لينكدإن',
};
const POST_TYPES: { id: PostType; label: string; hint: string }[] = [
  { id: 'text', label: 'نص فقط', hint: 'منشور مكتوب' },
  { id: 'image', label: 'صورة', hint: 'بطاقة وحدة' },
  { id: 'carousel', label: 'كاروسيل', hint: 'ملف PDF يتقلّب' },
];
const SLIDE_NAMES: Record<string, string> = {
  cover: 'الغلاف', bullets: 'نقاط', step: 'خطوة', stat: 'رقم', quote: 'اقتباس', cta: 'الختام', tip: 'نصيحة', picture: 'صورة',
};
const FIELDS: Record<string, string[]> = {
  cover: ['kicker', 'title', 'subtitle'],
  bullets: ['kicker', 'title', 'bullets'],
  step: ['n', 'title', 'body'],
  stat: ['value', 'label', 'note'],
  quote: ['text', 'by'],
  cta: ['title', 'body', 'action'],
  tip: ['kicker', 'title', 'bullets'],
  picture: ['title', 'subtitle'],
};
const FIELD_NAMES: Record<string, string> = {
  kicker: 'سطر صغير فوق العنوان', title: 'العنوان', subtitle: 'سطر تحت العنوان', bullets: 'النقاط (كل سطر نقطة)', n: 'رقم الخطوة',
  body: 'النص', value: 'الرقم الكبير', label: 'وش يعني الرقم', note: 'ملاحظة', text: 'الاقتباس', by: 'القائل', action: 'الدعوة',
};
const LONG_FIELDS = new Set(['subtitle', 'body', 'text', 'note', 'label', 'bullets']);
const CAPTION_MAX = 3000;
const LINK_WAIT_MS = 100_000;

const FONT_URLS: Record<string, string> = {
  'FatimahArabic-Regular.woff': fatimahRegular,
  'FatimahArabic-Heavy.woff': fatimahHeavy,
  'Inter-400.woff2': inter400,
  'Inter-600.woff2': inter600,
  'Inter-800.woff2': inter800,
};
const BRAND_CSS: string = brandCss((f: string) => new URL(FONT_URLS[f], location.href).href);

// Vercel caps a function's request and response at 4.5 MB
const MAX_BYTES = 4_400_000;
const mb = (n: number) => (n / 1_000_000).toFixed(1);
export const SIGNED_OUT_EVENT = 'app:signed-out';

async function callAgent<T>(body: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const payload = JSON.stringify(body);
  const size = new Blob([payload]).size;
  if (size > MAX_BYTES) {
    throw new Error(`الطلب كبير (${mb(size)} MB) والحد ${mb(MAX_BYTES)} MB. غالباً الصورة كبيرة؛ جرّب «صورة ثانية» أو قالب بدون صورة.`);
  }
  const res = await fetch('/api/linkedin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    signal,
  });
  const text = await res.text();
  if (res.status === 401) {
    window.dispatchEvent(new Event(SIGNED_OUT_EVENT));
    throw new Error('انتهت الجلسة. ادخل كلمة المرور مرة ثانية.');
  }
  if (res.status === 413) throw new Error(`الطلب أكبر من حد Vercel (٤٫٥ MB).`);
  if (!res.ok) {
    let code = '';
    try {
      code = JSON.parse(text)?.error || '';
    } catch {
      /* not JSON */
    }
    if (code === 'response_too_large') throw new Error('رد n8n أكبر من حد Vercel (٤٫٥ MB)، فما وصل. الملف كبير زيادة.');
    if (code === 'n8n_timeout') throw new Error('n8n طوّل أكثر من ٥ دقايق. جرّب مرة ثانية.');
    if (code === 'not_configured') throw new Error('متغيرات البيئة ناقصة في Vercel (LINKEDIN_WEBHOOK_URL / LINKEDIN_WEBHOOK_SECRET).');
    if (code === 'n8n_rejected_key') throw new Error('n8n رفض المفتاح (403): قيمة LINKEDIN_WEBHOOK_SECRET في Vercel ما تطابق credential «LinkedIn agent key» في n8n.');
    if (code === 'n8n_not_found') throw new Error('n8n ما لقى الـwebhook (404): تأكد من LINKEDIN_WEBHOOK_URL في Vercel وإن الـworkflow منشور.');
    if (code === 'n8n_unreachable') throw new Error('ما قدرنا نوصل لـn8n: تأكد من LINKEDIN_WEBHOOK_URL في Vercel.');
    throw new Error(`رد الوكيل بخطأ ${res.status}: ${text.slice(0, 300)}`);
  }
  try {
    const data = JSON.parse(text);
    const listy = body.action === 'templates' || body.action === 'history';
    return (Array.isArray(data) && !listy ? data[0] : data) as T;
  } catch {
    throw new Error('رد الوكيل بشي ما فهمناه.');
  }
}

function toTemplate(r: TemplateRow): Template {
  return { id: r.template_id, name: r.name, nameAr: r.name_ar, kind: r.kind, css: r.css, slides: JSON.parse(r.slides_json), limits: JSON.parse(r.limits_json || '{}') };
}

function elapsed(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

// datetime-local value for "now + minutes", in the browser's local time
function localInput(minutesFromNow: number) {
  const d = new Date(Date.now() + minutesFromNow * 60_000);
  d.setSeconds(0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

const plain = (v: unknown) => String(v ?? '').replace(/==/g, '');

export default function LinkedInAgent() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesState, setTemplatesState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [templatesError, setTemplatesError] = useState('');

  const [idea, setIdea] = useState('');
  const [postType, setPostType] = useState<PostType>('carousel');
  const [templateId, setTemplateId] = useState('');
  // the post being edited keeps its own type and template; the form above picks the next one
  const [draftType, setDraftType] = useState<PostType>('carousel');
  const [draftTpl, setDraftTpl] = useState('');

  const [phase, setPhase] = useState<Phase>('idle');
  const [steps, setSteps] = useState<Partial<Record<StepKey, StepState>>>({});
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState<'' | 'draft' | 'picture' | 'render'>('');

  const [postText, setPostText] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [imageBrief, setImageBrief] = useState('');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [selected, setSelected] = useState(0);

  const [rendered, setRendered] = useState<(Rendered & { key: string }) | null>(null);
  const [scheduleOn, setScheduleOn] = useState(false);
  const [scheduleAt, setScheduleAt] = useState(localInput(60));
  const [postUrl, setPostUrl] = useState('');
  // LinkedIn needs ~1–2 min to process a carousel/image before its link opens (tested: ~80 s);
  // until then the link shows "Post not found", so the button waits
  const [linkReadyAt, setLinkReadyAt] = useState(0);

  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [historyState, setHistoryState] = useState<'loading' | 'ready' | 'error'>('loading');

  const topic = useRef('');
  const inFlight = useRef(false);
  const abort = useRef<AbortController | null>(null);

  const ticking = phase === 'working' || phase === 'publishing' || busy !== '' || (!!postUrl && now < linkReadyAt);
  useEffect(() => {
    if (!ticking) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [ticking]);

  useEffect(() => {
    loadTemplates();
    loadHistory();
  }, []);

  async function loadTemplates() {
    try {
      const rows = await callAgent<TemplateRow[]>({ action: 'templates' });
      const list = (Array.isArray(rows) ? rows : []).filter((r) => r && r.template_id).map(toTemplate);
      setTemplates(list);
      setTemplatesState('ready');
    } catch (err) {
      setTemplatesError((err as Error).message);
      setTemplatesState('error');
    }
  }

  async function loadHistory() {
    try {
      const rows = await callAgent<HistoryRow[]>({ action: 'history' });
      setHistory(Array.isArray(rows) ? rows.filter((r) => r && r.ref) : []);
      setHistoryState('ready');
    } catch {
      setHistoryState('error');
    }
  }

  const kindTemplates = templates.filter((t) => (postType === 'carousel' ? t.kind === 'carousel' : postType === 'image' ? t.kind === 'image' : false));
  const template = templates.find((t) => t.id === draftTpl) || null;
  // templates the open post can switch to: same kind, and every slide type it uses exists there
  const draftTemplates = templates.filter((t) => t.kind === (draftType === 'carousel' ? 'carousel' : 'image') && slides.every((sl) => sl.type in t.slides));

  // keep a valid template picked for the chosen post type
  useEffect(() => {
    if (postType === 'text') return;
    if (!kindTemplates.some((t) => t.id === templateId)) setTemplateId(kindTemplates[0]?.id || '');
  }, [postType, templates]); // eslint-disable-line react-hooks/exhaustive-deps

  async function step<T>(key: StepKey, fn: () => Promise<T>): Promise<T> {
    const startedAt = Date.now();
    setSteps((s) => ({ ...s, [key]: { status: 'active', startedAt } }));
    try {
      const value = await fn();
      setSteps((s) => ({ ...s, [key]: { status: 'done', ms: Date.now() - startedAt } }));
      return value;
    } catch (e) {
      setSteps((s) => ({ ...s, [key]: { status: 'error', ms: Date.now() - startedAt } }));
      throw e;
    }
  }

  const needsPicture = !!template && 'picture' in template.slides && draftType === 'image';
  const needsFile = draftType !== 'text';

  async function writeDraft(type: PostType, tpl: string, signal?: AbortSignal) {
    const d = await step('draft', () =>
      callAgent<Draft>({ action: 'draft', idea: topic.current, post_type: type, template_id: type === 'text' ? '' : tpl }, signal)
    );
    setPostText(d.post_text || '');
    setDocTitle(d.doc_title || '');
    setImageBrief(d.image_brief || '');
    setSlides(Array.isArray(d.slides) ? d.slides : []);
    setSelected(0);
    setRendered(null);
    return d;
  }

  async function makePicture(brief: string, signal?: AbortSignal) {
    const r = await step('picture', () => callAgent<{ image_url: string }>({ action: 'image', image_brief: brief, idea: topic.current }, signal));
    setSlides((list) => list.map((s, i) => (i === 0 ? { ...s, image_url: r.image_url } : s)));
  }

  async function generate(e: FormEvent) {
    e.preventDefault();
    if (!idea.trim() || inFlight.current || (postType !== 'text' && !templateId)) return;
    inFlight.current = true;
    topic.current = idea.trim();
    abort.current = new AbortController();
    const signal = abort.current.signal;

    setPhase('working');
    setError('');
    setPostUrl('');
    setScheduleOn(false);
    setSlides([]);
    setPostText('');
    setRendered(null);
    setNow(Date.now());
    const formTpl = templates.find((t) => t.id === templateId);
    const pic = postType === 'image' && !!formTpl && 'picture' in formTpl.slides;
    setDraftType(postType);
    setDraftTpl(postType === 'text' ? '' : templateId);
    setSteps({
      draft: { status: 'pending' },
      ...(pic ? { picture: { status: 'pending' } } : {}),
      ...(postType !== 'text' ? { render: { status: 'pending' } } : {}),
      publish: { status: 'pending' },
    });

    try {
      const d = await writeDraft(postType, templateId, signal);
      setPhase('review');
      if (pic) {
        setBusy('picture');
        await makePicture(d.image_brief || topic.current, signal).finally(() => setBusy(''));
      }
    } catch (err) {
      setError((err as Error).name === 'AbortError' ? 'وقّفت الانتظار.' : (err as Error).message);
      setPhase((p) => (p === 'review' ? 'review' : 'idle'));
    } finally {
      inFlight.current = false;
    }
  }

  async function regenerate(which: 'draft' | 'picture') {
    if (busy || inFlight.current) return;
    setBusy(which);
    setError('');
    setNow(Date.now());
    try {
      if (which === 'draft') {
        const d = await writeDraft(draftType, draftTpl);
        if (needsPicture) await makePicture(d.image_brief || topic.current);
      } else {
        await makePicture(imageBrief || topic.current);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy('');
    }
  }

  // what the file would contain right now; a render is only reused while this stays the same
  const contentKey = JSON.stringify([draftTpl, slides]);
  const issues: string[] = useMemo(() => (template && slides.length ? check(template, { slides }) : []), [template, slides]);
  const fileReady = !!rendered && rendered.key === contentKey;

  async function render(): Promise<Rendered> {
    if (fileReady && rendered) return rendered;
    const r = await step('render', () => callAgent<Rendered>({ action: 'render', template_id: draftTpl, slides }));
    if (!r.file_b64) throw new Error('ما رجع ملف من Gotenberg.');
    setRendered({ ...r, key: contentKey });
    return r;
  }

  async function renderNow() {
    if (busy || inFlight.current) return;
    setBusy('render');
    setError('');
    setNow(Date.now());
    try {
      await render();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy('');
    }
  }

  const scheduleDate = new Date(scheduleAt);
  const scheduleMinutes = (scheduleDate.getTime() - Date.now()) / 60_000;
  const scheduleValid = !scheduleOn || (scheduleMinutes >= 10 && scheduleMinutes <= 30 * 24 * 60);
  const pictureMissing = needsPicture && !slides[0]?.image_url;
  const canPublish =
    phase === 'review' && !busy && postText.trim().length > 0 && postText.length <= CAPTION_MAX && issues.length === 0 && scheduleValid && !pictureMissing && (!needsFile || slides.length > 0);

  async function publish() {
    if (inFlight.current || !canPublish) return;
    inFlight.current = true;
    setPhase('publishing');
    setError('');
    setNow(Date.now());
    try {
      const file = needsFile ? await render() : null;
      const r = await step('publish', () =>
        callAgent<{ published?: boolean; scheduled?: boolean; post_url?: string }>({
          action: 'publish',
          post_type: draftType,
          post_text: postText,
          doc_title: docTitle || 'Ahmed Farag',
          template_id: draftType === 'text' ? '' : draftTpl,
          idea: topic.current,
          // the picture travels inside the file already; keep history rows small
          slides: slides.map(({ image_url, ...s }) => s),
          file_b64: file?.file_b64 || '',
          mime: file?.mime || '',
          schedule_at: scheduleOn ? scheduleDate.toISOString() : '',
        })
      );
      setPostUrl(r.post_url || '');
      setLinkReadyAt(draftType === 'text' ? 0 : Date.now() + LINK_WAIT_MS);
      setNow(Date.now());
      setPhase(r.scheduled ? 'scheduled' : 'published');
      loadHistory();
    } catch (err) {
      setError((err as Error).message);
      setPhase('review');
    } finally {
      inFlight.current = false;
    }
  }

  function reset() {
    setPhase('idle');
    setSteps({});
    setSlides([]);
    setPostText('');
    setRendered(null);
    setPostUrl('');
    setIdea('');
  }

  // ---- slide editing ----
  function updateSlide(i: number, patch: Partial<Slide>) {
    setSlides((list) => list.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  }
  function moveSlide(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= slides.length) return;
    setSlides((list) => {
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setSelected(j);
  }
  function removeSlide(i: number) {
    setSlides((list) => list.filter((_, j) => j !== i));
    setSelected((s) => Math.max(0, Math.min(s, slides.length - 2)));
  }
  function addSlide(type: string) {
    const at = Math.min(selected + 1, slides.length);
    setSlides((list) => [...list.slice(0, at), { type, title: '' }, ...list.slice(at)]);
    setSelected(at);
  }

  const statusText =
    phase === 'idle' ? 'جاهز'
    : phase === 'working' ? 'يكتب'
    : phase === 'review' ? (busy ? 'يشتغل' : 'جاهز للمراجعة')
    : phase === 'publishing' ? 'ينشر'
    : phase === 'scheduled' ? 'مجدول'
    : 'انتشر';
  const statusClass = phase === 'working' || phase === 'publishing' || busy ? 'running' : phase === 'idle' ? (error ? 'error' : 'idle') : 'done';
  const showSteps = Object.keys(steps).length > 0;
  const editable = phase === 'review' && !busy;
  const limits = limitsFor(template);
  const stageWidth = useStageWidth();
  const current = slides[selected];

  return (
    <section className={`device content li ${phase === 'idle' ? '' : 'wide'}`} dir="rtl" lang="ar">
      <div className="device-head">
        <div>
          <p className="eyebrow">لينكدإن · أحمد فرج</p>
          <h1>وكيل محتوى لينكدإن</h1>
        </div>
        <span className={`status ${statusClass}`}>
          <i />
          {statusText}
        </span>
      </div>

      {templatesState === 'error' && (
        <p className="notice">
          ما قدرنا نجيب القوالب.
          {templatesError && <span className="notice-detail">{templatesError}</span>}
        </p>
      )}

      <form className="well" onSubmit={generate}>
        <label className="label" htmlFor="idea">فكرة المنشور</label>
        <textarea
          id="idea"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="مثال: ليه أغلب الشركات تفشل في أول وكيل ذكاء اصطناعي"
          rows={3}
          disabled={phase === 'working' || phase === 'publishing'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) generate(e);
          }}
        />

        <div className="li-pick">
          <span className="li-pick-label">نوع المنشور</span>
          <div className="seg" role="radiogroup" aria-label="نوع المنشور">
            {POST_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={postType === t.id}
                className={`seg-btn ${postType === t.id ? 'on' : ''}`}
                onClick={() => setPostType(t.id)}
                disabled={phase === 'working' || phase === 'publishing'}
              >
                <strong>{t.label}</strong>
                <span>{t.hint}</span>
              </button>
            ))}
          </div>
        </div>

        {postType !== 'text' && (
          <div className="li-pick">
            <span className="li-pick-label">القالب</span>
            {templatesState === 'loading' && <span className="muted small-text">نجيب القوالب…</span>}
            <div className="tpl-grid">
              {kindTemplates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`tpl-card ${templateId === t.id ? 'on' : ''}`}
                  aria-pressed={templateId === t.id}
                  onClick={() => setTemplateId(t.id)}
                  disabled={phase === 'working' || phase === 'publishing' || busy !== ''}
                  title={t.name}
                >
                  <SlidePreview template={t} slides={[sampleSlide(t)]} index={0} width={92} />
                  <span>{t.nameAr}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="well-foot">
          <span className="hint">⌘ + Enter</span>
          {phase === 'working' ? (
            <button type="button" className="btn ghost" onClick={() => abort.current?.abort()}>
              وقّف الانتظار
            </button>
          ) : (
            <button
              className="btn"
              disabled={!idea.trim() || phase === 'publishing' || busy !== '' || (postType !== 'text' && !templateId)}
            >
              {phase === 'idle' ? 'اكتب المنشور' : 'فكرة جديدة'}
            </button>
          )}
        </div>
      </form>

      {showSteps && (
        <ol className="steps">
          {(Object.keys(STEP_LABELS) as StepKey[])
            .filter((k) => steps[k])
            .map((k) => {
              const s = steps[k]!;
              const time = s.status === 'active' && s.startedAt ? elapsed(now - s.startedAt) : s.ms != null ? elapsed(s.ms) : '';
              return (
                <li key={k} className={`step ${s.status}`}>
                  <span className="step-dot">{s.status === 'done' ? '✓' : s.status === 'error' ? '!' : ''}</span>
                  <span className="step-label">{STEP_LABELS[k]}</span>
                  {k === 'publish' && s.status === 'pending' && <span className="step-note">ينتظر موافقتك</span>}
                  <span className="step-time">{time}</span>
                </li>
              );
            })}
        </ol>
      )}

      {error && (
        <div className="error-box">
          <strong>ما نجح</strong>
          <pre>{error}</pre>
        </div>
      )}

      {phase === 'idle' && !error && !showSteps && (
        <div className="empty">اكتب فكرة واختر القالب. الوكيل يكتب المنشور والشرائح، وتعدّلها وتشوفها قبل ما تنشر.</div>
      )}

      {phase === 'working' && (
        <div className="empty">
          <span className="spinner" /> يكتب المنشور{postType !== 'text' ? ' والشرائح' : ''}…
        </div>
      )}

      {phase !== 'idle' && phase !== 'working' && (
        <div className={`li-review ${needsFile ? '' : 'text-only'}`}>
          {needsFile && template && (
            <div className="li-visual">
              <div className="li-stage">
                {slides.length > 0 ? (
                  <SlidePreview template={template} slides={slides} index={Math.min(selected, slides.length - 1)} width={stageWidth} />
                ) : (
                  <div className="li-stage-empty">ما فيه شرائح</div>
                )}
                {busy === 'picture' && (
                  <div className="media-loading">
                    <span className="spinner" />
                    يولّد الصورة…
                  </div>
                )}
              </div>

              {template.kind === 'carousel' && (
                <div className="thumbs">
                  {slides.map((_s, i) => (
                    <button key={i} type="button" className={`thumb ${i === selected ? 'on' : ''}`} onClick={() => setSelected(i)} aria-label={`الشريحة ${i + 1}`}>
                      <SlidePreview template={template} slides={slides} index={i} width={64} />
                      <span>{i + 1}</span>
                    </button>
                  ))}
                </div>
              )}

              {needsPicture && editable && (
                <button type="button" className="link-btn" onClick={() => regenerate('picture')}>
                  ↻ صورة ثانية
                </button>
              )}

              {editable && draftTemplates.length > 1 && (
                <div className="li-switch">
                  <span className="muted small-text">غيّر القالب:</span>
                  {draftTemplates.map((t) => (
                    <button key={t.id} type="button" className={`chip-btn ${t.id === draftTpl ? 'on' : ''}`} onClick={() => setDraftTpl(t.id)}>
                      {t.nameAr}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="result-posts">
            {needsFile && current && template && (
              <div className="slide-editor">
                <div className="slide-editor-head">
                  <strong>
                    {template.kind === 'carousel' ? `الشريحة ${selected + 1} من ${slides.length}` : 'نص الصورة'} · {SLIDE_NAMES[current.type] || current.type}
                  </strong>
                  {template.kind === 'carousel' && editable && (
                    <div className="slide-tools">
                      <button type="button" onClick={() => moveSlide(selected, -1)} disabled={selected === 0} aria-label="قدّمها">→</button>
                      <button type="button" onClick={() => moveSlide(selected, 1)} disabled={selected === slides.length - 1} aria-label="أخّرها">←</button>
                      <button type="button" onClick={() => removeSlide(selected)} disabled={slides.length <= 2} aria-label="احذف الشريحة">✕</button>
                    </div>
                  )}
                </div>

                {template.kind === 'carousel' && editable && (
                  <label className="field">
                    نوع الشريحة
                    <select value={current.type} onChange={(e) => updateSlide(selected, { type: e.target.value })}>
                      {Object.keys(template.slides).map((t) => (
                        <option key={t} value={t}>{SLIDE_NAMES[t] || t}</option>
                      ))}
                    </select>
                  </label>
                )}

                {(FIELDS[current.type] || []).map((f) => {
                  const isList = f === 'bullets';
                  const value = isList ? ((current.bullets as string[]) || []).join('\n') : String(current[f] ?? '');
                  const max = isList ? limits.bullet : limits[f];
                  const over = isList
                    ? ((current.bullets as string[]) || []).some((b) => plain(b).length > limits.bullet) || ((current.bullets as string[]) || []).length > limits.bullets
                    : max != null && plain(value).length > max;
                  const count = isList ? `${((current.bullets as string[]) || []).length}/${limits.bullets} نقاط · كل نقطة ${limits.bullet} حرف` : max ? `${plain(value).length}/${max}` : '';
                  return (
                    <label key={f} className={`field ${over ? 'over' : ''}`}>
                      <span className="field-top">
                        {FIELD_NAMES[f] || f}
                        <em dir="ltr">{count}</em>
                      </span>
                      {LONG_FIELDS.has(f) ? (
                        <textarea
                          dir="auto"
                          rows={isList ? 4 : 2}
                          value={value}
                          disabled={!editable}
                          onChange={(e) =>
                            updateSlide(selected, isList ? { bullets: e.target.value.split('\n') } : { [f]: e.target.value })
                          }
                          onBlur={() => isList && updateSlide(selected, { bullets: ((current.bullets as string[]) || []).map((b) => b.trim()).filter(Boolean) })}
                        />
                      ) : (
                        <input dir="auto" value={value} disabled={!editable} onChange={(e) => updateSlide(selected, { [f]: e.target.value })} />
                      )}
                    </label>
                  );
                })}
                <p className="field-hint">حط ==كلمة== عشان تتلوّن بالأخضر.</p>

                {template.kind === 'carousel' && editable && (
                  <div className="add-slide">
                    <span className="muted small-text">أضف شريحة بعدها:</span>
                    {Object.keys(template.slides).map((t) => (
                      <button key={t} type="button" className="chip-btn" onClick={() => addSlide(t)} disabled={slides.length >= 12}>
                        + {SLIDE_NAMES[t] || t}
                      </button>
                    ))}
                  </div>
                )}

                {issues.length > 0 && (
                  <ul className="issues">
                    {issues.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <article className="post-card linkedin">
              <header className="post-head">
                <LinkedInIcon />
                <div className="post-who">
                  <strong>نص المنشور</strong>
                  <span>{postUrl ? 'انتشر المنشور' : phase === 'scheduled' ? 'بينتشر في الوقت اللي اخترته' : editable ? 'تقدر تعدّله قبل النشر' : 'النص'}</span>
                </div>
                {postUrl && <span className="live-pill">● مباشر</span>}
              </header>
              {busy === 'draft' ? (
                <div className="caption-loading">
                  <span className="spinner" /> يكتب من جديد…
                </div>
              ) : (
                <>
                  <textarea className="caption-edit" dir="auto" value={postText} onChange={(e) => setPostText(e.target.value)} rows={9} disabled={!editable} />
                  <div className={`caption-count ${postText.length > CAPTION_MAX ? 'over' : ''}`}>
                    <span>أول ٢٠٠ حرف تبان قبل «المزيد»</span>
                    <span dir="ltr">{postText.length}/{CAPTION_MAX}</span>
                  </div>
                </>
              )}
              {draftType === 'carousel' && (
                <label className="field doc-title">
                  عنوان الملف (يبان فوق الكاروسيل)
                  <input dir="auto" value={docTitle} maxLength={100} onChange={(e) => setDocTitle(e.target.value)} disabled={!editable} />
                </label>
              )}
              {postUrl &&
                (now < linkReadyAt ? (
                  <span className="post-open waiting" aria-live="polite">
                    <span className="spinner" /> لينكدإن يجهّز الملف… <span dir="ltr">{elapsed(linkReadyAt - now)}</span>
                  </span>
                ) : (
                  <a className="post-open" href={postUrl} target="_blank" rel="noreferrer">
                    افتح في لينكدإن ↗
                  </a>
                ))}
            </article>

            {editable && (
              <button type="button" className="btn ghost small" onClick={() => regenerate('draft')}>
                اكتب المنشور من جديد
              </button>
            )}

            {needsFile && (phase === 'review' || phase === 'publishing') && (
              <div className="file-box">
                <div>
                  <strong>{draftType === 'carousel' ? 'ملف PDF' : 'صورة PNG'}</strong>
                  <span className="muted small-text">
                    {fileReady && rendered ? ` · جاهز (${Math.round(rendered.bytes / 1024)} KB)` : ' · يتجهّز وقت النشر، أو جهّزه الحين عشان تشوفه'}
                  </span>
                </div>
                {fileReady && rendered ? (
                  <a className="btn ghost small" href={`data:${rendered.mime};base64,${rendered.file_b64}`} download={draftType === 'carousel' ? 'carousel.pdf' : 'post.png'}>
                    نزّل الملف
                  </a>
                ) : (
                  <button type="button" className="btn ghost small" onClick={renderNow} disabled={!!busy || issues.length > 0 || pictureMissing || phase !== 'review'}>
                    {busy === 'render' ? 'يجهّز…' : 'جهّز الملف'}
                  </button>
                )}
              </div>
            )}

            {(phase === 'review' || phase === 'publishing') && (
              <div className="publish-box">
                <div className="schedule-row">
                  <Toggle on={scheduleOn} onChange={setScheduleOn} icon={<span aria-hidden="true">🗓️</span>} label="جدولة النشر" />
                  {scheduleOn && (
                    <input type="datetime-local" className="schedule-input" value={scheduleAt} min={localInput(10)} onChange={(e) => setScheduleAt(e.target.value)} dir="ltr" />
                  )}
                </div>
                {scheduleOn && !scheduleValid && <p className="field-error">اختر وقت بعد ١٠ دقايق على الأقل، وخلال ٣٠ يوم.</p>}
                {issues.length > 0 && <p className="field-error">فيه نص أطول من المسموح. قصّره عشان تقدر تنشر.</p>}
                <button type="button" className="btn publish-btn" onClick={publish} disabled={!canPublish && phase !== 'publishing'}>
                  {phase === 'publishing' ? 'ينشر…' : scheduleOn ? 'جدول المنشور' : 'انشر على لينكدإن'}
                </button>
              </div>
            )}

            {(phase === 'published' || phase === 'scheduled') && (
              <div className="done-box">
                <strong>
                  {phase === 'scheduled'
                    ? `تمت الجدولة: ${scheduleDate.toLocaleString('ar-SA', { dateStyle: 'medium', timeStyle: 'short' })}`
                    : 'انتشر المنشور 🎉'}
                </strong>
                <button type="button" className="btn ghost small" onClick={reset}>
                  منشور جديد
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="history">
        <div className="history-head">
          <span className="label">منشوراتي على لينكدإن</span>
          {historyState === 'ready' && <span className="muted small-text">{history.length} منشور</span>}
        </div>
        {historyState === 'loading' && <div className="empty small">نجيب المنشورات…</div>}
        {historyState === 'error' && <div className="empty small">ما قدرنا نجيب المنشورات السابقة.</div>}
        {historyState === 'ready' && history.length === 0 && <div className="empty small">ما فيه منشورات للحين.</div>}
        {historyState === 'ready' && history.length > 0 && (
          <ul className="li-history">
            {history.map((row) => (
              <li key={row.ref}>
                <span className={`badge ${row.status}`}>{row.status === 'scheduled' ? 'مجدول' : 'منشور'}</span>
                <span className="li-history-text" dir="auto">{(row.post_text || row.idea || '').split('\n')[0]}</span>
                <span className="muted small-text">
                  {POST_TYPES.find((t) => t.id === row.post_type)?.label || row.post_type} ·{' '}
                  {new Date(row.status === 'scheduled' && row.scheduled_at ? row.scheduled_at : row.createdAt || '').toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}
                </span>
                {row.post_url && (
                  <a href={row.post_url} target="_blank" rel="noreferrer">
                    افتح ↗
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// The big preview is 380px wide, or narrower on a phone (page, card and stage padding take ~80px)
function useStageWidth() {
  const calc = () => Math.min(380, window.innerWidth - 80);
  const [w, setW] = useState(calc);
  useEffect(() => {
    const on = () => setW(calc());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return w;
}

// A sample slide so the template picker shows each layout's look
function sampleSlide(t: Template): Slide {
  const type = Object.keys(t.slides)[0];
  const samples: Record<string, Slide> = {
    cover: { type: 'cover', kicker: 'أتمتة', title: 'قبل ما تبني ==وكيلك== الأول', subtitle: '٥ أسئلة تختصر عليك أسابيع' },
    quote: { type: 'quote', text: 'الأتمتة تبدأ من ==فهمك لشغلك==.', by: 'أحمد فرج' },
    tip: { type: 'tip', kicker: 'نصيحة', title: '٣ أشياء قبل ==أول وكيل==', bullets: ['حدد المشكلة', 'رتب بياناتك', 'جرّب يدوي'] },
    picture: { type: 'picture', title: 'ابدأ بـ==مهمة وحدة==', subtitle: 'صورة يولّدها الذكاء الاصطناعي' },
  };
  return samples[type] || { type, title: t.nameAr };
}

// Renders one slide of the real template in a scaled iframe (same engine and fonts as n8n)
function SlidePreview({ template, slides, index, width }: { template: Template; slides: Slide[]; index: number; width: number }) {
  const html = useMemo(() => {
    const doc: string = renderDoc(template, { author: AUTHOR, slides }, BRAND_CSS);
    const only = `<style>html,body{overflow:hidden!important}.slide:not(:nth-of-type(${index + 1})){display:none!important}</style>`;
    return doc.replace('</head>', `${only}</head>`);
  }, [template, slides, index]);
  const scale = width / 1080;
  return (
    <div className="slide-preview" style={{ width, height: 1350 * scale }}>
      <iframe title="معاينة" srcDoc={html} tabIndex={-1} style={{ transform: `scale(${scale})` }} />
    </div>
  );
}

function Toggle({ on, onChange, icon, label }: { on: boolean; onChange: (v: boolean) => void; icon: ReactNode; label: string }) {
  return (
    <button type="button" className={`toggle ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => onChange(!on)}>
      <span className="toggle-icon">{icon}</span>
      {label}
      <span className="toggle-check" aria-hidden="true">{on ? '✓' : ''}</span>
    </button>
  );
}

function LinkedInIcon() {
  return (
    <svg className="platform-icon" viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="9" fill="#0A66C2" />
      <path fill="#fff" d="M11 16h4v13h-4zM13 9.6a2.3 2.3 0 1 1 0 4.6 2.3 2.3 0 0 1 0-4.6zM17.6 16h3.8v1.8h.1c.5-1 1.8-2.1 3.8-2.1 4 0 4.8 2.6 4.8 6V29h-4v-6.4c0-1.5 0-3.5-2.1-3.5s-2.5 1.7-2.5 3.4V29h-3.9z" />
    </svg>
  );
}
