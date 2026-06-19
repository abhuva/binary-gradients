import { normalizeHex } from './domain/color.js';
import { advancePaletteCycleState, wrapPaletteOffset } from './domain/palette-cycle.js';
import {
  createPreset,
  createPresetCollection,
  mergePresetLibraries,
  normalizePreset,
  normalizePresetCollection,
  parsePresetPayload,
  PRESET_STORAGE_KEY,
  serializePreset,
  serializePresetCollection,
} from './domain/presets.js';
import {
  COMBINE_MODIFIER_IDS,
  COMBINE_MODIFIER_TYPES,
  COMBINE_OPERATION_IDS,
  COMBINE_OPERATION_TYPES,
  DEFAULT_GRADIENT,
  FIELD_IDS,
  FIELD_TYPES,
  GRADIENT_WRAP_TYPES,
  normalizeGradientDefinition,
} from './domain/registries.js';
import { pick, randomInt } from './domain/random.js';
import { createInitialState, previewModeForActiveTab, resolveValueDepth } from './domain/state.js';
import { clampNumber } from './domain/value-range.js';
import { makeBuiltinLuts } from './lut/builtins.js';
import { generateLutDefinition, LUT_GENERATOR_CONTROLS, LUT_GENERATOR_TYPES } from './lut/generators.js';
import { buildLut, cloneLut, exportLut, sanitizeLutId } from './lut/model.js';
import { createWebGlRenderer } from './render/webgl-renderer.js';
import { bindControls, el, initSelect, labelWrap } from './ui/dom.js';
import { renderGradientPanel } from './ui/gradient-panel.js';
import { createLutEditor } from './ui/lut-editor.js';
import { createViewportController } from './ui/viewport.js';
import { createWikiPanel } from './ui/wiki-panel.js';
import { createWikiLoader } from './wiki/wiki-loader.js';

const canvas = document.querySelector('#canvas');
const viewport = document.querySelector('#viewport');
const readout = document.querySelector('#readout');
const wikiPanelElement = document.querySelector('#wikiPanel');
const controls = bindControls();
const state = createInitialState();
const STARTUP_WIKI_ID = 'welcome';
const BUILTIN_PRESET_COLLECTION_URL = './presets/builtin-presets.json';

let renderer = null;
let glDiagnostics = [];
let lutLibrary = makeBuiltinLuts();
let currentLut = cloneLut(lutLibrary[state.paletteId]);
let palette = buildLut(currentLut);
let builtInPresets = [];
let userPresets = [];
let selectedPresetId = '';
let activePresetTag = 'all';
let presetSearchTerm = '';
let selectedPointId = currentLut.points[0]?.id ?? null;
let lastTime = performance.now();
let fpsSampleStart = lastTime;
let fpsFrameCount = 0;
let currentFps = 0;
let renderQueued = false;
let needsStaticRender = true;
let viewportController = null;
let lutEditor = null;
let wikiPanel = null;
let presentationMode = false;
let savedViewportView = null;
let presentationHideTimer = null;

initSelect(controls.paletteWrapMode, GRADIENT_WRAP_TYPES, state.paletteWrapMode);
initSelect(controls.fieldWrapMode, GRADIENT_WRAP_TYPES, state.fieldWrapMode);
initSelect(controls.lutGenerator, LUT_GENERATOR_TYPES, 'harmony');
refreshPaletteSelect();
setupRenderer();
viewportController = createViewportController({
  viewport,
  canvas,
  getSize: () => ({ width: state.width, height: state.height }),
  onChange: updateReadouts,
});
lutEditor = createLutEditor({
  lutCanvas: document.querySelector('#lutCanvas'),
  lutMarkers: controls.lutMarkers,
  pointEditor: controls.pointEditor,
  pointIndex: controls.pointIndex,
  pointColor: controls.pointColor,
  pointKind: controls.pointKind,
  getLut: () => currentLut,
  getSelectedPointId: () => selectedPointId,
  setSelectedPointId: (id) => { selectedPointId = id; },
  onChange: updateRendererFromCurrentLut,
});
wikiPanel = createWikiPanel({
  panel: wikiPanelElement,
  loader: createWikiLoader(),
});
wikiPanel.enhance(document);
wireControls();
renderGradientPanels();
syncLutControls();
setValueBits(state.valueBits);
applyWindowSize();
userPresets = readStoredPresetCollection().presets;
refreshPresetBrowser();
loadBuiltInPresetCollection();
lutEditor.render();
requestAnimationFrame(tick);
requestAnimationFrame(() => {
  viewportController.reset();
  wikiPanel.open(STARTUP_WIKI_ID);
});

