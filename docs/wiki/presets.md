---
id: presets
title: Presets
summary: Save and restore the complete visual recipe: canvas intent, render state, gradients, combine settings, and editable LUT.
section: Presets
related:
  - render
  - gradient-fields
  - lut-definition
---

# What a preset stores

A preset is a versioned snapshot of the current visual recipe.

It stores:

- Canvas width, height, fixed-size intent, and value depth.
- Current animation time and time settings.
- `Field Wrap` and `Palette Wrap`.
- Palette offset and cycle settings.
- Combine operation, modifier, and shift.
- Full Grad 1 and Grad 2 definitions.
- The current editable LUT definition.

# What a preset does not store

A preset does not store interface-only state:

- Viewport zoom or pan.
- Active tab.
- Gradient preview button state.
- GPU diagnostics.
- Presentation mode.

Those settings affect how you look at the render, not the visual recipe itself.

# Why time is stored

The current animation time is part of the saved recipe because animated fields can look different at different phases. Saving time makes a preset closer to "what I saw when I saved it".

# Fixed canvas size

By default, loading a preset keeps the current Width and Height from the Set tab. This makes preset browsing adaptive, so selecting presets changes the visual recipe without unexpectedly changing the screen-sized render.

Enable `Fixed canvas size` when saving if a preset should restore its exact Width and Height on load. Value depth is still preset-controlled because it changes the numeric domain of the effect.

# Local storage

User presets live in browser `localStorage`. This is convenient, but browser data can be cleared.

Use `Export Collection` for anything important. This downloads the full user preset collection, not only one setup.

# Built-in presets

The app also loads a bundled preset collection at startup. These presets are read-only examples that make the online version useful immediately, even before you save anything locally.

If a user preset has the same ID as a built-in preset, the user preset wins in the browser list.

# Browser and filters

The preset list is clickable. Clicking a preset loads it immediately.

Use search to match preset names, descriptions, tags, or source. Tag buttons filter the list to one preset family.

# Import and export

`Import JSON` accepts either one preset or a full preset collection.

`Export Selected` downloads only the selected preset.

`Export Collection` downloads all user presets as one collection file.

# Import and migration

Imported presets are normalized before loading. Missing or invalid modes fall back to safe values.

Older presets that used the former `gradientWrapMode` field are migrated by copying that value into both `fieldWrapMode` and `paletteWrapMode`.

Older presets without `fixedCanvasSize` are treated as adaptive and do not restore Width or Height unless that flag is explicitly `true`.
