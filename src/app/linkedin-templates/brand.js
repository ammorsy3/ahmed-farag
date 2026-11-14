// The shared brand layer for every LinkedIn template: ahmad-farag.com fonts and colors,
// the 1080×1350 canvas and the footer. Templates only add layout on top of this.
// fontUrl(file) returns where each font file lives (a path in the preview, a data: URI when rendering).

export const FONT_FILES = ['FatimahArabic-Regular.woff', 'FatimahArabic-Heavy.woff', 'Inter-400.woff2', 'Inter-600.woff2', 'Inter-800.woff2'];

export const AUTHOR = { ar: 'أحمد فرج', en: 'Ahmed Farag' };

export function brandCss(fontUrl) {
  const f = (file, family, weight, range) =>
    `@font-face{font-family:'${family}';src:url('${fontUrl(file)}') format('${file.endsWith('2') ? 'woff2' : 'woff'}');font-weight:${weight};font-style:normal;font-display:block;${range ? `unicode-range:${range};` : ''}}`;
  // No unicode-range on Fatimah: Gotenberg's Chromium skips a font that has one (tested).
  return `
${f('FatimahArabic-Regular.woff', 'Fatimah Arabic', '400 600', '')}
${f('FatimahArabic-Heavy.woff', 'Fatimah Arabic', '700 900', '')}
${f('Inter-400.woff2', 'Inter', '400', '')}
${f('Inter-600.woff2', 'Inter', '500 600', '')}
${f('Inter-800.woff2', 'Inter', '700 900', '')}

:root{
  /* ahmad-farag.com tokens */
  --heading:#0F1A14; --body:#4A574F; --muted:#6B7A71;
  --primary:#1F9A2E; --primary-hover:#167023; --bright:#2FBF3F; --lime:#7ED957;
  --forest:#143D20; --mint:#E3F2E4; --surface:#F4F8F4; --card:#FFFFFF;
  --line:#E3EAE4; --line-strong:#DBE3DC;
  --pad-x:96px; --pad-top:104px; --foot-h:150px;
  /* each template sets these */
  --bg:var(--surface); --fg:var(--heading); --fg-soft:var(--body); --accent:var(--primary); --rule:var(--line);
}
@page{size:1080px 1350px;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#fff;width:1080px;margin:0}
body{font-family:'Fatimah Arabic','Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;font-feature-settings:"kern"}
.slide{position:relative;width:1080px;height:1350px;overflow:hidden;background:var(--bg);color:var(--fg);
  padding:var(--pad-top) var(--pad-x) var(--foot-h);display:flex;flex-direction:column;break-after:page;page-break-after:always}
.slide:last-child{break-after:auto;page-break-after:auto}
.slide > *{position:relative;z-index:1}
mark{background:none;color:var(--accent)}
.en,.num{font-family:'Inter',sans-serif;direction:ltr;unicode-bidi:isolate}

/* footer: name on the right, swipe cue + page on the left */
.foot{position:absolute;inset:auto var(--pad-x) 0 var(--pad-x);height:112px;display:flex;align-items:center;justify-content:space-between;
  border-top:1.5px solid var(--rule);font-size:28px;color:var(--fg-soft);z-index:2}
.foot-who{display:flex;align-items:baseline;gap:14px}
.foot-who strong{font-weight:800;color:var(--fg);font-size:30px}
.foot-who span{font-family:'Inter',sans-serif;font-weight:600;font-size:22px;letter-spacing:.02em;opacity:.8}
.foot-end{display:flex;align-items:center;gap:22px}
.foot-swipe{display:flex;align-items:center;gap:10px;font-weight:600;color:var(--accent)}
.foot-swipe i{font-style:normal;font-family:'Inter',sans-serif;font-size:28px}
.foot-page{font-family:'Inter',sans-serif;font-weight:600;font-size:24px;direction:ltr;opacity:.75}
`;
}
