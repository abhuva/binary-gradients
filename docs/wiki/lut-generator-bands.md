---
id: lut-generator-bands
title: LUT Generator > Bands / Posterize
summary: Creates discrete color bands by duplicating colors near band edges.
section: LUT
related:
  - lut-generator
  - lut-editor
---

# How it is created

Bands / Posterize divides the LUT into a fixed number of bands. Each band gets a hue based on `Base Hue`, band index, seed drift, and contrast.

At high hardness, each band color is duplicated near the next edge. This creates a long flat color region followed by a sharp transition.

# Controls

`Bands` controls the number of visible color regions.

`Hardness` controls whether transitions are soft or posterized.

`Contrast` increases color separation.

# Visual result

Use this when you want contour-map behavior, hard strata, or explicit value buckets instead of smooth interpolation.