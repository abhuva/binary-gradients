---
id: gradient-modulo
title: Modulo / Stripes
summary: Stripe fields based on remainders and coefficient formulas.
section: Gradients
related:
  - gradient-linear
  - gradient-bitwiseCoord
---

# Modulo field

Modulo fields create repeating values from band indices. The core idea is remainder:

```text
value = band mod Modulo Count
```

The result is then scaled across the active value range, so a small modulo count can still use the full LUT.

# Linear Stripes

Linear stripes rotate the pixel coordinate, divide by scale, and use the x band.

```text
q = rotate(pixel, angle) / scale
band = floor(q.x)
```

This creates hard parallel stripes.

# Grid Sum

Grid Sum adds x and y bands:

```text
band = floor(q.x) + floor(q.y)
```

This produces diagonal or grid-like repetition depending on angle and scale.

# Coefficient Formula

Coefficient Formula weights x and y bands:

```text
band = floor(q.x) * X Mult + floor(q.y) * Y Mult
```

Changing coefficients changes the periodic relationship between axes. Small integer ratios can create stable tilings. Larger or negative values can create sharper interference.

# Practical use

Modulo fields are good when you want graphic repetition without relying on bitwise operations. They are also useful as one input to `XOR` or `DIFF` because their bands are already discrete.