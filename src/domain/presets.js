import {
  COMBINE_MODIFIER_IDS,
  COMBINE_OPERATION_IDS,
  DEFAULT_GRADIENT,
  GRADIENT_WRAP_TYPES,
  normalizeGradientDefinition,
} from './registries.js';
import { uid } from './random.js';
import { resolveValueDepth } from './state.js';
import { clampNumber, wrapRange } from './value-range.js';
import { normalizePoint, sanitizeLutId } from '../lut/model.js';

export const PRESET_VERSION = 1;
export const PRESET_STORAGE_KEY = 'binary-gradients.presets.v1';
export const PRESET_COLLECTION_VERSION = 1;

const DEFAULT_LUT = {
  id: 'preset-lut',
  length: 2,
  points: [
    { id: 'p0', index: 0, color: '#000000', kind: 'smooth' },
    { id: 'p1', index: 1, color: '#ffffff', kind: 'smooth' },
  ],
};

export function createPreset({ name, description = '', tags = [], state, currentLut }) {
  const presetName = normalizePresetName(name);
  return normalizePreset({
    version: PRESET_VERSION,
    id: createPresetId(presetName),
    name: presetName,
    description,
    tags,
    createdAt: new Date().toISOString(),
    app: 'binary-gradients',
    state: snapshotPresetState(state),
    lut: clonePresetLut(currentLut),
  });
}

export function normalizePreset(rawPreset, maxTextureSize = Infinity) {
  const source = rawPreset && typeof rawPreset === 'object' ? rawPreset : {};
  const stateSource = source.state && typeof source.state === 'object' ? source.state : {};
  const resolved = resolveValueDepth(stateSource.valueBits, maxTextureSize);
  const valueRange = resolved.valueRange;
  const valueMask = resolved.valueMask;
  const gradients = Array.isArray(stateSource.gradients) ? stateSource.gradients : [];
  const legacyWrapMode = normalizeWrapMode(stateSource.gradientWrapMode, 'loop');

  return {
    version: PRESET_VERSION,
    id: normalizePresetId(source.id || source.name || 'preset'),
    name: normalizePresetName(source.name || source.id || 'Preset'),
    description: normalizePresetDescription(source.description),
    tags: normalizePresetTags(source.tags),
    author: normalizePresetDescription(source.author),
    createdAt: typeof source.createdAt === 'string' && source.createdAt ? source.createdAt : new Date().toISOString(),
    app: 'binary-gradients',
    state: {
      width: clampNumber(stateSource.width, 16, 8192),
      height: clampNumber(stateSource.height, 16, 8192),
      valueBits: resolved.valueBits,
      valueRange,
      valueMask,
      time: finiteNumber(stateSource.time, 0),
      timeScale: clampNumber(Number(stateSource.timeScale) * 100, 0, 400) / 100,
      timeRunning: stateSource.timeRunning !== false,
      combineOperation: validKey(stateSource.combineOperation, COMBINE_OPERATION_IDS, 'xor'),
      combineModifier: validKey(stateSource.combineModifier, COMBINE_MODIFIER_IDS, 'none'),
      combineShift: clampNumber(stateSource.combineShift, 0, 8),
      fieldWrapMode: normalizeWrapMode(stateSource.fieldWrapMode, legacyWrapMode),
      paletteWrapMode: normalizeWrapMode(stateSource.paletteWrapMode, legacyWrapMode),
      paletteOffset: wrapRange(finiteNumber(stateSource.paletteOffset, 0), valueRange),
      paletteCycleDirection: stateSource.paletteCycleDirection === -1 ? -1 : 1,
      cycleSeconds: clampNumber(Number(stateSource.cycleSeconds) * 2, 0, 80) / 2,
      paletteRunning: stateSource.paletteRunning !== false,
      gradients: [
        normalizePresetGradient(gradients[0]),
        normalizePresetGradient(gradients[1]),
      ],
    },
    lut: normalizePresetLut(source.lut),
  };
}

export function serializePreset(preset) {
  return JSON.stringify(normalizePreset(preset), null, 2);
}

export function parsePreset(json, maxTextureSize = Infinity) {
  return normalizePreset(JSON.parse(json), maxTextureSize);
}

export function createPresetCollection({ name = 'Preset Collection', description = '', presets = [] } = {}, maxTextureSize = Infinity) {
  return normalizePresetCollection({
    version: PRESET_COLLECTION_VERSION,
    app: 'binary-gradients',
    name,
    description,
    presets,
  }, maxTextureSize);
}

