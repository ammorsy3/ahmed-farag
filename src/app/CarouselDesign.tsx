// The carousel design controls on /app:
//  - CarouselDesign: switches for the whole carousel + "auto rhythm"
//  - SlideDesign: the selected slide's template, layout and its own switches
import { slideOptions, slideTemplate, type SlideData } from './linkedin-templates/engine.js';
import { docSwitchOn, fitsLayout, layoutsFor, optionDefs, toggleDocSwitch, type DesignTemplate, type Opts } from './design';

function Switch({ label, hint, on, onChange, marked }: { label: string; hint?: string; on: boolean; onChange: () => void; marked?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={on} className={`design-row ${on ? 'on' : ''}`} onClick={onChange}>
      <span className="design-label">
        {label}
        {marked && <em className="design-own">لهذي الشريحة</em>}
        {hint && <small>{hint}</small>}
      </span>
      <span className="switch" aria-hidden="true">
        <i />
      </span>
    </button>
  );
}

// Label for a switch at carousel level (dots defaults to "cover only" in some templates)
const docLabel = (key: string, label: string) => (key === 'dots' ? 'نقاط النافذة على كل الشرائح' : label);

export function CarouselDesign({
  template,
  docOpts,
  onDocOpts,
  rhythm,
  onRhythm,
}: {
  template: DesignTemplate;
  docOpts: Opts;
  onDocOpts: (o: Opts) => void;
  rhythm: boolean;
  onRhythm: (on: boolean) => void;
}) {
  return (
    <div className="design-box">
      <div className="design-head">
        <strong>تصميم الكاروسيل</strong>
        <span className="muted small-text">لكل الشرائح</span>
      </div>
      <Switch label="تنويع تلقائي" hint="يخلط القوالب والأشكال عشان ما تتشابه الشرائح" on={rhythm} onChange={() => onRhythm(!rhythm)} />
      {optionDefs(template).map((def) => (
        <Switch key={def.key} label={docLabel(def.key, def.label)} on={docSwitchOn(def, docOpts)} onChange={() => onDocOpts(toggleDocSwitch(def, docOpts))} />
      ))}
    </div>
  );
}

export function SlideDesign({
  slide,
  docTemplate,
  carousels,
  byId,
  docOpts,
  onChange,
}: {
  slide: SlideData;
  docTemplate: DesignTemplate;
  carousels: DesignTemplate[];
  byId: Record<string, DesignTemplate>;
  docOpts: Opts;
  onChange: (patch: Partial<SlideData>) => void;
}) {
  const t = slideTemplate(docTemplate, slide, byId);
  const layouts = layoutsFor(t, slide.type);
  const current = t.slides[`${slide.type}~${slide.variant}`] ? String(slide.variant) : '';
  const effective = slideOptions(t, slide, docOpts);
  const own = (slide.o as Opts) || {};
  const others = carousels.filter((c) => c.slides[slide.type]);

  function setTpl(id: string) {
    onChange({ tpl: id === docTemplate.id ? undefined : id });
  }
  function flip(key: string) {
    onChange({ o: { ...own, [key]: !effective[key] } });
  }

  return (
    <div className="design-box slide-design">
      <div className="design-head">
        <strong>تصميم الشريحة</strong>
        {Object.keys(own).length > 0 && (
          <button type="button" className="link-btn" onClick={() => onChange({ o: undefined })}>
            رجّع المفاتيح للافتراضي
          </button>
        )}
      </div>

      {others.length > 1 && (
        <div className="design-chips">
          <span className="muted small-text">القالب</span>
          {others.map((c) => (
            <button key={c.id} type="button" className={`chip-btn ${c.id === t.id ? 'on' : ''}`} onClick={() => setTpl(c.id)}>
              {c.nameAr}
              {c.id === docTemplate.id ? ' (الأساسي)' : ''}
            </button>
          ))}
        </div>
      )}

      {layouts.length > 1 && (
        <div className="design-chips">
          <span className="muted small-text">الشكل</span>
          {layouts.map((l) => {
            const fits = !l.variant || fitsLayout(t, slide, l.variant);
            return (
              <button
                key={l.variant || 'base'}
                type="button"
                className={`chip-btn ${l.variant === current ? 'on' : ''}`}
                onClick={() => onChange({ variant: l.variant || undefined })}
                title={fits ? undefined : 'النقاط أطول من المسموح لهذا الشكل'}
              >
                {l.label}
                {!fits && ' ⚠️'}
              </button>
            );
          })}
        </div>
      )}

      {optionDefs(t).map((def) => (
        <Switch key={def.key} label={def.label} on={!!effective[def.key]} marked={def.key in own} onChange={() => flip(def.key)} />
      ))}
    </div>
  );
}
