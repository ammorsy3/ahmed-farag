import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { dir, lang, t } from '../i18n';
import Reveal from './Reveal';
import { needFromUrl, needLabels, needs, onNeedPicked, type Need } from '../lib/consultNeed';

// Where the request is sent: an n8n webhook. It receives a JSON POST and must answer 2xx once the
// message is really handed off. It is a public endpoint (visible in the browser anyway), so it is built
// in; VITE_CONSULT_WEBHOOK_URL can still override it, e.g. to point at a test workflow.
const WEBHOOK_URL =
  (import.meta.env.VITE_CONSULT_WEBHOOK_URL as string | undefined) ||
  'https://n8n-production-6d8a0.up.railway.app/webhook/ahmed-farag';

type Fields = { name: string; email: string; phone: string; business: string; message: string };
type Errors = Partial<Record<'name' | 'email' | 'phone' | 'message', string>>;
type Status = 'idle' | 'sending' | 'sent' | 'error';

const empty: Fields = { name: '', email: '', phone: '', business: '', message: '' };

const copy = t({
  ar: {
    heading: 'عندك مشكلة معيّنة في بالك؟',
    description:
      'احكِ لي عن شغلك وإيش اللي مضايقك، ونطلع بأسرع حل عملي يناسبك.',
    button: 'إرسال',
    name: 'الاسم',
    email: 'الإيميل',
    phone: 'رقم الجوال',
    business: 'اسم شركتك أو موقعها',
    need: 'وش تحتاج؟',
    message: 'احكِ لي باختصار',
    placeholders: {
      none: 'وش في بالك؟ ولو عندك مثال أو موعد معيّن، اذكره.',
      automation: 'مثلاً: كل يوم أنسخ الطلبات من الإيميل لشيت يدويًا…',
      'ai-tool': 'مثلاً: أبي مساعد يرد على أسئلة العملاء من ملفاتنا…',
      app: 'مثلاً: أبي موقع لنشاطي يستقبل طلبات، أو تطبيق حجوزات لعملائي…',
      other: 'وش في بالك؟',
    },
    optional: 'اختياري',
    requiredBadge: 'إلزامي',
    sending: 'يرسل…',
    required: 'هذا الحقل مطلوب.',
    emailInvalid: 'اكتب إيميل صحيح.',
    phoneInvalid: 'اكتب رقم جوال صحيح.',
    sentTitle: 'وصلني طلبك',
    sentText: 'بقرأ اللي كتبته وأرد عليك على إيميلك.',
    errorText: 'ما انرسل طلبك. معلوماتك محفوظة هنا، جرّب مرة ثانية.',
    notConfigured: 'النموذج مو جاهز للإرسال لسه. معلوماتك محفوظة هنا.',
  },
  en: {
    heading: 'Have a specific problem in mind?',
    description:
      'Tell me about your business and what’s giving you trouble, and we’ll figure out the quickest practical solution that makes sense for you.',
    button: 'Send',
    name: 'Name',
    email: 'Email',
    phone: 'Phone number',
    business: 'Company name or website',
    need: 'What do you need?',
    message: 'Tell me a bit about it',
    placeholders: {
      none: 'What do you have in mind? Any examples or deadlines help.',
      automation: 'e.g. Every day I copy orders from email into a spreadsheet by hand…',
      'ai-tool': 'e.g. I want an assistant that answers customer questions from our docs…',
      app: 'e.g. A site for my business that takes enquiries, or a booking app for my customers…',
      other: 'What do you have in mind?',
    },
    optional: 'optional',
    requiredBadge: 'required',
    sending: 'Sending…',
    required: 'This field is required.',
    emailInvalid: 'Enter a valid email address.',
    phoneInvalid: 'Enter a valid phone number.',
    sentTitle: 'Got it, thanks',
    sentText: 'I’ll read what you wrote and reply by email.',
    errorText: 'Your request didn’t send. What you wrote is still here, so try again.',
    notConfigured: 'The form isn’t connected yet, so nothing was sent. What you wrote is still here.',
  },
});

