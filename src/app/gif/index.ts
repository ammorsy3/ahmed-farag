// Makes the animated GIF for a "متحرك" post, in the browser:
// draw every frame on a canvas → one shared palette → store only the pixels that changed → GIF bytes.
import { GIFEncoder, applyPalette, quantize } from 'gifenc';
import fatimahRegular from '../linkedin-templates/fonts/FatimahArabic-Regular.woff?url';
import fatimahHeavy from '../linkedin-templates/fonts/FatimahArabic-Heavy.woff?url';
import inter600 from '../linkedin-templates/fonts/Inter-600.woff2?url';
import inter800 from '../linkedin-templates/fonts/Inter-800.woff2?url';
import { GIF_H, GIF_SCENES, GIF_W, type GifSlide, type Scene } from './scenes';

export { GIF_SCENES, GIF_W, GIF_H, type GifSlide };

const FRAME_MS = 80; // 12.5 frames a second, smooth enough and well under LinkedIn's 250-frame limit
const AUTHOR = { ar: 'أحمد فرج', en: 'Ahmed Farag' };

let fontsReady: Promise<void> | null = null;
export function loadGifFonts() {
  fontsReady ??= (async () => {
    const faces = [
      new FontFace('Fatimah Arabic', `url(${fatimahRegular})`, { weight: '400 600' }),
      new FontFace('Fatimah Arabic', `url(${fatimahHeavy})`, { weight: '700 900' }),
      new FontFace('Inter', `url(${inter600})`, { weight: '500 600' }),
      new FontFace('Inter', `url(${inter800})`, { weight: '700 900' }),
    ];
    await Promise.all(faces.map((f) => f.load().then(() => document.fonts.add(f))));
  })();
  return fontsReady;
}

let photo: Promise<HTMLImageElement | null> | null = null;
function loadPhoto() {
  photo ??= new Promise((res) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = '/AHMED2.jpg';
  });
  return photo;
}

async function makeScene(slide: GifSlide, canvas: HTMLCanvasElement): Promise<Scene> {
  await loadGifFonts();
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const def = GIF_SCENES[slide.type] || GIF_SCENES.demo;
  return def.build(ctx, slide, { author: AUTHOR, photo: await loadPhoto() });
}

function newCanvas() {
  const c = document.createElement('canvas');
  c.width = GIF_W;
  c.height = GIF_H;
  return c;
}

// A still frame (for previews): t = 'end' is the finished state
export async function gifFrame(slide: GifSlide, t: number | 'end', canvas = newCanvas()) {
  const scene = await makeScene(slide, canvas);
  scene.draw(t === 'end' ? scene.duration : t);
  return { canvas, duration: scene.duration };
}

// Plays the scene on a canvas (live preview); returns a stop function
export async function playGif(slide: GifSlide, canvas: HTMLCanvasElement) {
  const scene = await makeScene(slide, canvas);
  let raf = 0;
  const t0 = performance.now();
  const tick = () => {
    scene.draw((performance.now() - t0) % (scene.duration + 400));
    raf = requestAnimationFrame(tick);
  };
  tick();
  return () => cancelAnimationFrame(raf);
}

export async function makeGif(slide: GifSlide, onProgress?: (p: number) => void): Promise<{ bytes: Uint8Array; frames: number; durationMs: number }> {
  const canvas = newCanvas();
  const scene = await makeScene(slide, canvas);
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const grab = (t: number) => {
    scene.draw(t);
    return ctx.getImageData(0, 0, GIF_W, GIF_H).data;
  };

  // one palette for the whole GIF (no flicker), from a few moments across the animation
  const samples = [0, 0.25, 0.5, 0.75, 1].map((k) => grab(scene.duration * k));
  const joined = new Uint8ClampedArray(samples.reduce((n, s) => n + s.length, 0));
  let off = 0;
  for (const s of samples) {
    joined.set(s, off);
    off += s.length;
  }
  const palette = quantize(joined, 255);
  const T = palette.length; // extra entry = "unchanged pixel" (transparent)
  const fullPalette = [...palette, [255, 0, 255]];

  const gif = GIFEncoder();
  const count = Math.ceil(scene.duration / FRAME_MS) + 1;
  let shown: Uint8Array | null = null; // what the viewer currently sees
  let pending: { index: Uint8Array; delay: number } | null = null;
  let frames = 0;
  const flush = () => {
    if (!pending) return;
    gif.writeFrame(pending.index, GIF_W, GIF_H, {
      palette: frames === 0 ? fullPalette : undefined,
      delay: pending.delay,
      transparent: frames > 0,
      transparentIndex: T,
      dispose: 1, // keep the previous frame; only changed pixels are drawn
    });
    frames++;
    pending = null;
  };

  for (let f = 0; f < count; f++) {
    const t = Math.min(scene.duration, f * FRAME_MS);
    const index = applyPalette(grab(t), palette);
    const isLast = f === count - 1;
    if (shown) {
      let changed = 0;
      const delta = new Uint8Array(index.length);
      for (let i = 0; i < index.length; i++) {
        if (index[i] === shown[i]) delta[i] = T;
        else {
          delta[i] = index[i];
          changed++;
        }
      }
      if (changed === 0 && pending) pending.delay += FRAME_MS; // nothing moved: just show the last frame longer
      else {
        flush();
        pending = { index: delta, delay: FRAME_MS };
        shown = index;
      }
    } else {
      pending = { index, delay: FRAME_MS };
      shown = index;
    }
    if (isLast && pending) pending.delay += 600;
    if (f % 6 === 0) {
      onProgress?.(f / count);
      await new Promise((r) => setTimeout(r)); // keep the page responsive on a phone
    }
  }
  flush();
  gif.finish();
  onProgress?.(1);
  return { bytes: gif.bytes(), frames, durationMs: scene.duration };
}
