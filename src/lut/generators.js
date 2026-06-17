import { hexToRgb, hsvToHex, normalizeHex, rgbToHsv } from '../domain/color.js';
import { mulberry32, popcount } from '../domain/random.js';
import { clamp, clampNumber } from '../domain/value-range.js';
import { normalizePoint, sanitizeLutId } from './model.js';
import { uid } from '../domain/random.js';

export const LUT_GENERATOR_TYPES = {
  harmony: 'Harmony',
  waves: 'HSV Waves',
  bit: 'Bit Pattern',
  walk: 'Random Walk',
  physical: 'Physical Preset',
  seamless: 'Seamless Cycle',
  mirror: 'Mirror / Symmetry',
  bitplane: 'Bitplane',
  bands: 'Bands / Posterize',
  scientific: 'Scientific Diverging',
  luminance: 'Luminance Controlled',
  colorRamp: 'Color Ramp',
  chaos: 'Chaos Map',
  fourier: 'Fourier Waves',
  ease: 'Ease Curve',
};

export const LUT_GENERATOR_CONTROLS = {
  physical: [
    { key: 'preset', label: 'Preset', type: 'select', options: { fire: 'Fire', ice: 'Ice', thermal: 'Thermal', topo: 'Topo', ocean: 'Ocean', oil: 'Oil Slick', toxic: 'Toxic', sunset: 'Sunset', crt: 'CRT', vga: 'VGA Plasma' }, value: 'fire' },
  ],
  seamless: [
    { key: 'turns', label: 'Turns', min: 1, max: 8, step: 1, value: 2 },
  ],
  mirror: [
    { key: 'mirrorMode', label: 'Mode', type: 'select', options: { exact: 'Exact', inverted: 'Inverted', complement: 'Complement', brightness: 'Brightness' }, value: 'complement' },
    { key: 'shift', label: 'Shift', min: 0, max: 180, step: 1, value: 60 },
  ],
  bitplane: [
    { key: 'bitMode', label: 'Bit Mode', type: 'select', options: { highHue: 'High Hue', lowBright: 'Low Bright', popSat: 'Pop Saturation', power: 'Power Highlight' }, value: 'highHue' },
  ],
  bands: [
    { key: 'bands', label: 'Bands', min: 2, max: 32, step: 1, value: 8 },
    { key: 'hardness', label: 'Hardness', min: 0, max: 100, step: 1, value: 100 },
  ],
  scientific: [
    { key: 'diverge', label: 'Diverge', type: 'select', options: { blueRed: 'Blue / Red', purpleGreen: 'Purple / Green', coldHot: 'Cold / Hot', darkBright: 'Dark / Bright' }, value: 'blueRed' },
  ],
  luminance: [
    { key: 'lumaPower', label: 'Luma Power', min: 25, max: 300, step: 5, value: 100 },
  ],
  colorRamp: [
    { key: 'startColor', label: 'Start', type: 'color', value: '#07111f' },
    { key: 'midColor', label: 'Middle', type: 'color', value: '#24c8db' },
    { key: 'endColor', label: 'End', type: 'color', value: '#fff4b8' },
  ],
  chaos: [
    { key: 'chaosR', label: 'Chaos R', min: 340, max: 400, step: 1, value: 382 },
  ],
  fourier: [
    { key: 'harmonics', label: 'Harmonics', min: 1, max: 6, step: 1, value: 3 },
    { key: 'roughness', label: 'Roughness', min: 0, max: 100, step: 1, value: 55 },
  ],
  ease: [
    { key: 'easeMode', label: 'Curve', type: 'select', options: { linear: 'Linear', smooth: 'Smoothstep', expo: 'Exponential', log: 'Logarithmic', pulse: 'Pulse', steps: 'Stepped' }, value: 'smooth' },
  ],
};

export function generateLutDefinition(options) {
  const rng = mulberry32(options.seed || 1);
  const type = Object.prototype.hasOwnProperty.call(LUT_GENERATOR_TYPES, options.type) ? options.type : 'harmony';
  return {
    id: sanitizeLutId(`${type}-${options.seed}`),
    length: options.length,
    points: createGeneratedLutPoints(type, options, rng),
  };
}

