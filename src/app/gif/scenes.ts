// The animated GIF scenes. Claude picks the one that fits the idea and writes its text:
//   chat  «محادثة»: a customer message, then the agent's replies appear one by one
//   flow  «سير عمل»: workflow steps light up from the trigger to "✓ تم"
//   demo  «عرض تطبيق»: an app window; the cursor clicks each tab and its panel fills in
// Each scene is drawn on a 1080×1350 canvas at any time t (ms), so frames can be rendered in order.
import { AR, C, EN, authorChip, card, charCount, check, clamp01, cursor, drawLines, ease, fitText, gridBg, layout, rr, span, windowDots, type Ctx } from './draw';

export const GIF_W = 1080;
export const GIF_H = 1350;

export type GifSlide = { type: string; kicker?: string; title?: string; bullets?: string[] };
// author null = no name chip at the bottom; dark = the forest-green background
export type SceneEnv = { author: { ar: string; en: string } | null; photo: HTMLImageElement | null; dark?: boolean };
export type Scene = { duration: number; draw: (t: number) => void };

const HOLD = 2400; // the finished state stays on screen before the GIF loops

function header(ctx: Ctx, s: GifSlide, topY: number, dark = false) {
  let y = topY;
  if (s.kicker) {
    ctx.font = `800 28px ${AR}`;
    ctx.direction = 'rtl';
    ctx.textAlign = 'center';
    ctx.fillStyle = dark ? C.lime : C.primary;
    ctx.fillText(s.kicker, GIF_W / 2, y);
    y += 30;
  }
  const font = `800 56px ${AR}`;
  const lines = layout(ctx, s.title || '', font, 900, 2);
  drawLines(ctx, lines, GIF_W / 2, y + 62, 74, font, dark ? '#fff' : C.heading, dark ? C.lime : C.primary, 'center');
  return y + 62 + (lines.length - 1) * 74 + 46;
}

