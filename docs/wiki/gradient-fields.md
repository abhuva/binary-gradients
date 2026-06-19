---
id: gradient-fields
title: Gradient Fields
summary: Gradients are scalar fields: one numeric value per pixel before color exists.
section: Gradients
related:
  - render-combine
  - render-palette
---

# Scalar fields

A gradient is a function that returns one number per pixel:

```text
G(x, y) = integer scalar value
```

The shader computes one value for Grad 1 and one value for Grad 2. Those values are wrapped, combined, and then colorized through the LUT.

# Color comes later

A gradient field is not inherently red, blue, bright, or dark. It is just numbers. The active LUT decides which numbers become which colors.

This is why changing the LUT can completely change the visual mood while preserving the same structure.

# Previewing one gradient

Grad 1 and Grad 2 normally keep showing the final combined render. Use the `P` button in the title bar to switch the Grad tabs into individual preview mode. With `P` enabled, Grad 1 shows only Gradient 1 and Grad 2 shows only Gradient 2; Presets, Set, Anim, Comb, and LUT still show the final combined image.

# Common controls

`Scale` changes spatial frequency. Smaller scale usually means tighter bands, smaller cells, or denser coordinate quantization. Larger scale spreads the pattern out.

Use the `A` button on `Scale` to reveal scale animation controls. `Amp` moves scale above and below the base value with a sine wave, and `Speed` controls how fast that modulation runs. Animated scale is clamped to stay at least `1`.

`Offset` adds to the scalar value before field wrapping. It shifts the field through the value range.

`Speed` animates offset over time:

```text
animatedOffset = offset + time * speed
```

This is a scalar scroll, not a camera movement.

# Origin controls

Origin-based fields use `Origin X` and `Origin Y` as normalized positions across the canvas. `Amp X`, `Amp Y`, `Speed X`, and `Speed Y` can animate the origin with sine waves.

This is why rings, square fields, polar fields, and Voronoi-like structures can feel alive without moving the viewport.

# Geometric and organic families

Some fields are geometric: linear, rings, square, fan, modulo, polar, and bitwise coordinate. They expose clear mathematical structure.

Some fields are organic: plasma, noise, and Voronoi distance modes. They produce softer or cellular structure.

Combining one geometric field with one organic field often creates the glass, water, or caustic-like behavior that makes this tool interesting.
