import { hexToRgb, normalizeHex } from '../domain/color.js';
import { uid } from '../domain/random.js';
import { clampNumber, lerp } from '../domain/value-range.js';

export function buildLut(definition) {
  const length = clampNumber(definition.length, 2, 4096);
  const colors = Array.from({ length }, () => [0, 0, 0]);
  const smoothPoints = definition.points
    .filter((point) => point.kind === 'smooth')
    .map((point) => normalizePoint(point, length))
    .sort((a, b) => a.index - b.index);

  if (smoothPoints.length === 0) {
    for (let i = 0; i < length; i++) colors[i] = [0, 0, 0];
  } else {
    const first = smoothPoints[0];
    const last = smoothPoints[smoothPoints.length - 1];
    for (let i = 0; i <= first.index; i++) colors[i] = hexToRgb(first.color);
    for (let i = last.index; i < length; i++) colors[i] = hexToRgb(last.color);

    for (let s = 0; s < smoothPoints.length - 1; s++) {
      const left = smoothPoints[s];
      const right = smoothPoints[s + 1];
      const span = Math.max(1, right.index - left.index);
      const lc = hexToRgb(left.color);
      const rc = hexToRgb(right.color);
      for (let i = left.index; i <= right.index; i++) {
        const t = (i - left.index) / span;
        colors[i] = [
          Math.round(lerp(lc[0], rc[0], t)),
          Math.round(lerp(lc[1], rc[1], t)),
          Math.round(lerp(lc[2], rc[2], t)),
        ];
      }
    }
  }

  definition.points
    .filter((point) => point.kind === 'hard')
    .map((point) => normalizePoint(point, length))
    .forEach((point) => {
      colors[point.index] = hexToRgb(point.color);
    });

  return colors;
}

export function normalizePoint(point, length) {
  return {
    ...point,
    index: clampNumber(point.index, 0, length - 1),
    color: normalizeHex(point.color),
    kind: point.kind === 'hard' ? 'hard' : 'smooth',
  };
}

export function exportLut(definition) {
  const normalizedPoints = definition.points
    .map((point) => normalizePoint(point, definition.length))
    .sort((a, b) => a.index - b.index || a.kind.localeCompare(b.kind));
  return {
    version: 1,
    id: sanitizeLutId(definition.id),
    length: clampNumber(definition.length, 2, 4096),
    gradientStops: normalizedPoints
      .filter((point) => point.kind === 'smooth')
      .map(({ index, color }) => ({ index, color })),
    pointOverrides: normalizedPoints
      .filter((point) => point.kind === 'hard')
      .map(({ index, color }) => ({ index, color })),
  };
}

export function cloneLut(definition) {
  return {
    id: definition.id,
    length: definition.length,
    points: definition.points.map((point) => ({ ...point, id: uid() })),
  };
}

export function sanitizeLutId(value) {
  const id = String(value || 'custom-lut').trim().toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/^-+|-+$/g, '');
  return id || 'custom-lut';
}