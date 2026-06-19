export function bindControls() {
  return {
    tabButtons: [...document.querySelectorAll('.tab-button')],
    tabPanels: [...document.querySelectorAll('.tab-panel')],
    presetSearch: document.querySelector('#presetSearch'),
    presetTagFilters: document.querySelector('#presetTagFilters'),
    presetBrowser: document.querySelector('#presetBrowser'),
    presetName: document.querySelector('#presetName'),
    presetTags: document.querySelector('#presetTags'),
    presetDescription: document.querySelector('#presetDescription'),
    savePreset: document.querySelector('#savePreset'),
    deletePreset: document.querySelector('#deletePreset'),
    exportPresetCollection: document.querySelector('#exportPresetCollection'),
    exportPreset: document.querySelector('#exportPreset'),
    importPreset: document.querySelector('#importPreset'),
    importPresetFile: document.querySelector('#importPresetFile'),
    presetStatus: document.querySelector('#presetStatus'),
    width: document.querySelector('#width'),
    height: document.querySelector('#height'),
    valueBits: document.querySelector('#valueBits'),
    applySize: document.querySelector('#applySize'),
    useWindowSize: document.querySelector('#useWindowSize'),
    resetView: document.querySelector('#resetView'),
    enterPresentation: document.querySelector('#enterPresentation'),
    presentationExit: document.querySelector('#presentationExit'),
    timeScale: document.querySelector('#timeScale'),
    timeScaleOut: document.querySelector('#timeScaleOut'),
    paletteWrapMode: document.querySelector('#paletteWrapMode'),
    fieldWrapMode: document.querySelector('#fieldWrapMode'),
    toggleTime: document.querySelector('#toggleTime'),
    resetTime: document.querySelector('#resetTime'),
    runGpuDiagnostics: document.querySelector('#runGpuDiagnostics'),
    gpuDiagnostics: document.querySelector('#gpuDiagnostics'),
    gradientPreviewToggles: [document.querySelector('#previewGradient1'), document.querySelector('#previewGradient2')],
    gradientPanels: [document.querySelector('#gradient1Panel'), document.querySelector('#gradient2Panel')],
    combineOperationButtons: [...document.querySelectorAll('[data-combine-operation]')],
    combineModifierButtons: [...document.querySelectorAll('[data-combine-modifier]')],
    combineShift: document.querySelector('#combineShift'),
    combineShiftOut: document.querySelector('#combineShiftOut'),
    palette: document.querySelector('#palette'),
    cycleSeconds: document.querySelector('#cycleSeconds'),
    cycleSecondsOut: document.querySelector('#cycleSecondsOut'),
    paletteOffset: document.querySelector('#paletteOffset'),
    paletteOffsetDown: document.querySelector('#paletteOffsetDown'),
    paletteOffsetUp: document.querySelector('#paletteOffsetUp'),
    paletteOffsetOut: document.querySelector('#paletteOffsetOut'),
    toggleAnimation: document.querySelector('#toggleAnimation'),
    randomize: document.querySelector('#randomize'),
    savePng: document.querySelector('#savePng'),
    lutId: document.querySelector('#lutId'),
    lutLength: document.querySelector('#lutLength'),
    lutGenerator: document.querySelector('#lutGenerator'),
    lutGeneratorHelp: document.querySelector('#lutGeneratorHelp'),
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

export function initSelect(select, options, selected) {
  select.replaceChildren(...Object.entries(options).map(([value, label]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    option.selected = value === selected;
    return option;
  }));
}

export function labelWrap(text) {
  const label = document.createElement('label');
  label.append(text);
  return label;
}

export function el(tag, props = {}, text = '') {
  const node = document.createElement(tag);
  const { dataset, ...rest } = props;
  Object.assign(node, rest);
  if (dataset) Object.assign(node.dataset, dataset);
  if (text) node.textContent = text;
  return node;
}