function setupRenderer() {
  glDiagnostics = [];
  try {
    renderer = createWebGlRenderer(canvas, { onDiagnostic: addGpuDiagnostic });
    state.rendererActual = 'webgl';
    renderer.uploadLutTexture(palette, state.valueRange);
    addGpuDiagnostic('WebGL2 renderer initialized.');
  } catch (error) {
    renderer = null;
    state.rendererActual = 'webgl error';
    addGpuDiagnostic(error.message);
    console.error('WebGL2 renderer failed.', error);
    flushGpuDiagnostics();
  }
}

function wireControls() {
  controls.tabButtons.forEach((button) => button.addEventListener('click', () => setTab(button.dataset.tab)));
  controls.savePreset.addEventListener('click', saveCurrentPreset);
  controls.presetSearch.addEventListener('input', () => {
    presetSearchTerm = controls.presetSearch.value.trim().toLowerCase();
    refreshPresetBrowser();
  });
  controls.presetBrowser.addEventListener('click', handlePresetBrowserClick);
  controls.presetTagFilters.addEventListener('click', handlePresetTagClick);
  controls.deletePreset.addEventListener('click', deleteSelectedPreset);
  controls.exportPresetCollection.addEventListener('click', exportUserPresetCollection);
  controls.exportPreset.addEventListener('click', exportSelectedPreset);
  controls.importPreset.addEventListener('click', () => controls.importPresetFile.click());
  controls.importPresetFile.addEventListener('change', importPresetFile);
  controls.gradientPreviewToggles.forEach((toggle, index) => {
    toggle.addEventListener('change', () => {
      state.gradientPreviewEnabled[index] = toggle.checked;
      syncPreviewMode();
      requestRender();
    });
  });
  controls.combineOperationButtons.forEach((button) => {
    button.addEventListener('click', () => {
      state.combineOperation = button.dataset.combineOperation;
      syncCombineControls();
      requestRender();
    });
  });
  controls.combineModifierButtons.forEach((button) => {
    button.addEventListener('click', () => {
      state.combineModifier = button.dataset.combineModifier;
      syncCombineControls();
      requestRender();
    });
  });

  controls.applySize.addEventListener('click', () => {
    state.width = clampNumber(controls.width.value, 16, 8192);
    state.height = clampNumber(controls.height.value, 16, 8192);
    controls.width.value = state.width;
    controls.height.value = state.height;
    resizeBuffers();
    viewportController.reset();
    requestRender();
  });
  controls.useWindowSize.addEventListener('click', applyWindowSize);
  controls.valueBits.addEventListener('change', () => setValueBits(Number(controls.valueBits.value)));
  controls.resetView.addEventListener('click', () => viewportController.reset());
  controls.enterPresentation.addEventListener('click', enterPresentationMode);
  controls.presentationExit.addEventListener('click', exitPresentationMode);

  controls.timeScale.addEventListener('input', () => {
    state.timeScale = Number(controls.timeScale.value) / 100;
    updateReadouts();
  });
  controls.paletteWrapMode.addEventListener('change', () => {
    state.paletteWrapMode = controls.paletteWrapMode.value;
    syncPaletteCycleDirection();
    requestRender();
  });
  controls.fieldWrapMode.addEventListener('change', () => {
    state.fieldWrapMode = controls.fieldWrapMode.value;
    requestRender();
  });
  controls.toggleTime.addEventListener('click', () => {
    state.timeRunning = !state.timeRunning;
    controls.toggleTime.textContent = state.timeRunning ? 'pause' : 'resume';
  });
  controls.resetTime.addEventListener('click', () => {
    state.time = 0;
    requestRender();
  });
  controls.runGpuDiagnostics.addEventListener('click', runGpuDiagnostics);

  controls.combineShift.addEventListener('input', () => {
    state.combineShift = clampNumber(controls.combineShift.value, 0, 8);
    syncCombineControls();
    requestRender();
  });
  controls.palette.addEventListener('change', () => {
    state.paletteId = controls.palette.value;
    currentLut = cloneLut(lutLibrary[state.paletteId]);
    palette = buildLut(currentLut);
    selectedPointId = currentLut.points[0]?.id ?? null;
    uploadLutTexture();
    syncLutControls();
    lutEditor.render();
    requestRender();
  });
  controls.cycleSeconds.addEventListener('input', () => {
    state.cycleSeconds = Number(controls.cycleSeconds.value);
    updateReadouts();
  });
  controls.paletteOffset.addEventListener('input', () => {
    setPaletteOffset(Number(controls.paletteOffset.value));
  });
  controls.paletteOffsetDown.addEventListener('click', () => stepPaletteOffset(-1));
  controls.paletteOffsetUp.addEventListener('click', () => stepPaletteOffset(1));
  controls.toggleAnimation.addEventListener('click', () => {
    state.paletteRunning = !state.paletteRunning;
    controls.toggleAnimation.textContent = state.paletteRunning ? 'Pause Palette' : 'Resume Palette';
  });

  controls.randomize.addEventListener('click', randomize);
  controls.savePng.addEventListener('click', savePng);

  controls.lutId.addEventListener('input', () => {
    currentLut.id = sanitizeLutId(controls.lutId.value);
  });
  controls.lutLength.addEventListener('change', applyLutLength);
  document.querySelectorAll('[data-lut-length-preset]').forEach((button) => {
    button.addEventListener('click', () => {
      controls.lutLength.value = button.dataset.lutLengthPreset;
      applyLutLength();
    });
  });
  controls.lutGenerator.addEventListener('change', () => {
    renderGeneratorParams();
    syncGeneratorHelp();
    generateCurrentLut();
  });
  controls.lutGeneratorHelp.addEventListener('click', () => {
    wikiPanel?.open(generatorWikiId(controls.lutGenerator.value));
  });
  controls.lutBaseHue.addEventListener('input', generateCurrentLut);
  controls.lutDetail.addEventListener('input', generateCurrentLut);
  controls.lutContrast.addEventListener('input', generateCurrentLut);
  controls.generateLut.addEventListener('click', generateCurrentLut);
  controls.randomizeLutSeed.addEventListener('click', () => {
    controls.lutSeed.value = String(randomInt(0, 999999));
    generateCurrentLut();
  });
  controls.addSmoothPoint.addEventListener('click', () => lutEditor.addPoint('smooth'));
  controls.addHardPoint.addEventListener('click', () => lutEditor.addPoint('hard'));
  controls.pointIndex.addEventListener('input', lutEditor.updateSelectedPointFromControls);
  controls.pointColor.addEventListener('input', lutEditor.updateSelectedPointFromControls);
  controls.pointKind.addEventListener('change', lutEditor.updateSelectedPointFromControls);
  controls.deletePoint.addEventListener('click', lutEditor.deleteSelectedPoint);
  controls.applyLutToRenderer.addEventListener('click', applyCurrentLutToRenderer);
  controls.saveLutJson.addEventListener('click', saveLutJson);

  window.addEventListener('keydown', () => {
    if (presentationMode) exitPresentationMode();
  });
  window.addEventListener('mousemove', showPresentationControl);
  window.addEventListener('resize', () => {
    if (presentationMode) {
      viewportController.fitToViewport();
    } else {
      viewportController.reset();
    }
    lutEditor.render();
  });
  syncCombineControls();
  updateReadouts();
  syncGeneratorReadouts();
  renderGeneratorParams();
  syncGeneratorHelp();
}

