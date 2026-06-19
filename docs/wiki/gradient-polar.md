---
id: gradient-polar
title: Polar / Spiral
summary: Angular and radial fields using polar coordinates around an origin.
section: Gradients
related:
  - gradient-fan
  - gradient-rings
---

# Polar coordinates

Polar fields describe a pixel by angle and radius around an origin:

```text
d = pixel - origin
angle = atan(d.y, d.x)
radius = length(d) / scale
```

This makes the field naturally radial.

# Animated origin

Use the `A` button on `Origin X` or `Origin Y` to reveal that axis animation controls. Moving the origin changes the pivot for spiral, angular stripe, and polar checker modes.

# Spiral

Spiral mode combines angle and radius:

```text
spiral = angleTurns * Angular Freq + radius * Radial Freq + radius * Twist
value = fract(spiral) * valueRange
```

`Angular Freq` controls how many angular cycles exist. `Radial Freq` controls how strongly distance contributes. `Twist` bends the spiral as radius increases.

# Angular Stripes

Angular Stripes quantizes only the angular coordinate. It behaves like a fan with explicit band count.

# Polar Checker

Polar Checker combines angular bands and radial bands. This creates a target-like grid in polar coordinates.

# Practical use

Polar fields are central for spirals, fans, vortex forms, radial checkers, and rotating machinery-like patterns. They combine especially well with plasma or noise when you want organic motion inside a radial structure.
