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
  const pingPongWrapId = GRADIENT_WRAP_SHADER_IDS.pingpong;
  assert.ok(fs.includes('uniform int u_fieldWrapMode;'));
  assert.ok(fs.includes('uniform int u_paletteWrapMode;'));
  assert.ok(fs.includes(`if (u_fieldWrapMode == ${pingPongWrapId}) return pingPongValue(whole);`));
  assert.ok(fs.includes(`if (u_paletteWrapMode == ${pingPongWrapId}) return pingPongValue(v);`));
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
  assert.equal(packed[GRADIENT_UNIFORM_SLOTS.fanDirection], DEFAULT_GRADIENT.fanDirection);
  assert.equal(packed[GRADIENT_UNIFORM_SLOTS.jitterRange], DEFAULT_GRADIENT.jitterRange);
  assert.equal(packed[GRADIENT_UNIFORM_SLOTS.jitterSpeed], DEFAULT_GRADIENT.jitterSpeed);
  assert.equal(packed[GRADIENT_UNIFORM_SLOTS.scaleAmp], DEFAULT_GRADIENT.scaleAmp);
  assert.equal(packed[GRADIENT_UNIFORM_SLOTS.scaleSpeed], DEFAULT_GRADIENT.scaleSpeed);
  assert.equal(packed[GRADIENT_UNIFORM_SLOTS.contrastAmp], DEFAULT_GRADIENT.contrastAmp);
  assert.equal(packed[GRADIENT_UNIFORM_SLOTS.contrastSpeed], DEFAULT_GRADIENT.contrastSpeed);
  assert.equal(packed[GRADIENT_UNIFORM_SLOTS.freq1Amp], DEFAULT_GRADIENT.freq1Amp);
  assert.equal(packed[GRADIENT_UNIFORM_SLOTS.freq1Speed], DEFAULT_GRADIENT.freq1Speed);
  assert.equal(packed[GRADIENT_UNIFORM_SLOTS.freq2Amp], DEFAULT_GRADIENT.freq2Amp);
  assert.equal(packed[GRADIENT_UNIFORM_SLOTS.freq2Speed], DEFAULT_GRADIENT.freq2Speed);
  assert.equal(packed[GRADIENT_UNIFORM_SLOTS.warpAmp], DEFAULT_GRADIENT.warpAmp);
  assert.equal(packed[GRADIENT_UNIFORM_SLOTS.warpSpeed], DEFAULT_GRADIENT.warpSpeed);
  assert.equal(packed[GRADIENT_UNIFORM_SLOTS.noiseContrastAmp], DEFAULT_GRADIENT.noiseContrastAmp);
  assert.equal(packed[GRADIENT_UNIFORM_SLOTS.noiseContrastSpeed], DEFAULT_GRADIENT.noiseContrastSpeed);
});

test('Fan shader branch includes direction control', () => {
  const { fs } = createMainShaderSources();
  assert.ok(Object.hasOwn(FIELD_TYPES, 'fan'));
  assert.ok(Object.hasOwn(FIELD_SHADER_IDS, 'fan'));
  assert.ok(fs.includes(`type == ${FIELD_SHADER_IDS.fan}`));
  assert.ok(fs.includes('float fanDirection = g[33] < 0.0 ? -1.0 : 1.0;'));
  assert.ok(fs.includes('atan(d.y, d.x) * fanDirection'));
});

test('Voronoi shader branch includes mode and metric controls', () => {
  const { fs } = createMainShaderSources();
  assert.ok(Object.hasOwn(FIELD_TYPES, 'voronoi'));
  assert.ok(Object.hasOwn(FIELD_SHADER_IDS, 'voronoi'));
  assert.ok(fs.includes(`type == ${FIELD_SHADER_IDS.voronoi}`));
  assert.ok(fs.includes('int metric = int(clamp(floor(g[22] + 0.5), 0.0, 2.0));'));
  assert.ok(fs.includes('int mode = int(clamp(floor(g[21] + 0.5), 0.0, 2.0));'));
  assert.ok(fs.includes('float jitter = clamp(g[15] + sin(u_time * g[35]) * g[34], 0.0, 1.0);'));
  assert.ok(fs.includes('float contrast = clamp(g[18] + sin(u_time * g[39]) * g[38], 0.0, 16.0);'));
  assert.ok(fs.includes('nearest * contrast'));
  assert.ok(fs.includes('(second - nearest) * contrast'));
});

