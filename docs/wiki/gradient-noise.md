---
id: gradient-noise
title: Noise
summary: Layered value noise with drift and contrast controls.
section: Gradients
related:
  - gradient-voronoi
  - gradient-plasma
---

# Noise field

Noise samples pseudo-random values on a grid and smoothly interpolates between them. The shader stacks multiple octaves to add detail at different scales.

```text
sum = octave1 + octave2 * 0.5 + octave3 * 0.25 + ...
value = contrast-adjusted sum
```

# Seed

`Seed` changes the pseudo-random pattern. The same seed produces the same field.

# Octaves

More octaves add smaller details. Fewer octaves produce broad soft regions.

# Contrast

Contrast expands or compresses the noise value distribution. Higher contrast makes features more pronounced.

Use the `A` button on `Contrast` to reveal `Amp` and `Speed`. Animated contrast is clamped so modulation cannot invert the noise response.

# Drift

`Drift X` and `Drift Y` move sampling coordinates over time. This creates scrolling organic motion.

# Practical use

Noise is useful as an irregular companion to geometric fields. It can break up clean lines, produce cloudy modulation, or create more natural transitions when used with arithmetic combine modes.
