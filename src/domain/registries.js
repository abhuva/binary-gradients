export const FIELD_TYPES = {
  linear: 'Linear / Angle',
  rings: 'Rings',
  square: 'Square / Diamond',
  fan: 'Fan / Angle',
  bitwiseCoord: 'Bitwise Coord',
  modulo: 'Modulo / Stripes',
  polar: 'Polar / Spiral',
  voronoi: 'Voronoi Cells',
  plasma: 'Plasma',
  noise: 'Noise',
};

export const FIELD_SHADER_IDS = {
  linear: 0,
  rings: 1,
  square: 2,
  fan: 3,
  bitwiseCoord: 4,
  modulo: 5,
  polar: 6,
  voronoi: 7,
  plasma: 8,
  noise: 9,
};

export const FIELD_IDS = Object.keys(FIELD_TYPES);

export const COMBINE_OPERATION_TYPES = {
  xor: 'XOR',
  and: 'AND',
  or: 'OR',
  xnor: 'XNOR',
  nand: 'NAND',
  nor: 'NOR',
  add: 'ADD mod range',
  sub: 'SUB mod range',
  diff: 'ABS difference',
  mul: 'MUL mod range',
  min: 'MIN',
  max: 'MAX',
};

export const COMBINE_OPERATION_SHADER_IDS = {
  xor: 0,
  and: 1,
  or: 2,
  xnor: 3,
  nand: 4,
  nor: 5,
  add: 6,
  sub: 7,
  diff: 8,
  mul: 9,
  min: 10,
  max: 11,
};

export const COMBINE_MODIFIER_TYPES = {
  none: 'None',
  shiftB: 'Shift Grad 2',
  popcount: 'Popcount',
  lowbit: 'Lowbit',
  highbit: 'Highbit',
};

export const COMBINE_MODIFIER_SHADER_IDS = {
  none: 0,
  shiftB: 1,
  popcount: 2,
  lowbit: 3,
  highbit: 4,
};

export const COMBINE_OPERATION_IDS = Object.keys(COMBINE_OPERATION_TYPES);
export const COMBINE_MODIFIER_IDS = Object.keys(COMBINE_MODIFIER_TYPES);

export const COMBINE_TYPES = COMBINE_OPERATION_TYPES;
export const COMBINE_SHADER_IDS = COMBINE_OPERATION_SHADER_IDS;
export const COMBINE_IDS = COMBINE_OPERATION_IDS;

export const GRADIENT_WRAP_TYPES = {
  loop: 'Loop / saw',
  pingpong: 'Ping-pong',
};

export const GRADIENT_WRAP_SHADER_IDS = { loop: 0, pingpong: 1 };

function originControls() {
  return [
    { key: 'originX', label: 'Origin X', min: 0, max: 1, step: 0.01 },
    { key: 'originY', label: 'Origin Y', min: 0, max: 1, step: 0.01 },
    { key: 'originAmpX', label: 'Amp X', min: 0, max: 0.5, step: 0.01 },
    { key: 'originAmpY', label: 'Amp Y', min: 0, max: 0.5, step: 0.01 },
    { key: 'originSpeedX', label: 'Speed X', min: -4, max: 4, step: 0.1 },
    { key: 'originSpeedY', label: 'Speed Y', min: -4, max: 4, step: 0.1 },
  ];
}

function animatedOriginControls() {
  return [
    {
      key: 'originX',
      label: 'Origin X',
      min: 0,
      max: 1,
      step: 0.01,
      animation: {
        rangeKey: 'originAmpX',
        speedKey: 'originSpeedX',
        rangeLabel: 'Amp X',
        speedLabel: 'Speed X',
        rangeMin: 0,
        rangeMax: 0.5,
        rangeStep: 0.01,
        speedMin: -4,
        speedMax: 4,
        speedStep: 0.1,
      },
    },
    {
      key: 'originY',
      label: 'Origin Y',
      min: 0,
      max: 1,
      step: 0.01,
      animation: {
        rangeKey: 'originAmpY',
        speedKey: 'originSpeedY',
        rangeLabel: 'Amp Y',
        speedLabel: 'Speed Y',
        rangeMin: 0,
        rangeMax: 0.5,
        rangeStep: 0.01,
        speedMin: -4,
        speedMax: 4,
        speedStep: 0.1,
      },
    },
  ];
}

export const COMMON_CONTROLS = [
  {
    key: 'scale',
    label: 'Scale',
    min: 1,
    step: 1,
    animation: {
      rangeKey: 'scaleAmp',
      speedKey: 'scaleSpeed',
      rangeLabel: 'Amp',
      speedLabel: 'Speed',
      rangeMin: 0,
      rangeStep: 1,
      speedMin: -12,
      speedMax: 12,
      speedStep: 0.1,
    },
  },
  { key: 'offset', label: 'Offset', min: 0, step: 1 },
  { key: 'offsetSpeed', label: 'Speed', min: -240, max: 240, step: 1 },
];

