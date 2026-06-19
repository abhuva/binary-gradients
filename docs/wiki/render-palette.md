---
id: render-palette
title: Field Wrap and Palette Wrap
summary: The two wrap domains: scalar field wrapping before combine and LUT wrapping after combine.
section: Anim
related:
  - render-combine
  - render-palette-controls
  - lut-definition
---

# Why wrapping exists

The shader works in a finite value range. At 8 bit depth, valid values are `0..255`. At 13 bit depth, valid values are `0..8191`.

Gradient formulas can naturally produce values outside that range. Palette offset can also push a final value outside the range. Wrapping defines how those out-of-range values come back into range.

# Field Wrap

Field wrap happens before the two gradients are combined.

```text
raw gradient value + gradient offset -> Field Wrap -> A or B
```

This affects pattern geometry because it changes the values entering the combine operation.

`Loop / saw` repeats from the beginning:

```text
0, 1, 2, ..., max, 0, 1, 2
```

`Ping-pong` mirrors at the ends:

```text
0, 1, 2, ..., max, max-1, ..., 0
```

Loop produces discontinuities at the wrap seam. Ping-pong produces mirrored symmetry instead of a jump.

# Palette Wrap

Palette wrap happens after combine.

```text
combined value + palette offset -> Palette Wrap -> LUT index
```

This affects color traversal. It does not change the scalar geometry that was produced by the gradients and combine stage.

When `Palette Wrap` is `Loop`, cycling moves through the LUT and jumps back to the beginning. When it is `Ping-pong`, cycling moves forward and then backward.

# Why the split matters

Before these controls were split, changing a palette cycling mode also changed the gradient fields themselves. That made some presets change structure when the user only expected the colors to move differently.

Now the mental model is explicit:

- Change `Field Wrap` when you want different scalar geometry.
- Change `Palette Wrap` when you want different color traversal.

# Fractional palette offset

Palette offset can be fractional internally so slow cycling remains smooth. The visible slider shows integer positions, but the shader can sample an in-between offset over time.
