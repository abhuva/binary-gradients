---
id: lut-generator-colorRamp
title: LUT Generator > Color Ramp
summary: A direct three-stop ramp from start color to middle color to end color.
section: LUT
related:
  - lut-generator
  - lut-editor
---

# How it is created

Color Ramp creates exactly three smooth points: start at index 0, middle at the center, and end at the final LUT index.

Unlike the seeded generators, this one is explicit. The selected colors are used directly after hex normalization.

# Controls

`Start`, `Middle`, and `End` are the three colors.

The common `Seed`, `Base Hue`, `Detail`, and `Contrast` controls do not meaningfully change this generator.

# Visual result

Use this for intentional hand-directed palettes. It is also a clean starting point before adding hard points or extra smooth points in the LUT editor.