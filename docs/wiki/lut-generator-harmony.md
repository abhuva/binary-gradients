---
id: lut-generator-harmony
title: LUT Generator > Harmony
summary: Color-theory ramps built from complementary, analogous, and triadic hue offsets.
section: LUT
related:
  - lut-generator
  - lut-editor
---

# How it is created

Harmony starts from `Base Hue`, then chooses one of several fixed hue-offset patterns: complementary, analogous, triadic, split-style, or four-color balance.

For each generated point, the hue is `Base Hue + pattern offset + seeded drift`. Saturation and brightness are kept in a readable mid-to-high range, with brightness lifted near the center of the ramp.

# Controls

`Detail` controls how many editable color points are placed across the LUT.

`Contrast` increases saturation, brightness separation, and seeded hue drift.

`Seed` chooses the harmony pattern and the small random drift.

# Visual result

This generator is useful when the scalar field already has strong structure and the palette should feel designed rather than noisy. It tends to create balanced ramps with clear color relationships.