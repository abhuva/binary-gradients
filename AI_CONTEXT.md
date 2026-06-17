# AI_CONTEXT.md

## Purpose

Fast handoff context for agents working in this repo. Read this before changing code.

## Product Intent

`binary-gradients` is a static WebGL2 playground for procedural integer-gradient experiments. It renders two configurable integer/scalar fields, combines them with binary or arithmetic operations, and maps the result through an editable lookup table.

The project intentionally stays lightweight: vanilla HTML/CSS/JavaScript, no backend, no build step, no framework.

Live site:

```text
https://abhuva.github.io/binary-gradients/
```

## Repository Shape

Main files and module groups:

- `index.html`: static UI shell for tabs, panels, render stage, and LUT dock.
- `styles.css`: compact square-corner dev-tool styling.
- `src/app.js`: composition root; owns app state, event orchestration, animation timing, render snapshots, and module wiring.
- `src/domain/`: pure registries, initial state, value-range helpers, color helpers, and random/ID helpers.
- `src/lut/`: built-in LUTs, editable LUT model/export logic, and LUT generators.
- `src/render/`: shader contract, shader source, WebGL2 renderer, LUT texture upload, and GPU diagnostics.
- `src/ui/`: DOM binding, gradient controls, LUT editor canvas/markers, and viewport pan/zoom.
- `tests/`: dependency-free Node tests for pure modules and shader/registry contracts.
- `package.json`: marks the repo as ES modules for Node validation and exposes `npm test`; no dependencies are declared.
- `.github/workflows/pages.yml`: GitHub Pages deployment workflow.
- `docs/architecture.md`: detailed architecture notes.
- `docs/history-and-sources.md`: historical/research background.
- `docs/refactor-plan.md`: modular architecture refactor plan and completed extraction checklist.
- `docs/wiki/`: in-app context wiki articles loaded from the browser through a static manifest.
- `docs/agent-handoff.md`: older handoff notes; useful, but check against current code before relying on paths or UI details.

## Current Architecture Baseline

The runtime pipeline is GPU-only:

```text
UI state
  -> WebGL uniforms and LUT texture
  -> fragment shader computes gradient A and gradient B
  -> shader combines integer values
  -> shader samples LUT texture
  -> canvas displays final color
```

There is no CPU renderer. This is intentional because high resolutions and larger value ranges are impractical on CPU.

The runtime now uses native ES modules. Preserve the separation:

```text
src/app.js       -> composition and orchestration
src/domain/*    -> pure domain data/helpers
src/lut/*       -> LUT model/generators
src/render/*    -> WebGL/shader ownership
src/ui/*        -> DOM interaction and pointer UI
```

Do not move domain logic back into `src/app.js`. Prefer adding new gradients, combines, controls, or LUT behavior in the owning module and only wiring the user interaction in `src/app.js`.

Preset serialization lives in `src/domain/presets.js`. Browser storage, file import/export, and UI wiring stay in `src/app.js`.

Wiki article loading and parsing lives in `src/wiki/`. The stage overlay UI lives in `src/ui/wiki-panel.js`.

## Runtime State

Important state fields include:

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
  paletteCycleDirection,
  cycleSeconds,
  paletteRunning
}
```

`valueBits` currently supports `8..13` bits:

```text
8  -> 256
9  -> 512
10 -> 1024
11 -> 2048
12 -> 4096
13 -> 8192
```

The app clamps active value depth to `gl.MAX_TEXTURE_SIZE` if needed.

## Gradient System

Current gradient types:

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

`linear` covers horizontal, vertical, and diagonal gradients through its `angle` parameter:

```text
0 deg  -> horizontal
90 deg -> vertical
45 deg -> diagonal
```

`square` covers box and diamond-style fields through its `angle` parameter:

```text
0 deg  -> axis-aligned box
45 deg -> diamond orientation
```

`voronoi` is a procedural hash-grid Voronoi field with:

```text
Cell ID      -> nearest cell ID
Distance     -> distance to nearest point
Edge / Ridge -> edge/ridge value from F2-F1

