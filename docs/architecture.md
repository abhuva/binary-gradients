# Architecture Overview

## High-Level Pipeline

The runtime pipeline is fully GPU-based:

```text
UI state
  -> WebGL uniforms
  -> fragment shader computes gradient A and gradient B
  -> shader combines integer values
  -> shader samples LUT texture
  -> canvas displays final color
```

No CPU renderer is present. This is intentional because high resolutions and larger value ranges are unusable on CPU.

## Main Files

### `index.html`

Defines the static UI skeleton:

- Left tool panel.
- Tabs: `Presets`, `Render`, `Canvas`, `Grad 1`, `Grad 2`, `LUT`.
- Main canvas viewport.
- LUT editor canvas.
- GPU diagnostics output.

Gradient controls are not hardcoded in HTML. They are generated from registry metadata in `src/domain/registries.js` and rendered by `src/ui/gradient-panel.js`.

### `styles.css`

Compact dev-tool styling:

- Monospace font.
- No rounded UI chrome except the LUT smooth-point marker shape.
- Small controls.
- Tabbed panel.
- Pixelated canvas rendering.
- LUT marker styling.

### `src/app.js`

Composition root and orchestration layer.

Responsibilities:

- Bind controls and initialize modules.
- Own mutable app state and current editable LUT state.
- Wire UI events to state changes.
- Build render snapshots and call the WebGL renderer.
- Own animation timing and palette cycling.
- Keep readouts and panel state synchronized.

`src/app.js` should not become a dumping ground for domain logic again. Prefer extracting pure behavior to `domain/` or `lut/`, renderer behavior to `render/`, and DOM interaction to `ui/`.

### `src/domain/`

Pure domain modules:

- `registries.js`: field/combine/wrap registries, explicit shader IDs, gradient control metadata, and default gradient parameters.
- `state.js`: initial app state and value-depth resolution.
- `presets.js`: versioned preset snapshot, serialization, and normalization.
- `value-range.js`: clamp/wrap/format helpers.
- `color.js`: RGB/HSV/hex helpers.
- `random.js`: random helpers, IDs, seeded RNG, and popcount.

### `src/lut/`

LUT modules:

- `builtins.js`: built-in editable LUT definitions.
- `model.js`: LUT build, point normalization, clone, sanitize, and export behavior.
- `generators.js`: LUT generator registry, dynamic generator controls, and generator algorithms.

### `src/render/`

WebGL modules:

- `shader-contract.js`: gradient uniform array length and named slot mapping.
- `shader-source.js`: main shader and probe shader source.
- `webgl-renderer.js`: WebGL2 lifecycle, shader compile/link, render, LUT texture upload, and GPU diagnostics.

### `src/ui/`

DOM interaction modules:

- `dom.js`: control binding, select population, small DOM helpers.
- `gradient-panel.js`: generated gradient controls.
- `lut-editor.js`: LUT preview canvas, markers, point drag/edit behavior.
- `viewport.js`: canvas pan/zoom controller.
- `wiki-panel.js`: in-stage context wiki overlay and `?` help button decoration.

### `src/wiki/`

Small dependency-free wiki helpers:

- `frontmatter.js`: simple frontmatter parser for controlled article metadata.
- `markdown.js`: safe markdown subset renderer for in-app articles.
- `wiki-loader.js`: manifest and article fetching with caching.

## State Model

The central state object includes:

```js
state = {
  width,
  height,
  valueBits,
  valueRange,
  valueMask,
  rendererActual,
  time,
  timeScale,
  timeRunning,
  activeTab,
  previewMode,
  gradientPreviewEnabled,
  gradients: [gradient1, gradient2],
  combineOperation,
  combineModifier,
  combineShift,
  fieldWrapMode,
  paletteWrapMode,
  paletteId,
  paletteOffset,
  cycleSeconds,
  paletteRunning
}
```

`valueBits` currently supports 8..13 bits:

```text
8  -> 256
9  -> 512
10 -> 1024
11 -> 2048
12 -> 4096
13 -> 8192
```

The code queries `gl.MAX_TEXTURE_SIZE` and clamps the runtime value depth if needed.

## Gradient Model

Each gradient is a plain object with all possible parameters. Not every gradient type uses every parameter.

Common parameters:

```text
type
scale
offset
offsetSpeed
```

The generated UI hides `scale` for field types where it has no effect, currently Plasma and Fan.

Origin-based parameters:

```text
originX
originY
originAmpX
originAmpY
originSpeedX
originSpeedY
```

Directional/fan parameters:

```text
angle
rotationSpeed
angleMultiplier
```

Plasma/noise parameters:

```text
freq1
freq2
phaseSpeed
warp
seed
octaves
contrast
driftX
driftY
```

Controls are generated from metadata in `COMMON_CONTROLS` and `SPECIFIC_CONTROLS`. Slider controls are the default. Discrete modes should use select metadata:

