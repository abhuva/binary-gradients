const FIELD_TYPES = {
  horizontal: 'Horizontal',
  vertical: 'Vertical',
  diagonal: 'Diagonal',
  rings: 'Rings',
  diamond: 'Diamond',
  box: 'Box',
  fan: 'Fan / Angle',
  xorCoord: 'X XOR Y',
  plasma: 'Plasma',
  noise: 'Noise',
};

const FIELD_IDS = Object.keys(FIELD_TYPES);
const FIELD_INDEX = Object.fromEntries(FIELD_IDS.map((id, index) => [id, index]));

const COMBINE_TYPES = {
  xor: 'XOR',
  and: 'AND',
  or: 'OR',
  add: 'ADD mod range',
  sub: 'SUB mod range',
  diff: 'ABS difference',
  mul: 'MUL mod range',
  min: 'MIN',
  max: 'MAX',
};
const COMBINE_IDS = Object.keys(COMBINE_TYPES);
const COMBINE_INDEX = Object.fromEntries(COMBINE_IDS.map((id, index) => [id, index]));

const GRADIENT_WRAP_TYPES = {
  loop: 'Loop / saw',
  pingpong: 'Ping-pong',
};
const GRADIENT_WRAP_INDEX = { loop: 0, pingpong: 1 };

