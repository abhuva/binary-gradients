---
id: welcome
title: Welcome
summary: A quick starting point for exploring binary gradients.
section: Intro
related:
  - render
  - render-combine
  - gradient-fields
  - lut-generator
---

# What this tool does

Binary Gradients combines two procedural scalar fields and maps the result through a LUT.

The basic pipeline is:

```text
Gradient 1 + Gradient 2 -> Combine operation -> LUT colors -> rendered image
```

# First steps

1. Open `Grad 1` or `Grad 2` and choose a field type.
2. Use the small preview toggle in a Grad tab when you want to inspect one field alone.
3. Open `Render > Combine` and switch the operation or modifier to change how both fields interact.
4. Open `Render > Palette` to try a different LUT or animate the palette offset.
5. Open `LUT > Generate LUT` to create a new editable color ramp.

# Important distinction

`Field Wrap` changes the numeric gradient fields before they are combined. This changes geometry.

`Palette Wrap` changes how the final combined value moves through the LUT. This changes color traversal.

# Canvas size

On startup, the canvas size is automatically set to the current browser window size. You can repeat this manually from `Canvas > Use Window`.

# Help articles

Most section headers have a `?` button. These articles explain what the controls do and why the math behaves the way it does.
