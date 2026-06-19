# Agent Handoff Notes

## Project Identity

Current working project name: `binary-gradients`.

Current folder:

```text
C:\Users\Marc Bielert\Github\visual-experiment
```

The folder name has not yet been renamed, but the desired repo/project name is `binary-gradients`.

## User Preferences / Direction

- The UI should feel like a compact dev tool, not a fancy website.
- No rounded borders or decorative web-design styling.
- Use monospace/code-like typography.
- Keep controls compact but readable.
- Favor pragmatic implementation over frameworks.
- Current stack should remain vanilla HTML/CSS/JS unless there is a strong reason to change.
- The renderer is intentionally WebGL2-only; do not reintroduce CPU fallback unless explicitly requested.

## Current Functional State

The app has these tabs:

```text
Presets
Set
Anim
Comb
Grad 1
Grad 2
LUT
```

Tab preview behavior:

```text
Presets -> final combined result
Set -> final combined result
Anim -> final combined result
Comb -> final combined result
Grad 1 -> final combined result by default; gradient 1 only when the global preview button is enabled
Grad 2 -> final combined result by default; gradient 2 only when the global preview button is enabled
LUT -> final combined result
```

Canvas supports mouse-wheel zoom and drag pan.

The LUT tab has an interactive LUT editor:

```text
circle marker = smooth/interpolated point
triangle marker = hard/exact override point
```

Click LUT bar to add smooth point. Drag marker to move. Click marker to edit selected point.

## Important Implementation Notes

### WebGL Shader Gotchas Already Fixed

- Do not name GLSL helper functions `smooth`; it is reserved. Use `smoothCurve`.
- GLSL array uniform locations must be queried as `u_g1[0]` and `u_g2[0]`, not `u_g1` / `u_g2`.
- Shader compile/link failures are reported through GPU diagnostics.

### Value Depth

The app supports 8..13 bit value ranges:

```text
valueRange = 1 << valueBits
valueMask = valueRange - 1
```

The shader uses these uniforms:

```text
u_valueRange
u_valueMask
```

Do not hardcode 255/256 in shader logic unless it is genuinely about RGBA channel bytes or a legacy editable LUT definition.

### LUT Scaling

Editable LUTs can have their own definition length. At runtime they are scaled to `state.valueRange` and uploaded as a WebGL texture.

Palette cycle speed is defined as `cycleSeconds`, meaning seconds for one complete cycle through the active value range.

### Source Of Truth

`src/app.js` is currently monolithic. If it grows much more, a good refactor would split into:

```text
src/state.js
src/gradients.js
src/lut.js
src/webgl.js
src/ui.js
src/viewport.js
```

Do not refactor opportunistically unless the next task benefits from it.

## Validation

Always run:

```powershell
node --check src/app.js
```

For browser validation, run:

```powershell
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

If GPU output is black or broken, use the `GPU Diagnostics` section in the Set tab and inspect console output.

## Research Summary

Closest known concepts:

- XOR texture: https://lodev.org/cgtutor/xortexture.html
- Krita binary blending modes: https://docs.krita.org/en/reference_manual/blending_modes/binary.html
- XOR blending with gradient layers: https://iaa.fandom.com/wiki/XOR_Blending
- CorelDRAW logical merge modes: https://community.coreldraw.com/cfs-file/__key/telligent-evolution-components-attachments/00-542-01-00-00-11-13-55/Merge-modes.pdf
- Bitwise/Sierpinski math: https://math.stackexchange.com/questions/1080223/what-do-bitwise-operators-look-like-in-3d
- Bitwise AND/Sierpinski explanation: https://lcamtuf.substack.com/p/sierpinski-triangle-in-my-bitwise
- Plasma effect: https://lodev.org/cgtutor/plasma.html

Current conclusion:

```text
The ingredients are known, but the exact generalized formulation of two arbitrary integer gradients combined bitwise and then colorized through a LUT does not appear to have a canonical name. Use binary-gradients.
```
