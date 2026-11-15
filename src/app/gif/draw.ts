// Canvas drawing helpers for the animated GIF posts (ahmad-farag.com brand, Arabic right-to-left).

export const C = {
  heading: '#0F1A14',
  body: '#4A574F',
  muted: '#6B7A71',
  primary: '#1F9A2E',
  primaryHover: '#167023',
  bright: '#2FBF3F',
  lime: '#7ED957',
  forest: '#143D20',
  mint: '#E3F2E4',
  surface: '#F4F8F4',
  card: '#FFFFFF',
  line: '#E3EAE4',
  lineStrong: '#DBE3DC',
};
export const AR = "'Fatimah Arabic', 'Inter', system-ui, sans-serif";
export const EN = "'Inter', system-ui, sans-serif";

export type Ctx = CanvasRenderingContext2D;

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const ease = (x: number) => {
  const t = clamp01(x);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
// 0→1 progress of t between a and b
export const span = (t: number, a: number, b: number) => clamp01((t - a) / Math.max(1, b - a));

export function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

// Light paper background with a faint grid (like a whiteboard)
export function gridBg(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = C.surface;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(15,26,20,0.055)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let x = 0.5; x < w; x += 44) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = 0.5; y < h; y += 44) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();
}

export function card(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, opts: { fill?: string; stroke?: string; lw?: number; shadow?: boolean } = {}) {
  ctx.save();
  if (opts.shadow) {
    ctx.shadowColor = 'rgba(15,26,20,0.16)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 18;
  }
  rr(ctx, x, y, w, h, r);
  ctx.fillStyle = opts.fill || C.card;
  ctx.fill();
  ctx.restore();
  if (opts.stroke) {
    rr(ctx, x, y, w, h, r);
    ctx.strokeStyle = opts.stroke;
    ctx.lineWidth = opts.lw || 2;
    ctx.stroke();
  }
}

// ---- rich Arabic text: ==word== is highlighted, words wrap right-to-left ----
type Token = { word: string; hl: boolean; w: number; glue?: boolean }; // glue: no space before (same word)
export type Lines = { tokens: Token[]; width: number }[];

function tokens(ctx: Ctx, text: string): Token[] {
  const out: Token[] = [];
  let prevEndsWithSpace = true;
  String(text || '')
    .split(/==(.+?)==/)
    .forEach((seg, i) => {
      seg.split(/\s+/).forEach((word, j) => {
        if (!word) return;
        const glue = j === 0 && !/^\s/.test(seg) && !prevEndsWithSpace && out.length > 0;
        out.push({ word, hl: i % 2 === 1, w: ctx.measureText(word).width, glue });
      });
      if (seg) prevEndsWithSpace = /\s$/.test(seg);
    });
  return out;
}

export function layout(ctx: Ctx, text: string, font: string, maxW: number, maxLines = 99): Lines {
  ctx.font = font;
  ctx.direction = 'rtl';
  const space = ctx.measureText(' ').width;
  const lines: Lines = [];
  let cur: Token[] = [];
  let width = 0;
  for (const t of tokens(ctx, text)) {
    const add = (cur.length && !t.glue ? space : 0) + t.w;
    if (cur.length && !t.glue && width + add > maxW) {
      lines.push({ tokens: cur, width });
      cur = [t];
      width = t.w;
    } else {
      cur.push(t);
      width += add;
    }
  }
  if (cur.length) lines.push({ tokens: cur, width });
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    const last = kept[maxLines - 1];
    last.tokens = [...last.tokens, { word: '…', hl: false, w: ctx.measureText('…').width }];
    return kept;
  }
  return lines;
}

