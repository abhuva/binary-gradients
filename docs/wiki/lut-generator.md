---
id: lut-generator
title: Generate LUT
summary: Procedural LUT generators create editable color point sets.
section: LUT
related:
  - lut-definition
  - lut-editor
---

# Generator purpose

Generators create editable LUT definitions from a few parameters. They are not a separate render path. After generation, the result is just normal editable LUT points.

# Common controls

`Seed` gives deterministic variation. Same generator settings and seed should produce the same color structure, excluding internal point IDs.

`Base Hue` sets the starting color family for hue-driven generators.

`Detail` usually controls how many points or features are produced.

`Contrast` controls how intense or separated the generated colors are.

# Generator families

Harmony creates color-theory ramps.

HSV Waves creates sinusoidal hue, saturation, and value movement.

Bit Pattern and Bitplane emphasize integer and bit structure.

Physical Preset creates themed ramps such as fire, ice, thermal, topo, ocean, oil, toxic, sunset, CRT, and VGA.

Bands / Posterize creates hard-edged palettes.

Fourier Waves and Chaos Map create more complex procedural color paths.

# Editing after generation

A generated LUT is a starting point. Use the editor to move points, add hard overrides, change colors, or shorten/lengthen the LUT.

# Practical use

For geometric scalar fields, high-contrast or bit-oriented palettes make structure readable. For organic fields, smooth ramps often produce better fluid motion. Hard points can add flashes without changing the underlying scalar pattern.