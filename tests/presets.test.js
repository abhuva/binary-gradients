import test from 'node:test';
import assert from 'node:assert/strict';
import { createPreset, normalizePreset, parsePreset, serializePreset } from '../src/domain/presets.js';
import { createInitialState } from '../src/domain/state.js';

const lut = {
  id: 'custom-lut',
  length: 4,
  points: [
    { id: 'a', index: 0, color: '#000000', kind: 'smooth' },
    { id: 'b', index: 3, color: '#ffffff', kind: 'smooth' },
  ],
};

test('createPreset captures render state, gradients, and editable LUT', () => {
  const state = createInitialState();
  state.width = 1920;
  state.height = 1080;
  state.time = 12.5;
  state.combineOperation = 'and';
  state.gradients[0].type = 'voronoi';

  const preset = createPreset({ name: 'Glass Water', state, currentLut: lut });

  assert.equal(preset.version, 1);
  assert.equal(preset.name, 'Glass Water');
  assert.equal(preset.state.width, 1920);
  assert.equal(preset.state.height, 1080);
  assert.equal(preset.state.time, 12.5);
  assert.equal(preset.state.combineOperation, 'and');
  assert.equal(preset.state.gradients[0].type, 'voronoi');
  assert.deepEqual(preset.lut.points, lut.points);
});

test('normalizePreset clamps unsafe values and falls back to known modes', () => {
  const preset = normalizePreset({
    id: 'Bad Preset!',
    name: '',
    state: {
      width: 2,
      height: 99999,
      valueBits: 20,
      timeScale: 9,
      combineOperation: 'bad',
      combineModifier: 'bad',
      fieldWrapMode: 'bad',
      paletteWrapMode: 'bad',
      paletteOffset: -1,
      cycleSeconds: 999,
      gradients: [{ type: 'missing' }],
    },
    lut: {
      id: 'Bad LUT!',
      length: 99999,
      points: [{ index: 99, color: 'bad', kind: 'bad' }],
    },
  }, 4096);

  assert.equal(preset.id, 'bad-preset');
  assert.equal(preset.name, 'Bad Preset!');
  assert.equal(preset.state.width, 16);
  assert.equal(preset.state.height, 8192);
  assert.equal(preset.state.valueBits, 12);
  assert.equal(preset.state.timeScale, 4);
  assert.equal(preset.state.combineOperation, 'xor');
  assert.equal(preset.state.combineModifier, 'none');
  assert.equal(preset.state.fieldWrapMode, 'loop');
  assert.equal(preset.state.paletteWrapMode, 'loop');
  assert.equal(preset.state.paletteOffset, 4095);
  assert.equal(preset.state.cycleSeconds, 40);
  assert.equal(preset.state.gradients[0].type, 'linear');
  assert.equal(preset.state.gradients[1].type, 'rings');
  assert.equal(preset.lut.id, 'bad-lut');
  assert.equal(preset.lut.length, 4096);
  assert.equal(preset.lut.points[0].index, 99);
  assert.equal(preset.lut.points[0].color, '#000000');
  assert.equal(preset.lut.points[0].kind, 'smooth');
});

test('normalizePreset migrates legacy gradientWrapMode into split wrap modes', () => {
  const preset = normalizePreset({
    state: {
      valueBits: 8,
      gradientWrapMode: 'pingpong',
    },
  });

  assert.equal(preset.state.fieldWrapMode, 'pingpong');
  assert.equal(preset.state.paletteWrapMode, 'pingpong');
});

test('serializePreset and parsePreset round-trip normalized preset data', () => {
  const preset = createPreset({ name: 'Round Trip', state: createInitialState(), currentLut: lut });
  const parsed = parsePreset(serializePreset(preset));

  assert.deepEqual(parsed, preset);
});