// Draws laid-out lines. x is the right edge (align right) or the centre (align center).
// reveal: how many characters are visible (typewriter), Infinity for all.
export function drawLines(
  ctx: Ctx,
  lines: Lines,
  x: number,
  y: number,
  lineH: number,
  font: string,
  color: string,
  hlColor: string,
  align: 'right' | 'center' = 'right',
  reveal = Infinity
) {
  ctx.font = font;
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  const space = ctx.measureText(' ').width;
  let left = reveal;
  lines.forEach((line, i) => {
    let cx = align === 'center' ? x + line.width / 2 : x;
    for (const t of line.tokens) {
      if (left <= 0) return;
      if (t.glue) cx += space; // glued to the previous word: no gap
      const word = left >= t.word.length ? t.word : Array.from(t.word).slice(0, Math.max(0, Math.floor(left))).join('');
      left -= t.word.length + 1;
      ctx.fillStyle = t.hl ? hlColor : color;
      ctx.fillText(word, cx, y + i * lineH);
      cx -= t.w + space;
    }
  });
}
export const charCount = (lines: Lines) => lines.reduce((n, l) => n + l.tokens.reduce((m, t) => m + t.word.length + 1, 0), 0);

// Small round author chip: photo (or initial), Arabic name and English name
export function authorChip(ctx: Ctx, cx: number, y: number, photo: HTMLImageElement | null, ar: string, en: string) {
  ctx.font = `800 30px ${AR}`;
  ctx.direction = 'rtl';
  const nameW = Math.max(ctx.measureText(ar).width, (() => {
    ctx.font = `600 22px ${EN}`;
    return ctx.measureText(en).width;
  })());
  const size = 72;
  const total = size + 18 + nameW;
  const right = cx + total / 2;
  // avatar on the right (RTL)
  const ax = right - size;
  ctx.save();
  ctx.beginPath();
  ctx.arc(ax + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = C.forest;
  ctx.fill();
  ctx.clip();
  if (photo && photo.complete && photo.naturalWidth) {
    const s = Math.min(photo.naturalWidth, photo.naturalHeight);
    ctx.drawImage(photo, (photo.naturalWidth - s) / 2, 0, s, s, ax, y, size, size);
  } else {
    ctx.fillStyle = '#fff';
    ctx.font = `800 34px ${AR}`;
    ctx.textAlign = 'center';
    ctx.fillText(Array.from(ar)[0] || '', ax + size / 2, y + 47);
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(ax + size / 2, y + size / 2, size / 2 + 2, 0, Math.PI * 2);
  ctx.strokeStyle = C.primary;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.textAlign = 'right';
  ctx.direction = 'rtl';
  ctx.fillStyle = C.heading;
  ctx.font = `800 30px ${AR}`;
  ctx.fillText(ar, ax - 18, y + 34);
  ctx.fillStyle = C.muted;
  ctx.font = `600 22px ${EN}`;
  ctx.direction = 'ltr';
  ctx.textAlign = 'right';
  ctx.fillText(en, ax - 18, y + 64);
  ctx.direction = 'rtl';
}

// Mouse pointer (tip at x,y)
export function cursor(ctx: Ctx, x: number, y: number, pressed = false) {
  const s = pressed ? 1.25 : 1.4;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 26);
  ctx.lineTo(7, 20);
  ctx.lineTo(12, 31);
  ctx.lineTo(17, 29);
  ctx.lineTo(12, 18);
  ctx.lineTo(21, 18);
  ctx.closePath();
  ctx.fillStyle = C.heading;
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2.2;
  ctx.stroke();
  ctx.restore();
}

export function windowDots(ctx: Ctx, x: number, y: number) {
  ['#FF5F57', '#FEBC2E', '#28C840'].forEach((c, i) => {
    ctx.beginPath();
    ctx.arc(x + i * 26, y, 9, 0, Math.PI * 2);
    ctx.fillStyle = c;
    ctx.fill();
  });
}

export function check(ctx: Ctx, cx: number, cy: number, size: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = size / 7;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.32, cy + size * 0.02);
  ctx.lineTo(cx - size * 0.08, cy + size * 0.26);
  ctx.lineTo(cx + size * 0.34, cy - size * 0.24);
  ctx.stroke();
  ctx.restore();
}