const inputClass =
  'w-full rounded-lg border border-line-strong bg-white px-4 py-3 text-base text-heading placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25';

// The form as its own home-page section; only the invitation up top gets the hero background
export default function ConsultSection() {
  return (
    <section id="talk" className="pb-20 lg:pb-28 bg-white" dir={dir} lang={lang}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="relative overflow-hidden rounded-3xl px-6 py-12 text-center sm:px-12 sm:py-16">
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-heading via-forest to-primary-hover">
            <div className="absolute inset-0 bg-black/20" />
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div
              className="absolute inset-0 bg-[linear-gradient(to_right,rgba(126,217,87,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(126,217,87,0.10)_1px,transparent_1px)] bg-[size:26px_26px] [mask-image:radial-gradient(120%_100%_at_50%_50%,#000_55%,transparent)] [-webkit-mask-image:radial-gradient(120%_100%_at_50%_50%,#000_55%,transparent)]"
            />
            <div className="absolute inset-0 bg-[radial-gradient(800px_500px_at_50%_45%,rgba(47,191,63,0.18),transparent_70%)]" />
            <div className="absolute -top-24 -left-24 h-[24rem] w-[24rem] rounded-full bg-primary/25 blur-3xl" />
            <div className="absolute -bottom-24 -right-24 h-[24rem] w-[24rem] rounded-full bg-lime/20 blur-3xl" />
            <div className="absolute inset-0 shadow-[inset_0_0_140px_rgba(0,0,0,0.5)]" />
          </div>
          <div className="relative z-10">
            <h3 className="mb-4 text-3xl sm:text-4xl lg:text-5xl font-bold leading-snug text-white">{copy.heading}</h3>
            <p className="mx-auto max-w-2xl text-lg text-white/85 leading-relaxed">{copy.description}</p>
          </div>
        </Reveal>
        <Reveal className="mt-6 md:mt-8" delay={0.1}>
          <ConsultCall />
        </Reveal>
      </div>
    </section>
  );
}