const LUT_GENERATOR_TYPES = {
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

const LUT_GENERATOR_CONTROLS = {
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

const COMMON_CONTROLS = [
  { key: 'scale', label: 'Scale', min: 1, max: 256, step: 1 },
  { key: 'offset', label: 'Offset', min: 0, max: 255, step: 1 },
  { key: 'offsetSpeed', label: 'Offset Speed', min: -240, max: 240, step: 1 },
];

const SPECIFIC_CONTROLS = {
  horizontal: [],
  vertical: [],
  xorCoord: [],
  diagonal: [
    { key: 'angle', label: 'Angle', min: 0, max: 360, step: 1 },
    { key: 'rotationSpeed', label: 'Rotation Speed', min: -180, max: 180, step: 1 },
  ],
  rings: originControls(),
  diamond: originControls(),
  box: originControls(),
  fan: [
    ...originControls(),
    { key: 'angleMultiplier', label: 'Angle Mult', min: 1, max: 16, step: 1 },
    { key: 'rotationSpeed', label: 'Rotation Speed', min: -180, max: 180, step: 1 },
  ],
  plasma: [
    { key: 'freq1', label: 'Freq 1', min: 1, max: 80, step: 1 },
    { key: 'freq2', label: 'Freq 2', min: 1, max: 80, step: 1 },
    { key: 'phaseSpeed', label: 'Phase Speed', min: -12, max: 12, step: 0.1 },
    { key: 'warp', label: 'Warp', min: 0, max: 10, step: 0.1 },
  ],
  noise: [
    { key: 'seed', label: 'Seed', min: 0, max: 1000, step: 1 },
    { key: 'octaves', label: 'Octaves', min: 1, max: 5, step: 1 },
    { key: 'contrast', label: 'Contrast', min: 0.2, max: 4, step: 0.1 },
    { key: 'driftX', label: 'Drift X', min: -4, max: 4, step: 0.1 },
    { key: 'driftY', label: 'Drift Y', min: -4, max: 4, step: 0.1 },
  ],
};

const DEFAULT_GRADIENT = {
  type: 'rings',
  scale: 10,
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
  angleMultiplier: 1,
  freq1: 18,
  freq2: 31,
  phaseSpeed: 1,
  warp: 2,
  seed: 17,
  octaves: 3,
  contrast: 1.2,
  driftX: 0.2,
  driftY: 0.1,
};

const state = {
  width: 1024,
  height: 768,
  valueBits: 8,
  valueRange: 256,
  valueMask: 255,
  rendererActual: 'webgl',
  time: 0,
  timeScale: 1,
  timeRunning: true,
  previewMode: 'final',
  gradients: [
    { ...DEFAULT_GRADIENT, type: 'rings', scale: 10 },
    { ...DEFAULT_GRADIENT, type: 'horizontal', scale: 12 },
  ],
  combine: 'xor',
  gradientWrapMode: 'loop',
  paletteId: 'spectral',
  paletteOffset: 0,
  paletteCycleDirection: 1,
  cycleSeconds: 12,
  paletteRunning: true,
};

let canvas = document.querySelector('#canvas');
const viewport = document.querySelector('#viewport');
const readout = document.querySelector('#readout');
const lutCanvas = document.querySelector('#lutCanvas');
const lutCtx = lutCanvas.getContext('2d', { alpha: false });
const controls = bindControls();

let gl = null;
let glProgram = null;
let glUniforms = null;
let glLutTexture = null;
let glVao = null;
let glDiagnostics = [];
let lutLibrary = makeBuiltinLuts();
let currentLut = cloneLut(lutLibrary[state.paletteId]);
let palette = buildLut(currentLut);
let selectedPointId = currentLut.points[0]?.id ?? null;
let lastTime = performance.now();
let renderQueued = false;
let needsStaticRender = true;
let view = { scale: 1, fitScale: 1, x: 0, y: 0 };
let drag = { active: false, pointerId: null, x: 0, y: 0, viewX: 0, viewY: 0 };
let lutDrag = { active: false, pointerId: null, pointId: null };

initSelect(controls.combine, COMBINE_TYPES, state.combine);
initSelect(controls.gradientWrapMode, GRADIENT_WRAP_TYPES, state.gradientWrapMode);
initSelect(controls.lutGenerator, LUT_GENERATOR_TYPES, 'harmony');
refreshPaletteSelect();
wireControls();
renderGradientPanel(0);
renderGradientPanel(1);
syncLutControls();
setupRenderer();
setValueBits(state.valueBits);
resizeBuffers();
renderLutEditor();
requestAnimationFrame(tick);
requestAnimationFrame(resetView);

function originControls() {
  return [
    { key: 'originX', label: 'Origin X', min: -1, max: 2, step: 0.001 },
    { key: 'originY', label: 'Origin Y', min: -1, max: 2, step: 0.001 },
    { key: 'originAmpX', label: 'Origin Amp X', min: 0, max: 1, step: 0.001 },
    { key: 'originAmpY', label: 'Origin Amp Y', min: 0, max: 1, step: 0.001 },
    { key: 'originSpeedX', label: 'Origin Speed X', min: -8, max: 8, step: 0.1 },
    { key: 'originSpeedY', label: 'Origin Speed Y', min: -8, max: 8, step: 0.1 },
  ];
}

function bindControls() {
  return {
    tabButtons: [...document.querySelectorAll('.tab-button')],
    tabPanels: [...document.querySelectorAll('.tab-panel')],
    width: document.querySelector('#width'),
    height: document.querySelector('#height'),
    valueBits: document.querySelector('#valueBits'),
    applySize: document.querySelector('#applySize'),
    resetView: document.querySelector('#resetView'),
    timeScale: document.querySelector('#timeScale'),
    timeScaleOut: document.querySelector('#timeScaleOut'),
    gradientWrapMode: document.querySelector('#gradientWrapMode'),
    toggleTime: document.querySelector('#toggleTime'),
    resetTime: document.querySelector('#resetTime'),
    runGpuDiagnostics: document.querySelector('#runGpuDiagnostics'),
    gpuDiagnostics: document.querySelector('#gpuDiagnostics'),
    gradientPanels: [document.querySelector('#gradient1Panel'), document.querySelector('#gradient2Panel')],
    combine: document.querySelector('#combine'),
    palette: document.querySelector('#palette'),
    cycleSeconds: document.querySelector('#cycleSeconds'),
    cycleSecondsOut: document.querySelector('#cycleSecondsOut'),
    paletteOffset: document.querySelector('#paletteOffset'),
    paletteOffsetOut: document.querySelector('#paletteOffsetOut'),
    toggleAnimation: document.querySelector('#toggleAnimation'),
    randomize: document.querySelector('#randomize'),
    savePng: document.querySelector('#savePng'),
    lutId: document.querySelector('#lutId'),
    lutLength: document.querySelector('#lutLength'),
    applyLutLength: document.querySelector('#applyLutLength'),
    lutGenerator: document.querySelector('#lutGenerator'),
    lutSeed: document.querySelector('#lutSeed'),
    lutBaseHue: document.querySelector('#lutBaseHue'),
    lutBaseHueOut: document.querySelector('#lutBaseHueOut'),
    lutDetail: document.querySelector('#lutDetail'),
    lutDetailOut: document.querySelector('#lutDetailOut'),
    lutContrast: document.querySelector('#lutContrast'),
    lutContrastOut: document.querySelector('#lutContrastOut'),
    lutGeneratorParams: document.querySelector('#lutGeneratorParams'),
    generateLut: document.querySelector('#generateLut'),
    randomizeLutSeed: document.querySelector('#randomizeLutSeed'),
    lutMarkers: document.querySelector('#lutMarkers'),
    addSmoothPoint: document.querySelector('#addSmoothPoint'),
    addHardPoint: document.querySelector('#addHardPoint'),
    pointEditor: document.querySelector('#pointEditor'),
    pointIndex: document.querySelector('#pointIndex'),
    pointColor: document.querySelector('#pointColor'),
    pointKind: document.querySelector('#pointKind'),
    deletePoint: document.querySelector('#deletePoint'),
    applyLutToRenderer: document.querySelector('#applyLutToRenderer'),
    saveLutJson: document.querySelector('#saveLutJson'),
  };
}

function initSelect(select, options, selected) {
  select.replaceChildren(...Object.entries(options).map(([value, label]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    option.selected = value === selected;
    return option;
  }));
}

function refreshPaletteSelect() {
  controls.palette.replaceChildren(...Object.keys(lutLibrary).map((id) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = id;
    option.selected = id === state.paletteId;
    return option;
  }));
}

function wireControls() {
  controls.tabButtons.forEach((button) => button.addEventListener('click', () => setTab(button.dataset.tab)));

  controls.applySize.addEventListener('click', () => {
    state.width = clampNumber(controls.width.value, 16, 8192);
    state.height = clampNumber(controls.height.value, 16, 8192);
    controls.width.value = state.width;
    controls.height.value = state.height;
    resizeBuffers();
    resetView();
    requestRender();
  });
  controls.valueBits.addEventListener('change', () => {
    setValueBits(Number(controls.valueBits.value));
  });
  controls.resetView.addEventListener('click', resetView);

  controls.timeScale.addEventListener('input', () => {
    state.timeScale = Number(controls.timeScale.value) / 100;
    updateReadouts();
  });
  controls.gradientWrapMode.addEventListener('change', () => {
    state.gradientWrapMode = controls.gradientWrapMode.value;
    syncPaletteCycleDirection();
    requestRender();
  });
  controls.toggleTime.addEventListener('click', () => {
    state.timeRunning = !state.timeRunning;
    controls.toggleTime.textContent = state.timeRunning ? 'Pause Time' : 'Resume Time';
  });
  controls.resetTime.addEventListener('click', () => {
    state.time = 0;
    requestRender();
  });
  controls.runGpuDiagnostics.addEventListener('click', runGpuDiagnostics);

  controls.combine.addEventListener('change', () => {
    state.combine = controls.combine.value;
    requestRender();
  });

  controls.palette.addEventListener('change', () => {
    state.paletteId = controls.palette.value;
    currentLut = cloneLut(lutLibrary[state.paletteId]);
    palette = buildLut(currentLut);
    selectedPointId = currentLut.points[0]?.id ?? null;
    uploadLutTexture();
    syncLutControls();
    renderLutEditor();
    requestRender();
  });
  controls.cycleSeconds.addEventListener('input', () => {
    state.cycleSeconds = Number(controls.cycleSeconds.value);
    updateReadouts();
  });
  controls.paletteOffset.addEventListener('input', () => {
    state.paletteOffset = wrapRange(Number(controls.paletteOffset.value));
    syncPaletteCycleDirection();
    requestRender();
  });
  controls.toggleAnimation.addEventListener('click', () => {
    state.paletteRunning = !state.paletteRunning;
    controls.toggleAnimation.textContent = state.paletteRunning ? 'Pause Palette' : 'Resume Palette';
  });

  controls.randomize.addEventListener('click', randomize);
  controls.savePng.addEventListener('click', savePng);

  controls.lutId.addEventListener('input', () => {
    currentLut.id = sanitizeLutId(controls.lutId.value);
  });
  controls.applyLutLength.addEventListener('click', applyLutLength);
  controls.lutGenerator.addEventListener('change', () => {
    renderGeneratorParams();
    generateCurrentLut();
  });
  controls.lutBaseHue.addEventListener('input', generateCurrentLut);
  controls.lutDetail.addEventListener('input', generateCurrentLut);
  controls.lutContrast.addEventListener('input', generateCurrentLut);
  controls.generateLut.addEventListener('click', generateCurrentLut);
  controls.randomizeLutSeed.addEventListener('click', () => {
    controls.lutSeed.value = String(randomInt(0, 999999));
    generateCurrentLut();
  });
  controls.addSmoothPoint.addEventListener('click', () => addLutPoint('smooth'));
  controls.addHardPoint.addEventListener('click', () => addLutPoint('hard'));
  lutCanvas.addEventListener('pointerdown', onLutCanvasPointerDown);
  controls.pointIndex.addEventListener('input', updateSelectedPointFromControls);
  controls.pointColor.addEventListener('input', updateSelectedPointFromControls);
  controls.pointKind.addEventListener('change', updateSelectedPointFromControls);
  controls.deletePoint.addEventListener('click', deleteSelectedPoint);
  controls.applyLutToRenderer.addEventListener('click', applyCurrentLutToRenderer);
  controls.saveLutJson.addEventListener('click', saveLutJson);

  viewport.addEventListener('wheel', onWheel, { passive: false });
  viewport.addEventListener('pointerdown', onPointerDown);
  viewport.addEventListener('pointermove', onPointerMove);
  viewport.addEventListener('pointerup', onPointerUp);
  viewport.addEventListener('pointercancel', onPointerUp);
  window.addEventListener('resize', () => {
    resetView();
    renderLutEditor();
  });
  updateReadouts();
  syncGeneratorReadouts();
  renderGeneratorParams();
}

function setTab(tabName) {
  controls.tabButtons.forEach((button) => button.classList.toggle('active', button.dataset.tab === tabName));
  controls.tabPanels.forEach((panel) => panel.classList.toggle('active', panel.id === `${tabName}Tab`));
  document.body.classList.toggle('lut-dock-active', tabName === 'lut');
  if (tabName === 'lut') requestAnimationFrame(renderLutEditor);
  state.previewMode = tabName === 'grad1' ? 'grad1' : tabName === 'grad2' ? 'grad2' : 'final';
  resetView();
  requestRender();
}

function setValueBits(bits) {
  state.valueBits = clampNumber(bits, 8, 13);
  state.valueRange = 1 << state.valueBits;
  state.valueMask = state.valueRange - 1;
  if (gl) {
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    if (state.valueRange > maxTextureSize) {
      state.valueBits = Math.floor(Math.log2(maxTextureSize));
      state.valueRange = 1 << state.valueBits;
      state.valueMask = state.valueRange - 1;
      addGpuDiagnostic(`Requested value depth exceeds MAX_TEXTURE_SIZE. Clamped to ${state.valueBits} bit.`);
    }
  }
  state.paletteOffset = wrapRange(state.paletteOffset);
  syncPaletteCycleDirection();
  controls.valueBits.value = String(state.valueBits);
  controls.paletteOffset.max = String(state.valueMask);
  controls.paletteOffset.value = Math.floor(state.paletteOffset);
  uploadLutTexture();
  updateGradientPanelRanges();
  requestRender();
}

function updateGradientPanelRanges() {
  state.gradients.forEach((_, index) => renderGradientPanel(index));
}

function renderGradientPanel(index) {
  const gradient = state.gradients[index];
  const panel = controls.gradientPanels[index];
  panel.replaceChildren();
  panel.appendChild(el('h2', {}, `Gradient ${index + 1}`));

  const typeLabel = labelWrap('Type');
  const typeSelect = document.createElement('select');
  initSelect(typeSelect, FIELD_TYPES, gradient.type);
  typeSelect.addEventListener('change', () => {
    state.gradients[index] = { ...DEFAULT_GRADIENT, ...state.gradients[index], type: typeSelect.value };
    renderGradientPanel(index);
    requestRender();
  });
  typeLabel.appendChild(typeSelect);
  panel.appendChild(typeLabel);

  panel.appendChild(el('h2', { className: 'subhead' }, 'Common'));
  COMMON_CONTROLS
    .filter((control) => gradient.type !== 'plasma' || control.key !== 'scale')
    .forEach((control) => panel.appendChild(createGradientControl(index, control)));

  const specific = SPECIFIC_CONTROLS[gradient.type] ?? [];
  if (specific.length > 0) {
    panel.appendChild(el('h2', { className: 'subhead' }, FIELD_TYPES[gradient.type]));
    specific.forEach((control) => panel.appendChild(createGradientControl(index, control)));
  }
}

function createGradientControl(index, control) {
  const gradient = state.gradients[index];
  const resolved = resolveControl(control);
  const label = labelWrap('');
  label.className = `gradient-control${control.key === 'offsetSpeed' ? ' has-snap' : ''}`;
  const caption = el('span', { className: 'gradient-control-label' }, control.label);
  const output = document.createElement('output');
  output.value = formatNumber(gradient[control.key]);

  const input = document.createElement('input');
  input.type = 'range';
  input.min = resolved.min;
  input.max = resolved.max;
  input.step = resolved.step;
  input.value = gradient[control.key];
  input.addEventListener('input', () => {
    gradient[control.key] = Number(input.value);
    output.value = formatNumber(gradient[control.key]);
    requestRender();
  });
  label.append(caption, input, output);
  if (control.key === 'offsetSpeed') {
    const zeroButton = el('button', { className: 'inline-zero', type: 'button' }, '0');
    zeroButton.title = 'Snap offset speed to zero';
    zeroButton.addEventListener('click', () => {
      gradient.offsetSpeed = 0;
      input.value = '0';
      output.value = '0';
      requestRender();
    });
    label.appendChild(zeroButton);
  }
  return label;
}

function resolveControl(control) {
  if (control.key === 'offset') return { ...control, max: state.valueMask };
  if (control.key === 'offsetSpeed') return { ...control, min: -state.valueRange, max: state.valueRange };
  return control;
}

function labelWrap(text) {
  const label = document.createElement('label');
  label.append(text);
  return label;
}

function el(tag, props = {}, text = '') {
  const node = document.createElement(tag);
  Object.assign(node, props);
  if (text) node.textContent = text;
  return node;
}

function setupRenderer() {
  glDiagnostics = [];
  const nextCanvas = document.createElement('canvas');
  nextCanvas.id = 'canvas';
  canvas.replaceWith(nextCanvas);
  canvas = nextCanvas;
  gl = null;
  glProgram = null;
  glUniforms = null;
  glLutTexture = null;
  glVao = null;

  gl = canvas.getContext('webgl2', { alpha: false, preserveDrawingBuffer: true });
  if (!gl) {
    state.rendererActual = 'webgl unavailable';
    addGpuDiagnostic('WebGL2 context unavailable. GPU rendering is required.');
    flushGpuDiagnostics();
    return;
  }

  try {
    state.rendererActual = 'webgl';
    initWebGl();
    uploadLutTexture();
    addGpuDiagnostic('WebGL2 renderer initialized.');
  } catch (error) {
    state.rendererActual = 'webgl error';
    addGpuDiagnostic(`WebGL setup failed: ${error.message}`);
    console.error('WebGL2 renderer failed.', error);
    flushGpuDiagnostics();
  }
}

function resizeBuffers() {
  canvas.width = state.width;
  canvas.height = state.height;
  if (gl) gl.viewport(0, 0, state.width, state.height);
  applyView();
  requestRender();
}

function resetView() {
  const rect = viewport.getBoundingClientRect();
  const fit = Math.min(rect.width / state.width, rect.height / state.height);
  view.fitScale = Number.isFinite(fit) && fit > 0 ? fit : 1;
  view.scale = view.fitScale;
  view.x = (rect.width - state.width * view.scale) / 2;
  view.y = (rect.height - state.height * view.scale) / 2;
  applyView();
}

function applyView() {
  canvas.style.width = `${state.width}px`;
  canvas.style.height = `${state.height}px`;
  canvas.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
  updateReadouts();
}

function onWheel(event) {
  event.preventDefault();
  const rect = viewport.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  const imageX = (mouseX - view.x) / view.scale;
  const imageY = (mouseY - view.y) / view.scale;
  const factor = Math.exp(-event.deltaY * 0.0015);
  const minScale = view.fitScale * 0.15;
  const maxScale = Math.max(view.fitScale * 128, 64);
  view.scale = clamp(view.scale * factor, minScale, maxScale);
  view.x = mouseX - imageX * view.scale;
  view.y = mouseY - imageY * view.scale;
  applyView();
}

function onPointerDown(event) {
  if (event.button !== 0) return;
  drag.active = true;
  drag.pointerId = event.pointerId;
  drag.x = event.clientX;
  drag.y = event.clientY;
  drag.viewX = view.x;
  drag.viewY = view.y;
  viewport.classList.add('dragging');
  viewport.setPointerCapture(event.pointerId);
}

function onPointerMove(event) {
  if (!drag.active || event.pointerId !== drag.pointerId) return;
  view.x = drag.viewX + event.clientX - drag.x;
  view.y = drag.viewY + event.clientY - drag.y;
  applyView();
}

function onPointerUp(event) {
  if (!drag.active || event.pointerId !== drag.pointerId) return;
  drag.active = false;
  drag.pointerId = null;
  viewport.classList.remove('dragging');
  viewport.releasePointerCapture(event.pointerId);
}

function tick(now) {
  const dt = Math.min(100, now - lastTime) / 1000;
  lastTime = now;

  let animated = false;
  if (state.timeRunning && state.timeScale > 0) {
    state.time += dt * state.timeScale;
    animated = hasGradientAnimation();
  }

  if (state.paletteRunning && state.cycleSeconds > 0) {
    advancePaletteCycle(dt);
    controls.paletteOffset.value = Math.floor(state.paletteOffset);
    needsStaticRender = true;
    animated = true;
  }

  if (animated || needsStaticRender) renderFrame();
  requestAnimationFrame(tick);
}

function hasGradientAnimation() {
  return state.gradients.some((g) => g.offsetSpeed || g.rotationSpeed || g.originSpeedX || g.originSpeedY || g.phaseSpeed || g.driftX || g.driftY);
}

function advancePaletteCycle(dt) {
  if (state.gradientWrapMode !== 'pingpong') {
    state.paletteOffset = wrapRange(state.paletteOffset + dt * state.valueRange / state.cycleSeconds);
    return;
  }

  const max = state.valueMask;
  if (max <= 0) {
    state.paletteOffset = 0;
    state.paletteCycleDirection = 1;
    return;
  }

  let next = state.paletteOffset + state.paletteCycleDirection * dt * (max * 2) / state.cycleSeconds;
  while (next < 0 || next > max) {
    if (next > max) {
      next = max - (next - max);
      state.paletteCycleDirection = -1;
    } else {
      next = -next;
      state.paletteCycleDirection = 1;
    }
  }
  state.paletteOffset = next;
}

function syncPaletteCycleDirection() {
  if (state.gradientWrapMode !== 'pingpong') return;
  if (state.paletteOffset <= 0) state.paletteCycleDirection = 1;
  else if (state.paletteOffset >= state.valueMask) state.paletteCycleDirection = -1;
}

function requestRender() {
  needsStaticRender = true;
  if (!renderQueued) {
    renderQueued = true;
    requestAnimationFrame(() => {
      renderQueued = false;
      renderFrame();
    });
  }
}

function renderFrame() {
  needsStaticRender = false;
  updateReadouts();
  if (gl && glProgram) renderWebGl();
}

function initWebGl() {
  const vs = `#version 300 es
  precision highp float;
  const vec2 POS[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
  void main() { gl_Position = vec4(POS[gl_VertexID], 0.0, 1.0); }
  `;

  const fs = `#version 300 es
  precision highp float;
  precision highp int;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_paletteOffset;
  uniform float u_valueRange;
  uniform int u_valueMask;
  uniform int u_combine;
  uniform int u_gradientWrapMode;
  uniform int u_preview;
  uniform int u_type1;
  uniform int u_type2;
  uniform float u_g1[22];
  uniform float u_g2[22];
  uniform sampler2D u_lut;
  out vec4 outColor;

  float wrapValue(float v) {
    float whole = floor(v);
    if (u_gradientWrapMode == 1) {
      float peak = max(1.0, u_valueRange - 1.0);
      float t = mod(whole, peak * 2.0);
      return t <= peak ? t : peak * 2.0 - t;
    }
    return mod(whole, u_valueRange);
  }
  float smoothCurve(float t) { return t * t * (3.0 - 2.0 * t); }
  vec2 smoothCurve(vec2 t) { return t * t * (3.0 - 2.0 * t); }
  float hash2(vec2 p, float seed) { return fract(sin(dot(p, vec2(127.1, 311.7)) + seed * 74.7) * 43758.5453); }
  float valueNoise(vec2 p, float seed) {
    vec2 i = floor(p);
    vec2 f = smoothCurve(fract(p));
    float a = hash2(i, seed);
    float b = hash2(i + vec2(1.0, 0.0), seed);
    float c = hash2(i + vec2(0.0, 1.0), seed);
    float d = hash2(i + vec2(1.0, 1.0), seed);
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fieldValue(int type, float g[22], vec2 pixel, vec2 uv) {
    float scale = max(1.0, g[0]);
    float offset = g[1] + u_time * g[2];
    float ox = g[3] + sin(u_time * g[5]) * g[7];
    float oy = g[4] + sin(u_time * g[6]) * g[8];
    vec2 origin = vec2(ox, oy) * (u_resolution - 1.0);
    vec2 d = pixel - origin;
    float value = 0.0;

    if (type == 0) value = floor(pixel.x / scale);
    else if (type == 1) value = floor(pixel.y / scale);
    else if (type == 2) {
      float a = radians(g[9] + u_time * g[10]);
      value = floor((cos(a) * pixel.x + sin(a) * pixel.y) / scale);
    }
    else if (type == 3) value = floor(length(d) / scale);
    else if (type == 4) value = floor((abs(d.x) + abs(d.y)) / scale);
    else if (type == 5) value = floor(max(abs(d.x), abs(d.y)) / scale);
    else if (type == 6) {
      float a = atan(d.y, d.x) + 3.14159265359 + radians(u_time * g[10]);
      value = floor((a / 6.28318530718) * u_valueRange * max(1.0, g[11]));
    }
    else if (type == 7) value = float((int(floor(pixel.x / scale)) ^ int(floor(pixel.y / scale))) & u_valueMask);
    else if (type == 8) {
      float phase = u_time * g[14];
      vec2 c = uv - 0.5;
      float warp = sin((uv.x + uv.y + phase * 0.05) * g[13]) * g[15] * 0.02;
      float v = sin((uv.x + warp) * g[12] + phase)
        + sin((uv.y - warp) * g[13] - phase * 0.7)
        + sin(length(c) * (g[12] + g[13]) - phase * 0.45);
      value = floor((v / 3.0 * 0.5 + 0.5) * (u_valueRange - 1.0));
    }
    else if (type == 9) {
      float freq = max(1.0, scale) / 24.0;
      vec2 p = uv * freq + vec2(g[16], g[16] * 1.37) + u_time * vec2(g[19], g[20]);
      float sum = 0.0;
      float amp = 0.5;
      for (int i = 0; i < 5; i++) {
        if (i >= int(g[17])) break;
        sum += valueNoise(p * exp2(float(i)), g[16] + float(i) * 13.0) * amp;
        amp *= 0.5;
      }
      value = floor(pow(clamp(sum * g[18], 0.0, 1.0), 1.2) * (u_valueRange - 1.0));
    }
    return wrapValue(value + offset);
  }

  int combineValues(int a, int b) {
    if (u_combine == 1) return a & b;
    if (u_combine == 2) return a | b;
    if (u_combine == 3) return (a + b) & u_valueMask;
    if (u_combine == 4) return (a - b) & u_valueMask;
    if (u_combine == 5) return abs(a - b) & u_valueMask;
    if (u_combine == 6) return (a * b) & u_valueMask;
    if (u_combine == 7) return min(a, b);
    if (u_combine == 8) return max(a, b);
    return (a ^ b) & u_valueMask;
  }

  void main() {
    vec2 pixel = gl_FragCoord.xy;
    vec2 uv = pixel / max(vec2(1.0), u_resolution - 1.0);
    int a = int(fieldValue(u_type1, u_g1, pixel, uv));
    int b = int(fieldValue(u_type2, u_g2, pixel, uv));
    int value = combineValues(a, b);
    if (u_preview == 1) value = a;
    else if (u_preview == 2) value = b;
    float lutX = (mod(float(value) + u_paletteOffset, u_valueRange) + 0.5) / u_valueRange;
    outColor = texture(u_lut, vec2(lutX, 0.5));
  }
  `;

  glProgram = createProgram(vs, fs);
  gl.useProgram(glProgram);
  glVao = gl.createVertexArray();
  gl.bindVertexArray(glVao);
  glUniforms = {
    resolution: gl.getUniformLocation(glProgram, 'u_resolution'),
    time: gl.getUniformLocation(glProgram, 'u_time'),
    paletteOffset: gl.getUniformLocation(glProgram, 'u_paletteOffset'),
    valueRange: gl.getUniformLocation(glProgram, 'u_valueRange'),
    valueMask: gl.getUniformLocation(glProgram, 'u_valueMask'),
    combine: gl.getUniformLocation(glProgram, 'u_combine'),
    gradientWrapMode: gl.getUniformLocation(glProgram, 'u_gradientWrapMode'),
    preview: gl.getUniformLocation(glProgram, 'u_preview'),
    type1: gl.getUniformLocation(glProgram, 'u_type1'),
    type2: gl.getUniformLocation(glProgram, 'u_type2'),
    g1: gl.getUniformLocation(glProgram, 'u_g1[0]'),
    g2: gl.getUniformLocation(glProgram, 'u_g2[0]'),
    lut: gl.getUniformLocation(glProgram, 'u_lut'),
  };
  gl.uniform1i(glUniforms.lut, 0);
}

function renderWebGl() {
  if (!gl || !glProgram) return;
  clearGlErrors();
  gl.viewport(0, 0, state.width, state.height);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(glProgram);
  gl.bindVertexArray(glVao);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, glLutTexture);
  gl.uniform2f(glUniforms.resolution, state.width, state.height);
  gl.uniform1f(glUniforms.time, state.time);
  gl.uniform1f(glUniforms.paletteOffset, state.paletteOffset);
  gl.uniform1f(glUniforms.valueRange, state.valueRange);
  gl.uniform1i(glUniforms.valueMask, state.valueMask);
  gl.uniform1i(glUniforms.combine, COMBINE_INDEX[state.combine] ?? 0);
  gl.uniform1i(glUniforms.gradientWrapMode, GRADIENT_WRAP_INDEX[state.gradientWrapMode] ?? 0);
  gl.uniform1i(glUniforms.preview, previewIndex());
  gl.uniform1i(glUniforms.type1, FIELD_INDEX[state.gradients[0].type] ?? 0);
  gl.uniform1i(glUniforms.type2, FIELD_INDEX[state.gradients[1].type] ?? 0);
  gl.uniform1fv(glUniforms.g1, gradientUniforms(state.gradients[0]));
  gl.uniform1fv(glUniforms.g2, gradientUniforms(state.gradients[1]));
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  const error = gl.getError();
  if (error !== gl.NO_ERROR) {
    addGpuDiagnostic(`WebGL render error: ${glErrorName(error)}.`);
    console.warn('WebGL render error.', error);
    flushGpuDiagnostics();
  }
}

