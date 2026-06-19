---
id: gradient-rings
title: Rings
summary: Concentric distance bands around an animated origin.
section: Gradients
related:
  - gradient-fields
  - gradient-polar
---

# Rings field

Rings measure distance from an origin:

```text
d = pixel - origin
value = floor(length(d) / scale)
```

Every equal distance from the origin gets the same value, so the field forms concentric circles.

# Scale

Scale controls ring width. Small scale creates many dense rings. Large scale creates fewer, broader rings.

# Animated origin

Use the `A` button on `Origin X` or `Origin Y` to reveal that axis animation controls. The origin can move with sine-wave animation:

```text
origin.x = Origin X + sin(time * Speed X) * Amp X
origin.y = Origin Y + sin(time * Speed Y) * Amp Y
```

Moving the origin changes the distance field itself, so the rings expand, contract, and slide relative to other gradients.

# Practical use

Rings combine well with linear fields and polar fields. With bitwise operations, each ring band can expose different bit planes, creating radial circuitry or interference patterns.