// ---------------- chat ----------------
function chatScene(ctx: Ctx, s: GifSlide, env: SceneEnv): Scene {
  const wx = 130, ww = 820, headH = 112;
  const maxBubble = ww * 0.8;
  const msgs = [{ text: s.title || '', side: 'in' as const }, ...(s.bullets || []).slice(0, 5).map((text) => ({ text, side: 'out' as const }))];
  const laid = msgs.map((m) => {
    const font = m.side === 'in' ? `800 36px ${AR}` : `400 33px ${AR}`;
    const lh = m.side === 'in' ? 50 : 48;
    const lines = layout(ctx, m.text, font, maxBubble - 64, 6);
    const w = Math.min(maxBubble, Math.max(...lines.map((l) => l.width), 60) + 64 + (m.side === 'out' ? 40 : 0));
    return { ...m, font, lh, lines, w, h: lines.length * lh + 40 };
  });
  // timeline: the customer writes, then for each reply "typing…" then the bubble
  const times: number[] = [];
  let t = 500;
  laid.forEach((_, i) => {
    if (i > 0) t += 1000; // typing
    times.push(t);
    t += 550;
  });
  const typingFrom = laid.map((_, i) => (i === 0 ? Infinity : times[i] - 1000));
  const duration = times[times.length - 1] + 400 + HOLD;
  const gap = 22;
  // the window is as tall as the finished conversation (centred above the author), capped at 1010
  const contentH = laid.reduce((n, m) => n + m.h + gap, 0) - gap;
  const wh = Math.min(1010, headH + 34 + contentH + 34 + 84);
  const wy = Math.max(110, (1150 - wh) / 2);
  const areaTop = wy + headH + 34, areaBottom = wy + wh - 34;

  return {
    duration,
    draw(now) {
      gridBg(ctx, GIF_W, GIF_H, env.dark);
      card(ctx, wx, wy, ww, wh, 40, { shadow: true, stroke: C.line });
      // header: agent avatar + name + online
      ctx.save();
      rr(ctx, wx, wy, ww, headH, 40);
      ctx.clip();
      ctx.fillStyle = '#FAFCFA';
      ctx.fillRect(wx, wy, ww, headH);
      ctx.restore();
      ctx.fillStyle = C.line;
      ctx.fillRect(wx, wy + headH, ww, 2);
      const ax = wx + ww - 44 - 64;
      ctx.beginPath();
      ctx.arc(ax + 32, wy + headH / 2, 32, 0, Math.PI * 2);
      ctx.fillStyle = C.primary;
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `800 26px ${EN}`;
      ctx.textAlign = 'center';
      ctx.direction = 'ltr';
      ctx.fillText('AI', ax + 32, wy + headH / 2 + 9);
      ctx.direction = 'rtl';
      ctx.textAlign = 'right';
      ctx.fillStyle = C.heading;
      ctx.font = `800 32px ${AR}`;
      ctx.fillText(s.kicker || 'وكيلك الذكي', ax - 20, wy + 50);
      ctx.fillStyle = C.muted;
      ctx.font = `400 24px ${AR}`;
      ctx.fillText('متصل الآن', ax - 44, wy + 86);
      ctx.beginPath();
      ctx.arc(ax - 30, wy + 78, 7, 0, Math.PI * 2);
      ctx.fillStyle = C.bright;
      ctx.fill();
      windowDots(ctx, wx + 44, wy + headH / 2);

      // messages (scroll up when they no longer fit)
      const visible = laid.map((m, i) => ({ m, i, a: ease(span(now, times[i], times[i] + 320)) })).filter((x) => now >= times[x.i]);
      const typingIdx = laid.findIndex((_, i) => now >= typingFrom[i] && now < times[i]);
      let y = areaTop;
      const pos = visible.map((v) => {
        const p = y;
        y += v.m.h + gap;
        return p;
      });
      const typingY = y;
      const bottom = typingIdx >= 0 ? typingY + 70 : y - gap;
      const scroll = Math.max(0, bottom - areaBottom);
      ctx.save();
      ctx.beginPath();
      ctx.rect(wx, wy + headH + 2, ww, wh - headH - 2);
      ctx.clip();
      visible.forEach((v, k) => {
        const m = v.m;
        const by = pos[k] - scroll + (1 - v.a) * 18;
        const bx = m.side === 'in' ? wx + ww - 36 - m.w : wx + 36;
        ctx.globalAlpha = v.a;
        if (m.side === 'in') card(ctx, bx, by, m.w, m.h, 30, { fill: C.mint, stroke: 'rgba(31,154,46,.18)' });
        else card(ctx, bx, by, m.w, m.h, 30, { fill: C.primary });
        drawLines(ctx, m.lines, bx + m.w - 32, by + 20 + m.lh * 0.78, m.lh, m.font, m.side === 'in' ? C.heading : '#fff', m.side === 'in' ? C.primary : C.lime);
        if (m.side === 'out') {
          // ✓✓ read
          check(ctx, bx + 26, by + m.h - 22, 20, 'rgba(255,255,255,.85)');
          check(ctx, bx + 38, by + m.h - 22, 20, 'rgba(255,255,255,.85)');
        }
        ctx.globalAlpha = 1;
      });
      if (typingIdx >= 0) {
        const by = typingY - scroll;
        card(ctx, wx + 36, by, 120, 62, 30, { fill: C.primary });
        for (let d = 0; d < 3; d++) {
          const phase = (now / 160 + d) % 3;
          ctx.beginPath();
          ctx.arc(wx + 36 + 34 + d * 26, by + 31 - (phase < 1 ? 5 : 0), 7, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${phase < 1 ? 1 : 0.55})`;
          ctx.fill();
        }
      }
      ctx.restore();
      if (env.author) authorChip(ctx, GIF_W / 2, 1200, env.photo, env.author.ar, env.author.en, env.dark);
    },
  };
}

// ---------------- flow ----------------
function flowScene(ctx: Ctx, s: GifSlide, env: SceneEnv): Scene {
  const steps = (s.bullets || []).slice(0, 5);
  const x0 = 130, x1 = 950, w = x1 - x0;
  const nodeFont = `400 32px ${AR}`;
  const nodes = steps.map((b) => {
    const lines = layout(ctx, b, nodeFont, w - 150, 2);
    return { lines, h: Math.max(96, lines.length * 44 + 48) };
  });
  const start = 900, every = 800;
  const doneAt = start + steps.length * every;
  const duration = doneAt + 700 + HOLD;
  return {
    duration,
    draw(now) {
      gridBg(ctx, GIF_W, GIF_H, env.dark);
      const blockH = 68 + 34 + nodes.reduce((h, n) => h + n.h + 30, 0) + 64;
      const headBottom = header(ctx, s, 96, env.dark) + 18;
      let y = Math.max(headBottom, headBottom + (1150 - headBottom - blockH) / 2);
      const boxX = x1 - 30 - 64; // number box (right side)
      const lineX = boxX + 32;
      // trigger pill
      const on = now >= 400;
      const pillW = 210;
      card(ctx, x1 - pillW, y, pillW, 68, 34, { fill: on ? C.primary : C.card, stroke: on ? undefined : C.lineStrong });
      ctx.fillStyle = on ? '#fff' : C.muted;
      ctx.font = `800 28px ${AR}`;
      ctx.direction = 'rtl';
      ctx.textAlign = 'right';
      ctx.fillText('⚡ تشغيل', x1 - 30, y + 44);
      const firstTop = y + 68 + 34;
      // positions
      let ny = firstTop;
      const pos = nodes.map((n) => {
        const p = ny;
        ny += n.h + 30;
        return p;
      });
      const endY = ny;
      // connector: dashed track + green progress
      ctx.save();
      ctx.strokeStyle = env.dark ? 'rgba(255,255,255,0.28)' : C.lineStrong;
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(lineX, y + 68);
      ctx.lineTo(lineX, endY);
      ctx.stroke();
      ctx.restore();
      const k = (now - start) / every; // how many steps are done (fractional)
      const progressY = k <= 0 ? y + 68 : k >= nodes.length ? endY : pos[Math.floor(k)] + nodes[Math.floor(k)].h * (k % 1);
      ctx.strokeStyle = C.primary;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(lineX, y + 68);
      ctx.lineTo(lineX, Math.max(y + 68, progressY));
      ctx.stroke();
      // nodes
      nodes.forEach((n, i) => {
        const top = pos[i];
        const act = clamp01((now - (start + i * every)) / 260);
        const done = now >= start + (i + 1) * every - 200;
        card(ctx, x0, top, w, n.h, 26, { fill: C.card, stroke: act > 0 ? C.primary : C.line, lw: act > 0 ? 3 : 2, shadow: act > 0 });
        rr(ctx, boxX, top + (n.h - 64) / 2, 64, 64, 18);
        ctx.fillStyle = act > 0 ? C.primary : C.surface;
        ctx.fill();
        ctx.fillStyle = act > 0 ? '#fff' : C.muted;
        ctx.font = `800 26px ${EN}`;
        ctx.textAlign = 'center';
        ctx.direction = 'ltr';
        ctx.fillText(String(i + 1).padStart(2, '0'), boxX + 32, top + n.h / 2 + 9);
        drawLines(ctx, n.lines, boxX - 26, top + n.h / 2 - ((n.lines.length - 1) * 44) / 2 + 11, 44, nodeFont, act > 0 ? C.heading : C.muted, C.primary);
        if (done) {
          ctx.beginPath();
          ctx.arc(x0 + 46, top + n.h / 2, 22, 0, Math.PI * 2);
          ctx.fillStyle = C.mint;
          ctx.fill();
          check(ctx, x0 + 46, top + n.h / 2, 30, C.primary);
        }
      });
      // "✓ تم"
      const fin = ease(span(now, doneAt, doneAt + 350));
      if (fin > 0) {
        const pw = 170 * (0.8 + 0.2 * fin);
        ctx.globalAlpha = fin;
        card(ctx, x1 - pw, endY, pw, 64, 32, { fill: C.lime });
        ctx.fillStyle = C.heading;
        ctx.font = `800 28px ${AR}`;
        ctx.textAlign = 'center';
        ctx.direction = 'rtl';
        ctx.fillText('✓ تم', x1 - pw / 2, endY + 42);
        ctx.globalAlpha = 1;
      }
      if (env.author) authorChip(ctx, GIF_W / 2, 1200, env.photo, env.author.ar, env.author.en, env.dark);
    },
  };
}

// ---------------- demo ----------------
// "Tab | what it shows". A whole sentence (no "|") becomes a short tab name (its first words)
// and the sentence goes in the panel, so no panel is left empty.
function splitTab(b: string) {
  const m = String(b).split(/\s*[|:：]\s*/);
  const name = (m[0] || '').trim();
  const desc = m.slice(1).join(' ').trim();
  if (desc) return { name, desc };
  const words = name.split(/\s+/);
  return words.length > 3 ? { name: words.slice(0, 3).join(' '), desc: name } : { name, desc: '' };
}

function demoScene(ctx: Ctx, s: GifSlide, env: SceneEnv): Scene {
  const tabs = (s.bullets || []).slice(0, 4).map(splitTab);
  const n = Math.max(1, tabs.length);
  const wx = 70, ww = 940, barH = 92;
  let wy = 300;
  const wh = 1110 - wy;
  // panel rectangles: one big on top, the rest share the bottom row
  const pad = 28;
  const innerX = wx + pad, innerW = ww - pad * 2, innerY = wy + barH + pad, innerH = wh - barH - pad * 2;
  const rects =
    n === 1
      ? [{ x: innerX, y: innerY, w: innerW, h: innerH }]
      : [
          { x: innerX, y: innerY, w: innerW, h: innerH * 0.56 },
          ...Array.from({ length: n - 1 }, (_, i) => {
            const cw = (innerW - 20 * (n - 2)) / (n - 1);
            // right-to-left order
            return { x: innerX + innerW - (i + 1) * cw - i * 20, y: innerY + innerH * 0.56 + 20, w: cw, h: innerH * 0.44 - 20 };
          }),
        ];
  const descFont = `400 30px ${AR}`;
  const descLines = tabs.map((tb, i) => layout(ctx, tb.desc, descFont, rects[i].w - 64, i === 0 ? 4 : 3));
  // tab pills, laid out from the right edge of the title bar, clear of the window dots on the left;
  // long names get a smaller font, then a "…"
  const barRoom = ww - 30 - 150;
  let tabSize = 28;
  ctx.direction = 'rtl';
  const widthAt = (size: number) => {
    ctx.font = `600 ${size}px ${AR}`;
    return tabs.reduce((sum, tb) => sum + ctx.measureText(tb.name).width + 44 + 10, -10);
  };
  while (tabSize > 22 && widthAt(tabSize) > barRoom) tabSize -= 2;
  const tabFont = `600 ${tabSize}px ${AR}`;
  ctx.font = tabFont;
  const maxPill = (barRoom - 10 * (n - 1)) / n;
  const tabLabels = tabs.map((tb) => (widthAt(tabSize) > barRoom ? fitText(ctx, tb.name, maxPill - 44) : tb.name));
  ctx.font = tabFont;
  let tx = wx + ww - 30;
  const pills = tabLabels.map((label) => {
    const pw = ctx.measureText(label).width + 44;
    const p = { x: tx - pw, w: pw };
    tx -= pw + 10;
    return p;
  });
  // panel titles fit their panel
  const titles = tabs.map((tb, i) => {
    ctx.font = `800 ${i === 0 ? 40 : 32}px ${AR}`;
    return fitText(ctx, tb.name, rects[i].w - 64);
  });
  // timeline per tab: move 700, click 150, type, pause
  const plan: { at: number; move: number; type: number }[] = [];
  let t = 600;
  tabs.forEach((_, i) => {
    const typing = Math.min(1600, Math.max(700, charCount(descLines[i]) * 22));
    plan.push({ at: t, move: 700, type: typing });
    t += 700 + 150 + typing + 500;
  });
  const duration = t + HOLD - 300;
  const tabPoint = (i: number) => ({ x: pills[i].x + pills[i].w / 2, y: wy + barH / 2 + 4 });
  const rest = { x: wx + ww * 0.35, y: wy + wh - 120 };

  return {
    duration,
    draw(now) {
      gridBg(ctx, GIF_W, GIF_H, env.dark);
      wy = 300;
      header(ctx, s, 96, env.dark);
      card(ctx, wx, wy, ww, wh, 40, { shadow: true, stroke: C.line });
      ctx.fillStyle = C.line;
      ctx.fillRect(wx, wy + barH, ww, 2);
      windowDots(ctx, wx + 40, wy + barH / 2);
      // which tab is active, cursor position
      let active = -1;
      let cur = rest;
      let pressed = false;
      plan.forEach((p, i) => {
        const from = i === 0 ? rest : tabPoint(i - 1);
        if (now >= p.at) {
          const k = ease(span(now, p.at, p.at + p.move));
          const to = tabPoint(i);
          cur = { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k };
          if (now >= p.at + p.move) active = i;
          pressed = now >= p.at + p.move && now < p.at + p.move + 150;
        }
      });
      // tabs
      tabs.forEach((_tb, i) => {
        const p = pills[i];
        const on = i === active;
        if (on) {
          rr(ctx, p.x, wy + 22, p.w, barH - 44, 24);
          ctx.fillStyle = C.primary;
          ctx.fill();
        }
        ctx.fillStyle = on ? '#fff' : C.body;
        ctx.font = tabFont;
        ctx.textAlign = 'center';
        ctx.direction = 'rtl';
        ctx.fillText(tabLabels[i], p.x + p.w / 2, wy + barH / 2 + 10);
      });
      // panels
      tabs.forEach((_tb, i) => {
        const r = rects[i];
        const on = i === active;
        const seen = active >= i;
        card(ctx, r.x, r.y, r.w, r.h, 26, { fill: '#FAFBF9', stroke: on ? C.primary : C.lineStrong, lw: on ? 3 : 2 });
        ctx.fillStyle = C.heading;
        ctx.font = `800 ${i === 0 ? 40 : 32}px ${AR}`;
        ctx.textAlign = 'right';
        ctx.direction = 'rtl';
        ctx.fillText(titles[i], r.x + r.w - 32, r.y + (i === 0 ? 62 : 54));
        if (seen) {
          const p = plan[i];
          const typedFrom = p.at + p.move + 150;
          const reveal = on ? Math.floor(span(now, typedFrom, typedFrom + p.type) * charCount(descLines[i])) : Infinity;
          drawLines(ctx, descLines[i], r.x + r.w - 32, r.y + (i === 0 ? 118 : 104), 44, descFont, C.body, C.primary, 'right', reveal);
          if (i === 0) {
            // a few list rows, like real app content, sliding in after the text
            const rowsTop = r.y + 118 + descLines[0].length * 44 + 10;
            const room = Math.floor((r.y + r.h - 24 - rowsTop) / 62);
            for (let k = 0; k < Math.min(3, room); k++) {
              const a = on ? ease(span(now, typedFrom + plan[0].type + k * 180, typedFrom + plan[0].type + k * 180 + 300)) : 1;
              if (a <= 0) continue;
              ctx.globalAlpha = a;
              const ry = rowsTop + k * 62;
              card(ctx, r.x + 28, ry, r.w - 56, 48, 14, { fill: C.card, stroke: C.line });
              ctx.beginPath();
              ctx.arc(r.x + r.w - 56, ry + 24, 11, 0, Math.PI * 2);
              ctx.fillStyle = k === 0 ? C.primary : C.mint;
              ctx.fill();
              rr(ctx, r.x + r.w - 82 - (r.w - 200) * (0.6 - k * 0.12), ry + 18, (r.w - 200) * (0.6 - k * 0.12), 12, 6);
              ctx.fillStyle = C.lineStrong;
              ctx.fill();
              ctx.globalAlpha = 1;
            }
          }
        } else {
          // empty skeleton lines until its tab is opened
          ctx.fillStyle = C.line;
          for (let l = 0; l < (i === 0 ? 3 : 2); l++) {
            const lw = (r.w - 64) * (l === 0 ? 0.9 : l === 1 ? 0.7 : 0.5);
            rr(ctx, r.x + r.w - 32 - lw, r.y + (i === 0 ? 100 : 86) + l * 40, lw, 16, 8);
            ctx.fill();
          }
        }
      });
      cursor(ctx, cur.x, cur.y, pressed);
      if (pressed) {
        ctx.beginPath();
        ctx.arc(cur.x, cur.y, 26, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(31,154,46,.45)';
        ctx.lineWidth = 4;
        ctx.stroke();
      }
      if (env.author) authorChip(ctx, GIF_W / 2, 1200, env.photo, env.author.ar, env.author.en, env.dark);
    },
  };
}

export const GIF_SCENES: Record<string, { label: string; build: (ctx: Ctx, s: GifSlide, env: SceneEnv) => Scene }> = {
  demo: { label: 'عرض تطبيق', build: demoScene },
  chat: { label: 'محادثة', build: chatScene },
  flow: { label: 'سير عمل', build: flowScene },
};