function createGeneratedLutPoints(type, options, rng) {
  if (type === 'waves') return createWaveLutPoints(options, rng);
  if (type === 'bit') return createBitLutPoints(options, rng);
  if (type === 'walk') return createRandomWalkLutPoints(options, rng);
  if (type === 'physical') return createPhysicalLutPoints(options, rng);
  if (type === 'seamless') return createSeamlessLutPoints(options, rng);
  if (type === 'mirror') return createMirrorLutPoints(options, rng);
  if (type === 'bitplane') return createBitplaneLutPoints(options, rng);
  if (type === 'bands') return createBandLutPoints(options, rng);
  if (type === 'scientific') return createScientificLutPoints(options, rng);
  if (type === 'luminance') return createLuminanceLutPoints(options, rng);
  if (type === 'colorRamp') return createColorRampLutPoints(options);
  if (type === 'chaos') return createChaosLutPoints(options, rng);
  if (type === 'fourier') return createFourierLutPoints(options, rng);
  if (type === 'ease') return createEaseLutPoints(options, rng);
  return createHarmonyLutPoints(options, rng);
}

function createHarmonyLutPoints(options, rng) {
  const patterns = [[0, 180], [-28, 0, 28], [0, 120, 240], [0, 60, 180, 240], [0, 150, 210]];
  const offsets = patterns[Math.floor(rng() * patterns.length)];
  const count = clampNumber(options.detail, 2, 12);
  const points = [];
  for (let i = 0; i < count; i++) {
    const t = i / Math.max(1, count - 1);
    const offset = offsets[i % offsets.length];
    const drift = (rng() - 0.5) * 24 * options.contrast;
    const hue = options.baseHue + offset + drift;
    const saturation = 45 + options.contrast * 50;
    const value = 30 + options.contrast * 45 + Math.sin(t * Math.PI) * 20;
    points.push(makeLutPoint(t, hsvToHex(hue, saturation, value), 'smooth', options.length));
  }
  return lockLutEndpoints(points, options.length);
}

function createWaveLutPoints(options, rng) {
  const count = clampNumber(options.detail, 4, 32);
  const hueFreq = 1 + Math.floor(rng() * 4);
  const satFreq = 1 + Math.floor(rng() * 3);
  const valFreq = 1 + Math.floor(rng() * 3);
  const huePhase = rng() * Math.PI * 2;
  const satPhase = rng() * Math.PI * 2;
  const valPhase = rng() * Math.PI * 2;
  const points = [];
  for (let i = 0; i < count; i++) {
    const t = i / Math.max(1, count - 1);
    const wave = Math.sin(t * Math.PI * 2 * hueFreq + huePhase);
    const hue = options.baseHue + wave * 160 * options.contrast + t * 360;
    const saturation = 55 + Math.sin(t * Math.PI * 2 * satFreq + satPhase) * 25 * options.contrast;
    const value = 58 + Math.sin(t * Math.PI * 2 * valFreq + valPhase) * 32 * options.contrast;
    points.push(makeLutPoint(t, hsvToHex(hue, saturation, value), 'smooth', options.length));
  }
  return lockLutEndpoints(points, options.length);
}

function createBitLutPoints(options, rng) {
  const count = clampNumber(options.detail, 4, 32);
  const points = [];
  const hueStep = 24 + Math.floor(rng() * 48);
  for (let i = 0; i < count; i++) {
    const t = i / Math.max(1, count - 1);
    const value = Math.round(t * 255);
    const bits = popcount(value);
    const low = value & 15;
    const high = value >> 4;
    const hue = options.baseHue + bits * hueStep + high * 7;
    const saturation = 50 + options.contrast * 45;
    const brightness = 24 + options.contrast * 34 + (low / 15) * 38;
    points.push(makeLutPoint(t, hsvToHex(hue, saturation, brightness), 'smooth', options.length));
  }
  return lockLutEndpoints(points, options.length);
}

