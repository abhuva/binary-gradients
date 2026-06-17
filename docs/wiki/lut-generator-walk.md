---
id: lut-generator-walk
title: LUT Generator > Random Walk
summary: Seeded hue, saturation, and brightness drift from point to point.
section: LUT
related:
  - lut-generator
  - lut-editor
---

# How it is created

Random Walk starts at `Base Hue` with moderate saturation and brightness. Each following point adds a seeded random step to hue, saturation, and brightness.

The values are clamped so the palette stays usable, but there is no fixed color-theory pattern. The ramp is controlled drift.

# Controls

`Detail` controls the number of walk steps.

`Contrast` increases the maximum step size.

`Seed` defines the exact walk path.

# Visual result

This generator is useful for exploratory palettes. It can create irregular, organic transitions without changing the underlying scalar field.