function applyWindowSize() {
  state.width = clampNumber(window.innerWidth, 16, 8192);
  state.height = clampNumber(window.innerHeight, 16, 8192);
  controls.width.value = state.width;
  controls.height.value = state.height;
  resizeBuffers();
  viewportController.reset();
  requestRender();
}

function enterPresentationMode() {
  if (presentationMode) return;
  presentationMode = true;
  savedViewportView = viewportController.getView();
  document.body.classList.add('presentation-mode');
  viewportController.setInteractionEnabled(false);
  requestAnimationFrame(() => {
    viewportController.fitToViewport();
    showPresentationControl();
  });
}

function exitPresentationMode() {
  if (!presentationMode) return;
  presentationMode = false;
  clearTimeout(presentationHideTimer);
  presentationHideTimer = null;
  document.body.classList.remove('presentation-mode', 'presentation-controls-visible');
  viewportController.setInteractionEnabled(true);
  if (savedViewportView) viewportController.setView(savedViewportView);
  savedViewportView = null;
  lutEditor.render();
  updateReadouts();
}

function showPresentationControl() {
  if (!presentationMode) return;
  document.body.classList.add('presentation-controls-visible');
  clearTimeout(presentationHideTimer);
  presentationHideTimer = setTimeout(() => {
    document.body.classList.remove('presentation-controls-visible');
  }, 2000);
}