function createRandomWalkLutPoints(options, rng) {
  const count = clampNumber(options.detail, 3, 24);
  const points = [];
  let hue = options.baseHue;
  let saturation = 55 + options.contrast * 35;
  let value = 40 + options.contrast * 35;
  for (let i = 0; i < count; i++) {
    const t = i / Math.max(1, count - 1);
    if (i > 0) {
      hue += (rng() - 0.5) * (55 + 90 * options.contrast);
      saturation = clamp(saturation + (rng() - 0.5) * 45, 20, 100);
      value = clamp(value + (rng() - 0.5) * 50, 12, 100);
    }
    points.push(makeLutPoint(t, hsvToHex(hue, saturation, value), 'smooth', options.length));
  }
  return lockLutEndpoints(points, options.length);
}

function createPhysicalLutPoints(options, rng) {
  const variants = {
    fire: ['#000000', '#350600', '#a01800', '#ff6a00', '#ffd15c', '#fff7d6'],
    ice: ['#07111f', '#123a61', '#2aa6d8', '#b7f3ff', '#ffffff'],
    thermal: ['#140028', '#2a3dff', '#00d2ff', '#f6ff00', '#ff5a00', '#ffffff'],
    topo: ['#102414', '#2f6b2f', '#9aaa52', '#8b6b42', '#d8d1b0', '#ffffff'],
    ocean: ['#020916', '#062a5f', '#0b77a8', '#3fc7c2', '#d7fff0'],
    oil: ['#050509', '#35205a', '#007c85', '#85b83a', '#ff8b2a', '#f2e7ff'],
    toxic: ['#080d05', '#254600', '#84c400', '#d6ff00', '#f4ffd0'],
    sunset: ['#15081d', '#5d174f', '#cf3d4d', '#ff9340', '#ffe6a8'],
    crt: ['#001000', '#00451d', '#00b050', '#b7ff66', '#f2ffe0'],
    vga: ['#ff00aa', '#ffff00', '#00b7ff', '#00ff66', '#ff00aa'],
  };
  const colors = variants[options.preset] ?? variants.fire;
  const jitter = 14 * options.contrast;
  const points = colors.map((color, index) => {
    const t = index / Math.max(1, colors.length - 1);
    const [h, s, v] = rgbToHsv(hexToRgb(color));
    return makeLutPoint(t, hsvToHex(h + (rng() - 0.5) * jitter, s, v), 'smooth', options.length);
  });
  return lockLutEndpoints(points, options.length);
}

function createSeamlessLutPoints(options, rng) {
  const count = clampNumber(options.detail, 4, 32);
  const phase = rng() * 360;
  const points = [];
  for (let i = 0; i < count; i++) {
    const t = i / Math.max(1, count - 1);
    const angle = t * 360 * options.turns + phase;
    const hue = options.baseHue + angle;
    const saturation = 58 + Math.sin(t * Math.PI * 2 * options.turns) * 22 * options.contrast;
    const value = 62 + Math.cos(t * Math.PI * 2 * options.turns) * 24 * options.contrast;
    points.push(makeLutPoint(t, hsvToHex(hue, saturation, value), 'smooth', options.length));
  }
  points[points.length - 1].color = points[0].color;
  return lockLutEndpoints(points, options.length);
}

function createMirrorLutPoints(options, rng) {
  const halfCount = Math.max(2, Math.ceil(clampNumber(options.detail, 4, 24) / 2));
  const half = [];
  for (let i = 0; i < halfCount; i++) {
    const t = i / Math.max(1, halfCount - 1);
    const hue = options.baseHue + t * options.shift + (rng() - 0.5) * 18 * options.contrast;
    const saturation = 50 + options.contrast * 45;
    const value = 28 + t * 58 + Math.sin(t * Math.PI) * 20 * options.contrast;
    half.push({ hue, saturation, value });
  }
  const colors = half.map((item) => hsvToHex(item.hue, item.saturation, item.value));
  for (let i = half.length - 2; i >= 0; i--) {
    const item = half[i];
    let hue = item.hue;
    let saturation = item.saturation;
    let value = item.value;
    if (options.mirrorMode === 'inverted') value = 100 - value;
    if (options.mirrorMode === 'complement') hue += 180;
    if (options.mirrorMode === 'brightness') value = 100 - value * 0.6;
    colors.push(hsvToHex(hue, saturation, value));
  }
  return lockLutEndpoints(colors.map((color, index) => makeLutPoint(index / (colors.length - 1), color, 'smooth', options.length)), options.length);
}

