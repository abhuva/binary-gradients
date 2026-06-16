# AGENTS.md

ALWAYS read `AI_CONTEXT.md` first.

Architecture overview: read [`docs/architecture.md`](docs/architecture.md). Historical/project background: read [`docs/history-and-sources.md`](docs/history-and-sources.md).

## Project Goal

Build and maintain `binary-gradients`: a self-contained browser playground for combining two integer gradient fields through binary/arithmetic operations and colorizing the result through editable LUTs.

Core runtime idea:

```text
A(x, y) = integer gradient / scalar field
B(x, y) = integer gradient / scalar field
V(x, y) = binary_or_arithmetic_op(A, B)
RGB(x, y) = LUT[V]
```

## Technical Direction

- Static site only: vanilla `index.html`, `styles.css`, and `src/app.js`.
- Runtime is browser-native HTML/CSS/JavaScript/WebGL2.
- No backend server is required for production.
- No framework, bundler, package manager, or game engine is currently used.
- GitHub Pages publishes the site from the repository root through `.github/workflows/pages.yml`.
- Keep the app understandable as a compact graphics/dev tool.
- Preserve pixel-sharp rendering and explicit WebGL2 behavior.
- Do not add a CPU renderer or fallback unless the user explicitly requests it.

## Working Agreement

- Keep dependencies minimal; prefer no dependencies for ordinary changes.
- Prefer small, focused increments over broad rewrites.
- Preserve existing user changes; never revert unrelated edits.
- Document run/deploy steps in `README.md` when they change.
- Keep `AI_CONTEXT.md` aligned when changing architecture, UI contracts, rendering behavior, LUT data behavior, deployment, or validation flow.
- Do not create or update a PR unless the user explicitly asks in the current turn.
- This repo auto-deploys on push to `main`; push only when the user asks for changes to be published or when the current task clearly includes updating the live site.

## Terminal Reliability Rules

- Keep terminal checks small and isolated.
- Prefer targeted fast checks before broader validation.
- Use explicit `timeout_ms` values for quick validation commands.
- Use simple PowerShell syntax and avoid over-escaped strings.
- Prefer `rg` for searching files/text.
- Never provide tool-payload JSON arrays as terminal commands.
- If a command appears stalled or fails due to quoting, retry with a simpler equivalent and report the failure mode only if relevant.

## Runtime And UI Conventions

- UI should feel like a compact graphics/debug tool, not a marketing website.
- Use monospace/code-like typography and square-corner controls.
- Keep controls compact but readable.
- Left panel owns tab controls; the stage owns the render canvas and the wide LUT editor dock.
- `Render`, `Canvas`, and `LUT` tabs show the final combined render.
- `Grad 1` and `Grad 2` tabs show their individual gradient previews.
- The LUT editor updates the rendered texture in realtime when handles/colors/points/length change.
- `Apply LUT` registers the current LUT under its ID in the palette selector; it is not required for live preview.
- Palette cycling supports loop and ping-pong behavior through `Render > Gradient Wrap`.

## Rendering Rules

- WebGL2 is required.
- Keep shader mappings synchronized with JS registries:
  - `FIELD_TYPES` / `FIELD_IDS` with shader `fieldValue()` branches.
  - `COMBINE_TYPES` / `COMBINE_IDS` with shader `combineValues()` branches.
  - `GRADIENT_WRAP_TYPES` / `GRADIENT_WRAP_INDEX` with shader `wrapValue()` behavior.
- Do not hardcode `255` or `256` for value-domain logic unless the code is genuinely about byte colors or legacy LUT export format.
- Use `state.valueRange` and `state.valueMask` for active value-depth behavior.
- LUT textures are uploaded at width `state.valueRange`, subject to `gl.MAX_TEXTURE_SIZE`.
- If shader output breaks, use the Render tab `GPU Diagnostics` button and inspect browser console output.

## Common Validation

Run focused checks for code changes:

```powershell
node --check src/app.js
```

For local browser testing:

```powershell
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

For deployment validation after pushing:

```powershell
gh run list --repo abhuva/binary-gradients --workflow "Deploy GitHub Pages" --limit 1
gh run watch <run-id> --repo abhuva/binary-gradients --exit-status
```

Live site:

```text
https://abhuva.github.io/binary-gradients/
```

## Current Non-Goals

- No backend service.
- No build system unless the project genuinely needs one.
- No framework migration for routine UI changes.
- No CPU fallback renderer.
- No desktop wrapper at this time.
- No broad module split unless the immediate task benefits from it.
