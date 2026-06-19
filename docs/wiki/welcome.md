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

# Presets

In order to get a quick impression of what this tool can produce, go to `Presets`  - here you find a curated list of presets, just click on them.
Note that some presets might use a specific dimension - you can safely override in `Set` settings.
# First steps

1. Open `Grad 1` or `Grad 2` and choose a field type.
2. Use the `P` button in the title bar when you want Grad tabs to show one field alone.
3. Open `Comb > Combine` and switch the operation or modifier to change how both fields interact.
4. Open `Anim > Palette` to try a different LUT or animate the palette offset.
5. Open `LUT > Generate LUT` to create a new editable color ramp.

# Important distinction

`Field Wrap` changes the numeric gradient fields before they are combined. This changes geometry.

`Palette Wrap` changes how the final combined value moves through the LUT. This changes color traversal.

# Set size

On startup, the canvas size is automatically set to the current browser window size. You can repeat this manually from `Set > Use Window`.

# Help articles

Most section headers have a `?` button. These articles explain what the controls do and why the math behaves the way it does.
