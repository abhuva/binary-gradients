---
id: gradient-linear
title: Linear / Angle
summary: A directional ramp sampled along a configurable angle.
section: Gradients
related:
  - gradient-fields
  - render-palette
---

# Linear field

Linear projects the pixel position onto an angle and divides by scale:

```text
value = floor((cos(angle) * x + sin(angle) * y) / scale)
```

At `0 deg`, the field changes along x. At `90 deg`, it changes along y. Diagonals are not separate gradient types; they are simply angles between those axes.

# Scale

Small scale makes narrow bands. Large scale makes broad bands.

Because the value is floored, the field is stepped rather than continuous. Those steps become important when combined with bitwise operations.

# Angle and rotation

`Angle` controls the ramp direction. `Rotation Speed` adds time to that angle, so the projected direction rotates.

```text
animatedAngle = angle + time * rotationSpeed
```

# Useful combinations

Linear is a good base field because it is easy to read. Combine it with rings for radial interference, modulo for graphic stripe structures, or noise/plasma for distortion-like color movement.