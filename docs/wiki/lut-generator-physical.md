---
id: lut-generator-physical
title: LUT Generator > Physical Preset
summary: Curated ramps such as fire, ice, thermal, topo, ocean, oil, toxic, sunset, CRT, and VGA.
section: LUT
related:
  - lut-generator
  - lut-editor
---

# How it is created

Physical Preset starts from a hand-authored list of colors for the selected preset. These colors are converted through HSV and receive a small seeded hue jitter.

The endpoints and relative stop order are preserved, so the preset identity stays readable while still allowing variation by seed and contrast.

# Controls

`Preset` chooses the color family.

`Contrast` controls the amount of hue jitter.

`Seed` chooses the exact jitter values.

# Visual result

Use this when you want a recognizable material or display language: heat maps, ocean depth, CRT green, toxic green, oil slick, or old VGA plasma colors.