function saveCurrentPreset() {
  const preset = createPreset({
    name: controls.presetName.value,
    description: controls.presetDescription.value,
    tags: controls.presetTags.value,
    state,
    currentLut,
  });
  userPresets = upsertPreset(userPresets, preset);
  selectedPresetId = preset.id;
  writeStoredPresetCollection();
  refreshPresetBrowser();
  setPresetStatus(`Saved "${preset.name}".`);
}

function deleteSelectedPreset() {
  const preset = selectedPreset();
  if (!preset) return;
  if (preset.source !== 'user') {
    setPresetStatus('Built-in presets cannot be deleted. Save a user version first.');
    return;
  }
  userPresets = userPresets.filter((item) => item.id !== preset.id);
  selectedPresetId = '';
  writeStoredPresetCollection();
  refreshPresetBrowser();
  setPresetStatus(`Deleted "${preset.name}".`);
}

function exportUserPresetCollection() {
  const collection = createPresetCollection({
    name: 'Binary Gradients User Presets',
    description: 'User preset collection exported from binary-gradients.',
    presets: userPresets,
  }, presetMaxTextureSize());
  const blob = new Blob([serializePresetCollection(collection, presetMaxTextureSize())], { type: 'application/json' });
  const link = document.createElement('a');
  link.download = 'binary-gradients-presets.json';
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
  setPresetStatus(`Exported ${collection.presets.length} user preset${collection.presets.length === 1 ? '' : 's'}.`);
}

function exportSelectedPreset() {
  const preset = selectedPreset();
  if (!preset) return;
  const blob = new Blob([serializePreset(preset)], { type: 'application/json' });
  const link = document.createElement('a');
  link.download = `${preset.id}.json`;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
  setPresetStatus(`Exported "${preset.name}".`);
}

async function importPresetFile() {
  const file = controls.importPresetFile.files?.[0];
  if (!file) return;
  try {
    const payload = parsePresetPayload(await file.text(), presetMaxTextureSize());
    if (payload.type === 'collection') {
      userPresets = upsertPresets(userPresets, payload.collection.presets);
      selectedPresetId = payload.collection.presets.at(-1)?.id ?? selectedPresetId;
      writeStoredPresetCollection();
      refreshPresetBrowser();
      setPresetStatus(`Imported ${payload.collection.presets.length} preset${payload.collection.presets.length === 1 ? '' : 's'} from "${payload.collection.name}".`);
    } else {
      userPresets = upsertPreset(userPresets, payload.preset);
      selectedPresetId = payload.preset.id;
      writeStoredPresetCollection();
      refreshPresetBrowser();
      setPresetStatus(`Imported "${payload.preset.name}".`);
    }
  } catch (error) {
    console.error('Preset import failed.', error);
    setPresetStatus('Import failed. File is not a valid preset or collection JSON.');
  } finally {
    controls.importPresetFile.value = '';
  }
}

