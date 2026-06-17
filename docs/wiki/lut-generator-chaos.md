---
id: lut-generator-chaos
title: LUT Generator > Chaos Map
summary: Uses the logistic map to create chaotic but deterministic color paths.
section: LUT
related:
  - lut-generator
  - lut-editor
---

# How it is created

Chaos Map iterates the logistic equation `x = r * x * (1 - x)`. The seed chooses the starting value. Each iteration becomes one LUT point.

The chaotic value drives hue and brightness. Popcount of the sampled value influences saturation, adding a bit-oriented texture to the palette.

# Controls

`Chaos R` controls the logistic-map parameter. Higher values tend to create more chaotic paths.

`Detail` controls how many iterations are sampled.

`Contrast` controls brightness intensity.

# Visual result

This creates irregular ramps with deterministic chaos. It works well when you want a palette that feels unstable without being purely random.