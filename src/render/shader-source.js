import { COMBINE_MODIFIER_SHADER_IDS, COMBINE_OPERATION_SHADER_IDS, FIELD_SHADER_IDS, GRADIENT_WRAP_SHADER_IDS } from '../domain/registries.js';
import { GRADIENT_UNIFORM_LENGTH } from './shader-contract.js';

export function createMainShaderSources() {
  const pingPongWrapId = GRADIENT_WRAP_SHADER_IDS.pingpong;
  const vs = `#version 300 es
  precision highp float;
  const vec2 POS[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
  void main() { gl_Position = vec4(POS[gl_VertexID], 0.0, 1.0); }
  `;

  const fs = `#version 300 es
  precision highp float;
  precision highp int;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_paletteOffset;
  uniform float u_valueRange;
  uniform int u_valueMask;
  uniform int u_combineOperation;
  uniform int u_combineModifier;
  uniform int u_combineShift;
  uniform int u_fieldWrapMode;
  uniform int u_paletteWrapMode;
  uniform int u_preview;
  uniform int u_type1;
  uniform int u_type2;
  uniform float u_g1[${GRADIENT_UNIFORM_LENGTH}];
  uniform float u_g2[${GRADIENT_UNIFORM_LENGTH}];
  uniform sampler2D u_lut;
  out vec4 outColor;

  float pingPongValue(float v) {
    float peak = max(1.0, u_valueRange - 1.0);
    float t = mod(v, peak * 2.0);
    return t <= peak ? t : peak * 2.0 - t;
  }
  float wrapFieldValue(float v) {
    float whole = floor(v);
    if (u_fieldWrapMode == ${pingPongWrapId}) return pingPongValue(whole);
    return mod(floor(v), u_valueRange);
  }
  float wrapPaletteValue(float v) {
    if (u_paletteWrapMode == ${pingPongWrapId}) return pingPongValue(v);
    return mod(v, u_valueRange);
  }
  float smoothCurve(float t) { return t * t * (3.0 - 2.0 * t); }
  vec2 smoothCurve(vec2 t) { return t * t * (3.0 - 2.0 * t); }
  float hash2(vec2 p, float seed) { return fract(sin(dot(p, vec2(127.1, 311.7)) + seed * 74.7) * 43758.5453); }
  vec2 hashCellPoint(vec2 cell, float seed) {
    return vec2(hash2(cell, seed), hash2(cell + vec2(19.19, 73.73), seed + 11.0));
  }
  float voronoiDistance(vec2 delta, int metric) {
    vec2 a = abs(delta);
    if (metric == 1) return a.x + a.y;
    if (metric == 2) return max(a.x, a.y);
    return length(delta);
  }
  vec2 rotate2(vec2 p, float radiansValue) {
    float c = cos(radiansValue);
    float s = sin(radiansValue);
    return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
  }
  float scaledModuloValue(float value, float moduloCount) {
    float remainder = mod(value, moduloCount);
    return floor((remainder / max(1.0, moduloCount - 1.0)) * (u_valueRange - 1.0));
  }
  int popcountInt(int value) {
    int n = value & u_valueMask;
    int count = 0;
    for (int i = 0; i < 16; i++) {
      count += n & 1;
      n = n >> 1;
    }
    return count;
  }
  int lowbitInt(int value) {
    int n = value & u_valueMask;
    return n & -n;
  }
  int highbitInt(int value) {
    int n = value & u_valueMask;
    int bit = 0;
    for (int i = 0; i < 16; i++) {
      if (n > 0) bit = 1 << i;
      n = n >> 1;
    }
    return bit;
  }
  float valueNoise(vec2 p, float seed) {
    vec2 i = floor(p);
    vec2 f = smoothCurve(fract(p));
    float a = hash2(i, seed);
    float b = hash2(i + vec2(1.0, 0.0), seed);
    float c = hash2(i + vec2(0.0, 1.0), seed);
    float d = hash2(i + vec2(1.0, 1.0), seed);
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fieldValue(int type, float g[${GRADIENT_UNIFORM_LENGTH}], vec2 pixel, vec2 uv) {
    float scale = max(1.0, g[0]);
    float offset = g[1] + u_time * g[2];
    float ox = g[3] + sin(u_time * g[5]) * g[7];
    float oy = g[4] + sin(u_time * g[6]) * g[8];
    vec2 origin = vec2(ox, oy) * (u_resolution - 1.0);
    vec2 d = pixel - origin;
    float value = 0.0;

    if (type == ${FIELD_SHADER_IDS.linear}) {
      float a = radians(g[9] + u_time * g[10]);
      value = floor((cos(a) * pixel.x + sin(a) * pixel.y) / scale);
    }
    else if (type == ${FIELD_SHADER_IDS.rings}) value = floor(length(d) / scale);
    else if (type == ${FIELD_SHADER_IDS.square}) {
      float a = radians(g[9] + u_time * g[10]);
      vec2 q = vec2(cos(a) * d.x - sin(a) * d.y, sin(a) * d.x + cos(a) * d.y);
      value = floor(max(abs(q.x), abs(q.y)) / scale);
    }
    else if (type == ${FIELD_SHADER_IDS.fan}) {
      float a = atan(d.y, d.x) + 3.14159265359 + radians(u_time * g[10]);
      value = floor((a / 6.28318530718) * u_valueRange * max(1.0, g[11]));
    }
    else if (type == ${FIELD_SHADER_IDS.bitwiseCoord}) {
      int x = int(floor(pixel.x / scale)) & u_valueMask;
      int y = int(floor(pixel.y / scale)) & u_valueMask;
      int mode = int(clamp(floor(g[31] + 0.5), 0.0, 18.0));
      int shift = int(clamp(floor(g[32] + 0.5), 0.0, 8.0));
      int shiftedY = (y << shift) & u_valueMask;
      int result = x ^ y;
      if (mode == 1) result = x & y;
      else if (mode == 2) result = x | y;
      else if (mode == 3) result = ~(x ^ y);
      else if (mode == 4) result = ~(x & y);
      else if (mode == 5) result = ~(x | y);
      else if (mode == 6) result = x + shiftedY;
      else if (mode == 7) result = x ^ shiftedY;
      else if (mode == 8) result = x & shiftedY;
      else if (mode == 9) result = x | shiftedY;
      else if (mode == 10) result = int(floor(float(popcountInt(x ^ y)) / 16.0 * (u_valueRange - 1.0)));
      else if (mode == 11) result = int(floor(float(popcountInt(x & y)) / 16.0 * (u_valueRange - 1.0)));
      else if (mode == 12) result = int(floor(float(popcountInt(x | y)) / 16.0 * (u_valueRange - 1.0)));
      else if (mode == 13) result = lowbitInt(x ^ y);
      else if (mode == 14) result = lowbitInt(x & y);
      else if (mode == 15) result = lowbitInt(x | y);
      else if (mode == 16) result = highbitInt(x ^ y);
      else if (mode == 17) result = highbitInt(x & y);
      else if (mode == 18) result = highbitInt(x | y);
      value = float(result & u_valueMask);
    }
    else if (type == ${FIELD_SHADER_IDS.modulo}) {
      int mode = int(clamp(floor(g[23] + 0.5), 0.0, 2.0));
      float moduloCount = max(2.0, floor(g[24] + 0.5));
      float a = radians(g[9] + u_time * g[10]);
      vec2 q = rotate2(pixel, a) / scale;
      float band = floor(q.x);
      if (mode == 1) {
        band = floor(q.x) + floor(q.y);
      } else if (mode == 2) {
        band = floor(q.x) * floor(g[25]) + floor(q.y) * floor(g[26]);
      }
      value = scaledModuloValue(band, moduloCount);
    }
    else if (type == ${FIELD_SHADER_IDS.polar}) {
      int mode = int(clamp(floor(g[27] + 0.5), 0.0, 2.0));
      float angularFrequency = max(1.0, floor(g[28] + 0.5));
      float radialFrequency = max(0.0, floor(g[29] + 0.5));
      float angle = atan(d.y, d.x) + 3.14159265359 + radians(u_time * g[10]);
      float angleTurns = angle / 6.28318530718;
      float radius = length(d) / scale;
      if (mode == 1) {
        value = scaledModuloValue(floor(angleTurns * angularFrequency), angularFrequency);
      } else if (mode == 2) {
        float angularBand = floor(angleTurns * angularFrequency);
        float radialBand = floor(radius * max(1.0, radialFrequency));
        value = scaledModuloValue(angularBand + radialBand, 2.0);
      } else {
        float spiral = angleTurns * angularFrequency + radius * radialFrequency + radius * g[30];
        value = floor(fract(spiral) * (u_valueRange - 1.0));
      }
    }
    else if (type == ${FIELD_SHADER_IDS.voronoi}) {
      vec2 p = (pixel + u_time * vec2(g[19], g[20]) * scale) / scale;
      vec2 baseCell = floor(p);
      vec2 local = fract(p);
      float jitter = clamp(g[15], 0.0, 1.0);
      int metric = int(clamp(floor(g[22] + 0.5), 0.0, 2.0));
      float nearest = 9999.0;
      float second = 9999.0;
      float cellId = 0.0;
      for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
          vec2 neighbor = vec2(float(x), float(y));
          vec2 cell = baseCell + neighbor;
          vec2 point = mix(vec2(0.5), hashCellPoint(cell, g[16]), jitter);
          vec2 delta = neighbor + point - local;
          float dist = voronoiDistance(delta, metric);
          if (dist < nearest) {
            second = nearest;
            nearest = dist;
            cellId = hash2(cell, g[16] + 31.0);
          } else if (dist < second) {
            second = dist;
          }
        }
      }
      int mode = int(clamp(floor(g[21] + 0.5), 0.0, 2.0));
      if (mode == 1) value = floor(clamp(nearest * g[18], 0.0, 1.0) * (u_valueRange - 1.0));
      else if (mode == 2) value = floor(clamp((second - nearest) * g[18], 0.0, 1.0) * (u_valueRange - 1.0));
      else value = floor(cellId * (u_valueRange - 1.0));
    }
    else if (type == ${FIELD_SHADER_IDS.plasma}) {
      float phase = u_time * g[14];
      vec2 c = uv - 0.5;
      float warp = sin((uv.x + uv.y + phase * 0.05) * g[13]) * g[15] * 0.02;
      float v = sin((uv.x + warp) * g[12] + phase)
        + sin((uv.y - warp) * g[13] - phase * 0.7)
        + sin(length(c) * (g[12] + g[13]) - phase * 0.45);
      value = floor((v / 3.0 * 0.5 + 0.5) * (u_valueRange - 1.0));
    }
    else if (type == ${FIELD_SHADER_IDS.noise}) {
      float freq = max(1.0, scale) / 24.0;
      vec2 p = uv * freq + vec2(g[16], g[16] * 1.37) + u_time * vec2(g[19], g[20]);
      float sum = 0.0;
      float amp = 0.5;
      for (int i = 0; i < 5; i++) {
        if (i >= int(g[17])) break;
        sum += valueNoise(p * exp2(float(i)), g[16] + float(i) * 13.0) * amp;
        amp *= 0.5;
      }
      value = floor(pow(clamp(sum * g[18], 0.0, 1.0), 1.2) * (u_valueRange - 1.0));
    }
    return wrapFieldValue(value + offset);
  }

  int combineBaseValues(int a, int b) {
    if (u_combineOperation == ${COMBINE_OPERATION_SHADER_IDS.and}) return a & b;
    if (u_combineOperation == ${COMBINE_OPERATION_SHADER_IDS.or}) return a | b;
    if (u_combineOperation == ${COMBINE_OPERATION_SHADER_IDS.xnor}) return ~(a ^ b);
    if (u_combineOperation == ${COMBINE_OPERATION_SHADER_IDS.nand}) return ~(a & b);
    if (u_combineOperation == ${COMBINE_OPERATION_SHADER_IDS.nor}) return ~(a | b);
    if (u_combineOperation == ${COMBINE_OPERATION_SHADER_IDS.add}) return a + b;
    if (u_combineOperation == ${COMBINE_OPERATION_SHADER_IDS.sub}) return a - b;
    if (u_combineOperation == ${COMBINE_OPERATION_SHADER_IDS.diff}) return abs(a - b);
    if (u_combineOperation == ${COMBINE_OPERATION_SHADER_IDS.mul}) return a * b;
    if (u_combineOperation == ${COMBINE_OPERATION_SHADER_IDS.min}) return min(a, b);
    if (u_combineOperation == ${COMBINE_OPERATION_SHADER_IDS.max}) return max(a, b);
    return (a ^ b) & u_valueMask;
  }

  int combineValues(int a, int b) {
    int right = b;
    if (u_combineModifier == ${COMBINE_MODIFIER_SHADER_IDS.shiftB}) {
      int shift = clamp(u_combineShift, 0, 8);
      right = (b << shift) & u_valueMask;
    }
    int result = combineBaseValues(a, right) & u_valueMask;
    if (u_combineModifier == ${COMBINE_MODIFIER_SHADER_IDS.popcount}) {
      return int(floor(float(popcountInt(result)) / 16.0 * (u_valueRange - 1.0))) & u_valueMask;
    }
    if (u_combineModifier == ${COMBINE_MODIFIER_SHADER_IDS.lowbit}) return lowbitInt(result) & u_valueMask;
    if (u_combineModifier == ${COMBINE_MODIFIER_SHADER_IDS.highbit}) return highbitInt(result) & u_valueMask;
    return result;
  }

  void main() {
    vec2 pixel = gl_FragCoord.xy;
    vec2 uv = pixel / max(vec2(1.0), u_resolution - 1.0);
    int a = int(fieldValue(u_type1, u_g1, pixel, uv));
    int b = int(fieldValue(u_type2, u_g2, pixel, uv));
    int value = combineValues(a, b);
    if (u_preview == 1) value = a;
    else if (u_preview == 2) value = b;
    float lutX = (wrapPaletteValue(float(value) + u_paletteOffset) + 0.5) / u_valueRange;
    outColor = texture(u_lut, vec2(lutX, 0.5));
  }
  `;

  return { vs, fs };
}

export function createProbeShaderSources() {
  return {
    vs: `#version 300 es
    precision highp float;
    const vec2 POS[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
    void main() { gl_Position = vec4(POS[gl_VertexID], 0.0, 1.0); }
    `,
    fs: `#version 300 es
    precision highp float;
    out vec4 outColor;
    void main() { outColor = vec4(1.0, 0.0, 0.0, 1.0); }
    `,
  };
}
