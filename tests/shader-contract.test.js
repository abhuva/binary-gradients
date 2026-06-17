import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COMBINE_MODIFIER_SHADER_IDS,
  COMBINE_MODIFIER_TYPES,
  COMBINE_OPERATION_SHADER_IDS,
  COMBINE_OPERATION_TYPES,
  COMBINE_SHADER_IDS,
  COMBINE_TYPES,
  DEFAULT_GRADIENT,
  FIELD_SHADER_IDS,
  FIELD_TYPES,
  GRADIENT_WRAP_SHADER_IDS,
  GRADIENT_WRAP_TYPES,
  normalizeGradientDefinition,
} from '../src/domain/registries.js';
import { createMainShaderSources } from '../src/render/shader-source.js';
import { GRADIENT_UNIFORM_LENGTH, GRADIENT_UNIFORM_SLOTS, packGradientUniforms } from '../src/render/shader-contract.js';

function assertClose(actual, expected, tolerance = 0.000001) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} should be within ${tolerance} of ${expected}`);
}

function assertSameKeys(left, right, label) {
  assert.deepEqual(Object.keys(left).sort(), Object.keys(right).sort(), label);
}

function assertUniqueContiguousIds(map, label) {
  const ids = Object.values(map).sort((a, b) => a - b);
  assert.equal(new Set(ids).size, ids.length, `${label} ids must be unique`);
  assert.deepEqual(ids, Array.from({ length: ids.length }, (_, index) => index), `${label} ids must be contiguous from zero`);
}

test('registry shader id maps cover exactly the public registries', () => {
  assertSameKeys(FIELD_TYPES, FIELD_SHADER_IDS, 'field ids');
  assertSameKeys(COMBINE_OPERATION_TYPES, COMBINE_OPERATION_SHADER_IDS, 'combine operation ids');
  assertSameKeys(COMBINE_MODIFIER_TYPES, COMBINE_MODIFIER_SHADER_IDS, 'combine modifier ids');
  assertSameKeys(COMBINE_TYPES, COMBINE_SHADER_IDS, 'legacy combine aliases');
  assertSameKeys(GRADIENT_WRAP_TYPES, GRADIENT_WRAP_SHADER_IDS, 'wrap ids');
});

test('rotated square field replaces separate box and diamond field ids', () => {
  assert.ok(Object.hasOwn(FIELD_TYPES, 'square'));
  assert.ok(!Object.hasOwn(FIELD_TYPES, 'box'));
  assert.ok(!Object.hasOwn(FIELD_TYPES, 'diamond'));
  assert.ok(Object.hasOwn(FIELD_SHADER_IDS, 'square'));
  assert.ok(!Object.hasOwn(FIELD_SHADER_IDS, 'box'));
  assert.ok(!Object.hasOwn(FIELD_SHADER_IDS, 'diamond'));
});

test('registry shader ids are unique and contiguous', () => {
  assertUniqueContiguousIds(FIELD_SHADER_IDS, 'field');
  assertUniqueContiguousIds(COMBINE_OPERATION_SHADER_IDS, 'combine operation');
  assertUniqueContiguousIds(COMBINE_MODIFIER_SHADER_IDS, 'combine modifier');
  assertUniqueContiguousIds(GRADIENT_WRAP_SHADER_IDS, 'wrap');
});

test('shader source uses the explicit gradient uniform length', () => {
  const { fs } = createMainShaderSources();
  assert.match(fs, new RegExp(`uniform float u_g1\\[${GRADIENT_UNIFORM_LENGTH}\\]`));
  assert.match(fs, new RegExp(`uniform float u_g2\\[${GRADIENT_UNIFORM_LENGTH}\\]`));
  assert.match(fs, new RegExp(`float fieldValue\\(int type, float g\\[${GRADIENT_UNIFORM_LENGTH}\\]`));
});

test('shader source contains branches for all explicit field shader ids', () => {
  const { fs } = createMainShaderSources();
  for (const [field, id] of Object.entries(FIELD_SHADER_IDS)) {
    assert.ok(fs.includes(`type == ${id}`), `missing shader branch for ${field}:${id}`);
  }
});

test('shader source contains branches for non-default combine operation ids and xor fallback', () => {
  const { fs } = createMainShaderSources();
  for (const [combine, id] of Object.entries(COMBINE_OPERATION_SHADER_IDS)) {
    if (combine === 'xor') continue;
    assert.ok(fs.includes(`u_combineOperation == ${id}`), `missing combine operation branch for ${combine}:${id}`);
  }
  assert.ok(fs.includes('return (a ^ b) & u_valueMask;'), 'missing xor fallback');
});

test('shader source separates field wrap from palette wrap', () => {
  const { fs } = createMainShaderSources();
  assert.ok(fs.includes('uniform int u_fieldWrapMode;'));
  assert.ok(fs.includes('uniform int u_paletteWrapMode;'));
  assert.ok(fs.includes('if (u_fieldWrapMode == 1) return pingPongValue(whole);'));
  assert.ok(fs.includes('if (u_paletteWrapMode == 1) return pingPongValue(v);'));
  assert.ok(fs.includes('return wrapFieldValue(value + offset);'));
  assert.ok(fs.includes('wrapPaletteValue(float(value) + u_paletteOffset)'));
  assert.ok(fs.includes('return mod(v, u_valueRange);'));
});

test('shader source contains combine modifiers for shifted and bit-derived render combines', () => {
  const { fs } = createMainShaderSources();
  assert.ok(fs.includes('uniform int u_combineModifier;'));
  assert.ok(fs.includes('uniform int u_combineShift;'));
  assert.ok(fs.includes(`u_combineModifier == ${COMBINE_MODIFIER_SHADER_IDS.shiftB}`));
  assert.ok(fs.includes('right = (b << shift) & u_valueMask;'));
  assert.ok(fs.includes(`u_combineModifier == ${COMBINE_MODIFIER_SHADER_IDS.popcount}`));
  assert.ok(fs.includes('popcountInt(result)'));
  assert.ok(fs.includes(`u_combineModifier == ${COMBINE_MODIFIER_SHADER_IDS.lowbit}`));
  assert.ok(fs.includes('lowbitInt(result)'));
  assert.ok(fs.includes(`u_combineModifier == ${COMBINE_MODIFIER_SHADER_IDS.highbit}`));
  assert.ok(fs.includes('highbitInt(result)'));
});

test('gradient uniform slots cover the full fixed uniform array', () => {
  const slots = Object.values(GRADIENT_UNIFORM_SLOTS).sort((a, b) => a - b);
  assert.equal(new Set(slots).size, slots.length, 'uniform slots must be unique');
  assert.equal(slots[0], 0);
  assert.equal(slots.at(-1), GRADIENT_UNIFORM_LENGTH - 1);
});

test('packGradientUniforms writes values into named slots', () => {
  const packed = packGradientUniforms(DEFAULT_GRADIENT);

  assert.equal(packed.length, GRADIENT_UNIFORM_LENGTH);
  assert.equal(packed[GRADIENT_UNIFORM_SLOTS.scale], DEFAULT_GRADIENT.scale);
  assert.equal(packed[GRADIENT_UNIFORM_SLOTS.offset], DEFAULT_GRADIENT.offset);
  assert.equal(packed[GRADIENT_UNIFORM_SLOTS.seed], DEFAULT_GRADIENT.seed);
  assertClose(packed[GRADIENT_UNIFORM_SLOTS.driftY], DEFAULT_GRADIENT.driftY);
  assert.equal(packed[GRADIENT_UNIFORM_SLOTS.voronoiMode], DEFAULT_GRADIENT.voronoiMode);
  assert.equal(packed[GRADIENT_UNIFORM_SLOTS.metric], DEFAULT_GRADIENT.metric);
  assert.equal(packed[GRADIENT_UNIFORM_SLOTS.moduloMode], DEFAULT_GRADIENT.moduloMode);
  assert.equal(packed[GRADIENT_UNIFORM_SLOTS.moduloCount], DEFAULT_GRADIENT.moduloCount);
  assert.equal(packed[GRADIENT_UNIFORM_SLOTS.coefficientX], DEFAULT_GRADIENT.coefficientX);
  assert.equal(packed[GRADIENT_UNIFORM_SLOTS.coefficientY], DEFAULT_GRADIENT.coefficientY);
  assert.equal(packed[GRADIENT_UNIFORM_SLOTS.polarMode], DEFAULT_GRADIENT.polarMode);
  assert.equal(packed[GRADIENT_UNIFORM_SLOTS.angularFrequency], DEFAULT_GRADIENT.angularFrequency);
  assert.equal(packed[GRADIENT_UNIFORM_SLOTS.radialFrequency], DEFAULT_GRADIENT.radialFrequency);
  assert.equal(packed[GRADIENT_UNIFORM_SLOTS.twist], DEFAULT_GRADIENT.twist);
  assert.equal(packed[GRADIENT_UNIFORM_SLOTS.bitwiseMode], DEFAULT_GRADIENT.bitwiseMode);
  assert.equal(packed[GRADIENT_UNIFORM_SLOTS.bitShift], DEFAULT_GRADIENT.bitShift);
});

test('Voronoi shader branch includes mode and metric controls', () => {
  const { fs } = createMainShaderSources();
  assert.ok(Object.hasOwn(FIELD_TYPES, 'voronoi'));
  assert.ok(Object.hasOwn(FIELD_SHADER_IDS, 'voronoi'));
  assert.ok(fs.includes(`type == ${FIELD_SHADER_IDS.voronoi}`));
  assert.ok(fs.includes('int metric = int(clamp(floor(g[22] + 0.5), 0.0, 2.0));'));
  assert.ok(fs.includes('int mode = int(clamp(floor(g[21] + 0.5), 0.0, 2.0));'));
});

test('Modulo shader branch includes mode, count, and coefficient controls', () => {
  const { fs } = createMainShaderSources();
  assert.ok(Object.hasOwn(FIELD_TYPES, 'modulo'));
  assert.ok(Object.hasOwn(FIELD_SHADER_IDS, 'modulo'));
  assert.ok(fs.includes(`type == ${FIELD_SHADER_IDS.modulo}`));
  assert.ok(fs.includes('int mode = int(clamp(floor(g[23] + 0.5), 0.0, 2.0));'));
  assert.ok(fs.includes('float moduloCount = max(2.0, floor(g[24] + 0.5));'));
  assert.ok(fs.includes('floor(q.x) * floor(g[25]) + floor(q.y) * floor(g[26])'));
});

test('Polar shader branch includes mode and frequency controls', () => {
  const { fs } = createMainShaderSources();
  assert.ok(Object.hasOwn(FIELD_TYPES, 'polar'));
  assert.ok(Object.hasOwn(FIELD_SHADER_IDS, 'polar'));
  assert.ok(fs.includes(`type == ${FIELD_SHADER_IDS.polar}`));
  assert.ok(fs.includes('int mode = int(clamp(floor(g[27] + 0.5), 0.0, 2.0));'));
  assert.ok(fs.includes('float angularFrequency = max(1.0, floor(g[28] + 0.5));'));
  assert.ok(fs.includes('float radialFrequency = max(0.0, floor(g[29] + 0.5));'));
  assert.ok(fs.includes('radius * g[30]'));
});

test('Bitwise coordinate shader branch replaces single xor coordinate field', () => {
  const { fs } = createMainShaderSources();
  assert.ok(Object.hasOwn(FIELD_TYPES, 'bitwiseCoord'));
  assert.ok(Object.hasOwn(FIELD_SHADER_IDS, 'bitwiseCoord'));
  assert.ok(!Object.hasOwn(FIELD_TYPES, 'xorCoord'));
  assert.ok(!Object.hasOwn(FIELD_SHADER_IDS, 'xorCoord'));
  assert.ok(fs.includes(`type == ${FIELD_SHADER_IDS.bitwiseCoord}`));
  assert.ok(fs.includes('int mode = int(clamp(floor(g[31] + 0.5), 0.0, 18.0));'));
  assert.ok(fs.includes('int shift = int(clamp(floor(g[32] + 0.5), 0.0, 8.0));'));
  assert.ok(fs.includes('result = ~(x ^ y)'));
  assert.ok(fs.includes('result = ~(x & y)'));
  assert.ok(fs.includes('result = ~(x | y)'));
  assert.ok(fs.includes('int shiftedY = (y << shift) & u_valueMask;'));
  assert.ok(fs.includes('popcountInt(x & y)'));
  assert.ok(fs.includes('popcountInt(x ^ y)'));
  assert.ok(fs.includes('popcountInt(x | y)'));
  assert.ok(fs.includes('lowbitInt(x & y)'));
  assert.ok(fs.includes('lowbitInt(x ^ y)'));
  assert.ok(fs.includes('lowbitInt(x | y)'));
  assert.ok(fs.includes('highbitInt(x | y)'));
  assert.ok(fs.includes('highbitInt(x ^ y)'));
  assert.ok(fs.includes('highbitInt(x & y)'));
});

test('multi-mode gradient controls use select metadata with named options', async () => {
  const { SPECIFIC_CONTROLS } = await import('../src/domain/registries.js');
  const selectControls = [
    SPECIFIC_CONTROLS.voronoi.find((control) => control.key === 'voronoiMode'),
    SPECIFIC_CONTROLS.voronoi.find((control) => control.key === 'metric'),
    SPECIFIC_CONTROLS.modulo.find((control) => control.key === 'moduloMode'),
    SPECIFIC_CONTROLS.polar.find((control) => control.key === 'polarMode'),
    SPECIFIC_CONTROLS.bitwiseCoord.find((control) => control.key === 'bitwiseMode'),
  ];

  for (const control of selectControls) {
    assert.equal(control.type, 'select');
    assert.ok(Object.keys(control.options).length >= 2);
  }
  assert.equal(Object.keys(selectControls.at(-1).options).length, 19);
});

test('legacy linear direction field ids normalize to linear with equivalent angles', () => {
  assert.deepEqual(normalizeGradientDefinition({ type: 'horizontal', angle: 45 }), { type: 'linear', angle: 0 });
  assert.deepEqual(normalizeGradientDefinition({ type: 'vertical', angle: 45 }), { type: 'linear', angle: 90 });
  assert.deepEqual(normalizeGradientDefinition({ type: 'diagonal', angle: 135 }), { type: 'linear', angle: 135 });
  assert.deepEqual(normalizeGradientDefinition({ type: 'unknown', angle: 12 }), { type: 'linear', angle: 12 });
});