```js
{ key, label, type: 'select', options: { value: 'Label' } }
```

Generated gradient sliders add compact `-` / `+` step buttons in the UI. Select controls do not get step buttons. The linear `Angle` slider also exposes `90`, `180`, and `270` quick-set buttons.

Generated gradient select rows use a wider select column than slider rows so closed dropdown labels remain readable.

## Gradient Types

Current types:

```text
linear
rings
square
fan
bitwiseCoord
modulo
polar
voronoi
plasma
noise
```

`linear` is the generalized angle-based linear field. The old horizontal, vertical, and diagonal concepts are equivalent to linear angles:

```text
0 deg  -> horizontal
90 deg -> vertical
45 deg -> diagonal
```

`square` is the generalized rotated square-distance field. The old box and diamond concepts are equivalent to square angles:

```text
0 deg  -> axis-aligned box
45 deg -> diamond orientation
```

`voronoi` is a procedural hash-grid cell field. It uses a fixed 3x3 neighbor search in the shader and supports:

```text
Cell ID      -> nearest cell ID
Distance     -> distance to nearest point
Edge / Ridge -> edge/ridge value from F2-F1

Euclidean
Manhattan
Chebyshev
```

`modulo` is a stripe/modulo field:

```text
Linear Stripes      -> rotated linear stripes
Grid Sum            -> summed grid/diagonal stripes
Coefficient Formula -> floor(x) * X Mult + floor(y) * Y Mult
```

`polar` is an angular/radial field:

```text
Spiral
Angular Stripes
Polar Checker
```

`bitwiseCoord` is the generalized bitwise coordinate field:

```text
XOR
AND
OR
XNOR
NAND
NOR
Add Shift
XOR Shift
AND Shift
OR Shift
Popcount XOR
Popcount AND
Popcount OR
Lowbit XOR
Lowbit AND
Lowbit OR
Highbit XOR
Highbit AND
Highbit OR
```

Shift modes combine `x` with `(y << Bit Shift) & valueMask`. Popcount modes scale the set-bit count into the active value range. Lowbit/highbit modes return the lowest or highest set bit from the selected expression.

The numeric shader mapping uses explicit `FIELD_SHADER_IDS` from `src/domain/registries.js`. If adding a gradient type, add a stable shader ID and update the shader branch in `src/render/shader-source.js`.

## Combine Modes

The render combine UI is split into operation and modifier button rows.

Operations:

```text
xor
and
or
xnor
nand
nor
add
sub
diff
mul
min
max
```

Modifiers:

```text
none
shiftB
popcount
lowbit
highbit
```

The operation combines Grad 1 and Grad 2. `shiftB` changes the right-hand input to `(Grad 2 << combineShift) & valueMask` before the operation. The bit-derived modifiers transform the operation result; popcount is scaled across the active value range for LUT visibility.

The numeric shader mapping uses explicit `COMBINE_OPERATION_SHADER_IDS` and `COMBINE_MODIFIER_SHADER_IDS` from `src/domain/registries.js`. If adding a combine operation or modifier, add a stable shader ID and update `combineBaseValues()` or `combineValues()` in `src/render/shader-source.js`.

## WebGL Renderer

`createWebGlRenderer()` in `src/render/webgl-renderer.js` builds a WebGL2 program with:

- Fullscreen triangle vertex shader.
- Fragment shader that computes both gradient fields.
- Integer combine operations.
- LUT texture lookup.

Important uniforms:

```text
u_resolution
u_time
u_paletteOffset
u_valueRange
u_valueMask
u_combineOperation
u_combineModifier
u_combineShift
u_fieldWrapMode
u_paletteWrapMode
u_preview
u_type1
u_type2
u_g1[0]
u_g2[0]
u_lut
```

`packGradientUniforms()` in `src/render/shader-contract.js` serializes each gradient into a fixed-size float array for the shader. Slot ownership is explicit through `GRADIENT_UNIFORM_SLOTS`.

## Preview Modes

The active tab controls what the main canvas shows:

```text
Render -> final result
Canvas -> final result
Grad 1 -> final result unless its preview toggle is enabled
Grad 2 -> final result unless its preview toggle is enabled
LUT -> final result
```

This is implemented by deriving `state.previewMode` from `state.activeTab` and `state.gradientPreviewEnabled`, then passing it to shader uniform `u_preview`.

Tab switching must not reset the viewport camera. Pan/zoom state persists across tabs; reset behavior is reserved for explicit Reset View, canvas size changes, initial load, and window resize.

Render-tab sliders use compact single-line rows where practical, and related short actions can be grouped into button rows to keep the left panel dense.

The Canvas tab includes a `Use Window` action that copies `window.innerWidth` and `window.innerHeight` into the render dimensions, applies the resize, and recenters the viewport. This changes the actual render size.