function gradientUniforms(g) {
  return new Float32Array([
    g.scale, g.offset, g.offsetSpeed,
    g.originX, g.originY, g.originSpeedX, g.originSpeedY, g.originAmpX, g.originAmpY,
    g.angle, g.rotationSpeed, g.angleMultiplier,
    g.freq1, g.freq2, g.phaseSpeed, g.warp,
    g.seed, g.octaves, g.contrast, g.driftX, g.driftY,
    0,
  ]);
}

function previewIndex() {
  if (state.previewMode === 'grad1') return 1;
  if (state.previewMode === 'grad2') return 2;
  return 0;
}

function createProgram(vsSource, fsSource) {
  const vs = compileShader(gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program) || 'unknown link error';
    addGpuDiagnostic(`Program link failed: ${info}`);
    throw new Error(info);
  }
  const linkInfo = gl.getProgramInfoLog(program);
  if (linkInfo) addGpuDiagnostic(`Program link log: ${linkInfo}`);
  return program;
}

function compileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) || 'unknown compile error';
    addGpuDiagnostic(`${type === gl.VERTEX_SHADER ? 'Vertex' : 'Fragment'} shader failed: ${info}`);
    throw new Error(info);
  }
  const info = gl.getShaderInfoLog(shader);
  if (info) addGpuDiagnostic(`${type === gl.VERTEX_SHADER ? 'Vertex' : 'Fragment'} shader log: ${info}`);
  return shader;
}

