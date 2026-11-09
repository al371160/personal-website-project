// Tilt-shift blur: a sharp horizontal band through the middle of the frame, with
// blur ramping up toward the front (bottom) and back (top) of the pool and,
// more gently, toward the left and right edges. Run it as a separable blur:
// one pass with uDir = (1/width, 0), one with (0, 1/height), optionally twice.

export const TiltShiftShader = {
  name: "TiltShiftShader",
  uniforms: {
    tDiffuse: { value: null },
    uDir: { value: null }, // THREE.Vector2: one-pixel step along the blur axis
    uFocus: { value: 0.52 }, // vertical centre of the sharp band (0 = bottom)
    uFocusX: { value: 0.5 }, // horizontal centre for the side falloff
    uBand: { value: 0.14 }, // half-height of the fully sharp band
    uRamp: { value: 0.32 }, // distance over which blur reaches full strength
    uMaxBlur: { value: 7.0 }, // blur radius in px at full strength
    uSide: { value: 0.45 }, // how much the left/right edges blur (0..1)
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 uDir;
    uniform float uFocus;
    uniform float uFocusX;
    uniform float uBand;
    uniform float uRamp;
    uniform float uMaxBlur;
    uniform float uSide;
    varying vec2 vUv;

    void main() {
      float vertical = smoothstep(uBand, uBand + uRamp, abs(vUv.y - uFocus));
      float side = smoothstep(0.3, 0.5, abs(vUv.x - uFocusX)) * uSide;
      float amount = max(vertical, side);
      vec2 stepUv = uDir * (uMaxBlur * amount / 4.0);

      vec4 sum = texture2D(tDiffuse, vUv) * 0.1633;
      sum += (texture2D(tDiffuse, vUv + stepUv) + texture2D(tDiffuse, vUv - stepUv)) * 0.1531;
      sum += (texture2D(tDiffuse, vUv + 2.0 * stepUv) + texture2D(tDiffuse, vUv - 2.0 * stepUv)) * 0.12245;
      sum += (texture2D(tDiffuse, vUv + 3.0 * stepUv) + texture2D(tDiffuse, vUv - 3.0 * stepUv)) * 0.0918;
      sum += (texture2D(tDiffuse, vUv + 4.0 * stepUv) + texture2D(tDiffuse, vUv - 4.0 * stepUv)) * 0.051;
      gl_FragColor = sum;
    }
  `,
};
