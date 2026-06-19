---
id: gradient-fan
title: Fan / Angle
summary: Angular sectors around an origin.
section: Gradients
related:
  - gradient-fields
  - gradient-polar
---

# Fan field

Fan converts angle around an origin into a scalar value:

```text
d = pixel - origin
angle = atan(d.y, d.x)
value = normalized angle * valueRange * Angle Mult
```

The result is a set of angular sectors radiating from the origin.

# Animated origin

Use the `A` button on `Origin X` or `Origin Y` to reveal that axis animation controls. Moving the origin changes the pivot point of the fan.

# Angle Mult

`Angle Mult` repeats the angular sweep. Higher values create more spokes.

# Direction

`Direction` flips the angular coordinate between clockwise and counterclockwise. The default clockwise direction preserves the previous fan behavior.

# Rotation

Rotation speed adds time to the angular coordinate. This rotates the fan pattern without moving the canvas.

# Practical use

Fan fields are useful for radial slicing. Combine them with rings for polar grids, or with modulo/bitwise fields for hard angular mechanical patterns.