export const BITWISE_COORD_MODES = {
  0: 'XOR',
  1: 'AND',
  2: 'OR',
  3: 'XNOR',
  4: 'NAND',
  5: 'NOR',
  6: 'Add Shift',
  7: 'XOR Shift',
  8: 'AND Shift',
  9: 'OR Shift',
  10: 'Popcount XOR',
  11: 'Popcount AND',
  12: 'Popcount OR',
  13: 'Lowbit XOR',
  14: 'Lowbit AND',
  15: 'Lowbit OR',
  16: 'Highbit XOR',
  17: 'Highbit AND',
  18: 'Highbit OR',
};

export const SPECIFIC_CONTROLS = {
  bitwiseCoord: [
    { key: 'bitwiseMode', label: 'Mode', type: 'select', options: BITWISE_COORD_MODES },
    { key: 'bitShift', label: 'Bit Shift', min: 0, max: 8, step: 1 },
  ],
  linear: [
    { key: 'angle', label: 'Angle', min: 0, max: 360, step: 1 },
    { key: 'rotationSpeed', label: 'Rotation Speed', min: -180, max: 180, step: 1 },
  ],
  rings: animatedOriginControls(),
  square: [
    ...animatedOriginControls(),
    {
      key: 'angle',
      label: 'Angle',
      min: 0,
      max: 360,
      step: 1,
      animation: {
        speedKey: 'rotationSpeed',
        speedLabel: 'Speed',
        speedMin: -180,
        speedMax: 180,
        speedStep: 1,
      },
    },
  ],
  fan: [
    ...animatedOriginControls(),
    { key: 'fanDirection', label: 'Direction', type: 'toggle', options: { 1: 'Clockwise', '-1': 'Counterclockwise' } },
    { key: 'angleMultiplier', label: 'Angle Mult', min: 1, max: 16, step: 1 },
    { key: 'rotationSpeed', label: 'Rotation Speed', min: -180, max: 180, step: 1 },
  ],
  modulo: [
    { key: 'moduloMode', label: 'Mode', type: 'select', options: { 0: 'Linear Stripes', 1: 'Grid Sum', 2: 'Coefficient Formula' } },
    { key: 'moduloCount', label: 'Modulo Count', min: 2, max: 64, step: 1 },
    { key: 'coefficientX', label: 'X Mult', min: -16, max: 16, step: 1 },
    { key: 'coefficientY', label: 'Y Mult', min: -16, max: 16, step: 1 },
    { key: 'angle', label: 'Angle', min: 0, max: 360, step: 1 },
    { key: 'rotationSpeed', label: 'Rotation Speed', min: -180, max: 180, step: 1 },
  ],
  polar: [
    ...animatedOriginControls(),
    { key: 'polarMode', label: 'Mode', type: 'select', options: { 0: 'Spiral', 1: 'Angular Stripes', 2: 'Polar Checker' } },
    { key: 'angularFrequency', label: 'Angular Freq', min: 1, max: 64, step: 1 },
    { key: 'radialFrequency', label: 'Radial Freq', min: 0, max: 64, step: 1 },
    { key: 'twist', label: 'Twist', min: -16, max: 16, step: 0.1 },
    { key: 'rotationSpeed', label: 'Rotation Speed', min: -180, max: 180, step: 1 },
  ],
  voronoi: [
    { key: 'voronoiMode', label: 'Mode', type: 'select', options: { 0: 'Cell ID', 1: 'Distance', 2: 'Edge / Ridge' } },
    { key: 'metric', label: 'Metric', type: 'select', options: { 0: 'Euclidean', 1: 'Manhattan', 2: 'Chebyshev' } },
    { key: 'seed', label: 'Seed', min: 0, max: 1000, step: 1 },
    {
      key: 'warp',
      label: 'Jitter',
      min: 0,
      max: 1,
      step: 0.01,
      animation: {
        rangeKey: 'jitterRange',
        speedKey: 'jitterSpeed',
        rangeLabel: 'Range',
        speedLabel: 'Speed',
        rangeMin: 0,
        rangeMax: 1,
        rangeStep: 0.01,
        speedMin: -12,
        speedMax: 12,
        speedStep: 0.1,
      },
    },
    {
      key: 'contrast',
      label: 'Contrast',
      min: 0.2,
      max: 8,
      step: 0.1,
      animation: {
        rangeKey: 'contrastAmp',
        speedKey: 'contrastSpeed',
        rangeLabel: 'Amp',
        speedLabel: 'Speed',
        rangeMin: 0,
        rangeMax: 8,
        rangeStep: 0.1,
        speedMin: -12,
        speedMax: 12,
        speedStep: 0.1,
      },
    },
    { key: 'driftX', label: 'Drift X', min: -4, max: 4, step: 0.1 },
    { key: 'driftY', label: 'Drift Y', min: -4, max: 4, step: 0.1 },
  ],
  plasma: [
    {
      key: 'freq1',
      label: 'Freq 1',
      min: 1,
      max: 80,
      step: 1,
      animation: {
        rangeKey: 'freq1Amp',
        speedKey: 'freq1Speed',
        rangeLabel: 'Amp',
        speedLabel: 'Speed',
        rangeMin: 0,
        rangeMax: 80,
        rangeStep: 1,
        speedMin: -12,
        speedMax: 12,
        speedStep: 0.1,
      },
    },
    {
      key: 'freq2',
      label: 'Freq 2',
      min: 1,
      max: 80,
      step: 1,
      animation: {
        rangeKey: 'freq2Amp',
        speedKey: 'freq2Speed',
        rangeLabel: 'Amp',
        speedLabel: 'Speed',
        rangeMin: 0,
        rangeMax: 80,
        rangeStep: 1,
        speedMin: -12,
        speedMax: 12,
        speedStep: 0.1,
      },
    },
    { key: 'phaseSpeed', label: 'Phase Speed', min: -12, max: 12, step: 0.1 },
    {
      key: 'warp',
      label: 'Warp',
      min: 0,
      max: 10,
      step: 0.1,
      animation: {
        rangeKey: 'warpAmp',
        speedKey: 'warpSpeed',
        rangeLabel: 'Amp',
        speedLabel: 'Speed',
        rangeMin: 0,
        rangeMax: 10,
        rangeStep: 0.1,
        speedMin: -12,
        speedMax: 12,
        speedStep: 0.1,
      },
    },
  ],
  noise: [
    { key: 'seed', label: 'Seed', min: 0, max: 1000, step: 1 },
    { key: 'octaves', label: 'Octaves', min: 1, max: 5, step: 1 },
    {
      key: 'contrast',
      label: 'Contrast',
      min: 0.2,
      max: 4,
      step: 0.1,
      animation: {
        rangeKey: 'noiseContrastAmp',
        speedKey: 'noiseContrastSpeed',
        rangeLabel: 'Amp',
        speedLabel: 'Speed',
        rangeMin: 0,
        rangeMax: 4,
        rangeStep: 0.1,
        speedMin: -12,
        speedMax: 12,
        speedStep: 0.1,
      },
    },
    { key: 'driftX', label: 'Drift X', min: -4, max: 4, step: 0.1 },
    { key: 'driftY', label: 'Drift Y', min: -4, max: 4, step: 0.1 },
  ],
};

