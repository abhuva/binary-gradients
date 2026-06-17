---
id: render-combine
title: Render > Combine
summary: How Grad 1 and Grad 2 become one integer value field through binary and arithmetic operations.
section: Render
related:
  - gradient-fields
  - gradient-bitwiseCoord
  - render-palette
---

# The combine stage

Each gradient produces one integer-like scalar value per pixel. After field wrapping, those values become `A` and `B`.

```text
A = fieldWrap(Grad 1 raw value + Grad 1 offset)
B = fieldWrap(Grad 2 raw value + Grad 2 offset)
V = operation(A, B)
```

`V` is still not a color. It is the final scalar value used to sample the LUT.

# Why binary operations look geometric

Binary operations inspect the bits of the numbers. With 8 bit value depth, a value has bits like this:

```text
value 173 = 10101101
```

A smooth ramp is not smooth at the bit level. Bit 0 flips every step, bit 1 flips every two steps, bit 7 flips halfway through the range. When two spatial fields are combined bit by bit, those bit-plane transitions become visible as hard structure.

That is why `XOR`, `AND`, and `OR` often create grid-like, interference-like, or architectural patterns even when the input gradients are simple.

# Operations

`XOR` keeps bits that differ between `A` and `B`. It is often the most visually active operation and creates strong interference patterns.

`AND` keeps only bits present in both fields. It tends to darken or mask, because many bits are discarded.

`OR` keeps bits present in either field. It tends to fill space and preserve high bits from both inputs.

`XNOR`, `NAND`, and `NOR` are inverted versions inside the active value depth. They often create negative-space variants of the same bit structure.

`ADD` and `SUB` treat the fields as numbers. They preserve more ramp behavior, but wrap at the active value range.

`DIFF` is absolute difference. It is good for distance-like relationships between fields.

`MUL` multiplies values and wraps the result. It can become very dense because small numeric changes produce large output changes.

`MIN` and `MAX` choose one field at each pixel. They behave like scalar masks: one field can carve into or dominate the other.

# Modifiers

`Shift Grad 2` shifts `B` left before the operation:

```text
B2 = (B << shift) & valueMask
```

This changes which bit planes interact. A low bit in `B` can become a higher bit before combining.

`Popcount` replaces the result with the number of set bits, scaled across the value range. This makes bit density visible.

`Lowbit` isolates the lowest active bit. `Highbit` isolates the highest active bit. These are useful for exposing hierarchy inside a pattern.

# Practical reading

If the image is too noisy, try `MIN`, `MAX`, `DIFF`, or remove bit-derived modifiers. If the image is too smooth, try `XOR`, `Shift Grad 2`, `Popcount`, or a bitwise coordinate gradient.