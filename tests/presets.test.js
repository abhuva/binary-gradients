import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  createPreset,
  createPresetCollection,
  mergePresetLibraries,
  normalizePreset,
  normalizePresetCollection,
  parsePreset,
  parsePresetPayload,
  serializePreset,
} from '../src/domain/presets.js';
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
  assert.deepEqual(preset.tags, []);
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

test('normalizePreset ignores malformed LUT point entries', () => {
  const preset = normalizePreset({
    lut: {
      id: 'broken-lut',
      length: 4,
      points: [
        null,
        { index: 0, color: '#000000', kind: 'smooth' },
        'bad',
        { index: 3, color: '#ffffff', kind: 'hard' },
      ],
    },
  });

  assert.equal(preset.lut.length, 4);
  assert.deepEqual(preset.lut.points.map((point) => point.index), [0, 3]);
});

test('serializePreset and parsePreset round-trip normalized preset data', () => {
  const preset = createPreset({ name: 'Round Trip', state: createInitialState(), currentLut: lut });
  const parsed = parsePreset(serializePreset(preset));

  assert.deepEqual(parsed, preset);
});

test('normalizePresetCollection supports legacy array storage', () => {
  const preset = createPreset({ name: 'Legacy Array', state: createInitialState(), currentLut: lut });
  const collection = normalizePresetCollection([preset]);

  assert.equal(collection.name, 'Preset Collection');
  assert.equal(collection.presets.length, 1);
  assert.equal(collection.presets[0].id, 'legacy-array');
});

test('parsePresetPayload detects collection and single preset JSON', () => {
  const preset = createPreset({ name: 'Payload Preset', state: createInitialState(), currentLut: lut });
  const collectionPayload = parsePresetPayload(JSON.stringify(createPresetCollection({ name: 'Payloads', presets: [preset] })));
  const presetPayload = parsePresetPayload(serializePreset(preset));

  assert.equal(collectionPayload.type, 'collection');
  assert.equal(collectionPayload.collection.presets[0].id, 'payload-preset');
  assert.equal(presetPayload.type, 'preset');
  assert.equal(presetPayload.preset.id, 'payload-preset');
});

test('mergePresetLibraries lets user presets override built-ins by id', () => {
  const state = createInitialState();
  const builtIn = createPreset({ name: 'Shared', description: 'built in', tags: ['starter'], state, currentLut: lut });
  const user = createPreset({ name: 'Shared', description: 'user copy', tags: ['custom'], state, currentLut: lut });
  const merged = mergePresetLibraries({ builtIn: [builtIn], user: [user] });

  assert.equal(merged.length, 1);
  assert.equal(merged[0].source, 'user');
  assert.equal(merged[0].description, 'user copy');
  assert.deepEqual(merged[0].tags, ['custom']);
});

test('built-in preset collection file normalizes successfully', () => {
  const collection = normalizePresetCollection(JSON.parse(readFileSync('presets/builtin-presets.json', 'utf8')));

  assert.ok(collection.presets.length >= 1);
  assert.ok(collection.presets.every((preset) => preset.tags.length >= 1));
});
