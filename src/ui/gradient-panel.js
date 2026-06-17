import { COMMON_CONTROLS, FIELD_TYPES, SPECIFIC_CONTROLS } from '../domain/registries.js';
import { formatNumber } from '../domain/value-range.js';
import { el, initSelect, labelWrap } from './dom.js';

export function renderGradientPanel({ index, panel, gradient, valueMask, valueRange, onTypeChange, onParamChange }) {
  panel.replaceChildren();
  panel.appendChild(el('h2', { dataset: { wiki: 'gradient-fields' } }, `Gradient ${index + 1}`));

  const typeLabel = labelWrap('Type');
  const typeSelect = document.createElement('select');
  initSelect(typeSelect, FIELD_TYPES, gradient.type);
  typeSelect.addEventListener('change', () => onTypeChange(index, typeSelect.value));
  typeLabel.appendChild(typeSelect);
  panel.appendChild(typeLabel);

  COMMON_CONTROLS
    .filter((control) => !((gradient.type === 'plasma' || gradient.type === 'fan') && control.key === 'scale'))
    .forEach((control) => panel.appendChild(createGradientControl({ index, gradient, control, valueMask, valueRange, onParamChange })));

  const specific = SPECIFIC_CONTROLS[gradient.type] ?? [];
  if (specific.length) {
    panel.appendChild(el('h2', { className: 'subhead', dataset: { wiki: `gradient-${gradient.type}` } }, FIELD_TYPES[gradient.type]));
    specific.forEach((control) => panel.appendChild(createGradientControl({ index, gradient, control, valueMask, valueRange, onParamChange })));
  }
}

function createGradientControl({ index, gradient, control, valueMask, valueRange, onParamChange }) {
  const resolved = resolveControl(control, valueMask, valueRange);
  const label = labelWrap('');
  label.className = [
    'gradient-control',
    'has-step',
    control.key === 'offsetSpeed' ? 'has-snap' : '',
    gradient.type === 'linear' && control.key === 'angle' ? 'has-angle-presets' : '',
  ].filter(Boolean).join(' ');
  const caption = el('span', { className: 'gradient-control-label' }, control.label);

  if (control.type === 'select') {
    label.className = 'gradient-control select-control';
    const select = document.createElement('select');
    initSelect(select, resolved.options, String(gradient[control.key]));
    select.addEventListener('change', () => onParamChange(index, control.key, Number(select.value)));
    label.append(caption, select);
    return label;
  }

  const output = document.createElement('output');
  output.value = formatNumber(gradient[control.key]);

  const input = document.createElement('input');
  input.type = 'range';
  input.min = resolved.min;
  input.max = resolved.max;
  input.step = resolved.step;
  input.value = gradient[control.key];
  input.addEventListener('input', () => {
    const value = Number(input.value);
    output.value = formatNumber(value);
    onParamChange(index, control.key, value);
  });

  label.appendChild(caption);
  label.append(
    createStepButton('-', () => stepRangeInput(input, -1, output, (value) => onParamChange(index, control.key, value))),
    createStepButton('+', () => stepRangeInput(input, 1, output, (value) => onParamChange(index, control.key, value))),
  );
  label.append(input, output);
  if (control.key === 'offsetSpeed') {
    const zeroButton = el('button', { className: 'inline-zero', type: 'button' }, '0');
    zeroButton.title = 'Snap offset speed to zero';
    zeroButton.addEventListener('click', () => {
      input.value = '0';
      output.value = '0';
      onParamChange(index, 'offsetSpeed', 0);
    });
    label.appendChild(zeroButton);
  }
  if (gradient.type === 'linear' && control.key === 'angle') {
    const presets = el('span', { className: 'angle-presets' });
    [90, 180, 270].forEach((angle) => {
      const button = el('button', { className: 'angle-preset-button', type: 'button' }, String(angle));
      button.title = `Set angle to ${angle} degrees`;
      button.addEventListener('click', () => setRangeInputValue(input, angle, output, (value) => onParamChange(index, control.key, value)));
      presets.appendChild(button);
    });
    label.appendChild(presets);
  }
  return label;
}

function createStepButton(text, onClick) {
  const button = el('button', { className: 'gradient-step-button', type: 'button' }, text);
  button.title = text === '-' ? 'Decrease by one step' : 'Increase by one step';
  button.addEventListener('click', onClick);
  return button;
}

function stepRangeInput(input, direction, output, onChange) {
  if (direction < 0) input.stepDown();
  else input.stepUp();
  setRangeInputValue(input, Number(input.value), output, onChange);
}

function setRangeInputValue(input, value, output, onChange) {
  const min = Number(input.min);
  const max = Number(input.max);
  const next = Math.max(min, Math.min(max, Number(value)));
  input.value = String(next);
  output.value = formatNumber(next);
  onChange(next);
}

function resolveControl(control, valueMask, valueRange) {
  if (control.key === 'offset') return { ...control, max: valueMask };
  if (control.key === 'offsetSpeed') return { ...control, min: -valueRange, max: valueRange };
  return control;
}