function applyPreset(rawPreset) {
  const preset = normalizePreset(rawPreset, presetMaxTextureSize());
  const presetState = preset.state;
  state.width = presetState.width;
  state.height = presetState.height;
  controls.width.value = state.width;
  controls.height.value = state.height;
  setValueBits(presetState.valueBits);
  state.time = presetState.time;
  state.timeScale = presetState.timeScale;
  state.timeRunning = presetState.timeRunning;
  state.combineOperation = presetState.combineOperation;
  state.combineModifier = presetState.combineModifier;
  state.combineShift = presetState.combineShift;
  state.fieldWrapMode = presetState.fieldWrapMode;
  state.paletteWrapMode = presetState.paletteWrapMode;
  state.paletteOffset = wrapRange(presetState.paletteOffset);
  state.paletteCycleDirection = presetState.paletteCycleDirection;
  state.cycleSeconds = presetState.cycleSeconds;
  state.paletteRunning = presetState.paletteRunning;
  state.gradients = presetState.gradients.map((gradient) => normalizeGradientDefinition(gradient));

  currentLut = cloneLut(preset.lut);
  lutLibrary[currentLut.id] = cloneLut(currentLut);
  state.paletteId = currentLut.id;
  palette = buildLut(currentLut);
  selectedPointId = currentLut.points[0]?.id ?? null;

  syncPaletteCycleDirection();
  uploadLutTexture();
  resizeBuffers();
  viewportController.reset();
  renderGradientPanels();
  refreshPaletteSelect();
  syncControls();
  syncLutControls();
  lutEditor.render();
  requestRender();
}

