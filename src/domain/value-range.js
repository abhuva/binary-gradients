export function clampNumber(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function wrapRange(value, valueRange) {
  return ((Number(value) % valueRange) + valueRange) % valueRange;
}

export function clampByte(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : Number(value).toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}