Euclidean
Manhattan
Chebyshev
```

`modulo` is a stripe/modulo field with:

```text
Linear Stripes      -> rotated linear stripes
Grid Sum            -> summed grid/diagonal stripes
Coefficient Formula -> floor(x) * X Mult + floor(y) * Y Mult
```

`polar` is an angular/radial field with:

```text
Spiral
Angular Stripes
Polar Checker
```

`bitwiseCoord` replaces the old single `X XOR Y` field with dropdown modes:

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

Shift modes use `x` with `y << Bit Shift` masked to the active value depth. Popcount modes scale the set-bit count across the active value range. Lowbit/highbit modes return the lowest or highest set bit in the selected bitwise expression.

Each gradient stores a full parameter object. Not every type uses every parameter.

Common controls:

- `offset`
- `offsetSpeed`
- `scale`, except Plasma and Fan do not show scale because it has no effect there.

`scale`, `offset`, and `offsetSpeed` slider bounds are resolved in the UI from the active value depth. Do not reintroduce fixed 8-bit limits for these common controls.

Type-specific controls are defined in `SPECIFIC_CONTROLS`.

Gradient controls support range sliders by default and dropdowns through metadata:

```js
{ key, label, type: 'select', options: { value: 'Label' } }
```

Use dropdowns for discrete modes; do not expose mode numbers as sliders.

Gradient controls are generated dynamically in `renderGradientPanel()` and `createGradientControl()`. Range controls in Grad 1/2 use compact single-line rows: label, slider, value, and for offset `Speed` a `0` snap button.

Every generated gradient slider has compact `-` / `+` buttons that step by the slider's configured step size. Select controls do not get step buttons. The linear `Angle` control additionally has quick-set buttons for `90`, `180`, and `270`.

Generated gradient dropdown rows use a wider select column so closed dropdown text remains readable.

## Shader Mapping Rules

The shader source lives in `src/render/shader-source.js`. The WebGL lifecycle lives in `src/render/webgl-renderer.js`.

Keep JS registries and shader branches synchronized:

- `FIELD_TYPES` / `FIELD_SHADER_IDS` maps to `fieldValue()` numeric branches.
- `COMBINE_OPERATION_TYPES` / `COMBINE_OPERATION_SHADER_IDS` maps to `combineBaseValues()` numeric branches.
- `COMBINE_MODIFIER_TYPES` / `COMBINE_MODIFIER_SHADER_IDS` maps to `combineValues()` modifier behavior.
- `GRADIENT_WRAP_TYPES` / `GRADIENT_WRAP_SHADER_IDS` maps to field and palette wrap mode uniforms.

Gradient uniform array ownership is explicit in `src/render/shader-contract.js` through `GRADIENT_UNIFORM_LENGTH`, `GRADIENT_UNIFORM_SLOTS`, and `packGradientUniforms()`.

Important WebGL details already handled:

- GLSL helper names should avoid reserved/confusing names; use `smoothCurve`, not `smooth`.
- Array uniform locations are queried as `u_g1[0]` and `u_g2[0]`.
- Shader compile/link errors are shown through GPU diagnostics and console output.

## Combine Modes

`Render > Combine` uses two button rows instead of a dropdown:

```text
Operation -> XOR, AND, OR, XNOR, NAND, NOR, ADD, SUB, DIFF, MUL, MIN, MAX
Modifier  -> None, Shift Grad 2, Popcount, Lowbit, Highbit
```

The operation combines Grad 1 and Grad 2. `Shift Grad 2` applies `(Grad 2 << Combine Shift) & valueMask` before the operation. `Popcount`, `Lowbit`, and `Highbit` transform the operation result. Popcount is scaled across the active value range so it remains visible with LUTs.

Legacy/current operation IDs:

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

Adding a combine operation or modifier requires both JS registry changes and shader behavior.

## Field Wrap And Palette Wrap

`Render > Field Wrap` controls how raw scalar gradient values are folded before Grad 1 and Grad 2 are combined. This affects pattern geometry.

`Render > Palette Wrap` controls how the final combined value plus palette offset indexes the LUT. This affects color traversal.

`Render > Palette > Offset` has compact `-` / `+` buttons that step the palette offset by the slider step. The buttons use wrapped offset math, so decreasing below zero wraps to the active value mask.

Both wrap controls currently support:

- `Loop / saw`: values wrap from the high end back to zero.
- `Ping-pong`: values bounce between zero and max.

Palette cycling follows `paletteWrapMode`:

- In loop mode, `paletteOffset` wraps normally.
- In ping-pong mode, `paletteOffset` moves `0 -> max -> 0`, and the visible Offset slider moves back and forth.

`Cycle Seconds` means one full cycle duration. For ping-pong, that means a full `0 -> max -> 0` traversal.

`wrapRange()` must preserve fractional values. Do not reintroduce `Math.floor()` there; slow cycle speeds need fractional accumulation.

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

Point kinds:

```text
smooth -> interpolated stop
hard   -> exact point override
```

The LUT editor is shown as a wide bottom dock in the render stage when the LUT tab is active. The main render remains visible above it.

The LUT side panel includes first-slice automatic generators:

- `Harmony`: color-theory stop sets using complementary/analogous/triadic-style hue offsets.
- `HSV Waves`: sine-wave hue/saturation/value stop paths.
- `Bit Pattern`: integer/bit-inspired stop colors based on popcount and low/high nibble variation.
- `Random Walk`: seeded color-space drift.
- `Physical Preset`: curated fire/ice/thermal/topo/ocean/oil/toxic/sunset/CRT/VGA families with seeded variation.
- `Seamless Cycle`: first/last color matched for smoother palette cycling.
- `Mirror / Symmetry`: exact, inverted, complementary, or brightness-mirrored palettes.
- `Bitplane`: high-bit, low-bit, popcount, or power-of-two color emphasis.
- `Bands / Posterize`: duplicated stops for hard-edged bands.
- `Scientific Diverging`: readable diverging palettes.
- `Luminance Controlled`: monotonic brightness with hue variation.
- `Color Ramp`: three explicit color stops.
- `Chaos Map`: logistic-map color paths.
- `Fourier Waves`: multi-harmonic color waves.
- `Ease Curve`: linear/smooth/exponential/log/pulse/stepped ramps.

Generator controls are intentionally compact: generator type, seed, base hue, detail, contrast, generate, and random seed. Generator-specific controls render dynamically below the common controls and regenerate live when changed. Base hue, detail, and contrast also regenerate live; seed only changes through `Generate` or `Random Seed`. Generators replace the current LUT with editable points and use the `buildLut()` path from `src/lut/model.js`. They do not create hidden raw LUT textures.

The LUT generator dropdown has a small right-aligned contextual `?` help button below it. The button opens `lut-generator-${generatorId}`, so every key in `LUT_GENERATOR_TYPES` must have a matching article in `docs/wiki/index.json`.

LUT edits update the renderer in realtime when:

- dragging a marker
- adding a smooth or hard point
- deleting a point
- changing point index
- changing point color
- changing point kind
- applying LUT length

`Apply LUT` registers the current LUT into the palette selector under its sanitized ID. It is not required for live preview.

Exported LUT JSON is normalized as:

```json
{
  "version": 1,
  "id": "name",
  "length": 256,
  "gradientStops": [],
  "pointOverrides": []
}
```

At render time, the current LUT is built into RGB data and scaled to a GPU texture with width `state.valueRange`.

## Preset System

Presets are versioned snapshots of the current visual recipe:

```text
canvas size/value depth
render timing and palette cycling settings
combine operation/modifier settings
Grad 1 and Grad 2 full gradient definitions
current editable LUT definition
current animation time
```

Presets intentionally do not store runtime/device state, active tab, gradient preview toggles, viewport pan/zoom, or presentation mode.

The Presets tab saves presets to browser `localStorage` under `binary-gradients.presets.v1`. It also supports JSON export/import for moving presets between browsers or machines. Imported presets are normalized through `normalizePreset()` before storage or load.

Preset storage now has two layers:

```text
built-in presets -> loaded from presets/builtin-presets.json at startup
user presets     -> saved in localStorage as a collection
```

The Presets tab renders a unified clickable browser with search and tag filters. Clicking a preset loads it immediately. User presets override built-ins with the same ID in the displayed list. `Export Collection` downloads the full user collection; `Export Selected` keeps single-preset export available.

## UI Contracts

Current tabs:

```text
Presets
Render
Canvas
Grad 1
Grad 2
LUT
```

Preview behavior:

```text
Render -> final combined result
Canvas -> final combined result
Grad 1 -> final combined result by default; gradient 1 only when its preview toggle is enabled
Grad 2 -> final combined result by default; gradient 2 only when its preview toggle is enabled
LUT -> final combined result
```

`state.previewMode` is derived from `state.activeTab` and `state.gradientPreviewEnabled` through `previewModeForActiveTab()`. Do not make Grad 1 / Grad 2 tab activation implicitly change to individual-preview mode.

The stage supports wheel zoom and drag pan. Viewport zoom/pan persists across tab switches; only explicit Reset View, canvas size changes, initial load, and window resize should recenter the canvas.

The Canvas tab `Use Window` button copies the current browser window `innerWidth` and `innerHeight` into the canvas size fields, applies them, and recenters the viewport. This is a convenience for setting render dimensions; it is not presentation/fullscreen mode.

On startup, the app runs the same window-size application once so the initial render dimensions match the current browser window.

Presentation mode is entered through the small button in the left-panel title area. It hides the UI, disables viewport interaction, and fits the existing canvas uniformly inside the browser window without changing render dimensions or distorting pixels. It exits on any key or through the floating top-left button. That floating button appears on mouse movement and hides again after roughly two seconds of no mouse movement.

The UI style should remain compact, square-cornered, and tool-like:

- Monospace typography.
- No decorative marketing layout.
- Pixelated canvas rendering.
- Small but readable controls.
- Render-tab sliders use compact single-line rows where practical.

## Context Wiki

The in-app wiki is a static, dependency-free help/education system:

- Section headers use `data-wiki="article-id"`.
- `src/ui/wiki-panel.js` decorates those headers with compact `?` buttons.
- Clicking a `?` opens a stage overlay while keeping the left panel visible.
- Article files live under `docs/wiki/`.
- `docs/wiki/index.json` maps article IDs to markdown files because static browser JavaScript cannot list directories.
- Markdown files use simple frontmatter with fields like `id`, `title`, `summary`, `section`, and `related`.
- `src/wiki/frontmatter.js`, `src/wiki/markdown.js`, and `src/wiki/wiki-loader.js` intentionally implement a small controlled subset instead of adding a markdown/YAML dependency.

When adding a UI section, add a `data-wiki` article ID to its heading and create/update the corresponding article and manifest entry.

The app opens the `welcome` wiki article on startup as a brief intro and first-steps guide.

## Deployment

This is a static site. Production hosting is GitHub Pages.

Workflow:

```text
.github/workflows/pages.yml
```

The workflow uploads the repository root as a static Pages artifact and deploys it. Pushing to `main` triggers deployment.

GitHub repo:

```text
https://github.com/abhuva/binary-gradients
```

Live site:

```text
https://abhuva.github.io/binary-gradients/
```

The Pages workflow currently forces JavaScript actions to Node 24 via:

```yaml
env:
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true
```

GitHub may still warn that upstream action packages target Node 20 internally. Treat that as a dependency warning unless the deployment fails.

## Verification

For JS syntax validation:

```powershell
node --check src/app.js
```

For all module and test syntax validation:

```powershell
Get-ChildItem -Recurse src,tests -Filter *.js | ForEach-Object { node --check $_.FullName }
```

For automated tests:

```powershell
npm test
```

For whitespace/diff validation before commit:

```powershell
git diff --check
```

For local browser testing:

```powershell
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

For deployed-site checks:

```powershell
Invoke-WebRequest -Uri 'https://abhuva.github.io/binary-gradients/' -UseBasicParsing
Invoke-WebRequest -Uri 'https://abhuva.github.io/binary-gradients/src/app.js' -UseBasicParsing
```

## Known Constraints

- WebGL2 is required.
- No CPU fallback exists by design.
- LUT texture width is limited by `gl.MAX_TEXTURE_SIZE`.
- Value depth is restricted to `8..13` bits.
- Shader integer operations assume power-of-two value ranges.
- `src/app.js` is the composition root; keep changes focused and preserve module boundaries.

## Current Non-Goals

- No backend server.
- No build step.
- No npm dependency setup.
- No framework migration.
- No desktop/Tauri wrapper.
- No CPU renderer.

## Change Rules

- Preserve existing user changes; never revert unrelated edits.
- Keep dependencies minimal.
- Prefer small, testable increments.
- Keep `AI_CONTEXT.md` aligned when changing architecture, ownership, UI contracts, rendering behavior, LUT behavior, deployment, or validation flow.
