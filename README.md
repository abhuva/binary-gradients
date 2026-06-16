# binary-gradients

A WebGL playground for combining integer gradient fields with binary operations and LUT colorization.

Live site: https://abhuva.github.io/binary-gradients/

The core effect is deliberately simple:

```text
A(x, y) = integer gradient / scalar field
B(x, y) = integer gradient / scalar field
V(x, y) = binary_or_arithmetic_op(A, B)
RGB(x, y) = LUT[V]
```

The current implementation is GPU-only via WebGL2.

## Historical Context

This project recreates and extends an effect Marc discovered experimentally around 1996 using Turbo Pascal / VGA-era graphics. The original workflow involved drawing or filling simple geometric patterns, combining them through logical/binary operations, and animating colors by palette changes.

The exact project formulation is:

```text
create two fullscreen integer gradients
combine them with bitwise/arithmetic operations
map the result through a LUT
optionally animate gradient parameters and palette offset
```

Related historical/technical concepts existed separately:

- XOR textures in demoscene / graphics programming.
- Logical merge/blend modes in graphics tools such as CorelDRAW and Krita.
- VGA/amiga-style palette cycling.
- Bitwise/Sierpinski structures from integer coordinate operations.
- Plasma/noise procedural textures.

The specific generalized pipeline above does not appear to have a widely established canonical name. In this repo we call it `binary-gradients`.

## Current Features

- WebGL2 fragment-shader renderer.
- Two configurable integer gradient fields.
- Gradient previews per tab.
- Bitwise/arithmetic combine modes.
- Runtime value depth from 8 to 13 bits.
- LUT editor with smooth interpolation points and hard override points.
- LUT scaling to the selected value depth.
- Palette cycling by seconds per full cycle.
- Pan/zoom viewport for inspecting the render.
- PNG export from the current canvas.
- GPU diagnostics panel.

## Running

This is a static vanilla HTML/CSS/JS app. Use a local server:

```powershell
cd "C:\Users\Marc Bielert\Github\binary-gradients"
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

Hard-refresh after JS changes if the browser appears to keep stale code.

## Files

```text
index.html      UI structure and panel tabs
styles.css      compact dev-tool styling
src/app.js      all app state, WebGL shader, gradient UI, LUT editor, viewport interaction
docs/           project notes and handoff material
```

## Notes

The app intentionally does not include a CPU fallback. Large value ranges and 4k+ canvases are practical on the GPU but can freeze the browser if rendered on CPU.

## License

This project is licensed under the Creative Commons Attribution-ShareAlike 4.0 International license. See [LICENSE](LICENSE).