Presentation mode is a separate UI/display state. It hides the side panel, readout, and LUT dock, disables viewport zoom/drag, and fits the current render canvas uniformly into the browser window without changing `state.width` or `state.height`. Entering presentation mode stores the current viewport camera; exiting via any key or the floating top-left button restores that camera.

## Context Wiki

The context wiki is an in-app educational/help overlay. Section headings use `data-wiki="article-id"` and are decorated with compact `?` buttons by `src/ui/wiki-panel.js`.

Articles live under `docs/wiki/` and are loaded through `docs/wiki/index.json`. The manifest is required because the static browser runtime cannot scan folders.

Each markdown article starts with simple frontmatter:

```text
---
id: render-combine
title: Render > Combine
summary: How two scalar fields are combined.
section: Render
related:
  - gradient-fields
---
```

The wiki renderer intentionally supports a controlled markdown subset: headings, paragraphs, lists, inline code, fenced code blocks, normal links, and `wiki:article-id` internal links. This avoids adding a build step or markdown dependency.

## Field And Palette Wrap

`Render > Field Wrap` controls scalar field folding before Grad 1 and Grad 2 are combined:

```text
raw gradient value + gradient offset -> field wrap -> A/B
```

This affects the underlying pattern geometry.

`Render > Palette Wrap` controls LUT indexing after the gradients have been combined:

```text
combined value + palette offset -> palette wrap -> LUT index
```

This affects color traversal and palette cycling, not the scalar field geometry.

Both wrap controls currently support loop and ping-pong. Legacy presets with the old `gradientWrapMode` field are migrated by copying that value into both `fieldWrapMode` and `paletteWrapMode`.

## Preset System

Presets are versioned visual recipes managed by `src/domain/presets.js`.

Included in a preset:

- Canvas dimensions and value depth.
- Render timing, animation phase, field/palette wrap modes, and palette cycling state.
- Combine operation, modifier, and shift.
- Full Grad 1 and Grad 2 definitions.
- Current editable LUT definition.

Excluded from a preset:

- WebGL/runtime diagnostics such as `rendererActual`.
- Derived value-depth fields beyond normalization output.
- Active tab, gradient preview toggles, viewport pan/zoom, and presentation mode.

The Presets tab is intentionally simple: save current, load/delete saved browser presets, export selected preset JSON, and import preset JSON. Presets are stored in `localStorage` under `binary-gradients.presets.v1`; JSON export/import is the durable cross-browser path.

Loading a preset normalizes all data, recomputes value depth from the current device texture limit, replaces the editable LUT, registers that LUT in the palette selector, regenerates gradient controls, syncs UI controls, recenters the viewport, and renders.

## LUT System

Editable LUT definitions use:

```js
{
  id,
  length,
  points: [
    { id, index, color, kind }
  ]
}
```

`kind` is:

```text
smooth -> interpolated stop
hard   -> exact point override
```

Exported JSON is normalized to:

```json
{
  "version": 1,
  "id": "name",
  "length": 256,
  "gradientStops": [],
  "pointOverrides": []
}
```

At render time, the editable LUT is built into an RGB array and then scaled into a GPU texture of width `state.valueRange`.

## Palette Cycling

Palette cycling follows `paletteWrapMode` and uses seconds per full cycle, not indices per second:

```text
paletteOffset += dt * valueRange / cycleSeconds
```

This keeps animation speed visually comparable when switching from 8-bit to 13-bit value depth.

## Adding A Gradient Type

1. Add label to `FIELD_TYPES`.
2. Add default parameters to `DEFAULT_GRADIENT` if needed.
3. Add controls to `SPECIFIC_CONTROLS`.
4. Add a stable numeric ID to `FIELD_SHADER_IDS`.
5. Add shader branch in `fieldValue()` using that explicit shader ID.
6. If extra parameters are needed, extend `GRADIENT_UNIFORM_SLOTS`, `GRADIENT_UNIFORM_LENGTH`, `packGradientUniforms()`, and the shader reads.
7. Run `node --check src/app.js`.
8. Test in the browser with `GPU Diagnostics` if shader compilation fails.

## Adding A Combine Mode

1. Add label to `COMBINE_OPERATION_TYPES` or `COMBINE_MODIFIER_TYPES`.
2. Add a stable numeric ID to the matching shader ID map.
3. Add branch to shader `combineBaseValues()` for operations or `combineValues()` for modifiers.
4. Run `node --check src/app.js`.
5. Test in browser.

## Known Constraints

- WebGL2 is required.
- No CPU fallback exists by design.
- LUT runtime width is limited by `gl.MAX_TEXTURE_SIZE`.
- Value depth is currently restricted to 8..13 bits.
- Shader integer operations assume power-of-two value ranges.
- Registry shader IDs and shader branches must stay synchronized.
