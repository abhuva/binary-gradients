import { DEFAULT_GRADIENT } from './registries.js';
import { clampNumber } from './value-range.js';

export function createInitialState() {
  return {
    width: 1024,
    height: 768,
    valueBits: 8,
    valueRange: 256,
    valueMask: 255,
    rendererActual: 'webgl',
    time: 0,
    timeScale: 1,
    timeRunning: true,
    activeTab: 'render',
    previewMode: 'final',
    gradientPreviewEnabled: [false, false],
    gradients: [
      { ...DEFAULT_GRADIENT, type: 'rings', scale: 10 },
      { ...DEFAULT_GRADIENT, type: 'linear', scale: 12, angle: 0 },
    ],
    combineOperation: 'xor',
    combineModifier: 'none',
    combineShift: 1,
    fieldWrapMode: 'loop',
    paletteWrapMode: 'loop',
    paletteId: 'spectral',
    paletteOffset: 0,
    paletteCycleDirection: 1,
    cycleSeconds: 12,
    paletteRunning: true,
  };
}

export function previewModeForActiveTab(activeTab, gradientPreviewEnabled) {
  if (activeTab === 'grad1' && gradientPreviewEnabled[0]) return 'grad1';
  if (activeTab === 'grad2' && gradientPreviewEnabled[1]) return 'grad2';
  return 'final';
}

export function resolveValueDepth(bits, maxTextureSize = Infinity) {
  let valueBits = clampNumber(bits, 8, 13);
  let valueRange = 1 << valueBits;
  if (valueRange > maxTextureSize) {
    valueBits = Math.floor(Math.log2(maxTextureSize));
    valueRange = 1 << valueBits;
  }
  return {
    valueBits,
    valueRange,
    valueMask: valueRange - 1,
  };
}
