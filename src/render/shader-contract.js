export const GRADIENT_UNIFORM_LENGTH = 48;

export const GRADIENT_UNIFORM_SLOTS = {
  scale: 0,
  offset: 1,
  offsetSpeed: 2,
  originX: 3,
  originY: 4,
  originSpeedX: 5,
  originSpeedY: 6,
  originAmpX: 7,
  originAmpY: 8,
  angle: 9,
  rotationSpeed: 10,
  angleMultiplier: 11,
  freq1: 12,
  freq2: 13,
  phaseSpeed: 14,
  warp: 15,
  seed: 16,
  octaves: 17,
  contrast: 18,
  driftX: 19,
  driftY: 20,
  voronoiMode: 21,
  metric: 22,
  moduloMode: 23,
  moduloCount: 24,
  coefficientX: 25,
  coefficientY: 26,
  polarMode: 27,
  angularFrequency: 28,
  radialFrequency: 29,
  twist: 30,
  bitwiseMode: 31,
  bitShift: 32,
  fanDirection: 33,
  jitterRange: 34,
  jitterSpeed: 35,
  scaleAmp: 36,
  scaleSpeed: 37,
  contrastAmp: 38,
  contrastSpeed: 39,
  freq1Amp: 40,
  freq1Speed: 41,
  freq2Amp: 42,
  freq2Speed: 43,
  warpAmp: 44,
  warpSpeed: 45,
  noiseContrastAmp: 46,
  noiseContrastSpeed: 47,
};

export function packGradientUniforms(g) {
  const values = new Float32Array(GRADIENT_UNIFORM_LENGTH);
  values[GRADIENT_UNIFORM_SLOTS.scale] = g.scale;
  values[GRADIENT_UNIFORM_SLOTS.offset] = g.offset;
  values[GRADIENT_UNIFORM_SLOTS.offsetSpeed] = g.offsetSpeed;
  values[GRADIENT_UNIFORM_SLOTS.originX] = g.originX;
  values[GRADIENT_UNIFORM_SLOTS.originY] = g.originY;
  values[GRADIENT_UNIFORM_SLOTS.originSpeedX] = g.originSpeedX;
  values[GRADIENT_UNIFORM_SLOTS.originSpeedY] = g.originSpeedY;
  values[GRADIENT_UNIFORM_SLOTS.originAmpX] = g.originAmpX;
  values[GRADIENT_UNIFORM_SLOTS.originAmpY] = g.originAmpY;
  values[GRADIENT_UNIFORM_SLOTS.angle] = g.angle;
  values[GRADIENT_UNIFORM_SLOTS.rotationSpeed] = g.rotationSpeed;
  values[GRADIENT_UNIFORM_SLOTS.angleMultiplier] = g.angleMultiplier;
  values[GRADIENT_UNIFORM_SLOTS.freq1] = g.freq1;
  values[GRADIENT_UNIFORM_SLOTS.freq2] = g.freq2;
  values[GRADIENT_UNIFORM_SLOTS.phaseSpeed] = g.phaseSpeed;
  values[GRADIENT_UNIFORM_SLOTS.warp] = g.warp;
  values[GRADIENT_UNIFORM_SLOTS.seed] = g.seed;
  values[GRADIENT_UNIFORM_SLOTS.octaves] = g.octaves;
  values[GRADIENT_UNIFORM_SLOTS.contrast] = g.contrast;
  values[GRADIENT_UNIFORM_SLOTS.driftX] = g.driftX;
  values[GRADIENT_UNIFORM_SLOTS.driftY] = g.driftY;
  values[GRADIENT_UNIFORM_SLOTS.voronoiMode] = g.voronoiMode;
  values[GRADIENT_UNIFORM_SLOTS.metric] = g.metric;
  values[GRADIENT_UNIFORM_SLOTS.moduloMode] = g.moduloMode;
  values[GRADIENT_UNIFORM_SLOTS.moduloCount] = g.moduloCount;
  values[GRADIENT_UNIFORM_SLOTS.coefficientX] = g.coefficientX;
  values[GRADIENT_UNIFORM_SLOTS.coefficientY] = g.coefficientY;
  values[GRADIENT_UNIFORM_SLOTS.polarMode] = g.polarMode;
  values[GRADIENT_UNIFORM_SLOTS.angularFrequency] = g.angularFrequency;
  values[GRADIENT_UNIFORM_SLOTS.radialFrequency] = g.radialFrequency;
  values[GRADIENT_UNIFORM_SLOTS.twist] = g.twist;
  values[GRADIENT_UNIFORM_SLOTS.bitwiseMode] = g.bitwiseMode;
  values[GRADIENT_UNIFORM_SLOTS.bitShift] = g.bitShift;
  values[GRADIENT_UNIFORM_SLOTS.fanDirection] = g.fanDirection < 0 ? -1 : 1;
  values[GRADIENT_UNIFORM_SLOTS.jitterRange] = g.jitterRange ?? 0;
  values[GRADIENT_UNIFORM_SLOTS.jitterSpeed] = g.jitterSpeed ?? 0;
  values[GRADIENT_UNIFORM_SLOTS.scaleAmp] = g.scaleAmp ?? 0;
  values[GRADIENT_UNIFORM_SLOTS.scaleSpeed] = g.scaleSpeed ?? 0;
  values[GRADIENT_UNIFORM_SLOTS.contrastAmp] = g.contrastAmp ?? 0;
  values[GRADIENT_UNIFORM_SLOTS.contrastSpeed] = g.contrastSpeed ?? 0;
  values[GRADIENT_UNIFORM_SLOTS.freq1Amp] = g.freq1Amp ?? 0;
  values[GRADIENT_UNIFORM_SLOTS.freq1Speed] = g.freq1Speed ?? 0;
  values[GRADIENT_UNIFORM_SLOTS.freq2Amp] = g.freq2Amp ?? 0;
  values[GRADIENT_UNIFORM_SLOTS.freq2Speed] = g.freq2Speed ?? 0;
  values[GRADIENT_UNIFORM_SLOTS.warpAmp] = g.warpAmp ?? 0;
  values[GRADIENT_UNIFORM_SLOTS.warpSpeed] = g.warpSpeed ?? 0;
  values[GRADIENT_UNIFORM_SLOTS.noiseContrastAmp] = g.noiseContrastAmp ?? 0;
  values[GRADIENT_UNIFORM_SLOTS.noiseContrastSpeed] = g.noiseContrastSpeed ?? 0;
  return values;
}
