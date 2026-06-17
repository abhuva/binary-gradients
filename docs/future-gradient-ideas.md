# Future Gradient Creation Ideas

## Purpose

Planning notes for expanding `binary-gradients` beyond the current gradient families. These ideas are intentionally broader than the immediate implementation backlog so future work can pick from them without losing the design reasoning.

The current app combines two integer/scalar fields and maps the result through a LUT. New gradient families should preserve that model:

```text
A(x, y) = integer/scalar field
B(x, y) = integer/scalar field
V(x, y) = combine(A, B)
RGB(x, y) = LUT[V]
```

Prefer gradient types that produce clear integer structure and interact interestingly with XOR/AND/OR/add/sub/min/max.

## 1. Cell / Voronoi Gradients

First slice implemented:

- `voronoi` field type.
- Hash-grid pseudo-points, no point arrays or data textures.
- Modes: nearest-cell ID, distance to nearest point, edge/ridge from nearest-vs-second-nearest distance.
- Metrics: Euclidean, Manhattan, Chebyshev.

Generate integer fields from nearest points.

Possible modes:

- nearest-cell ID
- distance to nearest point
- distance difference between nearest and second nearest
- cell border/ridge pattern

Useful visual results:

- cracked cells
- organic islands
- stained glass structures
- terrain-like regions
- cellular masks for later LUT work

Likely controls:

- point count
- seed
- metric: Euclidean / Manhattan / Chebyshev
- jitter
- scale
- border emphasis

Remaining implementation notes:

- The first shader version uses hash-grid pseudo-points and a fixed 3x3 neighbor search.
- Full arbitrary point arrays would need uniform arrays or texture data and should wait until needed.
- Future versions could add richer cell coloring, animated jitter, or arbitrary point arrays if the procedural version is not enough.

## 2. Modulo / Stripe Families

First slice implemented:

- `modulo` field type.
- Modes: rotated linear stripes, summed grid/diagonal stripes, coefficient formula.
- Controls: modulo count, X/Y coefficients, angle, rotation speed.

Explicit integer pattern generators based on coordinate formulas.

Examples:

```text
floor(x / scale) mod n
floor((x + y) / scale) mod n
(x * a + y * b) mod range
```

Useful visual results:

- repeating bands
- moire patterns
- retro graphics
- simple but readable binary-combine structure

Likely controls:

- divisor / scale
- modulo count
- x multiplier
- y multiplier
- angle
- phase / offset speed

Remaining implementation notes:

- Current first slice is cheap in shader and uses only formulas.
- Very good for testing combine modes because the source structure is obvious.
- Future UI work could replace numeric mode sliders with named select controls.

## 3. Polar / Angular Families

First slice implemented:

- `polar` field type.
- Modes: spiral, angular stripes, polar checker.
- Controls: origin, angular frequency, radial frequency, twist, rotation speed.

The current `fan` gradient already uses angle, but polar gradients can go further.

Ideas:

- spiral
- angular stripes
- radial spokes
- logarithmic spiral
- polar checkerboard

Example concepts:

```text
spiral = angle * angularFrequency + radius * radialFrequency
polar checker = floor(angleBands) XOR floor(radiusBands)
```

Likely controls:

- origin X/Y
- angular frequency
- radial frequency
- twist / turns
- rotation speed
- radius scale

Remaining implementation notes:

- `spiral` and polar checker are included in the first slice.
- Reuse existing origin controls where possible.
- Future versions could add logarithmic spiral behavior or source-specific phase controls.

## 4. Distance Field Shapes

Signed or unsigned distance fields from primitive shapes.

Shape candidates:

- circle
- square
- line
- capsule
- triangle-ish approximation
- repeated tiled shapes

Useful visual results:

- clean geometric masks
- contour bands around shapes
- shape combinations through binary operators
- strong editable design language

Likely controls:

- shape type
- origin X/Y
- size / radius
- thickness
- rotation
- repeat/tile count

Implementation notes:

- Current `rings` and `square` are already simple distance-field variants.
- A generalized shape-distance type could unify or extend them later.
- Avoid overbuilding shape composition until one-shape fields prove useful.

## 5. Tile / Checker Gradients

Discrete 2D pattern families.

Examples:

- checkerboard
- brick pattern
- diagonal checker
- woven pattern
- hex-ish approximation

Useful visual results:

- high contrast repeated structures
- strong XOR/AND/OR results
- retro/game-like tiling

Likely controls:

- tile width
- tile height
- phase offset
- stagger amount
- diagonal skew
- rotation or angle

Implementation notes:

- `checker` is a simple high-payoff first addition.
- Brick/woven can come later as submodes if the UI supports type-specific mode selectors.

## 6. Interference / Wave Fields

Fields built from sums or combinations of waves.

Examples:

```text
sin(x * f1) + sin(y * f2)
sin(distance(pointA)) + sin(distance(pointB))
```

Possible modes:

- linear wave
- radial wave
- two-source interference
- multi-source interference

Useful visual results:

- ripple patterns
- moire/interference bands
- animated wave textures
- smooth continuous source for quantized integer fields

Likely controls:

- frequency 1
- frequency 2
- phase speed
- source spacing
- source origin(s)
- contrast / quantization

Implementation notes:

- Good fit for LUT cycling.
- Keep source count fixed in the shader for first slice.
- `interference` is a strong recommended implementation candidate.

## 7. Fractal / Iterated Gradients

More procedural math-heavy fields.

Examples:

- Mandelbrot-ish escape count
- Julia-ish escape count
- domain-warped noise
- fBm noise
- ridged noise
- turbulence

