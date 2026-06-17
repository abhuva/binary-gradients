---
id: lut-generator-ease
title: LUT Generator > Ease Curve
summary: Applies an easing curve before mapping position to color and brightness.
section: LUT
related:
  - lut-generator
  - lut-editor
---

# How it is created

Ease Curve starts with evenly spaced raw LUT positions. Each position is transformed through the selected curve: linear, smoothstep, exponential, logarithmic, pulse, or stepped.

The eased value drives hue and brightness. In stepped mode, duplicate points are added near band edges to create harder plateaus.

# Controls

`Curve` selects the easing function.

`Detail` controls the number of curve samples.

`Contrast` controls color intensity and seeded hue drift.

# Visual result

Use this when you want the palette's value response to be part of the design: slow start, strong highlight compression, pulse-shaped brightness, or stepped regions.