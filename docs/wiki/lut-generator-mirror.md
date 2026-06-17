---
id: lut-generator-mirror
title: LUT Generator > Mirror / Symmetry
summary: Builds a half-ramp and reflects it with exact, inverted, complementary, or brightness variation.
section: LUT
related:
  - lut-generator
  - render-palette
---

# How it is created

Mirror / Symmetry first creates a half-ramp from `Base Hue`, `Shift`, contrast, and seed drift. It then appends a reflected copy of that half-ramp.

The reflection mode decides how the second half changes: exact mirror, inverted brightness, complementary hue, or brightness remap.

# Controls

`Mode` selects the reflection transform.

`Shift` controls hue movement across the first half.

`Detail` controls the approximate total point count.

# Visual result

Mirrored palettes are useful with ping-pong palette wrapping and fields that should feel balanced around a center point.