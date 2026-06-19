---
id: gradient-voronoi
title: Voronoi Cells
summary: Cell fields based on nearest randomized grid points.
section: Gradients
related:
  - gradient-noise
  - gradient-plasma
---

# Voronoi cells

Voronoi divides space by nearest feature point. The shader places one pseudo-random point in each grid cell and checks the local neighborhood.

For each pixel, it finds the nearest and second-nearest feature points.

# Modes

`Cell ID` hashes the nearest cell identity into a value. This produces flat cell regions.

`Distance` maps distance to the nearest feature point. This produces soft blobs or cellular gradients.

`Edge / Ridge` uses the difference between the second-nearest and nearest distances. This highlights cell boundaries and vein-like structures.

# Metrics

`Euclidean` uses circular distance. It gives organic round cells.

`Manhattan` uses `abs(x) + abs(y)`. It gives diamond-like geometry.

`Chebyshev` uses `max(abs(x), abs(y))`. It gives square-like geometry.

# Jitter and seed

`Seed` changes the pseudo-random point placement. `Jitter` controls how far points move from the cell center. Low jitter creates regular grids. High jitter creates more natural cells.

Use the `A` button on the Jitter row to reveal its animation controls. `Range` animates above and below the base jitter value with a sine wave. `Speed` controls that oscillation speed. The animated jitter is clamped between `0` and `1`, so it never moves points outside the intended Voronoi cell jitter domain.

# Contrast

Contrast expands the visible distance or edge response. Use the `A` button on `Contrast` to reveal `Amp` and `Speed`. Animated contrast is clamped so modulation cannot invert the distance response.

# Drift

Drift moves the sampling position over time. It scrolls the cell field rather than moving the camera.

# Practical use

Voronoi is the main cellular/organic field. Combine edge mode with geometric fields for cracked glass, water caustics, maps, membranes, and biological patterns.
