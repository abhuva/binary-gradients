---
id: lut-definition
title: LUT Definition
summary: Editable lookup tables convert integer values into RGB colors.
section: LUT
related:
  - lut-generator
  - lut-editor
  - render-palette
---

# What a LUT does

A LUT maps a numeric value to color:

```text
RGB = LUT[value]
```

The gradients and combine stage produce values, not colors. The LUT decides how those values look.

# Runtime scaling

The editable LUT has its own length. At render time it is expanded or sampled into a GPU texture with width equal to the active value range.

```text
valueRange = 256, 512, 1024, ... 8192
LUT texture width = valueRange
```

This keeps the shader lookup simple: one scalar value maps to one horizontal texture coordinate.

# Smooth points

Smooth points define an interpolated color ramp. Between two smooth points, RGB values are linearly interpolated.

This is good for gradients, thermal ramps, topographic palettes, and continuous color travel.

# Hard points

Hard points override exact indices after smooth interpolation. They are single-value accents.

Use hard points for sparks, scanline-like hits, exact threshold markers, or glitch-like highlights.

# LUT length

A shorter LUT can produce repeated or posterized color logic when expanded. A longer LUT gives more room for detailed ramps and precise point placement.

# Apply LUT

The current editable LUT updates the render live. `Apply LUT` registers it under its ID in the palette selector, so it can be selected later like a built-in palette.