---
id: lut-generator-fourier
title: LUT Generator > Fourier Waves
summary: Multi-harmonic sine waves generate complex periodic color motion.
section: LUT
related:
  - lut-generator
  - render-palette-controls
---

# How it is created

Fourier Waves sums several sine harmonics across the LUT. The seed chooses each harmonic phase. The summed wave modulates hue, saturation, and brightness.

Lower harmonics create broad movement. Higher harmonics add smaller ripples and sharper color variation.

# Controls

`Harmonics` controls how many sine components are summed.

`Roughness` controls how strongly upper harmonics contribute.

`Detail` controls how many editable points sample the resulting wave.

# Visual result

This generator is good for rich cyclic palettes. It often pairs well with smooth organic fields and with palette cycling.