function ConsultCall() {
  const [fields, setFields] = useState<Fields>(empty);
  const [need, setNeed] = useState<Need | ''>(needFromUrl);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  // A service CTA was clicked: select its need (and leave the visitor's typing alone)
  useEffect(
    () =>
      onNeedPicked((picked) => {
        setNeed(picked);
        setStatus((s) => (s === 'sent' ? 'idle' : s));
      }),
    [],
  );
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>('idle');
  const [failure, setFailure] = useState('');
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const set = (key: keyof Fields) => (e: { target: { value: string } }) => {
    setFields((f) => ({ ...f, [key]: e.target.value }));
    if (key in errors) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  function validate(): Errors {
    const e: Errors = {};
    if (!fields.name.trim()) e.name = copy.required;
    if (!fields.email.trim()) e.email = copy.required;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) e.email = copy.emailInvalid;
    // Required, and should look like a number: 7–15 digits, with +, spaces, dashes or brackets
    const phone = fields.phone.trim();
    if (!phone) e.phone = copy.required;
    else if (!/^\+?[\d\s()-]+$/.test(phone) || !/^\d{7,15}$/.test(phone.replace(/\D/g, ''))) e.phone = copy.phoneInvalid;
    if (!fields.message.trim()) e.message = copy.required;
    return e;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (status === 'sending') return;
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    if (!WEBHOOK_URL) {
      setFailure(copy.notConfigured);
      setStatus('error');
      return;
    }
    setStatus('sending');
    setFailure('');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fields.name.trim(),
          email: fields.email.trim(),
          phone: fields.phone.trim(),
          business: fields.business.trim(),
          // service: what they picked (readable, in their language); serviceId: the stable key
          service: need ? needLabels[need] : '',
          serviceId: need,
          // the n8n flow and confirmation email read the message as `problem`
          problem: fields.message.trim(),
          notes: '',
          language: lang,
          sentAt: new Date().toISOString(),
        }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setFields(empty);
      setNeed('');
      setStatus('sent');
    } catch {
      setFailure(copy.errorText);
      setStatus('error');
    } finally {
      clearTimeout(timer);
    }
  }

  function label(text: string, optional = false) {
    return (
      <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-heading">
        {text}
        {optional ? (
          <span className="rounded bg-surface px-2 py-0.5 text-xs font-medium text-muted ring-1 ring-inset ring-line-strong">{copy.optional}</span>
        ) : (
          <span className="text-lg leading-none text-primary" aria-hidden="true" title={copy.requiredBadge}>*</span>
        )}
      </span>
    );
  }

  const fieldError = (msg?: string, id?: string) =>
    msg && (
      <p id={id} className="mt-1.5 text-sm text-red-600">
        {msg}
      </p>
    );

  return (
    <div>
      <div className="rounded-2xl border border-line-strong bg-surface p-6 sm:p-10">
        {status === 'sent' ? (
          <div role="status" className="flex items-start gap-3 rounded-xl bg-mint p-5 ring-1 ring-primary/20">
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
            <div>
              <p className="font-semibold text-heading">{copy.sentTitle}</p>
              <p className="text-body">{copy.sentText}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                {label(copy.name)}
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  required
                  value={fields.name}
                  onChange={set('name')}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'consult-name-err' : undefined}
                  className={inputClass}
                />
                {fieldError(errors.name, 'consult-name-err')}
              </label>
              <label className="block">
                {label(copy.email)}
                <input
                  type="email"
                  name="email"
                  dir="ltr"
                  autoComplete="email"
                  required
                  value={fields.email}
                  onChange={set('email')}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'consult-email-err' : undefined}
                  className={inputClass}
                />
                {fieldError(errors.email, 'consult-email-err')}
              </label>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                {label(copy.phone)}
                <input
                  type="tel"
                  name="phone"
                  dir="ltr"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  value={fields.phone}
                  onChange={set('phone')}
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? 'consult-phone-err' : undefined}
                  className={inputClass}
                />
                {fieldError(errors.phone, 'consult-phone-err')}
              </label>
              <label className="block">
                {label(copy.business, true)}
                <input type="text" name="business" autoComplete="organization" value={fields.business} onChange={set('business')} className={inputClass} />
              </label>
            </div>

            <fieldset>
              <legend className="contents">{label(copy.need, true)}</legend>
              <div className="flex flex-wrap gap-2">
                {needs.map((n) => {
                  const on = need === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      aria-pressed={on}
                      onClick={() => {
                        setNeed(on ? '' : n);
                        if (!on) messageRef.current?.focus();
                      }}
                      className={
                        'rounded-full px-4 py-2 text-sm font-semibold ring-1 ring-inset transition-colors ' +
                        (on
                          ? 'bg-primary text-white ring-primary'
                          : 'bg-white text-heading ring-line-strong hover:ring-primary/50 hover:text-primary')
                      }
                    >
                      {needLabels[n]}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <label className="block">
              {label(copy.message)}
              <textarea
                ref={messageRef}
                name="message"
                rows={5}
                required
                placeholder={copy.placeholders[need || 'none']}
                value={fields.message}
                onChange={set('message')}
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? 'consult-message-err' : undefined}
                className={inputClass}
              />
              {fieldError(errors.message, 'consult-message-err')}
            </label>

            {status === 'error' && (
              <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
                {failure}
              </p>
            )}

            <div className="flex justify-center pt-2">
              <button
                type="submit"
                disabled={status === 'sending'}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-lg font-semibold text-white transition-all duration-200 hover:bg-primary-hover hover:shadow-lg disabled:opacity-70"
              >
                {status === 'sending' && <Loader2 className="h-5 w-5 animate-spin" />}
                {status === 'sending' ? copy.sending : copy.button}
                {status !== 'sending' && <Arrow className="h-5 w-5" />}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
