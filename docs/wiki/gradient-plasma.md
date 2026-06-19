---
id: gradient-plasma
title: Plasma
summary: Organic sine-wave interference field.
section: Gradients
related:
  - gradient-noise
  - gradient-voronoi
---

# Plasma field

Plasma combines several sine waves sampled from x, y, and radial distance. The waves interfere with each other and produce a smooth organic field.

Conceptually:

```text
v = sin(x wave) + sin(y wave) + sin(radial wave)
value = normalized v across the value range
```

# Frequency

`Freq 1` and `Freq 2` control wave density. Higher frequencies create smaller folds and more visual activity.

Use the `A` button on each frequency row to reveal `Amp` and `Speed`. This modulates wave density over time with a sine wave.

# Phase Speed

`Phase Speed` animates the wave phase. Positive and negative values move the waves in opposite temporal directions.

# Warp

`Warp` bends coordinates before sampling the waves. Small values add fluid motion. Large values can create heavy distortion.

Use the `A` button on `Warp` to reveal `Amp` and `Speed`. Animated warp is clamped to stay non-negative.

# Practical use

Plasma is one of the strongest organic sources. It is useful when a strict geometric pattern needs movement, water, heat, glass, or energy-like behavior.