function createBitplaneLutPoints(options, rng) {
  const count = clampNumber(options.detail, 8, 32);
  const points = [];
  for (let i = 0; i < count; i++) {
    const t = i / Math.max(1, count - 1);
    const value = Math.round(t * 255);
    const low = value & 15;
    const high = value >> 4;
    const bits = popcount(value);
    const isPower = value > 0 && (value & (value - 1)) === 0;
    let hue = options.baseHue + high * 19;
    let saturation = 50 + options.contrast * 45;
    let brightness = 30 + (low / 15) * 60;
    if (options.bitMode === 'lowBright') {
      hue = options.baseHue + bits * 34;
      brightness = 18 + (low / 15) * 78;
    } else if (options.bitMode === 'popSat') {
      hue = options.baseHue + value * 0.9;
      saturation = 20 + bits * 10;
      brightness = 38 + options.contrast * 45;
    } else if (options.bitMode === 'power') {
      hue = isPower ? options.baseHue + 180 : options.baseHue + high * 13;
      saturation = isPower ? 100 : 35 + options.contrast * 35;
      brightness = isPower ? 100 : 22 + bits * 8;
    }
    hue += (rng() - 0.5) * 8;
    points.push(makeLutPoint(t, hsvToHex(hue, saturation, brightness), 'smooth', options.length));
  }
  return lockLutEndpoints(points, options.length);
}

function createBandLutPoints(options, rng) {
  const bandCount = clampNumber(options.bands, 2, 32);
  const points = [];
  for (let i = 0; i < bandCount; i++) {
    const t = i / Math.max(1, bandCount - 1);
    const hue = options.baseHue + i * (360 / bandCount) + (rng() - 0.5) * 35 * options.contrast;
    const color = hsvToHex(hue, 55 + options.contrast * 42, 40 + ((i % 2) * 30) + options.contrast * 20);
    points.push(makeLutPoint(t, color, 'smooth', options.length));
    if (options.hardness > 0.65 && i < bandCount - 1) {
      points.push(makeLutPoint((i + 0.98) / Math.max(1, bandCount - 1), color, 'smooth', options.length));
    }
  }
  return lockLutEndpoints(points, options.length);
}

function createScientificLutPoints(options, rng) {
  const schemes = {
    blueRed: ['#173b82', '#f8f8f8', '#9e1f1f'],
    purpleGreen: ['#371b58', '#111111', '#4fd15f'],
    coldHot: ['#001a66', '#00d0ff', '#f7f7f7', '#ffb000', '#7a0000'],
    darkBright: ['#030303', '#243059', '#f2f2f2'],
  };
  const colors = schemes[options.diverge] ?? schemes.blueRed;
  const points = colors.map((color, index) => {
    const [h, s, v] = rgbToHsv(hexToRgb(color));
    return makeLutPoint(index / (colors.length - 1), hsvToHex(h + (rng() - 0.5) * 8 * options.contrast, s, v), 'smooth', options.length);
  });
  return lockLutEndpoints(points, options.length);
}

function createLuminanceLutPoints(options, rng) {
  const count = clampNumber(options.detail, 3, 24);
  const points = [];
  for (let i = 0; i < count; i++) {
    const t = i / Math.max(1, count - 1);
    const luma = Math.pow(t, options.lumaPower);
    const hue = options.baseHue + t * 270 + Math.sin(t * Math.PI * 2) * 35 * options.contrast + (rng() - 0.5) * 8;
    const saturation = 42 + options.contrast * 50;
    const value = 8 + luma * 90;
    points.push(makeLutPoint(t, hsvToHex(hue, saturation, value), 'smooth', options.length));
  }
  return lockLutEndpoints(points, options.length);
}

