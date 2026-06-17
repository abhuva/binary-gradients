import { clamp, clampByte } from './value-range.js';

export function hexToRgb(hex) {
  const normalized = normalizeHex(hex).slice(1);
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ];
}

export function rgbToHsv(rgb) {
  const r = rgb[0] / 255;
  const g = rgb[1] / 255;
  const b = rgb[2] / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let hue = 0;
  if (delta !== 0) {
    if (max === r) hue = 60 * (((g - b) / delta) % 6);
    else if (max === g) hue = 60 * ((b - r) / delta + 2);
    else hue = 60 * ((r - g) / delta + 4);
  }
  return [
    (hue + 360) % 360,
    max === 0 ? 0 : (delta / max) * 100,
    max * 100,
  ];
}

export function rgbToHex(rgb) {
  return `#${rgb.map((value) => clampByte(value).toString(16).padStart(2, '0')).join('')}`;
}

export function normalizeHex(value) {
  const raw = String(value || '').trim();
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase();
  return '#000000';
}

export function hsvToHex(hue, saturation, value) {
  const h = ((hue % 360) + 360) % 360 / 60;
  const s = clamp(saturation / 100, 0, 1);
  const v = clamp(value / 100, 0, 1);
  const c = v * s;
  const x = c * (1 - Math.abs((h % 2) - 1));
  const m = v - c;
  let rgb = [0, 0, 0];
  if (h < 1) rgb = [c, x, 0];
  else if (h < 2) rgb = [x, c, 0];
  else if (h < 3) rgb = [0, c, x];
  else if (h < 4) rgb = [0, x, c];
  else if (h < 5) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return rgbToHex(rgb.map((channel) => (channel + m) * 255));
}