async function loadBuiltInPresetCollection() {
  try {
    const response = await fetch(BUILTIN_PRESET_COLLECTION_URL, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const collection = normalizePresetCollection(await response.json(), presetMaxTextureSize());
    builtInPresets = collection.presets;
    refreshPresetBrowser();
    setPresetStatus(`Loaded ${builtInPresets.length} built-in preset${builtInPresets.length === 1 ? '' : 's'}.`);
  } catch (error) {
    console.warn('Built-in presets could not be loaded.', error);
    setPresetStatus('Built-in presets unavailable. Showing local user presets.');
  }
}

function readStoredPresetCollection() {
  try {
    return normalizePresetCollection(JSON.parse(localStorage.getItem(PRESET_STORAGE_KEY) || '[]'), presetMaxTextureSize());
  } catch (error) {
    console.error('Stored presets could not be read.', error);
    return createPresetCollection({ name: 'User Presets', presets: [] }, presetMaxTextureSize());
  }
}

function writeStoredPresetCollection() {
  try {
    const collection = createPresetCollection({
      name: 'Binary Gradients User Presets',
      description: 'User presets saved in this browser.',
      presets: userPresets,
    }, presetMaxTextureSize());
    localStorage.setItem(PRESET_STORAGE_KEY, serializePresetCollection(collection, presetMaxTextureSize()));
  } catch (error) {
    console.error('Stored presets could not be written.', error);
    setPresetStatus('Save failed. Browser storage is unavailable or full.');
  }
}

function refreshPresetBrowser() {
  const allPresets = mergedPresets();
  const tags = availablePresetTags(allPresets);
  renderPresetTagFilters(tags);
  const visiblePresets = allPresets.filter(presetMatchesFilters);
  controls.presetBrowser.replaceChildren(...visiblePresets.map(renderPresetCard));
  if (!visiblePresets.length) {
    controls.presetBrowser.appendChild(el('p', { className: 'hint' }, 'No presets match the current filters.'));
  }
  syncPresetSelection();
}

function syncPresetSelection() {
  const preset = selectedPreset();
  controls.deletePreset.disabled = !preset || preset.source !== 'user';
  controls.exportPreset.disabled = !preset;
  controls.exportPresetCollection.disabled = userPresets.length === 0;
  if (preset) {
    controls.presetName.value = preset.name;
    controls.presetTags.value = preset.tags.join(', ');
    controls.presetDescription.value = preset.description;
    setPresetStatus(`Selected "${preset.name}".`);
  } else {
    controls.deletePreset.disabled = true;
    setPresetStatus(mergedPresets().length ? 'Select a preset.' : 'No presets available.');
  }
}

function selectedPreset() {
  return mergedPresets().find((preset) => preset.id === selectedPresetId) ?? null;
}

function setPresetStatus(message) {
  controls.presetStatus.textContent = message;
}

function upsertPreset(items, preset) {
  const index = items.findIndex((item) => item.id === preset.id);
  if (index === -1) return [...items, preset];
  return items.map((item, itemIndex) => (itemIndex === index ? preset : item));
}

function upsertPresets(items, nextPresets) {
  return nextPresets.reduce((result, preset) => upsertPreset(result, preset), items);
}

function mergedPresets() {
  return mergePresetLibraries({ builtIn: builtInPresets, user: userPresets });
}

function availablePresetTags(presets) {
  return [...new Set(presets.flatMap((preset) => preset.tags))].sort();
}

function renderPresetTagFilters(tags) {
  const buttons = [
    renderTagButton('all', 'All'),
    ...tags.map((tag) => renderTagButton(tag, tag)),
  ];
  controls.presetTagFilters.replaceChildren(...buttons);
}

function renderTagButton(tag, label) {
  const button = el('button', { className: 'tag-filter-button', type: 'button', dataset: { presetTag: tag } }, label);
  button.classList.toggle('active', activePresetTag === tag);
  return button;
}

function presetMatchesFilters(preset) {
  const tagMatch = activePresetTag === 'all' || preset.tags.includes(activePresetTag);
  if (!tagMatch) return false;
  if (!presetSearchTerm) return true;
  const haystack = [preset.name, preset.description, preset.source, ...preset.tags].join(' ').toLowerCase();
  return haystack.includes(presetSearchTerm);
}

function renderPresetCard(preset) {
  const card = el('button', {
    className: 'preset-card',
    type: 'button',
    dataset: { presetId: preset.id },
  });
  card.classList.toggle('active', preset.id === selectedPresetId);
  const title = el('span', { className: 'preset-card-title' }, preset.name);
  const source = el('span', { className: `preset-source preset-source-${preset.source}` }, preset.source);
  const description = el('span', { className: 'preset-card-description' }, preset.description || 'No description.');
  const tagLine = el('span', { className: 'preset-card-tags' }, preset.tags.length ? preset.tags.join(' · ') : 'untagged');
  card.append(title, source, description, tagLine);
  return card;
}

function handlePresetBrowserClick(event) {
  const card = event.target.closest('[data-preset-id]');
  if (!card) return;
  const preset = mergedPresets().find((item) => item.id === card.dataset.presetId);
  if (!preset) return;
  selectedPresetId = preset.id;
  applyPreset(preset);
  refreshPresetBrowser();
  setPresetStatus(`Loaded "${preset.name}".`);
}

function handlePresetTagClick(event) {
  const button = event.target.closest('[data-preset-tag]');
  if (!button) return;
  activePresetTag = button.dataset.presetTag;
  refreshPresetBrowser();
}

function presetMaxTextureSize() {
  return renderer ? renderer.getMaxTextureSize() : Infinity;
}

function setTab(tabName) {
  state.activeTab = tabName;
  controls.tabButtons.forEach((button) => button.classList.toggle('active', button.dataset.tab === tabName));
  controls.tabPanels.forEach((panel) => panel.classList.toggle('active', panel.id === `${tabName}Tab`));
  document.body.classList.toggle('lut-dock-active', tabName === 'lut');
  if (tabName === 'lut') requestAnimationFrame(() => lutEditor.render());
  syncPreviewMode();
  requestRender();
}

function syncPreviewMode() {
  state.previewMode = previewModeForActiveTab(state.activeTab, state.gradientPreviewEnabled);
}

function setValueBits(bits) {
  const previousBits = state.valueBits;
  const maxTextureSize = renderer ? renderer.getMaxTextureSize() : Infinity;
  const resolved = resolveValueDepth(bits, maxTextureSize);
  state.valueBits = resolved.valueBits;
  state.valueRange = resolved.valueRange;
  state.valueMask = resolved.valueMask;
  if (state.valueBits !== clampNumber(bits, 8, 13) && renderer) {
    addGpuDiagnostic(`Requested value depth exceeds MAX_TEXTURE_SIZE. Clamped to ${state.valueBits} bit.`);
  }
  state.paletteOffset = wrapRange(state.paletteOffset);
  syncPaletteCycleDirection();
  controls.valueBits.value = String(state.valueBits);
  controls.paletteOffset.max = String(state.valueMask);
  controls.paletteOffset.value = Math.floor(state.paletteOffset);
  uploadLutTexture();
  if (previousBits !== state.valueBits) renderGradientPanels();
  requestRender();
}

function renderGradientPanels() {
  state.gradients.forEach((gradient, index) => {
    renderGradientPanel({
      index,
      panel: controls.gradientPanels[index],
      gradient,
      valueMask: state.valueMask,
      valueRange: state.valueRange,
      onTypeChange: setGradientType,
      onParamChange: setGradientParam,
    });
    wikiPanel?.enhance(controls.gradientPanels[index]);
  });
}

function setGradientType(index, type) {
  state.gradients[index] = normalizeGradientDefinition({ ...DEFAULT_GRADIENT, ...state.gradients[index], type });
  renderGradientPanels();
  requestRender();
}

function setGradientParam(index, key, value) {
  state.gradients[index][key] = value;
  requestRender();
}

function resizeBuffers() {
  renderer?.resize(state.width, state.height);
  viewportController?.apply();
  requestRender();
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
  const next = advancePaletteCycleState({
    offset: state.paletteOffset,
    direction: state.paletteCycleDirection,
    mode: state.paletteWrapMode,
    valueRange: state.valueRange,
    valueMask: state.valueMask,
    cycleSeconds: state.cycleSeconds,
    dt,
  });
  state.paletteOffset = next.offset;
  state.paletteCycleDirection = next.direction;
}

function syncPaletteCycleDirection() {
  if (state.paletteWrapMode !== 'pingpong') return;
  if (state.paletteOffset <= 0) state.paletteCycleDirection = 1;
  else if (state.paletteOffset >= state.valueMask) state.paletteCycleDirection = -1;
}

function stepPaletteOffset(direction) {
  const step = Number(controls.paletteOffset.step) || 1;
  setPaletteOffset(state.paletteOffset + direction * step);
}

function setPaletteOffset(value) {
  state.paletteOffset = wrapRange(value);
  controls.paletteOffset.value = Math.floor(state.paletteOffset);
  syncPaletteCycleDirection();
  updateReadouts();
  requestRender();
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
  updateFps(performance.now());
  updateReadouts();
  renderer?.render(renderSnapshot());
}

function updateFps(now) {
  fpsFrameCount += 1;
  const elapsed = now - fpsSampleStart;
  if (elapsed < 500) return;
  currentFps = Math.round((fpsFrameCount * 1000) / elapsed);
  fpsFrameCount = 0;
  fpsSampleStart = now;
}

function renderSnapshot() {
  return {
    width: state.width,
    height: state.height,
    valueBits: state.valueBits,
    valueRange: state.valueRange,
    valueMask: state.valueMask,
    time: state.time,
    paletteOffset: state.paletteOffset,
    fieldWrapMode: state.fieldWrapMode,
    paletteWrapMode: state.paletteWrapMode,
    previewMode: state.previewMode,
    combineOperation: state.combineOperation,
    combineModifier: state.combineModifier,
    combineShift: state.combineShift,
    gradients: state.gradients,
  };
}

function uploadLutTexture() {
  renderer?.uploadLutTexture(palette, state.valueRange);
}

function runGpuDiagnostics() {
  glDiagnostics = [];
  addGpuDiagnostic(`Actual renderer before test: ${state.rendererActual}`);
  if (!renderer) {
    addGpuDiagnostic('No WebGL2 context available.');
    flushGpuDiagnostics();
    return;
  }
  renderer.runDiagnostics(renderSnapshot());
  flushGpuDiagnostics();
}

function addGpuDiagnostic(message) {
  glDiagnostics.push(message);
  console.info(`[GPU] ${message}`);
}

function flushGpuDiagnostics() {
  controls.gpuDiagnostics.textContent = glDiagnostics.join('\n') || 'No diagnostics.';
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

function applyLutLength() {
  const nextLength = clampNumber(controls.lutLength.value, 2, 4096);
  lutEditor.applyLength(nextLength);
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

function syncGeneratorHelp() {
  const generatorId = controls.lutGenerator.value;
  const label = LUT_GENERATOR_TYPES[generatorId] ?? generatorId;
  controls.lutGeneratorHelp.textContent = '?';
  controls.lutGeneratorHelp.title = `${label} generator details`;
  controls.lutGeneratorHelp.dataset.wiki = generatorWikiId(generatorId);
  controls.lutGeneratorHelp.setAttribute('aria-label', `Open wiki article for ${label} LUT generator`);
}

function generatorWikiId(generatorId) {
  return `lut-generator-${generatorId}`;
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
    startColor: normalizeHex(generatorParamValue('startColor', '#07111f')),
    midColor: normalizeHex(generatorParamValue('midColor', '#24c8db')),
    endColor: normalizeHex(generatorParamValue('endColor', '#fff4b8')),
    chaosR: generatorParamValue('chaosR', 382) / 100,
    harmonics: generatorParamValue('harmonics', 3),
    roughness: generatorParamValue('roughness', 55) / 100,
    easeMode: generatorParamValue('easeMode', 'smooth'),
  };
  currentLut = generateLutDefinition(options);
  selectedPointId = currentLut.points[0]?.id ?? null;
  syncLutControls();
  updateRendererFromCurrentLut();
  lutEditor.render();
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
  lutEditor?.syncSelectedPointControls();
}

function randomize() {
  const paletteKeys = Object.keys(lutLibrary);
  state.gradients.forEach((_, index) => {
    const type = pick(FIELD_IDS);
    state.gradients[index] = normalizeGradientDefinition({
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
    });
  });
  state.combineOperation = pick(COMBINE_OPERATION_IDS);
  state.combineModifier = pick(COMBINE_MODIFIER_IDS);
  state.combineShift = randomInt(0, 8);
  state.paletteId = pick(paletteKeys);
  currentLut = cloneLut(lutLibrary[state.paletteId]);
  palette = buildLut(currentLut);
  selectedPointId = currentLut.points[0]?.id ?? null;
  uploadLutTexture();
  renderGradientPanels();
  syncControls();
  syncLutControls();
  lutEditor.render();
  requestRender();
}

function syncControls() {
  controls.width.value = state.width;
  controls.height.value = state.height;
  controls.paletteWrapMode.value = state.paletteWrapMode;
  controls.fieldWrapMode.value = state.fieldWrapMode;
  controls.gradientPreviewToggles.forEach((toggle, index) => {
    toggle.checked = state.gradientPreviewEnabled[index];
  });
  controls.palette.value = state.paletteId;
  controls.timeScale.value = Math.round(state.timeScale * 100);
  controls.toggleTime.textContent = state.timeRunning ? 'pause' : 'resume';
  controls.valueBits.value = String(state.valueBits);
  controls.cycleSeconds.value = state.cycleSeconds;
  controls.paletteOffset.max = String(state.valueMask);
  controls.paletteOffset.value = Math.floor(state.paletteOffset);
  controls.toggleAnimation.textContent = state.paletteRunning ? 'Pause Palette' : 'Resume Palette';
  syncCombineControls();
  updateReadouts();
}

function syncCombineControls() {
  setButtonRowActive(controls.combineOperationButtons, 'combineOperation', state.combineOperation);
  setButtonRowActive(controls.combineModifierButtons, 'combineModifier', state.combineModifier);
  controls.combineShift.value = String(state.combineShift);
  controls.combineShiftOut.value = state.combineShift;
}

function setButtonRowActive(buttons, key, activeValue) {
  buttons.forEach((button) => button.classList.toggle('active', button.dataset[key] === activeValue));
}

function updateReadouts() {
  controls.cycleSecondsOut.value = state.cycleSeconds === 0 ? 'off' : `${state.cycleSeconds}s`;
  controls.paletteOffsetOut.value = Math.floor(state.paletteOffset);
  controls.timeScaleOut.value = `${Math.round(state.timeScale * 100)}%`;
  const preview = state.previewMode === 'final' ? 'FINAL' : state.previewMode.toUpperCase();
  const combineLabel = `${COMBINE_OPERATION_TYPES[state.combineOperation]}${state.combineModifier === 'none' ? '' : ` + ${COMBINE_MODIFIER_TYPES[state.combineModifier]}`}`;
  const zoom = viewportController?.view.scale ?? 1;
  readout.textContent = `${state.width} x ${state.height} | ${state.valueBits}BIT | ${state.rendererActual.toUpperCase()} | ${currentFps} FPS | ${preview} | zoom ${zoom.toFixed(2)}x | ${FIELD_TYPES[state.gradients[0].type]} ${combineLabel} ${FIELD_TYPES[state.gradients[1].type]} | LUT ${state.paletteId}`;
}

function savePng() {
  renderFrame();
  const link = document.createElement('a');
  link.download = `visual-experiment-${state.width}x${state.height}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function wrapRange(value) {
  return wrapPaletteOffset(value, state.valueRange);
}
