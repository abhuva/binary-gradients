---
id: lut-generator-seamless
title: LUT Generator > Seamless Cycle
summary: A periodic HSV path where the last color is forced to match the first.
section: LUT
related:
  - lut-generator
  - render-palette-controls
---

# How it is created

Seamless Cycle traces a periodic hue path. Saturation and brightness also use sine and cosine motion over the LUT.

After creating the points, the final point is set to the same color as the first point. This removes the hard color jump when palette cycling loops from the end back to the start.

# Controls

`Turns` controls how many hue rotations happen across the LUT.

`Detail` controls how many points approximate the loop.

`Contrast` controls saturation and brightness wave strength.

# Visual result

This is the safest generator for continuous palette animation in loop mode. It makes the color motion feel cyclic instead of resetting at the LUT seam.