test('shader scale uses scale animation amplitude and speed', () => {
  const { fs } = createMainShaderSources();

  assert.ok(fs.includes('float scale = max(1.0, g[0] + sin(u_time * g[37]) * g[36]);'));
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

test('Plasma shader branch includes animated frequency and warp controls', () => {
  const { fs } = createMainShaderSources();
  assert.ok(Object.hasOwn(FIELD_TYPES, 'plasma'));
  assert.ok(Object.hasOwn(FIELD_SHADER_IDS, 'plasma'));
  assert.ok(fs.includes(`type == ${FIELD_SHADER_IDS.plasma}`));
  assert.ok(fs.includes('float freq1 = max(1.0, g[12] + sin(u_time * g[41]) * g[40]);'));
  assert.ok(fs.includes('float freq2 = max(1.0, g[13] + sin(u_time * g[43]) * g[42]);'));
  assert.ok(fs.includes('float warpAmount = max(0.0, g[15] + sin(u_time * g[45]) * g[44]);'));
  assert.ok(fs.includes('sin((uv.x + warp) * freq1 + phase)'));
  assert.ok(fs.includes('sin((uv.y - warp) * freq2 - phase * 0.7)'));
});

test('Noise shader branch includes animated contrast control', () => {
  const { fs } = createMainShaderSources();
  assert.ok(Object.hasOwn(FIELD_TYPES, 'noise'));
  assert.ok(Object.hasOwn(FIELD_SHADER_IDS, 'noise'));
  assert.ok(fs.includes(`type == ${FIELD_SHADER_IDS.noise}`));
  assert.ok(fs.includes('float noiseContrast = clamp(g[18] + sin(u_time * g[47]) * g[46], 0.0, 8.0);'));
  assert.ok(fs.includes('sum * noiseContrast'));
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

test('Fan direction control uses a two-state toggle', async () => {
  const { SPECIFIC_CONTROLS } = await import('../src/domain/registries.js');
  const control = SPECIFIC_CONTROLS.fan.find((item) => item.key === 'fanDirection');

  assert.equal(control.type, 'toggle');
  assert.deepEqual(control.options, { 1: 'Clockwise', '-1': 'Counterclockwise' });
});

test('Voronoi jitter exposes animation metadata instead of separate top-level controls', async () => {
  const { SPECIFIC_CONTROLS } = await import('../src/domain/registries.js');
  const controls = SPECIFIC_CONTROLS.voronoi;
  const jitter = controls.find((control) => control.key === 'warp');

  assert.equal(jitter.label, 'Jitter');
  assert.equal(jitter.animation.rangeKey, 'jitterRange');
  assert.equal(jitter.animation.speedKey, 'jitterSpeed');
  assert.equal(jitter.animation.rangeLabel, 'Range');
  assert.equal(jitter.animation.speedLabel, 'Speed');
  assert.equal(controls.some((control) => control.key === 'jitterRange'), false);
  assert.equal(controls.some((control) => control.key === 'jitterSpeed'), false);
});

test('Voronoi contrast exposes amplitude and speed animation metadata', async () => {
  const { SPECIFIC_CONTROLS } = await import('../src/domain/registries.js');
  const controls = SPECIFIC_CONTROLS.voronoi;
  const contrast = controls.find((control) => control.key === 'contrast');

  assert.equal(contrast.animation.rangeKey, 'contrastAmp');
  assert.equal(contrast.animation.speedKey, 'contrastSpeed');
  assert.equal(contrast.animation.rangeLabel, 'Amp');
  assert.equal(contrast.animation.speedLabel, 'Speed');
  assert.equal(contrast.animation.rangeMax, 8);
  assert.equal(contrast.animation.speedMin, -12);
  assert.equal(contrast.animation.speedMax, 12);
});

test('Common scale exposes amplitude and speed animation metadata', async () => {
  const { COMMON_CONTROLS } = await import('../src/domain/registries.js');
  const scale = COMMON_CONTROLS.find((control) => control.key === 'scale');

  assert.equal(scale.animation.rangeKey, 'scaleAmp');
  assert.equal(scale.animation.speedKey, 'scaleSpeed');
  assert.equal(scale.animation.rangeLabel, 'Amp');
  assert.equal(scale.animation.speedLabel, 'Speed');
  assert.equal(scale.animation.rangeMin, 0);
  assert.equal(scale.animation.speedMin, -12);
  assert.equal(scale.animation.speedMax, 12);
});

test('Plasma frequency and warp controls expose amplitude and speed animation metadata', async () => {
  const { SPECIFIC_CONTROLS } = await import('../src/domain/registries.js');
  const controls = SPECIFIC_CONTROLS.plasma;
  const freq1 = controls.find((control) => control.key === 'freq1');
  const freq2 = controls.find((control) => control.key === 'freq2');
  const warp = controls.find((control) => control.key === 'warp');

  assert.equal(freq1.animation.rangeKey, 'freq1Amp');
  assert.equal(freq1.animation.speedKey, 'freq1Speed');
  assert.equal(freq2.animation.rangeKey, 'freq2Amp');
  assert.equal(freq2.animation.speedKey, 'freq2Speed');
  assert.equal(warp.animation.rangeKey, 'warpAmp');
  assert.equal(warp.animation.speedKey, 'warpSpeed');
  assert.equal(controls.some((control) => control.key === 'freq1Amp'), false);
  assert.equal(controls.some((control) => control.key === 'freq2Amp'), false);
  assert.equal(controls.some((control) => control.key === 'warpAmp'), false);
});

test('Noise contrast exposes amplitude and speed animation metadata', async () => {
  const { SPECIFIC_CONTROLS } = await import('../src/domain/registries.js');
  const controls = SPECIFIC_CONTROLS.noise;
  const contrast = controls.find((control) => control.key === 'contrast');

  assert.equal(contrast.animation.rangeKey, 'noiseContrastAmp');
  assert.equal(contrast.animation.speedKey, 'noiseContrastSpeed');
  assert.equal(contrast.animation.rangeLabel, 'Amp');
  assert.equal(contrast.animation.speedLabel, 'Speed');
  assert.equal(contrast.animation.rangeMax, 4);
  assert.equal(contrast.animation.speedMin, -12);
  assert.equal(contrast.animation.speedMax, 12);
});

test('Rings, Square, Fan, and Polar origin axes expose amp and speed through animation metadata', async () => {
  const { SPECIFIC_CONTROLS } = await import('../src/domain/registries.js');

  for (const controls of [SPECIFIC_CONTROLS.rings, SPECIFIC_CONTROLS.square, SPECIFIC_CONTROLS.fan, SPECIFIC_CONTROLS.polar]) {
    const originX = controls.find((control) => control.key === 'originX');
    const originY = controls.find((control) => control.key === 'originY');

    assert.equal(originX.animation.rangeKey, 'originAmpX');
    assert.equal(originX.animation.speedKey, 'originSpeedX');
    assert.equal(originX.animation.rangeLabel, 'Amp X');
    assert.equal(originX.animation.speedLabel, 'Speed X');
    assert.equal(originY.animation.rangeKey, 'originAmpY');
    assert.equal(originY.animation.speedKey, 'originSpeedY');
    assert.equal(originY.animation.rangeLabel, 'Amp Y');
    assert.equal(originY.animation.speedLabel, 'Speed Y');
    assert.equal(controls.some((control) => control.key === 'originAmpX'), false);
    assert.equal(controls.some((control) => control.key === 'originSpeedX'), false);
    assert.equal(controls.some((control) => control.key === 'originAmpY'), false);
    assert.equal(controls.some((control) => control.key === 'originSpeedY'), false);
  }
});

test('Square angle exposes rotation speed through animation metadata', async () => {
  const { SPECIFIC_CONTROLS } = await import('../src/domain/registries.js');
  const controls = SPECIFIC_CONTROLS.square;
  const angle = controls.find((control) => control.key === 'angle');

  assert.equal(angle.animation.speedKey, 'rotationSpeed');
  assert.equal(angle.animation.speedLabel, 'Speed');
  assert.equal(angle.animation.speedMin, -180);
  assert.equal(angle.animation.speedMax, 180);
  assert.equal(controls.some((control) => control.key === 'rotationSpeed'), false);
});

test('legacy linear direction field ids normalize to linear with equivalent angles', () => {
  assert.deepEqual(normalizeGradientDefinition({ type: 'horizontal', angle: 45 }), { type: 'linear', angle: 0 });
  assert.deepEqual(normalizeGradientDefinition({ type: 'vertical', angle: 45 }), { type: 'linear', angle: 90 });
  assert.deepEqual(normalizeGradientDefinition({ type: 'diagonal', angle: 135 }), { type: 'linear', angle: 135 });
  assert.deepEqual(normalizeGradientDefinition({ type: 'unknown', angle: 12 }), { type: 'linear', angle: 12 });
});
