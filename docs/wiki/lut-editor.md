---
id: lut-editor
title: LUT Editor
summary: The bottom dock edits LUT points directly while the render updates in realtime.
section: LUT
related:
  - lut-definition
  - render-palette
---

# Editor model

The LUT editor displays the current editable LUT as a horizontal color bar with markers.

Each marker is a point with an index, color, and kind.

```text
{ index, color, kind }
```

# Adding points

Click the bar to add a smooth point. Use `Add Hard` to add a hard override.

Smooth points participate in interpolation. Hard points override exact indices after interpolation.

# Moving points

Dragging a marker changes its index. The render updates immediately because the LUT is rebuilt and uploaded to the GPU.

# Selected point controls

`Index` sets the exact integer position. `Color` changes the point color. `Method` switches between smooth and hard behavior.

# Deleting points

Deleting removes the selected point. If the LUT has too few smooth points, the model still falls back safely, but useful ramps usually need at least two smooth anchors.

# Practical use

Use smooth points for broad color structure. Use hard points for accents, thresholds, one-pixel flashes, or deliberate artifacts. This separation is what makes the LUT useful for both painterly ramps and technical bit patterns.