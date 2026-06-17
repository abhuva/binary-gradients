---
id: gradient-preview
title: Gradient Preview
summary: Grad tabs can show either the final result or one individual gradient field.
section: Gradients
related:
  - gradient-fields
  - render-combine
---

# Preview behavior

Grad 1 and Grad 2 tabs normally show the final combined render. This keeps the canvas stable when switching tabs.

Enabling `Show Grad only` switches that tab to the individual scalar field preview.

# What the preview shows

The preview shows one scalar field mapped through the active LUT. It is not raw grayscale unless the LUT itself is grayscale.

# Why this is useful

If a combined image is confusing, inspect each gradient alone.

Questions to ask:

- Is the scale too dense or too broad?
- Is field wrap producing the expected seams or mirrors?
- Is animation coming from this gradient or the other one?
- Is the LUT making the field hard to read?

# Returning to final render

Turn the preview toggle off to return that Grad tab to the final combined render.