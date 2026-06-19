---
id: render-palette-controls
title: Anim > Palette
summary: Palette preset selection and LUT offset animation controls.
section: Anim
related:
  - render-palette
  - lut-definition
  - lut-generator
---

# What this section controls

Anim > Palette controls which LUT is used and how the final LUT lookup is offset over time.

This section does not edit LUT points. Editing happens in the LUT tab and LUT editor. Here you choose an available LUT and animate how the final values travel through it.

# Palette selector

`Palette` selects the active LUT definition. Built-in LUTs appear here, and custom LUTs appear after using `Apply LUT` in the LUT tab.

Changing the selected palette can strongly change the image mood without changing the underlying scalar pattern.

# Palette Wrap

`Palette Wrap` controls how the final combined value plus Offset indexes the LUT. This is part of palette traversal, so it belongs with the palette controls rather than the scalar field controls.

# Offset

`Offset` shifts the final LUT lookup:

```text
lutIndex = combinedValue + paletteOffset
```

The result is then resolved through `Palette Wrap`. Offset is a color traversal control. It does not move the gradients and it does not change the combine result.

# Cycle Seconds

`Cycle Seconds` defines how long one full palette cycle takes.

When Palette Wrap is `Loop`, one cycle means moving through the full LUT range and returning to the beginning.

When Palette Wrap is `Ping-pong`, one cycle means moving from the beginning to the end and back to the beginning.

Setting `Cycle Seconds` to `0` disables automatic palette cycling.

# Palette speed toggle

Use the `PS` button in the title bar to pause or resume automatic palette offset animation. The current offset is preserved, so you can pause on a specific color phase and continue adjusting other controls.

# Difference from Field Wrap

Palette controls affect color indexing after combine. They should not change the scalar geometry. If the pattern structure changes, you are looking at `Field Wrap`, gradient parameters, or combine settings instead.
