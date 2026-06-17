---
id: lut-generator-luminance
title: LUT Generator > Luminance Controlled
summary: A monotonic brightness ramp with hue variation layered on top.
section: LUT
related:
  - lut-generator
  - lut-editor
---

# How it is created

Luminance Controlled maps the LUT position through a power curve to produce brightness. Hue moves across the ramp and receives small sine and seed variation.

The important property is that brightness generally increases from start to end, making the palette readable even when colors vary.

# Controls

`Luma Power` shapes the brightness curve.

`Detail` controls the number of editable stops.

`Base Hue` and `Contrast` control the color layer over the brightness ramp.

# Visual result

Use this when value readability matters. The hue can be expressive, but low and high values remain separated by brightness.