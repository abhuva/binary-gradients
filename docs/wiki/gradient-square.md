---
id: gradient-square
title: Square / Diamond
summary: A rotated square-distance field that covers box and diamond forms.
section: Gradients
related:
  - gradient-fields
  - gradient-rings
---

# Square field

Square measures the maximum axis distance after rotating the pixel around the origin:

```text
q = rotate(pixel - origin, angle)
value = floor(max(abs(q.x), abs(q.y)) / scale)
```

Using `max(abs(x), abs(y))` creates square distance bands instead of circular distance bands.

# Box and diamond

A box and a diamond are the same field with different rotation.

```text
0 deg  -> axis-aligned square / box
45 deg -> diamond orientation
```

This is why the app exposes one `Square / Diamond` field instead of separate box and diamond types.

# Animated origin

Use the `A` button on `Origin X` or `Origin Y` to reveal that axis animation controls. Moving the origin changes the center of the square-distance field.

# Rotation

Use the `A` button on `Angle` to reveal rotation speed. This animates the box-to-diamond orientation over time without changing the base angle.

# Practical use

Square fields are good for architectural structure. They combine strongly with rings because both are distance fields but use different metrics.
