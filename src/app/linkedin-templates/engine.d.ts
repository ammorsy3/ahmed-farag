// Types for engine.js (copied as-is from agent-demos/linkedin-templates; the same file runs in n8n)
export type TemplateLike = { id: string; css: string; slides: Record<string, string>; limits?: Record<string, number>; footer?: boolean };
export type SlideData = { type: string; [field: string]: unknown };
export const SIZE: { width: number; height: number };
export const LIMITS: Record<string, number>;
export function fill(tpl: string, ctx: Record<string, unknown>): string;
export function limitsFor(template: TemplateLike | null | undefined): Record<string, number>;
export function check(template: TemplateLike, data: { slides: SlideData[] }): string[];
export function renderDoc(template: TemplateLike, data: { author: { ar: string; en: string }; slides: SlideData[] }, brandCss: string): string;
