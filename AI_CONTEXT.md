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

Main files:

- `index.html`: static UI shell for tabs, panels, render stage, and LUT dock.
- `styles.css`: compact square-corner dev-tool styling.
- `src/app.js`: all current runtime state, UI wiring, WebGL setup, shader source, LUT editing, viewport pan/zoom, and diagnostics.
- `.github/workflows/pages.yml`: GitHub Pages deployment workflow.
- `docs/architecture.md`: detailed architecture notes.
- `docs/history-and-sources.md`: historical/research background.
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

`src/app.js` is currently monolithic. Do not split it opportunistically. A future split could be useful if changes become large enough, likely around:

```text
state
controls/ui
webgl/shader
lut
viewport
export/diagnostics
```

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
  previewMode,
  gradients: [gradient1, gradient2],
  combine,
  gradientWrapMode,
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
horizontal
vertical
diagonal
rings
diamond
box
fan
xorCoord
plasma
noise
```

Each gradient stores a full parameter object. Not every type uses every parameter.

Common controls:

- `offset`
- `offsetSpeed`
- `scale`, except Plasma does not show scale because it has no effect there.

Type-specific controls are defined in `SPECIFIC_CONTROLS`.

Gradient controls are generated dynamically in `renderGradientPanel()` and `createGradientControl()`. Range controls in Grad 1/2 use compact single-line rows: label, slider, value, and for `Offset Speed` a `0` snap button.

## Shader Mapping Rules

The shader source lives inside `initWebGl()` in `src/app.js`.

Keep JS registries and shader branches synchronized:

- `FIELD_TYPES` / `FIELD_IDS` maps to `fieldValue()` numeric branches.
- `COMBINE_TYPES` / `COMBINE_IDS` maps to `combineValues()` numeric branches.
- `GRADIENT_WRAP_TYPES` / `GRADIENT_WRAP_INDEX` maps to `wrapValue()` behavior.

Important WebGL details already handled:

- GLSL helper names should avoid reserved/confusing names; use `smoothCurve`, not `smooth`.
- Array uniform locations are queried as `u_g1[0]` and `u_g2[0]`.
- Shader compile/link errors are shown through GPU diagnostics and console output.

## Combine Modes

Current combine modes:

```text
xor
and
or
add
sub
diff
mul
min
max
```

Adding a combine mode requires both JS registry changes and a shader branch.

## Gradient Wrap And Palette Cycling

`Render > Gradient Wrap` currently supports:

- `Loop / saw`: values wrap from the high end back to zero.
- `Ping-pong`: values bounce between zero and max.

Palette cycling also follows this mode:

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

## UI Contracts

Current tabs:

```text
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
Grad 1 -> gradient 1 only
Grad 2 -> gradient 2 only
LUT -> final combined result
```

The stage supports wheel zoom and drag pan.

The UI style should remain compact, square-cornered, and tool-like:

- Monospace typography.
- No decorative marketing layout.
- Pixelated canvas rendering.
- Small but readable controls.

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
- `src/app.js` is monolithic; keep changes focused until a refactor is justified.

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
