---
id: render
title: Render
summary: The runtime view of the pipeline: time, wrapping, diagnostics, and final output.
section: Render
related:
  - render-combine
  - render-palette
  - render-palette-controls
  - gradient-fields
---

# The render pipeline

The renderer turns two numeric fields into a color image. Color is the last step, not the first one.

```text
A(x, y) = Grad 1 scalar field
B(x, y) = Grad 2 scalar field
V(x, y) = combine(A, B)
RGB     = LUT[V]
```

This separation is the core idea of the tool. Gradients produce numbers, combine operations transform numbers, and the LUT decides how those numbers are seen.

# Time

`Time Speed` advances the global shader time. It does not animate a finished image like a video filter. Instead, it feeds formulas inside the gradient fields.

Examples:

- `rotationSpeed` changes an angle over time.
- `offsetSpeed` scrolls a scalar field through the value range.
- `originSpeedX` and `originSpeedY` oscillate the origin through sine waves.
- `phaseSpeed` moves plasma wave phases.
- `driftX` and `driftY` scroll noise or Voronoi sampling coordinates.

If none of the active gradients use animated parameters, changing time may not visibly change the image.

# Field wrap versus palette wrap

The two wrap dropdowns affect different parts of the pipeline.

`Field Wrap` happens before combine and changes the scalar geometry. `Palette Wrap` happens after combine and changes how values walk through the LUT. See [Field Wrap and Palette Wrap](wiki:render-palette) for the full explanation.

# GPU diagnostics

`gpu-diag` runs a compact WebGL check. It reports renderer information, value depth, texture state, shader/program status, and a center-pixel readback.

Use it when the canvas is black, frozen, or suspicious after changing shader-facing code. It is not a visual analysis tool; it is a sanity check that the GPU path is alive.
