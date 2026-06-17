# Modular Architecture Refactor Plan

## Goal

Turn the prototype into a modular, separation-by-concerns architecture while preserving the current product boundary:

- Static vanilla HTML/CSS/JavaScript.
- Browser-native ES modules.
- WebGL2-only renderer.
- No framework, bundler, package manager, backend, or CPU renderer.
- Compact graphics/debug-tool UI.

## Target Architecture

```text
index.html
  -> src/app.js
       -> app/controller-style orchestration
       -> domain registries/state/value helpers
       -> LUT model/generators/export
       -> WebGL renderer/shader contract
       -> UI helpers/panels/viewport
```

Recommended source layout:

```text
src/
  app.js
  domain/
    color.js
    registries.js
    state.js
    value-range.js
  lut/
    builtins.js
    generators.js
    model.js
  render/
    shader-contract.js
    shader-source.js
    webgl-renderer.js
  ui/
    dom.js
    gradient-panel.js
    lut-editor.js
    viewport.js
```

## Dependency Rules

- [x] `domain/*` must not import from `ui/*`, `render/*`, or browser DOM APIs.
- [x] `lut/*` may import from `domain/color.js` and `domain/value-range.js`.
- [x] `render/*` may import from `domain/registries.js` and `render/shader-contract.js`.
- [x] `ui/*` may read state passed into functions and call callbacks, but should not own WebGL resources.
- [x] `app.js` is the composition root and may import all modules.
- [x] Shader IDs and uniform slots must be explicit constants, not implicit object order.
- [x] Renderer receives snapshots/data and exposes imperative methods; it should not query arbitrary controls.

## Refactor Tasks

- [x] Document target architecture and dependency rules.
  - [x] Add this plan.
  - [x] Keep `AI_CONTEXT.md` aligned after implementation.
  - [x] Update `docs/architecture.md` after the module split.

- [x] Extract pure domain modules.
  - [x] Move value range helpers out of `src/app.js`.
  - [x] Move color conversion helpers out of `src/app.js`.
  - [x] Move field/combine/wrap registries and gradient controls out of `src/app.js`.
  - [x] Move default state/default gradient construction out of `src/app.js`.
  - Dependencies: none.

- [x] Extract LUT modules.
  - [x] Move built-in LUT definitions to `src/lut/builtins.js`.
  - [x] Move LUT build/normalize/clone/export functions to `src/lut/model.js`.
  - [x] Move LUT generator metadata and generator functions to `src/lut/generators.js`.
  - Dependencies: domain color/value helpers.

- [x] Extract renderer modules.
  - [x] Move shader source to `src/render/shader-source.js`.
  - [x] Move shader IDs/uniform slots to `src/render/shader-contract.js`.
  - [x] Move WebGL lifecycle, render, LUT upload, and diagnostics to `src/render/webgl-renderer.js`.
  - Dependencies: registries, shader contract, shader source.

- [x] Extract UI modules.
  - [x] Move DOM helpers and select population to `src/ui/dom.js`.
  - [x] Move gradient control rendering to `src/ui/gradient-panel.js`.
  - [x] Move LUT editor canvas/marker behavior to `src/ui/lut-editor.js`.
  - [x] Move viewport pan/zoom behavior to `src/ui/viewport.js`.
  - Dependencies: domain registries and LUT model.

- [x] Keep `src/app.js` as orchestration.
  - [x] Bind controls.
  - [x] Own mutable app state and selected LUT state.
  - [x] Wire UI events to state changes.
  - [x] Request renderer updates from state snapshots.
  - [x] Own animation tick loop.
  - Dependencies: all extracted modules.

- [x] Validate.
  - [x] Run `node --check src/app.js`.
  - [x] Run syntax checks for all new modules.
  - [x] Run `git diff --check`.
  - [ ] Manually browser-test via `python -m http.server 8080` when visual validation is needed.

## Follow-Up Architecture Work

- [x] Add Node tests for pure modules.
  - [x] LUT interpolation and hard-point overrides.
  - [x] LUT export format.
  - [x] Generator determinism by seed.
  - [x] Palette wrapping and ping-pong cycle math.
  - [x] Registry ID stability.
  - [x] Shader/uniform contract guards.

- [ ] Consider a small action/reducer layer once preset save/load or undo/redo exists.

- [ ] Consider generated shader branches only if the gradient registry grows enough to justify it.
