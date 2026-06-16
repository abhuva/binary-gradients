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
  paletteId: 'spectral',
  paletteOffset: 0,
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
  COMMON_CONTROLS.forEach((control) => panel.appendChild(createGradientControl(index, control)));

  const specific = SPECIFIC_CONTROLS[gradient.type] ?? [];
  if (specific.length > 0) {
    panel.appendChild(el('h2', { className: 'subhead' }, FIELD_TYPES[gradient.type]));
    specific.forEach((control) => panel.appendChild(createGradientControl(index, control)));
  }
}

function createGradientControl(index, control) {
  const gradient = state.gradients[index];
  const resolved = resolveControl(control);
  const label = labelWrap(`${control.label} `);
  const output = document.createElement('output');
  output.value = formatNumber(gradient[control.key]);
  label.appendChild(output);

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
  label.appendChild(input);
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
    state.paletteOffset = wrapRange(state.paletteOffset + dt * state.valueRange / state.cycleSeconds);
    controls.paletteOffset.value = Math.floor(state.paletteOffset);
    animated = true;
  }

  if (animated || needsStaticRender) renderFrame();
  requestAnimationFrame(tick);
}

function hasGradientAnimation() {
  return state.gradients.some((g) => g.offsetSpeed || g.rotationSpeed || g.originSpeedX || g.originSpeedY || g.phaseSpeed || g.driftX || g.driftY);
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
  uniform int u_preview;
  uniform int u_type1;
  uniform int u_type2;
  uniform float u_g1[22];
  uniform float u_g2[22];
  uniform sampler2D u_lut;
  out vec4 outColor;

  float wrapValue(float v) { return mod(floor(v), u_valueRange); }
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
  requestRender();
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
  return ((Math.floor(value) % state.valueRange) + state.valueRange) % state.valueRange;
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
