---
id: lut-generator-bit
title: LUT Generator > Bit Pattern
summary: Colors are derived from bit counts and low/high nibble variation.
section: LUT
related:
  - lut-generator
  - lut-generator-bitplane
---

# How it is created

Bit Pattern maps each generated stop to an 8-bit sample value. It reads the sample's popcount, low nibble, and high nibble.

The popcount and high nibble push the hue. The low nibble drives brightness. This makes nearby numeric values sometimes look very different, which exposes binary structure in the rendered field.

# Controls

`Detail` controls how many bit-sampled stops are produced.

`Base Hue` shifts the whole bit-color family.

`Contrast` raises saturation and brightness separation.

# Visual result

Use this when you want geometric or bitwise fields to show their internal integer steps clearly. It is less smooth than a photographic ramp by design.