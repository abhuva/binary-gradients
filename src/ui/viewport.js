import { clamp } from '../domain/value-range.js';

export function createViewportController({ viewport, canvas, getSize, onChange }) {
  const view = { scale: 1, fitScale: 1, x: 0, y: 0 };
  const drag = { active: false, pointerId: null, x: 0, y: 0, viewX: 0, viewY: 0 };
  let interactionEnabled = true;

  viewport.addEventListener('wheel', onWheel, { passive: false });
  viewport.addEventListener('pointerdown', onPointerDown);
  viewport.addEventListener('pointermove', onPointerMove);
  viewport.addEventListener('pointerup', onPointerUp);
  viewport.addEventListener('pointercancel', onPointerUp);

  function reset() {
    const { width, height } = getSize();
    const rect = viewport.getBoundingClientRect();
    const fit = Math.min(rect.width / width, rect.height / height);
    view.fitScale = Number.isFinite(fit) && fit > 0 ? fit : 1;
    view.scale = view.fitScale;
    view.x = (rect.width - width * view.scale) / 2;
    view.y = (rect.height - height * view.scale) / 2;
    apply();
  }

  function fitToViewport() {
    reset();
  }

  function apply() {
    const { width, height } = getSize();
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
    onChange?.(view);
  }

  function getView() {
    return { ...view };
  }

  function setView(nextView) {
    view.scale = nextView.scale;
    view.fitScale = nextView.fitScale;
    view.x = nextView.x;
    view.y = nextView.y;
    apply();
  }

  function setInteractionEnabled(enabled) {
    interactionEnabled = enabled;
    if (!enabled) cancelDrag();
  }

  function cancelDrag() {
    if (!drag.active) return;
    const pointerId = drag.pointerId;
    drag.active = false;
    drag.pointerId = null;
    viewport.classList.remove('dragging');
    if (pointerId !== null && viewport.hasPointerCapture(pointerId)) {
      viewport.releasePointerCapture(pointerId);
    }
  }

  function onWheel(event) {
    event.preventDefault();
    if (!interactionEnabled) return;
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
    apply();
  }

  function onPointerDown(event) {
    if (!interactionEnabled) return;
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
    if (!interactionEnabled) return;
    if (!drag.active || event.pointerId !== drag.pointerId) return;
    view.x = drag.viewX + event.clientX - drag.x;
    view.y = drag.viewY + event.clientY - drag.y;
    apply();
  }

  function onPointerUp(event) {
    if (!drag.active || event.pointerId !== drag.pointerId) return;
    drag.active = false;
    drag.pointerId = null;
    viewport.classList.remove('dragging');
    viewport.releasePointerCapture(event.pointerId);
  }

  return { view, reset, fitToViewport, apply, getView, setView, setInteractionEnabled };
}
