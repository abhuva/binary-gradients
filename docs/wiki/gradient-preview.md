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

Use the `P` button in the title bar to enable individual gradient preview. When enabled, Grad 1 shows only Gradient 1 and Grad 2 shows only Gradient 2. Other tabs still show the final combined render.

# What the preview shows

The preview shows one scalar field mapped through the active LUT. It is not raw grayscale unless the LUT itself is grayscale.

# Why this is useful

If a combined image is confusing, inspect each gradient alone.

Questions to ask:

- Is the scale too dense or too broad?
- Does field wrap produce the expected seams or mirrors?
- Which gradient is driving the visible animation?
- Does the LUT make the field hard to read?

# Returning to final render

Turn the title-bar `P` button off to return the Grad tabs to the final combined render.