Useful visual results:

- highly detailed procedural patterns
- organic/chaotic structures
- rich LUT response

Likely controls:

- iterations
- zoom / scale
- seed or constant
- warp amount
- octaves
- contrast

Implementation notes:

- Heavier in shader than most current types.
- Keep iteration counts modest.
- Domain-warped/ridged noise may be more compatible with the current shader than full fractal escape-time rendering.

## 8. Bitwise Coordinate Fields

First slice implemented:

- `bitwiseCoord` field type replacing the old single `X XOR Y` field.
- Dropdown mode selector, not a numeric mode slider.
- Modes: XOR, AND, OR, XNOR, NAND, NOR, Add Shift, XOR Shift, AND Shift, OR Shift, Popcount XOR/AND/OR, Lowbit XOR/AND/OR, Highbit XOR/AND/OR.
- Controls: coordinate scale, bit shift, operation mode.

The old `X XOR Y` field is now mode `XOR` inside the full bitwise-coordinate family.

Examples:

```text
x & y
x | y
x ^ y
~(x ^ y)
~(x & y)
~(x | y)
x + (y << k)
popcount(x ^ y)
popcount(x & y)
popcount(x | y)
lowest set bit of x/y expression
highest set bit of x/y expression
```

Useful visual results:

- Sierpinski-like structures
- hard binary artifacts
- patterns uniquely aligned with the project identity
- excellent interaction with bitwise combine modes

Likely controls:

- coordinate scale
- bit shift
- operation mode
- mask depth
- optional coordinate offset

Remaining implementation notes:

- This is one of the most project-specific directions.
- The second slice now covers complement, shifted, popcount, lowbit, and highbit variants.
- Future versions could add coordinate offsets, mask-depth controls, channel-swizzled coordinates, or explicit bitplane slicing.

## 9. Quantized Noise Families

The current `noise` gradient is one variant. It can be expanded.

Ideas:

- cellular noise
- value noise bands
- ridged noise
- blocky random grid
- hash grid
- smoothed hash grid

Useful visual results:

- terrain-ish fields
- organic masks
- stochastic but controllable patterns
- good source material for LUT generators

Likely controls:

- seed
- block size
- octaves
- contrast
- threshold / banding
- drift X/Y

Implementation notes:

- Current noise controls provide a baseline.
- Blocky hash-grid noise would be cheap and visually distinct from current smooth noise.
- Ridged noise would add strong contour-like detail.

## 10. Curve / Function Fields

Mathematical functions over coordinates.

Examples:

```text
x * y
x^2 + y^2
abs(x - y)
sin(x * y)
atan-like combinations
```

Useful visual results:

- algebraic structures
- saddle/hyperbola-like patterns
- distinctive non-gradient fields
- good with arithmetic combine modes

Likely controls:

- scale
- coefficient A/B
- function mode
- contrast
- offset speed

Implementation notes:

- Cheap to implement.
- Can become visually extreme quickly, so range normalization matters.
- A `formula` gradient type with submodes could cover this family.

## 11. Image / Mask Input

Use external image data as gradient input.

Ideas:

- load grayscale image as gradient A or B
- use image luminance as integer field
- use alpha/mask as field
- combine image-derived field with procedural fields

Useful visual results:

- user-authored patterns
- logos/masks/textures processed through binary combines
- hybrid procedural/manual workflows

Likely controls:

- image upload
- channel: luminance/red/green/blue/alpha
- fit mode: stretch/contain/tile
- value scaling

Implementation notes:

- Powerful, but adds file input and texture state complexity.
- Should come later than pure procedural gradients.
- Needs careful handling for static GitHub Pages/local browser security constraints.

## 12. Composed Gradient Nodes

Not a single gradient type, but a future architecture direction.

Concept:

```text
base gradient
  modified by another gradient
  combined with an operation
  result becomes Grad 1 or Grad 2
```

Examples:

```text
rings warped by noise
diagonal offset by fan
checker distorted by plasma
spiral masked by Voronoi
```

Useful visual results:

- richer procedural structures
- more intentional pattern design
- reusable mini-node workflows without a full node editor at first

Implementation notes:

- Architectural change, not a quick shader branch.
- Could start as one or two explicit compound gradient types before building a generic node system.
- Avoid this until the single-gradient vocabulary is larger and stable.

## Recommended Next Implementation Batch

Highest payoff without major architecture changes:

1. richer `polar` variants
2. `checker`
3. richer `voronoi` variants
4. bitwise coordinate additions: complements, shifts, popcount, lowbit, highbit
5. `interference`

Why this order:

- `spiral` expands the current polar/fan language with little extra cost.
- `checker` provides a clean discrete pattern that combines well with everything.
- `voronoi` adds a major organic/cellular visual family.
- bitwise coordinate additions reinforce the unique binary identity of the project.
- `interference` adds wave/ripple behavior and works well with animated LUTs.

## Implementation Guidelines

- Keep each new gradient as a normal integer/scalar field that can be previewed in `Grad 1` / `Grad 2`.
- Prefer cheap shader formulas first.
- Reuse existing control metadata patterns in `SPECIFIC_CONTROLS`.
- Keep `FIELD_TYPES`, `FIELD_SHADER_IDS`, and shader `fieldValue()` branches synchronized.
- Avoid adding external data/state until pure procedural options are exhausted.
- Run `node --check src/app.js` after shader/UI changes.
- Use the Render tab `GPU Diagnostics` button when shader output is black or compilation fails.
