// Types for engine.js (copied as-is from agent-demos/linkedin-templates; the same file runs in n8n)
export type OptionDef = { key: string; label: string; default: boolean | string[] };
export type TemplateLike = {
  id: string;
  css: string;
  slides: Record<string, string>;
  limits?: Record<string, number>;
  footer?: boolean;
  // design switches + layout variants ('step~big' …), from the template row's options_json
  options?: OptionDef[];
  variants?: Record<string, string>;
  variantLimits?: Record<string, Record<string, number>>;
  ownDots?: boolean | string[];
};
// tpl: another template for this slide · variant: layout ('big', 'grid', 'chat', 'flow') · o: switches for this slide
export type SlideData = { type: string; tpl?: string; variant?: string; o?: Record<string, boolean>; [field: string]: unknown };
export type DocData = { author: { ar: string; en: string }; slides: SlideData[]; opts?: Record<string, boolean> };
export type TemplateMap = Record<string, TemplateLike>;

export const SIZE: { width: number; height: number };
export const LIMITS: Record<string, number>;
export const SHARED_OPTIONS: OptionDef[];
export function fill(tpl: string, ctx: Record<string, unknown>): string;
export function limitsFor(template: TemplateLike | null | undefined, key?: string): Record<string, number>;
export function slideTemplate<T extends TemplateLike>(template: T, s: SlideData, templatesById?: Record<string, T>): T;
export function slideKey(template: TemplateLike, s: SlideData): string;
export function slideOptions(template: TemplateLike, s: SlideData, docOpts?: Record<string, boolean>): Record<string, boolean>;
export function check(template: TemplateLike, data: { slides: SlideData[] }, templatesById?: TemplateMap): string[];
export function renderDoc(template: TemplateLike, data: DocData, brandCss: string, templatesById?: TemplateMap): string;