export const DEFAULT_GRADIENT = {
  type: 'rings',
  scale: 1,
  scaleAmp: 0,
  scaleSpeed: 0,
  offset: 0,
  offsetSpeed: 0,
  originX: 0.5,
  originY: 0.5,
  originAmpX: 0,
  originAmpY: 0,
  originSpeedX: 0,
  originSpeedY: 0,
  angle: 45,
  rotationSpeed: 0,
  fanDirection: 1,
  angleMultiplier: 1,
  freq1: 18,
  freq1Amp: 0,
  freq1Speed: 0,
  freq2: 31,
  freq2Amp: 0,
  freq2Speed: 0,
  phaseSpeed: 1,
  warp: 2,
  warpAmp: 0,
  warpSpeed: 0,
  jitterRange: 0,
  jitterSpeed: 0,
  contrastAmp: 0,
  contrastSpeed: 0,
  noiseContrastAmp: 0,
  noiseContrastSpeed: 0,
  seed: 17,
  octaves: 3,
  contrast: 1.2,
  driftX: 0.2,
  driftY: 0.1,
  voronoiMode: 0,
  metric: 0,
  moduloMode: 0,
  moduloCount: 8,
  coefficientX: 3,
  coefficientY: 5,
  polarMode: 0,
  angularFrequency: 12,
  radialFrequency: 8,
  twist: 1,
  bitwiseMode: 0,
  bitShift: 1,
};

export function normalizeGradientDefinition(gradient) {
  if (gradient.type === 'horizontal') return { ...gradient, type: 'linear', angle: 0 };
  if (gradient.type === 'vertical') return { ...gradient, type: 'linear', angle: 90 };
  if (gradient.type === 'diagonal') return { ...gradient, type: 'linear' };
  if (!Object.prototype.hasOwnProperty.call(FIELD_TYPES, gradient.type)) return { ...gradient, type: 'linear' };
  return gradient;
}
