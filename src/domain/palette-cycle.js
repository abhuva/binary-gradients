export function advancePaletteCycleState({ offset, direction = 1, mode, valueRange, valueMask, cycleSeconds, dt }) {
  if (mode !== 'pingpong') {
    return {
      offset: wrapPaletteOffset(offset + dt * valueRange / cycleSeconds, valueRange),
      direction,
    };
  }

  const max = valueMask;
  if (max <= 0) return { offset: 0, direction: 1 };

  let nextOffset = offset + direction * dt * (max * 2) / cycleSeconds;
  let nextDirection = direction;
  while (nextOffset < 0 || nextOffset > max) {
    if (nextOffset > max) {
      nextOffset = max - (nextOffset - max);
      nextDirection = -1;
    } else {
      nextOffset = -nextOffset;
      nextDirection = 1;
    }
  }
  return { offset: nextOffset, direction: nextDirection };
}

export function wrapPaletteOffset(value, valueRange) {
  return ((Number(value) % valueRange) + valueRange) % valueRange;
}