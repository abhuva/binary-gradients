import test from 'node:test';
import assert from 'node:assert/strict';
import { generateLutDefinition, LUT_GENERATOR_TYPES } from '../src/lut/generators.js';

const baseOptions = {
  type: 'harmony',
  seed: 1234,
  baseHue: 205,
  detail: 8,
  contrast: 0.7,
  length: 256,
  preset: 'fire',
  turns: 2,
  mirrorMode: 'complement',
  shift: 60,
  bitMode: 'highHue',
  bands: 8,
  hardness: 1,
  diverge: 'blueRed',
  lumaPower: 1,
  startColor: '#07111f',
  midColor: '#24c8db',
  endColor: '#fff4b8',
  chaosR: 3.82,
  harmonics: 3,
  roughness: 0.55,
  easeMode: 'smooth',
};

function stablePointData(definition) {
  return definition.points.map(({ index, color, kind }) => ({ index, color, kind }));
}

test('LUT generators are deterministic by seed excluding generated point ids', () => {
  const first = generateLutDefinition(baseOptions);
  const second = generateLutDefinition(baseOptions);

  assert.equal(first.id, 'harmony-1234');
  assert.equal(second.id, 'harmony-1234');
  assert.deepEqual(stablePointData(first), stablePointData(second));
});

test('different generator seeds produce different stable point data', () => {
  const first = generateLutDefinition(baseOptions);
  const second = generateLutDefinition({ ...baseOptions, seed: 1235 });

  assert.notDeepEqual(stablePointData(first), stablePointData(second));
});

test('unknown generator type falls back to harmony behavior with sanitized id', () => {
  const generated = generateLutDefinition({ ...baseOptions, type: 'not-real' });

  assert.equal(generated.id, 'harmony-1234');
  assert.ok(generated.points.length >= 2);
});

test('every registered generator can create bounded editable points', () => {
  for (const type of Object.keys(LUT_GENERATOR_TYPES)) {
    const generated = generateLutDefinition({ ...baseOptions, type });
    assert.equal(generated.length, baseOptions.length, type);
    assert.ok(generated.points.length >= 2, type);
    for (const point of generated.points) {
      assert.ok(point.index >= 0 && point.index < baseOptions.length, `${type} index ${point.index}`);
      assert.match(point.color, /^#[0-9a-f]{6}$/i, `${type} color ${point.color}`);
      assert.equal(point.kind, 'smooth', type);
    }
    assert.equal(generated.points[0].index, 0, type);
    assert.equal(generated.points.at(-1).index, baseOptions.length - 1, type);
  }
});