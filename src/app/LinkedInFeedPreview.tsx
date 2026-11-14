import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';

// "How it looks in the feed": the post as LinkedIn shows it before anyone taps "…more".
// LinkedIn clamps the caption to 3 lines (blank lines count) and puts "…more" at the end of the 3rd.
// We measure the real text with the same width and font, so the cut lands where LinkedIn's does.
// Checked against LinkedIn on desktop (Nov 2026): text box 502 px, 14 px / 20 px system font, 3 lines,
// then "… more" — same cut, word for word.
// On a phone, LinkedIn's app pads the text 16 px each side, so we use this phone's own width.
const phoneWidth = () => (window.matchMedia('(max-width: 520px)').matches ? Math.round(window.innerWidth) : 375) - 32;
const DEVICES = {
  phone: { label: 'جوال', width: phoneWidth },
  desktop: { label: 'كمبيوتر', width: () => 502 },
} as const;
type Device = keyof typeof DEVICES;
const LINE = 20; // LinkedIn post text: 14 px on a 20 px line
const LINES = 3;
const MORE = '… more';
const HEADLINE = 'I help business owners make AI work in their favor | AI automation · AI tools · Apps & websites | Built Boothk & Bid';

// Longest prefix (in characters) that fits in 3 lines with "…more" after it; null when everything fits
function findCut(el: HTMLElement, text: string): number | null {
  const chars = Array.from(text);
  const fits = (s: string) => {
    el.textContent = s;
    return el.scrollHeight <= LINE * LINES + 1;
  };
  if (fits(text)) return null;
  let lo = 0;
  let hi = chars.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (fits(chars.slice(0, mid).join('').trimEnd() + MORE)) lo = mid;
    else hi = mid - 1;
  }
  // LinkedIn breaks on a word boundary when one is close
  const head = chars.slice(0, lo).join('');
  const space = Math.max(head.lastIndexOf(' '), head.lastIndexOf('\n'));
  return space > lo - 16 && space > 0 ? Array.from(head.slice(0, space)).length : lo;
}

export default function LinkedInFeedPreview({
  text,
  media,
  docTitle,
  pages,
}: {
  text: string;
  media?: (width: number) => ReactNode;
  docTitle?: string;
  pages?: number;
}) {
  const [device, setDevice] = useState<Device>('phone');
  const [expanded, setExpanded] = useState(false);
  const [cut, setCut] = useState<number | null>(null);
  const probe = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ scale: 1, height: 0 });
  const width = DEVICES[device].width();
  const clean = text.trim();

  useLayoutEffect(() => {
    if (probe.current) setCut(findCut(probe.current, clean));
  }, [clean, width]);

  // the card keeps LinkedIn's real width (so the text wraps the same); on a narrow screen it's scaled down to fit
  useEffect(() => {
    const update = () => {
      if (!frame.current || !card.current) return;
      const scale = Math.min(1, frame.current.clientWidth / card.current.offsetWidth);
      setFit({ scale, height: card.current.offsetHeight * scale });
    };
    update();
    const ro = new ResizeObserver(update);
    if (frame.current) ro.observe(frame.current);
    if (card.current) ro.observe(card.current);
    return () => ro.disconnect();
  }, [width]);

  const chars = useMemo(() => Array.from(clean), [clean]);
  const visible = cut == null ? clean : chars.slice(0, cut).join('').trimEnd();
  const shown = cut == null ? chars.length : Array.from(visible).length;

  return (
    <section className="feed-preview" aria-label="شكل المنشور في لينكدإن">
      <div className="feed-top">
        <strong>شكل المنشور في لينكدإن</strong>
        <div className="seg-mini" role="radiogroup" aria-label="الجهاز">
          {(Object.keys(DEVICES) as Device[]).map((d) => (
            <button key={d} type="button" role="radio" aria-checked={device === d} className={device === d ? 'on' : ''} onClick={() => setDevice(d)}>
              {DEVICES[d].label}
            </button>
          ))}
        </div>
      </div>

      <p className={`feed-hook ${cut == null ? 'all' : ''}`}>
        {cut == null ? 'النص كله يبان بدون «more» 👌' : <>يبان قبل «more»: <b>{shown}</b> حرف من {chars.length}</>}
      </p>

      <div className="feed-frame" ref={frame} style={{ height: fit.height || undefined }}>
        <div className="feed-card" ref={card} style={{ width: width + 32, transform: `scale(${fit.scale})` }}>
          <div className="feed-head">
            <img src="/AHMED2.jpg" alt="" className="feed-av" loading="lazy" />
            <div className="feed-who" dir="ltr">
              <b>Ahmed Farag</b>
              <span>{HEADLINE}</span>
              <span>now • 🌐</span>
            </div>
          </div>

          <div className="feed-text" dir="auto" style={{ width }}>
            {expanded || cut == null ? (
              clean
            ) : (
              <>
                {visible}
                <button type="button" className="feed-more" onClick={() => setExpanded(true)}>
                  {MORE}
                </button>
              </>
            )}
          </div>
          {expanded && cut != null && (
            <button type="button" className="feed-less" onClick={() => setExpanded(false)}>
              اطوِ النص
            </button>
          )}

          {media && (
            <div className="feed-media">
              {docTitle && (
                <div className="feed-doc" dir="ltr">
                  <bdi dir="auto">{docTitle}</bdi>
                  {pages ? ` • ${pages} pages` : null}
                </div>
              )}
              {media(width + 32)}
            </div>
          )}
        </div>
      </div>

      {/* hidden copy used to measure where the 3rd line ends */}
      <div ref={probe} className="feed-text feed-probe" dir="auto" style={{ width }} aria-hidden="true" />
    </section>
  );
}
