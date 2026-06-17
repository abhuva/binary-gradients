---
id: lut-generator-bitplane
title: LUT Generator > Bitplane
summary: Emphasizes high bits, low bits, popcount, or powers of two in the LUT value domain.
section: LUT
related:
  - lut-generator
  - lut-generator-bit
---

# How it is created

Bitplane samples 8-bit values and derives color from their low nibble, high nibble, popcount, and power-of-two status.

The selected mode chooses which bit feature is most visible. A small seeded hue jitter keeps the ramp from being perfectly mechanical.

# Controls

`Bit Mode` selects the emphasized bit feature.

`Detail` controls how many sample stops are created.

`Contrast` increases saturation and brightness range.

# Visual result

This generator is built for binary-looking fields. It can make bit boundaries, powers of two, and population-count changes visible as color structure.