function uploadLutTexture() {
  if (!gl) return;
  const width = state.valueRange;
  const pixels = new Uint8Array(width * 4);
  for (let i = 0; i < width; i++) {
    const color = palette[Math.floor((i / Math.max(1, width - 1)) * (palette.length - 1))];
    pixels[i * 4] = color[0];
    pixels[i * 4 + 1] = color[1];
    pixels[i * 4 + 2] = color[2];
    pixels[i * 4 + 3] = 255;
  }
  if (!glLutTexture) glLutTexture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, glLutTexture);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
}

function runGpuDiagnostics() {
  glDiagnostics = [];
  addGpuDiagnostic(`Actual renderer before test: ${state.rendererActual}`);

  setupRenderer();
  resizeBuffers();

  if (!gl) {
    addGpuDiagnostic('No WebGL2 context available.');
    flushGpuDiagnostics();
    return;
  }

  addGpuDiagnostic(`Vendor: ${gl.getParameter(gl.VENDOR)}`);
  addGpuDiagnostic(`Renderer: ${gl.getParameter(gl.RENDERER)}`);
  addGpuDiagnostic(`Version: ${gl.getParameter(gl.VERSION)}`);
  addGpuDiagnostic(`GLSL: ${gl.getParameter(gl.SHADING_LANGUAGE_VERSION)}`);
  addGpuDiagnostic(`MAX_TEXTURE_SIZE: ${gl.getParameter(gl.MAX_TEXTURE_SIZE)}`);
  addGpuDiagnostic(`Value depth: ${state.valueBits} bit / ${state.valueRange}`);
  addGpuDiagnostic(`Canvas: ${canvas.width}x${canvas.height}`);
  addGpuDiagnostic(`Program linked: ${Boolean(glProgram)}`);
  addGpuDiagnostic(`LUT texture: ${Boolean(glLutTexture)}`);
  addGpuDiagnostic(`Uniform resolution: ${Boolean(glUniforms?.resolution)}`);
  addGpuDiagnostic(`Uniform g1[0]: ${Boolean(glUniforms?.g1)}`);
  addGpuDiagnostic(`Uniform g2[0]: ${Boolean(glUniforms?.g2)}`);
  addGpuDiagnostic(`Uniform LUT: ${Boolean(glUniforms?.lut)}`);

  clearGlErrors();
  renderWebGl();
  const drawError = gl ? gl.getError() : 0;
  addGpuDiagnostic(`Post-render gl.getError: ${gl ? glErrorName(drawError) : 'no context'}`);

  if (gl) {
    const pixel = new Uint8Array(4);
    gl.readPixels(Math.floor(state.width / 2), Math.floor(state.height / 2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    const readError = gl.getError();
    addGpuDiagnostic(`Center pixel RGBA: ${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${pixel[3]}`);
    addGpuDiagnostic(`Post-read gl.getError: ${glErrorName(readError)}`);
    probeShaderOutput();
  }

  flushGpuDiagnostics();
}

function probeShaderOutput() {
  if (!gl) return;
  const source = `#version 300 es
  precision highp float;
  out vec4 outColor;
  void main() { outColor = vec4(1.0, 0.0, 0.0, 1.0); }
  `;
  const vertex = `#version 300 es
  precision highp float;
  const vec2 POS[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
  void main() { gl_Position = vec4(POS[gl_VertexID], 0.0, 1.0); }
  `;
  try {
    const oldProgram = glProgram;
    const probeProgram = createProgram(vertex, source);
    clearGlErrors();
    gl.useProgram(probeProgram);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    const pixel = new Uint8Array(4);
    gl.readPixels(Math.floor(state.width / 2), Math.floor(state.height / 2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    addGpuDiagnostic(`Probe solid-red pixel RGBA: ${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${pixel[3]}`);
    addGpuDiagnostic(`Probe gl.getError: ${glErrorName(gl.getError())}`);
    gl.deleteProgram(probeProgram);
    glProgram = oldProgram;
    gl.useProgram(glProgram);
  } catch (error) {
    addGpuDiagnostic(`Probe shader failed: ${error.message}`);
  }
}

function addGpuDiagnostic(message) {
  glDiagnostics.push(message);
  console.info(`[GPU] ${message}`);
}

function flushGpuDiagnostics() {
  controls.gpuDiagnostics.textContent = glDiagnostics.join('\\n') || 'No diagnostics.';
}

function clearGlErrors() {
  if (!gl) return;
  while (gl.getError() !== gl.NO_ERROR) {
    // Drain stale errors so diagnostics point at the operation being tested.
  }
}

function glErrorName(error) {
  if (!gl) return String(error);
  const names = new Map([
    [gl.NO_ERROR, 'NO_ERROR'],
    [gl.INVALID_ENUM, 'INVALID_ENUM'],
    [gl.INVALID_VALUE, 'INVALID_VALUE'],
    [gl.INVALID_OPERATION, 'INVALID_OPERATION'],
    [gl.INVALID_FRAMEBUFFER_OPERATION, 'INVALID_FRAMEBUFFER_OPERATION'],
    [gl.OUT_OF_MEMORY, 'OUT_OF_MEMORY'],
    [gl.CONTEXT_LOST_WEBGL, 'CONTEXT_LOST_WEBGL'],
  ]);
  return names.get(error) || `0x${error.toString(16)}`;
}

function getCombiner(type) {
  switch (type) {
    case 'and': return (a, b) => a & b;
    case 'or': return (a, b) => a | b;
    case 'add': return (a, b) => (a + b) & state.valueMask;
    case 'sub': return (a, b) => (a - b) & state.valueMask;
    case 'diff': return (a, b) => Math.abs(a - b) & state.valueMask;
    case 'mul': return (a, b) => (a * b) & state.valueMask;
    case 'min': return (a, b) => Math.min(a, b);
    case 'max': return (a, b) => Math.max(a, b);
    case 'xor':
    default:
      return (a, b) => a ^ b;
  }
}

function makeBuiltinLuts() {
  return {
    spectral: {
      id: 'spectral',
      length: 256,
      points: [
        { id: uid(), index: 0, color: '#00bfff', kind: 'smooth' },
        { id: uid(), index: 43, color: '#00ff80', kind: 'smooth' },
        { id: uid(), index: 85, color: '#ffff30', kind: 'smooth' },
        { id: uid(), index: 128, color: '#ff6030', kind: 'smooth' },
        { id: uid(), index: 170, color: '#ff40b0', kind: 'smooth' },
        { id: uid(), index: 213, color: '#7040ff', kind: 'smooth' },
        { id: uid(), index: 255, color: '#00bfff', kind: 'smooth' },
      ],
    },
    fire: {
      id: 'fire',
      length: 256,
      points: [
        { id: uid(), index: 0, color: '#000000', kind: 'smooth' },
        { id: uid(), index: 56, color: '#4a0900', kind: 'smooth' },
        { id: uid(), index: 120, color: '#dd3d00', kind: 'smooth' },
        { id: uid(), index: 190, color: '#ffd050', kind: 'smooth' },
        { id: uid(), index: 255, color: '#ffffff', kind: 'smooth' },
      ],
    },
    'candy-vga': {
      id: 'candy-vga',
      length: 256,
      points: [
        { id: uid(), index: 0, color: '#ea52b4', kind: 'smooth' },
        { id: uid(), index: 64, color: '#f5d547', kind: 'smooth' },
        { id: uid(), index: 128, color: '#37b9f1', kind: 'smooth' },
        { id: uid(), index: 192, color: '#7be06f', kind: 'smooth' },
        { id: uid(), index: 255, color: '#ea52b4', kind: 'smooth' },
      ],
    },
    mono: {
      id: 'mono',
      length: 256,
      points: [
        { id: uid(), index: 0, color: '#000000', kind: 'smooth' },
        { id: uid(), index: 255, color: '#ffffff', kind: 'smooth' },
      ],
    },
    amber: {
      id: 'amber',
      length: 256,
      points: [
        { id: uid(), index: 0, color: '#000000', kind: 'smooth' },
        { id: uid(), index: 110, color: '#9c4b00', kind: 'smooth' },
        { id: uid(), index: 190, color: '#ffb12c', kind: 'smooth' },
        { id: uid(), index: 255, color: '#fff2a0', kind: 'smooth' },
      ],
    },
  };
}

function buildLut(definition) {
  const length = clampNumber(definition.length, 2, 4096);
  const colors = Array.from({ length }, () => [0, 0, 0]);
  const smoothPoints = definition.points
    .filter((point) => point.kind === 'smooth')
    .map((point) => normalizePoint(point, length))
    .sort((a, b) => a.index - b.index);

  if (smoothPoints.length === 0) {
    for (let i = 0; i < length; i++) colors[i] = [0, 0, 0];
  } else {
    const first = smoothPoints[0];
    const last = smoothPoints[smoothPoints.length - 1];
    for (let i = 0; i <= first.index; i++) colors[i] = hexToRgb(first.color);
    for (let i = last.index; i < length; i++) colors[i] = hexToRgb(last.color);

    for (let s = 0; s < smoothPoints.length - 1; s++) {
      const left = smoothPoints[s];
      const right = smoothPoints[s + 1];
      const span = Math.max(1, right.index - left.index);
      const lc = hexToRgb(left.color);
      const rc = hexToRgb(right.color);
      for (let i = left.index; i <= right.index; i++) {
        const t = (i - left.index) / span;
        colors[i] = [
          Math.round(lerp(lc[0], rc[0], t)),
          Math.round(lerp(lc[1], rc[1], t)),
          Math.round(lerp(lc[2], rc[2], t)),
        ];
      }
    }
  }

  definition.points
    .filter((point) => point.kind === 'hard')
    .map((point) => normalizePoint(point, length))
    .forEach((point) => {
      colors[point.index] = hexToRgb(point.color);
    });

  return colors;
}

function normalizePoint(point, length) {
  return {
    ...point,
    index: clampNumber(point.index, 0, length - 1),
    color: normalizeHex(point.color),
    kind: point.kind === 'hard' ? 'hard' : 'smooth',
  };
}

function renderLutEditor() {
  const palettePreview = buildLut(currentLut);
  const rect = lutCanvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(256, Math.floor(rect.width * dpr));
  const height = Math.max(60, Math.floor(rect.height * dpr));

  if (lutCanvas.width !== width || lutCanvas.height !== height) {
    lutCanvas.width = width;
    lutCanvas.height = height;
  }

  const image = lutCtx.createImageData(width, height);
  for (let x = 0; x < width; x++) {
    const idx = Math.round((x / Math.max(1, width - 1)) * (palettePreview.length - 1));
    const color = palettePreview[idx];
    for (let y = 0; y < height; y++) {
      const p = (y * width + x) * 4;
      image.data[p] = color[0];
      image.data[p + 1] = color[1];
      image.data[p + 2] = color[2];
      image.data[p + 3] = 255;
    }
  }
  lutCtx.putImageData(image, 0, 0);
  renderLutMarkers();
  syncSelectedPointControls();
}

function renderLutMarkers() {
  const length = currentLut.length;
  controls.lutMarkers.replaceChildren(...currentLut.points.map((point) => {
    const normalized = normalizePoint(point, length);
    const marker = document.createElement('button');
    marker.type = 'button';
    marker.className = `lut-marker ${normalized.kind}${point.id === selectedPointId ? ' selected' : ''}`;
    marker.style.left = `${(normalized.index / (length - 1)) * 100}%`;
    marker.style.setProperty('--marker-color', normalized.color);
    marker.title = `${normalized.kind} ${normalized.index} ${normalized.color}`;
    marker.dataset.pointId = point.id;
    marker.addEventListener('pointerdown', onLutMarkerPointerDown);
    return marker;
  }));
}

function onLutCanvasPointerDown(event) {
  if (event.button !== 0) return;
  const index = lutIndexFromClientX(event.clientX);
  addLutPoint('smooth', index);
}

function onLutMarkerPointerDown(event) {
  event.preventDefault();
  event.stopPropagation();
  selectedPointId = event.currentTarget.dataset.pointId;
  lutDrag = { active: true, pointerId: event.pointerId, pointId: selectedPointId };
  window.addEventListener('pointermove', onLutMarkerPointerMove);
  window.addEventListener('pointerup', onLutMarkerPointerUp);
  window.addEventListener('pointercancel', onLutMarkerPointerUp);
  renderLutEditor();
}

function onLutMarkerPointerMove(event) {
  if (!lutDrag.active || event.pointerId !== lutDrag.pointerId) return;
  const point = findPoint(lutDrag.pointId);
  if (!point) return;
  point.index = lutIndexFromClientX(event.clientX);
  updateRendererFromCurrentLut();
  renderLutEditor();
}

function onLutMarkerPointerUp(event) {
  if (!lutDrag.active || event.pointerId !== lutDrag.pointerId) return;
  window.removeEventListener('pointermove', onLutMarkerPointerMove);
  window.removeEventListener('pointerup', onLutMarkerPointerUp);
  window.removeEventListener('pointercancel', onLutMarkerPointerUp);
  lutDrag = { active: false, pointerId: null, pointId: null };
  renderLutEditor();
}

function lutIndexFromClientX(clientX) {
  const rect = lutCanvas.getBoundingClientRect();
  const t = clamp((clientX - rect.left) / rect.width, 0, 1);
  return Math.round(t * (currentLut.length - 1));
}

function addLutPoint(kind, index = Math.floor((currentLut.length - 1) / 2)) {
  const color = rgbToHex(buildLut(currentLut)[clampNumber(index, 0, currentLut.length - 1)]);
  const point = {
    id: uid(),
    index: clampNumber(index, 0, currentLut.length - 1),
    color,
    kind,
  };
  currentLut.points.push(point);
  selectedPointId = point.id;
  updateRendererFromCurrentLut();
  renderLutEditor();
}

function updateSelectedPointFromControls() {
  const point = findPoint(selectedPointId);
  if (!point) return;
  point.index = clampNumber(controls.pointIndex.value, 0, currentLut.length - 1);
  point.color = normalizeHex(controls.pointColor.value);
  point.kind = controls.pointKind.value === 'hard' ? 'hard' : 'smooth';
  updateRendererFromCurrentLut();
  renderLutEditor();
}

function deleteSelectedPoint() {
  const point = findPoint(selectedPointId);
  if (!point) return;
  const smoothCount = currentLut.points.filter((item) => item.kind === 'smooth').length;
  if (point.kind === 'smooth' && smoothCount <= 2) return;
  currentLut.points = currentLut.points.filter((item) => item.id !== selectedPointId);
  selectedPointId = currentLut.points[0]?.id ?? null;
  updateRendererFromCurrentLut();
  renderLutEditor();
}

function applyLutLength() {
  const previousMax = Math.max(1, currentLut.length - 1);
  const nextLength = clampNumber(controls.lutLength.value, 2, 4096);
  currentLut.points.forEach((point) => {
    const t = point.index / previousMax;
    point.index = Math.round(t * (nextLength - 1));
  });
  currentLut.length = nextLength;
  controls.pointIndex.max = String(nextLength - 1);
  updateRendererFromCurrentLut();
  renderLutEditor();
}

function applyCurrentLutToRenderer() {
  currentLut.id = sanitizeLutId(controls.lutId.value);
  lutLibrary[currentLut.id] = cloneLut(currentLut);
  state.paletteId = currentLut.id;
  updateRendererFromCurrentLut();
  refreshPaletteSelect();
}

function updateRendererFromCurrentLut() {
  palette = buildLut(currentLut);
  uploadLutTexture();
  renderFrame();
}

function syncGeneratorReadouts() {
  controls.lutBaseHueOut.value = `${controls.lutBaseHue.value} deg`;
  controls.lutDetailOut.value = controls.lutDetail.value;
  controls.lutContrastOut.value = `${controls.lutContrast.value}%`;
}

function renderGeneratorParams() {
  const definitions = LUT_GENERATOR_CONTROLS[controls.lutGenerator.value] ?? [];
  controls.lutGeneratorParams.replaceChildren(...definitions.map(createGeneratorParamControl));
}

function createGeneratorParamControl(definition) {
  const label = labelWrap('');
  label.className = definition.type === 'select' || definition.type === 'color' ? 'generator-field' : 'generator-control';
  label.dataset.generatorParam = definition.key;

  const caption = el('span', {}, definition.label);
  let input;
  let output = null;
  if (definition.type === 'select') {
    input = document.createElement('select');
    initSelect(input, definition.options, definition.value);
  } else if (definition.type === 'color') {
    input = document.createElement('input');
    input.type = 'color';
    input.value = definition.value;
  } else {
    input = document.createElement('input');
    input.type = 'range';
    input.min = definition.min;
    input.max = definition.max;
    input.step = definition.step;
    input.value = definition.value;
    output = document.createElement('output');
    output.value = String(definition.value);
  }
  input.dataset.generatorParamInput = definition.key;
  input.addEventListener(definition.type === 'select' ? 'change' : 'input', () => {
    if (output) output.value = input.value;
    generateCurrentLut();
  });
  label.append(caption, input);
  if (output) label.appendChild(output);
  return label;
}

function generatorParamValue(key, fallback) {
  const input = controls.lutGeneratorParams.querySelector(`[data-generator-param-input="${key}"]`);
  if (!input) return fallback;
  return input.type === 'range' || input.type === 'number' ? Number(input.value) : input.value;
}

function generateCurrentLut() {
  syncGeneratorReadouts();
  const options = {
    type: controls.lutGenerator.value,
    seed: clampNumber(controls.lutSeed.value, 0, 999999),
    baseHue: clampNumber(controls.lutBaseHue.value, 0, 359),
    detail: clampNumber(controls.lutDetail.value, 2, 32),
    contrast: clampNumber(controls.lutContrast.value, 0, 100) / 100,
    length: clampNumber(controls.lutLength.value, 2, 4096),
    preset: generatorParamValue('preset', 'fire'),
    turns: generatorParamValue('turns', 2),
    mirrorMode: generatorParamValue('mirrorMode', 'complement'),
    shift: generatorParamValue('shift', 60),
    bitMode: generatorParamValue('bitMode', 'highHue'),
    bands: generatorParamValue('bands', 8),
    hardness: generatorParamValue('hardness', 100) / 100,
    diverge: generatorParamValue('diverge', 'blueRed'),
    lumaPower: generatorParamValue('lumaPower', 100) / 100,
    startColor: generatorParamValue('startColor', '#07111f'),
    midColor: generatorParamValue('midColor', '#24c8db'),
    endColor: generatorParamValue('endColor', '#fff4b8'),
    chaosR: generatorParamValue('chaosR', 382) / 100,
    harmonics: generatorParamValue('harmonics', 3),
    roughness: generatorParamValue('roughness', 55) / 100,
    easeMode: generatorParamValue('easeMode', 'smooth'),
  };
  const generated = generateLutDefinition(options);
  currentLut = generated;
  selectedPointId = currentLut.points[0]?.id ?? null;
  syncLutControls();
  updateRendererFromCurrentLut();
  renderLutEditor();
}

function generateLutDefinition(options) {
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
  const patterns = [
    [0, 180],
    [-28, 0, 28],
    [0, 120, 240],
    [0, 60, 180, 240],
    [0, 150, 210],
  ];
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

function hsvToHex(hue, saturation, value) {
  const h = ((hue % 360) + 360) % 360 / 60;
  const s = clamp(saturation / 100, 0, 1);
  const v = clamp(value / 100, 0, 1);
  const c = v * s;
  const x = c * (1 - Math.abs((h % 2) - 1));
  const m = v - c;
  let rgb = [0, 0, 0];
  if (h < 1) rgb = [c, x, 0];
  else if (h < 2) rgb = [x, c, 0];
  else if (h < 3) rgb = [0, c, x];
  else if (h < 4) rgb = [0, x, c];
  else if (h < 5) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return rgbToHex(rgb.map((channel) => (channel + m) * 255));
}

function popcount(value) {
  let n = value >>> 0;
  let count = 0;
  while (n) {
    count += n & 1;
    n >>>= 1;
  }
  return count;
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

function mulberry32(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function saveLutJson() {
  currentLut.id = sanitizeLutId(controls.lutId.value);
  const normalized = exportLut(currentLut);
  const blob = new Blob([JSON.stringify(normalized, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.download = `${normalized.id}.json`;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}

function syncLutControls() {
  controls.lutId.value = currentLut.id;
  controls.lutLength.value = currentLut.length;
  controls.pointIndex.max = String(currentLut.length - 1);
  syncSelectedPointControls();
}

function syncSelectedPointControls() {
  const point = findPoint(selectedPointId);
  controls.pointEditor.classList.toggle('disabled', !point);
  if (!point) return;
  const normalized = normalizePoint(point, currentLut.length);
  controls.pointIndex.max = String(currentLut.length - 1);
  controls.pointIndex.value = normalized.index;
  controls.pointColor.value = normalized.color;
  controls.pointKind.value = normalized.kind;
}

function findPoint(id) {
  return currentLut.points.find((point) => point.id === id);
}

function exportLut(definition) {
  const normalizedPoints = definition.points
    .map((point) => normalizePoint(point, definition.length))
    .sort((a, b) => a.index - b.index || a.kind.localeCompare(b.kind));
  return {
    version: 1,
    id: sanitizeLutId(definition.id),
    length: clampNumber(definition.length, 2, 4096),
    gradientStops: normalizedPoints
      .filter((point) => point.kind === 'smooth')
      .map(({ index, color }) => ({ index, color })),
    pointOverrides: normalizedPoints
      .filter((point) => point.kind === 'hard')
      .map(({ index, color }) => ({ index, color })),
  };
}

function cloneLut(definition) {
  return {
    id: definition.id,
    length: definition.length,
    points: definition.points.map((point) => ({ ...point, id: uid() })),
  };
}

function randomize() {
  const combineKeys = Object.keys(COMBINE_TYPES);
  const paletteKeys = Object.keys(lutLibrary);
  state.gradients.forEach((gradient, index) => {
    const type = pick(FIELD_IDS);
    state.gradients[index] = {
      ...DEFAULT_GRADIENT,
      type,
      scale: randomInt(2, 80),
      offset: randomInt(0, state.valueMask),
      offsetSpeed: randomInt(-80, 80),
      originX: Math.random(),
      originY: Math.random(),
      originAmpX: Math.random() * 0.25,
      originAmpY: Math.random() * 0.25,
      originSpeedX: Math.random() * 2 - 1,
      originSpeedY: Math.random() * 2 - 1,
      angle: randomInt(0, 359),
      rotationSpeed: randomInt(-40, 40),
      freq1: randomInt(6, 60),
      freq2: randomInt(6, 60),
      phaseSpeed: Math.random() * 4 - 2,
      warp: Math.random() * 5,
      seed: randomInt(1, 999),
    };
    renderGradientPanel(index);
  });
  state.combine = pick(combineKeys);
  state.paletteId = pick(paletteKeys);
  currentLut = cloneLut(lutLibrary[state.paletteId]);
  palette = buildLut(currentLut);
  selectedPointId = currentLut.points[0]?.id ?? null;
  uploadLutTexture();
  syncControls();
  syncLutControls();
  renderLutEditor();
  requestRender();
}

function syncControls() {
  controls.combine.value = state.combine;
  controls.gradientWrapMode.value = state.gradientWrapMode;
  controls.palette.value = state.paletteId;
  controls.timeScale.value = Math.round(state.timeScale * 100);
  controls.valueBits.value = String(state.valueBits);
  controls.cycleSeconds.value = state.cycleSeconds;
  controls.paletteOffset.max = String(state.valueMask);
  updateReadouts();
}

function updateReadouts() {
  controls.cycleSecondsOut.value = state.cycleSeconds === 0 ? 'off' : `${state.cycleSeconds}s`;
  controls.paletteOffsetOut.value = Math.floor(state.paletteOffset);
  controls.timeScaleOut.value = `${Math.round(state.timeScale * 100)}%`;
  const preview = state.previewMode === 'final' ? 'FINAL' : state.previewMode.toUpperCase();
  readout.textContent = `${state.width} x ${state.height} | ${state.valueBits}BIT | ${state.rendererActual.toUpperCase()} | ${preview} | zoom ${view.scale.toFixed(2)}x | ${FIELD_TYPES[state.gradients[0].type]} ${COMBINE_TYPES[state.combine]} ${FIELD_TYPES[state.gradients[1].type]} | LUT ${state.paletteId}`;
}

function savePng() {
  renderFrame();
  const link = document.createElement('a');
  link.download = `visual-experiment-${state.width}x${state.height}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function clampNumber(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function wrapRange(value) {
  return ((Number(value) % state.valueRange) + state.valueRange) % state.valueRange;
}

function clampByte(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function hexToRgb(hex) {
  const normalized = normalizeHex(hex).slice(1);
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ];
}

function rgbToHsv(rgb) {
  const r = rgb[0] / 255;
  const g = rgb[1] / 255;
  const b = rgb[2] / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let hue = 0;
  if (delta !== 0) {
    if (max === r) hue = 60 * (((g - b) / delta) % 6);
    else if (max === g) hue = 60 * ((b - r) / delta + 2);
    else hue = 60 * ((r - g) / delta + 4);
  }
  return [
    (hue + 360) % 360,
    max === 0 ? 0 : (delta / max) * 100,
    max * 100,
  ];
}

function rgbToHex(rgb) {
  return `#${rgb.map((value) => clampByte(value).toString(16).padStart(2, '0')).join('')}`;
}

function normalizeHex(value) {
  const raw = String(value || '').trim();
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase();
  return '#000000';
}

function sanitizeLutId(value) {
  const id = String(value || 'custom-lut').trim().toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/^-+|-+$/g, '');
  return id || 'custom-lut';
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : Number(value).toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}

function uid() {
  return `p${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
