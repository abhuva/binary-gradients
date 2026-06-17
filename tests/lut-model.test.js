import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLut, cloneLut, exportLut, normalizePoint, sanitizeLutId } from '../src/lut/model.js';

test('buildLut interpolates smooth points across the LUT length', () => {
  const colors = buildLut({
    id: 'ramp',
    length: 4,
    points: [
      { id: 'a', index: 0, color: '#000000', kind: 'smooth' },
      { id: 'b', index: 3, color: '#ffffff', kind: 'smooth' },
    ],
  });

  assert.deepEqual(colors, [
    [0, 0, 0],
    [85, 85, 85],
    [170, 170, 170],
    [255, 255, 255],
  ]);
});

test('buildLut applies hard point overrides after smooth interpolation', () => {
  const colors = buildLut({
    id: 'override',
    length: 4,
    points: [
      { id: 'a', index: 0, color: '#000000', kind: 'smooth' },
      { id: 'b', index: 3, color: '#ffffff', kind: 'smooth' },
      { id: 'c', index: 1, color: '#ff0000', kind: 'hard' },
    ],
  });

  assert.deepEqual(colors[1], [255, 0, 0]);
  assert.deepEqual(colors[2], [170, 170, 170]);
});

test('normalizePoint clamps index, normalizes color, and defaults kind to smooth', () => {
  assert.deepEqual(normalizePoint({ id: 'p', index: 99, color: 'bad', kind: 'other' }, 8), {
    id: 'p',
    index: 7,
    color: '#000000',
    kind: 'smooth',
  });
});

test('exportLut emits normalized v1 JSON shape', () => {
  const exported = exportLut({
    id: ' My LUT! ',
    length: 4,
    points: [
      { id: 'b', index: 3, color: '#ffffff', kind: 'smooth' },
      { id: 'h', index: 1, color: '#ff0000', kind: 'hard' },
      { id: 'a', index: 0, color: '#000000', kind: 'smooth' },
    ],
  });

  assert.deepEqual(exported, {
    version: 1,
    id: 'my-lut',
    length: 4,
    gradientStops: [
      { index: 0, color: '#000000' },
      { index: 3, color: '#ffffff' },
    ],
    pointOverrides: [
      { index: 1, color: '#ff0000' },
    ],
  });
});

test('exportLut clamps point indices to the exported length', () => {
  const exported = exportLut({
    id: 'oversized',
    length: 9999,
    points: [
      { id: 'a', index: 9998, color: '#ffffff', kind: 'smooth' },
      { id: 'b', index: 9000, color: '#ff0000', kind: 'hard' },
    ],
  });
  const indices = [...exported.gradientStops, ...exported.pointOverrides].map((point) => point.index);

  assert.equal(exported.length, 4096);
  assert.ok(indices.every((index) => index >= 0 && index < exported.length));
});

test('cloneLut preserves editable data but assigns fresh point ids', () => {
  const original = {
    id: 'source',
    length: 2,
    points: [{ id: 'old', index: 0, color: '#000000', kind: 'smooth' }],
  };
  const cloned = cloneLut(original);

  assert.equal(cloned.id, original.id);
  assert.equal(cloned.length, original.length);
  assert.notEqual(cloned.points[0].id, original.points[0].id);
  assert.deepEqual({ ...cloned.points[0], id: 'old' }, original.points[0]);
});

test('sanitizeLutId creates stable URL/file safe ids', () => {
  assert.equal(sanitizeLutId('  CRT Glow++  '), 'crt-glow');
  assert.equal(sanitizeLutId(''), 'custom-lut');
});
