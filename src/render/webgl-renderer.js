import {
  COMBINE_MODIFIER_SHADER_IDS,
  COMBINE_OPERATION_SHADER_IDS,
  FIELD_SHADER_IDS,
  GRADIENT_WRAP_SHADER_IDS,
  normalizeGradientDefinition,
} from '../domain/registries.js';
import { packGradientUniforms } from './shader-contract.js';
import { createMainShaderSources, createProbeShaderSources } from './shader-source.js';

export function createWebGlRenderer(canvas, { onDiagnostic = () => {} } = {}) {
  const gl = canvas.getContext('webgl2', { alpha: false, preserveDrawingBuffer: true });
  if (!gl) throw new Error('WebGL2 context unavailable. GPU rendering is required.');

  let program = null;
  let uniforms = null;
  let lutTexture = null;
  let vao = null;

  init();

  function init() {
    const { vs, fs } = createMainShaderSources();
    program = createProgram(vs, fs);
    gl.useProgram(program);
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    uniforms = {
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      time: gl.getUniformLocation(program, 'u_time'),
      paletteOffset: gl.getUniformLocation(program, 'u_paletteOffset'),
      valueRange: gl.getUniformLocation(program, 'u_valueRange'),
      valueMask: gl.getUniformLocation(program, 'u_valueMask'),
      combineOperation: gl.getUniformLocation(program, 'u_combineOperation'),
      combineModifier: gl.getUniformLocation(program, 'u_combineModifier'),
      combineShift: gl.getUniformLocation(program, 'u_combineShift'),
      fieldWrapMode: gl.getUniformLocation(program, 'u_fieldWrapMode'),
      paletteWrapMode: gl.getUniformLocation(program, 'u_paletteWrapMode'),
      preview: gl.getUniformLocation(program, 'u_preview'),
      type1: gl.getUniformLocation(program, 'u_type1'),
      type2: gl.getUniformLocation(program, 'u_type2'),
      g1: gl.getUniformLocation(program, 'u_g1[0]'),
      g2: gl.getUniformLocation(program, 'u_g2[0]'),
      lut: gl.getUniformLocation(program, 'u_lut'),
    };
    gl.uniform1i(uniforms.lut, 0);
  }

  function resize(width, height) {
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
  }

  function uploadLutTexture(palette, valueRange) {
    const width = valueRange;
    const pixels = new Uint8Array(width * 4);
    for (let i = 0; i < width; i++) {
      const color = palette[Math.floor((i / Math.max(1, width - 1)) * (palette.length - 1))];
      pixels[i * 4] = color[0];
      pixels[i * 4 + 1] = color[1];
      pixels[i * 4 + 2] = color[2];
      pixels[i * 4 + 3] = 255;
    }
    if (!lutTexture) lutTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, lutTexture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  }

  function render(snapshot) {
    if (!program) return;
    clearGlErrors();
    gl.viewport(0, 0, snapshot.width, snapshot.height);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, lutTexture);
    gl.uniform2f(uniforms.resolution, snapshot.width, snapshot.height);
    gl.uniform1f(uniforms.time, snapshot.time);
    gl.uniform1f(uniforms.paletteOffset, snapshot.paletteOffset);
    gl.uniform1f(uniforms.valueRange, snapshot.valueRange);
    gl.uniform1i(uniforms.valueMask, snapshot.valueMask);
    gl.uniform1i(uniforms.combineOperation, COMBINE_OPERATION_SHADER_IDS[snapshot.combineOperation] ?? 0);
    gl.uniform1i(uniforms.combineModifier, COMBINE_MODIFIER_SHADER_IDS[snapshot.combineModifier] ?? 0);
    gl.uniform1i(uniforms.combineShift, snapshot.combineShift ?? 0);
    gl.uniform1i(uniforms.fieldWrapMode, GRADIENT_WRAP_SHADER_IDS[snapshot.fieldWrapMode] ?? 0);
    gl.uniform1i(uniforms.paletteWrapMode, GRADIENT_WRAP_SHADER_IDS[snapshot.paletteWrapMode] ?? 0);
    gl.uniform1i(uniforms.preview, previewIndex(snapshot.previewMode));
    const gradient1 = normalizeGradientDefinition(snapshot.gradients[0]);
    const gradient2 = normalizeGradientDefinition(snapshot.gradients[1]);
    gl.uniform1i(uniforms.type1, FIELD_SHADER_IDS[gradient1.type] ?? 0);
    gl.uniform1i(uniforms.type2, FIELD_SHADER_IDS[gradient2.type] ?? 0);
    gl.uniform1fv(uniforms.g1, packGradientUniforms(gradient1));
    gl.uniform1fv(uniforms.g2, packGradientUniforms(gradient2));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    const error = gl.getError();
    if (error !== gl.NO_ERROR) {
      onDiagnostic(`WebGL render error: ${glErrorName(error)}.`);
      console.warn('WebGL render error.', error);
    }
  }

  function runDiagnostics(snapshot) {
    onDiagnostic(`Vendor: ${gl.getParameter(gl.VENDOR)}`);
    onDiagnostic(`Renderer: ${gl.getParameter(gl.RENDERER)}`);
    onDiagnostic(`Version: ${gl.getParameter(gl.VERSION)}`);
    onDiagnostic(`GLSL: ${gl.getParameter(gl.SHADING_LANGUAGE_VERSION)}`);
    onDiagnostic(`MAX_TEXTURE_SIZE: ${gl.getParameter(gl.MAX_TEXTURE_SIZE)}`);
    onDiagnostic(`Value depth: ${snapshot.valueBits} bit / ${snapshot.valueRange}`);
    onDiagnostic(`Canvas: ${canvas.width}x${canvas.height}`);
    onDiagnostic(`Program linked: ${Boolean(program)}`);
    onDiagnostic(`LUT texture: ${Boolean(lutTexture)}`);
    onDiagnostic(`Uniform resolution: ${Boolean(uniforms?.resolution)}`);
    onDiagnostic(`Uniform g1[0]: ${Boolean(uniforms?.g1)}`);
    onDiagnostic(`Uniform g2[0]: ${Boolean(uniforms?.g2)}`);
    onDiagnostic(`Uniform LUT: ${Boolean(uniforms?.lut)}`);

    clearGlErrors();
    render(snapshot);
    const drawError = gl.getError();
    onDiagnostic(`Post-render gl.getError: ${glErrorName(drawError)}`);

    const pixel = new Uint8Array(4);
    gl.readPixels(Math.floor(snapshot.width / 2), Math.floor(snapshot.height / 2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    const readError = gl.getError();
    onDiagnostic(`Center pixel RGBA: ${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${pixel[3]}`);
    onDiagnostic(`Post-read gl.getError: ${glErrorName(readError)}`);
    probeShaderOutput(snapshot);
  }

  function probeShaderOutput(snapshot) {
    const { vs, fs } = createProbeShaderSources();
    try {
      const oldProgram = program;
      const probeProgram = createProgram(vs, fs);
      clearGlErrors();
      gl.useProgram(probeProgram);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      const pixel = new Uint8Array(4);
      gl.readPixels(Math.floor(snapshot.width / 2), Math.floor(snapshot.height / 2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      onDiagnostic(`Probe solid-red pixel RGBA: ${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${pixel[3]}`);
      onDiagnostic(`Probe gl.getError: ${glErrorName(gl.getError())}`);
      gl.deleteProgram(probeProgram);
      program = oldProgram;
      gl.useProgram(program);
    } catch (error) {
      onDiagnostic(`Probe shader failed: ${error.message}`);
    }
  }

  function createProgram(vsSource, fsSource) {
    const nextProgram = gl.createProgram();
    const vs = compileShader(gl.VERTEX_SHADER, vsSource);
    const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
    gl.attachShader(nextProgram, vs);
    gl.attachShader(nextProgram, fs);
    gl.linkProgram(nextProgram);
    if (!gl.getProgramParameter(nextProgram, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(nextProgram) || 'WebGL program link failed');
    }
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    return nextProgram;
  }

  function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader) || 'unknown compile error';
      onDiagnostic(`${type === gl.VERTEX_SHADER ? 'Vertex' : 'Fragment'} shader failed: ${info}`);
      throw new Error(info);
    }
    const info = gl.getShaderInfoLog(shader);
    if (info) onDiagnostic(`${type === gl.VERTEX_SHADER ? 'Vertex' : 'Fragment'} shader log: ${info}`);
    return shader;
  }

  function clearGlErrors() {
    while (gl.getError() !== gl.NO_ERROR) {
      // Drain stale errors so diagnostics point at the operation being tested.
    }
  }

  function glErrorName(error) {
    const names = new Map([
      [gl.NO_ERROR, 'NO_ERROR'],
      [gl.INVALID_ENUM, 'INVALID_ENUM'],
      [gl.INVALID_VALUE, 'INVALID_VALUE'],
      [gl.INVALID_OPERATION, 'INVALID_OPERATION'],
      [gl.INVALID_FRAMEBUFFER_OPERATION, 'INVALID_FRAMEBUFFER_OPERATION'],
      [gl.OUT_OF_MEMORY, 'OUT_OF_MEMORY'],
      [gl.CONTEXT_LOST_WEBGL, 'CONTEXT_LOST_WEBGL'],
    ]);
    return names.get(error) || `0x${error.toString(16)}`;
  }

  function getMaxTextureSize() {
    return gl.getParameter(gl.MAX_TEXTURE_SIZE);
  }

  function dispose() {
    if (lutTexture) gl.deleteTexture(lutTexture);
    if (program) gl.deleteProgram(program);
    if (vao) gl.deleteVertexArray(vao);
    lutTexture = null;
    program = null;
    vao = null;
    uniforms = null;
  }

  return {
    canvas,
    gl,
    resize,
    uploadLutTexture,
    render,
    runDiagnostics,
    getMaxTextureSize,
    dispose,
  };
}

function previewIndex(previewMode) {
  if (previewMode === 'grad1') return 1;
  if (previewMode === 'grad2') return 2;
  return 0;
}