function createColorRampLutPoints(options) {
  return lockLutEndpoints([
    makeLutPoint(0, normalizeHex(options.startColor), 'smooth', options.length),
    makeLutPoint(0.5, normalizeHex(options.midColor), 'smooth', options.length),
    makeLutPoint(1, normalizeHex(options.endColor), 'smooth', options.length),
  ], options.length);
}

function createChaosLutPoints(options, rng) {
  const count = clampNumber(options.detail, 8, 32);
  const points = [];
  let x = 0.12 + rng() * 0.76;
  for (let i = 0; i < count; i++) {
    x = options.chaosR * x * (1 - x);
    const t = i / Math.max(1, count - 1);
    const hue = options.baseHue + x * 360;
    const saturation = 45 + popcount(Math.floor(x * 255)) * 6;
    const value = 22 + Math.pow(x, 0.7) * 76 * (0.35 + options.contrast * 0.65);
    points.push(makeLutPoint(t, hsvToHex(hue, saturation, value), 'smooth', options.length));
  }
  return lockLutEndpoints(points, options.length);
}

function createFourierLutPoints(options, rng) {
  const count = clampNumber(options.detail, 8, 32);
  const harmonics = clampNumber(options.harmonics, 1, 6);
  const phases = Array.from({ length: harmonics }, () => rng() * Math.PI * 2);
  const points = [];
  for (let i = 0; i < count; i++) {
    const t = i / Math.max(1, count - 1);
    let sum = 0;
    for (let h = 1; h <= harmonics; h++) {
      sum += Math.sin(t * Math.PI * 2 * h + phases[h - 1]) / Math.pow(h, 1.2 - options.roughness * 0.8);
    }
    const normalized = sum / harmonics;
    const hue = options.baseHue + t * 360 + normalized * 220 * options.contrast;
    const saturation = 52 + Math.sin(sum * 2.4) * 28 * options.contrast;
    const value = 56 + Math.cos(sum * 2.1) * 32 * options.contrast;
    points.push(makeLutPoint(t, hsvToHex(hue, saturation, value), 'smooth', options.length));
  }
  return lockLutEndpoints(points, options.length);
}

function createEaseLutPoints(options, rng) {
  const count = clampNumber(options.detail, 3, 32);
  const points = [];
  for (let i = 0; i < count; i++) {
    const raw = i / Math.max(1, count - 1);
    const t = applyEase(raw, options.easeMode, count);
    const hue = options.baseHue + t * 260 + (rng() - 0.5) * 10 * options.contrast;
    const saturation = 42 + options.contrast * 50;
    const value = 10 + t * 88;
    const color = hsvToHex(hue, saturation, value);
    points.push(makeLutPoint(raw, color, 'smooth', options.length));
    if (options.easeMode === 'steps' && i < count - 1) {
      points.push(makeLutPoint((i + 0.98) / Math.max(1, count - 1), color, 'smooth', options.length));
    }
  }
  return lockLutEndpoints(points, options.length);
}

function makeLutPoint(t, color, kind, length) {
  return {
    id: uid(),
    index: Math.round(clamp(t, 0, 1) * (length - 1)),
    color,
    kind,
  };
}

function lockLutEndpoints(points, length) {
  const normalized = points
    .map((point) => normalizePoint(point, length))
    .sort((a, b) => a.index - b.index);
  normalized[0].index = 0;
  normalized[normalized.length - 1].index = length - 1;
  return normalized;
}

function applyEase(t, mode, steps = 8) {
  const x = clamp(t, 0, 1);
  if (mode === 'expo') return x * x;
  if (mode === 'log') return Math.log1p(x * 9) / Math.log(10);
  if (mode === 'pulse') return Math.sin(x * Math.PI);
  if (mode === 'steps') return Math.floor(x * Math.max(2, steps - 1)) / Math.max(1, steps - 1);
  if (mode === 'smooth') return x * x * (3 - 2 * x);
  return x;
}