import { normalizeHex, rgbToHex } from '../domain/color.js';
import { uid } from '../domain/random.js';
import { clamp, clampNumber } from '../domain/value-range.js';
import { buildLut, normalizePoint } from '../lut/model.js';

export function createLutEditor({ lutCanvas, lutMarkers, pointEditor, pointIndex, pointColor, pointKind, getLut, getSelectedPointId, setSelectedPointId, onChange }) {
  const lutCtx = lutCanvas.getContext('2d', { alpha: false });
  const lutDrag = { active: false, pointerId: null, pointId: null };

  lutCanvas.addEventListener('pointerdown', onLutCanvasPointerDown);

  function render() {
    const currentLut = getLut();
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
    renderMarkers();
    syncSelectedPointControls();
  }

  function renderMarkers() {
    const currentLut = getLut();
    const length = currentLut.length;
    const selectedPointId = getSelectedPointId();
    lutMarkers.replaceChildren(...currentLut.points.map((point) => {
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
    addPoint('smooth', index);
  }

  function onLutMarkerPointerDown(event) {
    event.preventDefault();
    event.stopPropagation();
    setSelectedPointId(event.currentTarget.dataset.pointId);
    lutDrag.active = true;
    lutDrag.pointerId = event.pointerId;
    lutDrag.pointId = getSelectedPointId();
    window.addEventListener('pointermove', onLutMarkerPointerMove);
    window.addEventListener('pointerup', onLutMarkerPointerUp);
    window.addEventListener('pointercancel', onLutMarkerPointerUp);
    render();
  }

  function onLutMarkerPointerMove(event) {
    if (!lutDrag.active || event.pointerId !== lutDrag.pointerId) return;
    const point = findPoint(lutDrag.pointId);
    if (!point) return;
    point.index = lutIndexFromClientX(event.clientX);
    onChange();
    render();
  }

  function onLutMarkerPointerUp(event) {
    if (!lutDrag.active || event.pointerId !== lutDrag.pointerId) return;
    window.removeEventListener('pointermove', onLutMarkerPointerMove);
    window.removeEventListener('pointerup', onLutMarkerPointerUp);
    window.removeEventListener('pointercancel', onLutMarkerPointerUp);
    lutDrag.active = false;
    lutDrag.pointerId = null;
    lutDrag.pointId = null;
    render();
  }

  function addPoint(kind, index = Math.floor((getLut().length - 1) / 2)) {
    const currentLut = getLut();
    const color = rgbToHex(buildLut(currentLut)[clampNumber(index, 0, currentLut.length - 1)]);
    const point = {
      id: uid(),
      index: clampNumber(index, 0, currentLut.length - 1),
      color,
      kind,
    };
    currentLut.points.push(point);
    setSelectedPointId(point.id);
    onChange();
    render();
  }

  function updateSelectedPointFromControls() {
    const currentLut = getLut();
    const point = findPoint(getSelectedPointId());
    if (!point) return;
    point.index = clampNumber(pointIndex.value, 0, currentLut.length - 1);
    point.color = normalizeHex(pointColor.value);
    point.kind = pointKind.value === 'hard' ? 'hard' : 'smooth';
    onChange();
    render();
  }

  function deleteSelectedPoint() {
    const currentLut = getLut();
    const point = findPoint(getSelectedPointId());
    if (!point) return;
    const smoothCount = currentLut.points.filter((item) => item.kind === 'smooth').length;
    if (point.kind === 'smooth' && smoothCount <= 2) return;
    currentLut.points = currentLut.points.filter((item) => item.id !== getSelectedPointId());
    setSelectedPointId(currentLut.points[0]?.id ?? null);
    onChange();
    render();
  }

  function applyLength(nextLength) {
    const currentLut = getLut();
    const previousMax = Math.max(1, currentLut.length - 1);
    currentLut.points.forEach((point) => {
      const t = point.index / previousMax;
      point.index = Math.round(t * (nextLength - 1));
    });
    currentLut.length = nextLength;
    pointIndex.max = String(nextLength - 1);
    onChange();
    render();
  }

  function syncSelectedPointControls() {
    const currentLut = getLut();
    const point = findPoint(getSelectedPointId());
    pointEditor.classList.toggle('disabled', !point);
    if (!point) return;
    const normalized = normalizePoint(point, currentLut.length);
    pointIndex.max = String(currentLut.length - 1);
    pointIndex.value = normalized.index;
    pointColor.value = normalized.color;
    pointKind.value = normalized.kind;
  }

  function findPoint(id) {
    return getLut().points.find((point) => point.id === id);
  }

  function lutIndexFromClientX(clientX) {
    const rect = lutCanvas.getBoundingClientRect();
    const t = clamp((clientX - rect.left) / rect.width, 0, 1);
    return Math.round(t * (getLut().length - 1));
  }

  return {
    render,
    addPoint,
    updateSelectedPointFromControls,
    deleteSelectedPoint,
    applyLength,
    syncSelectedPointControls,
  };
}