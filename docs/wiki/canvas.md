---
id: canvas
title: Set
summary: Output resolution, value depth, viewport fitting, and why these are separate concepts.
section: Set
related:
  - render
  - lut-definition
---

# Canvas size

Width and height define the actual scalar field size. You can use any dimensions.

This is separate from zoom. Zoom only changes how the canvas appears on screen. Canvas size changes what is rendered and what is exported.

# Use Window

`Use Window` copies the browser window width and height into the canvas fields. It is a convenience for creating a render at screen size.

It does not enter presentation mode and it does not read the current viewport zoom.

# Value depth

Value depth defines the active scalar domain:

```text
8 bit  -> 256 values,  mask 255
9 bit  -> 512 values,  mask 511
10 bit -> 1024 values, mask 1023
13 bit -> 8192 values, mask 8191
```

This affects gradients, bitwise operations, combine output, palette offset, and LUT texture width.

Higher value depth gives more numeric room. It can reduce obvious band repetition, but it also changes how bitwise patterns behave because there are more active bits.

# GPU texture limit

The LUT texture is uploaded at the active value range width. If the GPU cannot support that width, the app clamps the value depth to the maximum supported texture size.

# Reset view

`Reset View` recenters and fits the canvas in the stage. It does not change canvas size or render state.

# GPU diagnostics

`gpu-diag` runs a compact WebGL check. It reports renderer information, value depth, texture state, shader/program status, and a center-pixel readback.

Use it when the canvas is black, frozen, or suspicious after changing shader-facing code. It is not a visual analysis tool; it is a sanity check that the GPU path is alive.
