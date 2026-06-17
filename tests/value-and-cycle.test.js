import test from 'node:test';
import assert from 'node:assert/strict';
import { advancePaletteCycleState, wrapPaletteOffset } from '../src/domain/palette-cycle.js';
import { previewModeForActiveTab, resolveValueDepth } from '../src/domain/state.js';
import { clampNumber, wrapRange } from '../src/domain/value-range.js';

test('wrapRange preserves fractional values across positive and negative input', () => {
  assert.equal(wrapRange(257.5, 256), 1.5);
  assert.equal(wrapRange(-0.25, 256), 255.75);
});

test('wrapPaletteOffset matches active value range wrapping', () => {
  assert.equal(wrapPaletteOffset(1025, 1024), 1);
  assert.equal(wrapPaletteOffset(-2, 1024), 1022);
});

test('loop palette cycling advances by valueRange per cycle duration', () => {
  const next = advancePaletteCycleState({
    offset: 250,
    direction: 1,
    mode: 'loop',
    valueRange: 256,
    valueMask: 255,
    cycleSeconds: 8,
    dt: 1,
  });

  assert.deepEqual(next, { offset: 26, direction: 1 });
});

test('ping-pong palette cycling reflects at the high endpoint and flips direction', () => {
  const next = advancePaletteCycleState({
    offset: 250,
    direction: 1,
    mode: 'pingpong',
    valueRange: 256,
    valueMask: 255,
    cycleSeconds: 10,
    dt: 1,
  });

  assert.equal(next.direction, -1);
  assert.equal(next.offset, 209);
});

test('ping-pong palette cycling reflects at the low endpoint and flips direction', () => {
  const next = advancePaletteCycleState({
    offset: 2,
    direction: -1,
    mode: 'pingpong',
    valueRange: 256,
    valueMask: 255,
    cycleSeconds: 10,
    dt: 1,
  });

  assert.equal(next.direction, 1);
  assert.equal(next.offset, 49);
});

test('resolveValueDepth clamps requested bits and max texture size', () => {
  assert.deepEqual(resolveValueDepth(7), { valueBits: 8, valueRange: 256, valueMask: 255 });
  assert.deepEqual(resolveValueDepth(13, 4096), { valueBits: 12, valueRange: 4096, valueMask: 4095 });
});

test('gradient tabs only switch to individual previews when their toggles are enabled', () => {
  assert.equal(previewModeForActiveTab('render', [true, true]), 'final');
  assert.equal(previewModeForActiveTab('grad1', [false, true]), 'final');
  assert.equal(previewModeForActiveTab('grad2', [true, false]), 'final');
  assert.equal(previewModeForActiveTab('grad1', [true, false]), 'grad1');
  assert.equal(previewModeForActiveTab('grad2', [false, true]), 'grad2');
});

test('clampNumber floors finite values and clamps bounds', () => {
  assert.equal(clampNumber(3.9, 0, 10), 3);
  assert.equal(clampNumber(-3, 0, 10), 0);
  assert.equal(clampNumber('bad', 0, 10), 0);
});
