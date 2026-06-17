---
id: lut-generator-scientific
title: LUT Generator > Scientific Diverging
summary: Readable diverging ramps centered between two visual extremes.
section: LUT
related:
  - lut-generator
  - render-palette
---

# How it is created

Scientific Diverging starts from curated color schemes with a meaningful low side, middle, and high side. The colors are lightly jittered in hue by seed and contrast.

The ramp is intentionally restrained compared to the more decorative generators.

# Controls

`Diverge` selects the color scheme.

`Contrast` controls small hue variation, not wild color separation.

`Seed` chooses the exact variation.

# Visual result

Use this when the LUT should help read scalar values clearly. Diverging palettes are especially useful when mid-values should be visually distinct from low and high values.