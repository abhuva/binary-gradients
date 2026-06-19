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
    control.animation ? 'has-animation' : '',
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

  if (control.type === 'toggle') {
    label.className = 'gradient-control toggle-button-control';
    const row = el('div', { className: 'button-row gradient-toggle-row' });
    Object.entries(resolved.options).forEach(([value, text]) => {
      const button = el('button', { className: 'mode-button', type: 'button' }, text);
      button.classList.toggle('active', Number(value) === Number(gradient[control.key]));
      button.addEventListener('click', () => {
        row.querySelectorAll('.mode-button').forEach((item) => item.classList.remove('active'));
        button.classList.add('active');
        onParamChange(index, control.key, Number(value));
      });
      row.appendChild(button);
    });
    label.append(caption, row);
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
  if (control.animation) {
    const animationPanel = createAnimationPanel({
      index,
      gradient,
      animation: resolved.animation,
      onParamChange,
    });
    const animationButton = el('button', { className: 'animation-toggle-button', type: 'button' }, 'A');
    const syncAnimationButton = () => {
      animationButton.classList.toggle('active', isAnimationActive(gradient, resolved.animation));
    };
    syncAnimationButton();
    animationButton.title = 'Show animation controls';
    animationButton.setAttribute('aria-expanded', String(!animationPanel.hidden));
    animationButton.addEventListener('click', () => {
      animationPanel.hidden = !animationPanel.hidden;
      animationButton.setAttribute('aria-expanded', String(!animationPanel.hidden));
    });
    animationPanel.addEventListener('animationstatechange', syncAnimationButton);
    label.appendChild(animationButton);
    const group = el('div', { className: 'gradient-control-group' });
    group.append(label, animationPanel);
    return group;
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

function createAnimationPanel({ index, gradient, animation, onParamChange }) {
  const panel = el('div', { className: 'animation-controls' });
  panel.hidden = !isAnimationActive(gradient, animation);
  if (animation.rangeKey) {
    panel.appendChild(createAnimationRangeControl({
      index,
      gradient,
      key: animation.rangeKey,
      label: animation.rangeLabel ?? 'Range',
      min: animation.rangeMin ?? 0,
      max: animation.rangeMax ?? 1,
      step: animation.rangeStep ?? 0.01,
      onParamChange,
    }));
  }
  if (animation.speedKey) {
    panel.appendChild(createAnimationRangeControl({
      index,
      gradient,
      key: animation.speedKey,
      label: animation.speedLabel ?? 'Speed',
      min: animation.speedMin ?? -12,
      max: animation.speedMax ?? 12,
      step: animation.speedStep ?? 0.1,
      snapZero: true,
      onParamChange,
    }));
  }
  return panel;
}

function createAnimationRangeControl({ index, gradient, key, label, min, max, step, snapZero = false, onParamChange }) {
  const row = labelWrap('');
  row.className = ['gradient-control', 'animation-control', 'has-step', snapZero ? 'has-snap' : ''].filter(Boolean).join(' ');
  const caption = el('span', { className: 'gradient-control-label' }, label);
  const output = document.createElement('output');
  output.value = formatNumber(gradient[key]);

  const input = document.createElement('input');
  input.type = 'range';
  input.min = min;
  input.max = max;
  input.step = step;
  input.value = gradient[key];
  input.addEventListener('input', () => {
    const value = Number(input.value);
    gradient[key] = value;
    output.value = formatNumber(value);
    onParamChange(index, key, value);
    row.dispatchEvent(new Event('animationstatechange', { bubbles: true }));
  });

  row.appendChild(caption);
  row.append(
    createStepButton('-', () => {
      stepRangeInput(input, -1, output, (value) => {
        gradient[key] = value;
        onParamChange(index, key, value);
      });
      row.dispatchEvent(new Event('animationstatechange', { bubbles: true }));
    }),
    createStepButton('+', () => {
      stepRangeInput(input, 1, output, (value) => {
        gradient[key] = value;
        onParamChange(index, key, value);
      });
      row.dispatchEvent(new Event('animationstatechange', { bubbles: true }));
    }),
  );
  row.append(input, output);

  if (snapZero) {
    const zeroButton = el('button', { className: 'inline-zero', type: 'button' }, '0');
    zeroButton.title = `Snap ${label.toLowerCase()} to zero`;
    zeroButton.addEventListener('click', () => {
      input.value = '0';
      output.value = '0';
      gradient[key] = 0;
      onParamChange(index, key, 0);
      row.dispatchEvent(new Event('animationstatechange', { bubbles: true }));
    });
    row.appendChild(zeroButton);
  }

  return row;
}

function isAnimationActive(gradient, animation) {
  return Boolean(
    (animation.rangeKey && Number(gradient[animation.rangeKey]))
    || (animation.speedKey && Number(gradient[animation.speedKey])),
  );
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
  if (control.key === 'scale') return {
    ...control,
    max: valueRange,
    animation: control.animation ? { ...control.animation, rangeMax: valueRange } : undefined,
  };
  if (control.key === 'offset') return { ...control, max: valueMask };
  if (control.key === 'offsetSpeed') return { ...control, min: -valueRange, max: valueRange };
  return control;
}