export function normalizePresetCollection(rawCollection, maxTextureSize = Infinity) {
  const source = rawCollection && typeof rawCollection === 'object' ? rawCollection : {};
  const rawPresets = Array.isArray(source.presets)
    ? source.presets
    : (Array.isArray(rawCollection) ? rawCollection : []);
  return {
    version: PRESET_COLLECTION_VERSION,
    app: 'binary-gradients',
    name: normalizePresetName(source.name || 'Preset Collection'),
    description: normalizePresetDescription(source.description),
    presets: rawPresets
      .filter((preset) => preset && typeof preset === 'object')
      .map((preset) => normalizePreset(preset, maxTextureSize)),
  };
}

export function serializePresetCollection(collection, maxTextureSize = Infinity) {
  return JSON.stringify(normalizePresetCollection(collection, maxTextureSize), null, 2);
}

export function parsePresetPayload(json, maxTextureSize = Infinity) {
  const payload = JSON.parse(json);
  if (Array.isArray(payload)) {
    return {
      type: 'collection',
      collection: normalizePresetCollection(payload, maxTextureSize),
    };
  }
  if (!payload || typeof payload !== 'object') {
    throw new Error('Preset import payload must be a preset object or preset collection.');
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'presets')) {
    if (!Array.isArray(payload.presets)) {
      throw new Error('Preset collection payload must contain a presets array.');
    }
    return {
      type: 'collection',
      collection: normalizePresetCollection(payload, maxTextureSize),
    };
  }
  if (!isPresetPayload(payload)) {
    throw new Error('Preset payload must contain state and lut objects.');
  }
  return {
    type: 'preset',
    preset: normalizePreset(payload, maxTextureSize),
  };
}

export function mergePresetLibraries({ builtIn = [], user = [] } = {}) {
  const merged = new Map();
  builtIn.forEach((preset) => merged.set(preset.id, { ...preset, source: 'built-in' }));
  user.forEach((preset) => merged.set(preset.id, { ...preset, source: 'user' }));
  return [...merged.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function snapshotPresetState(state) {
  return {
    width: state.width,
    height: state.height,
    valueBits: state.valueBits,
    valueRange: state.valueRange,
    valueMask: state.valueMask,
    time: state.time,
    timeScale: state.timeScale,
    timeRunning: state.timeRunning,
    combineOperation: state.combineOperation,
    combineModifier: state.combineModifier,
    combineShift: state.combineShift,
    fieldWrapMode: state.fieldWrapMode,
    paletteWrapMode: state.paletteWrapMode,
    paletteOffset: state.paletteOffset,
    paletteCycleDirection: state.paletteCycleDirection,
    cycleSeconds: state.cycleSeconds,
    paletteRunning: state.paletteRunning,
    gradients: state.gradients.map((gradient) => ({ ...gradient })),
  };
}

export function clonePresetLut(lut) {
  const normalized = normalizePresetLut(lut);
  return {
    ...normalized,
    points: normalized.points.map((point) => ({ ...point })),
  };
}

function normalizePresetGradient(gradient) {
  return normalizeGradientDefinition({ ...DEFAULT_GRADIENT, ...(gradient ?? {}) });
}

function normalizePresetLut(lut) {
  const source = lut && typeof lut === 'object' ? lut : DEFAULT_LUT;
  const length = clampNumber(source.length, 2, 4096);
  const points = Array.isArray(source.points) ? source.points : DEFAULT_LUT.points;
  const normalizedPoints = points
    .filter((point) => point && typeof point === 'object')
    .map((point) => normalizePoint({ ...point, id: point.id || uid() }, length))
    .sort((a, b) => a.index - b.index || a.kind.localeCompare(b.kind));

  return {
    id: sanitizeLutId(source.id || 'preset-lut'),
    length,
    points: normalizedPoints.length ? normalizedPoints : DEFAULT_LUT.points.map((point) => normalizePoint(point, length)),
  };
}

function normalizePresetName(value) {
  const name = String(value || '').trim();
  return name || 'Untitled Preset';
}

function normalizePresetDescription(value) {
  return String(value || '').trim();
}

function isPresetPayload(value) {
  return Boolean(
    value
    && typeof value === 'object'
    && !Array.isArray(value)
    && value.state
    && typeof value.state === 'object'
    && !Array.isArray(value.state)
    && value.lut
    && typeof value.lut === 'object'
    && !Array.isArray(value.lut),
  );
}

function normalizePresetTags(value) {
  const rawTags = Array.isArray(value) ? value : String(value || '').split(',');
  return [...new Set(rawTags
    .map((tag) => String(tag || '').trim().toLowerCase())
    .filter(Boolean))].sort();
}

function normalizePresetId(value) {
  return sanitizeLutId(value || 'preset');
}

function createPresetId(name) {
  return normalizePresetId(name);
}

function validKey(value, keys, fallback) {
  return keys.includes(value) ? value : fallback;
}

function normalizeWrapMode(value, fallback) {
  return Object.prototype.hasOwnProperty.call(GRADIENT_WRAP_TYPES, value) ? value : fallback;
}

function finiteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
