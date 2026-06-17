---
id: lut-generator-waves
title: LUT Generator > HSV Waves
summary: Sine waves move hue, saturation, and value along the LUT.
section: LUT
related:
  - lut-generator
  - render-palette-controls
---

# How it is created

HSV Waves samples several sine waves over the LUT. One wave bends hue, one bends saturation, and one bends brightness.

The seed chooses wave frequencies and phase offsets. The ramp also advances hue across the LUT, so the final palette is a mixture of cyclic hue travel and seeded oscillation.

# Controls

`Detail` controls how many points approximate the waves.

`Base Hue` offsets the full hue path.

`Contrast` increases the strength of the sine-wave movement.

# Visual result

This creates animated, liquid-feeling color ramps. It works well with palette cycling because the colors already have a periodic structure.