export function advancePaletteCycleState({ offset, direction = 1, mode, valueRange, valueMask, cycleSeconds, dt }) {
  if (!Number.isFinite(cycleSeconds) || cycleSeconds <= 0) {
    return {
      offset: wrapPaletteOffset(offset, valueRange),
      direction,
    };
  }

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
  if (!Number.isFinite(valueRange) || valueRange <= 0) return 0;
  return ((Number(value) % valueRange) + valueRange) % valueRange;
}
