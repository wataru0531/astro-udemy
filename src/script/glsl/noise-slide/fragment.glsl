precision mediump float;

#pragma glslify: noise2 = require(glsl-noise/simplex/2d);
#pragma glslify: noise3 = require(glsl-noise/simplex/3d);

varying vec2 vUv;
uniform sampler2D tex1;
uniform sampler2D tex2;

uniform float uTick;
uniform float uProgress;
uniform vec2 uNoiseScale;
uniform float uHover;

void main() {
  vec4 texCurrent = texture(tex1, vUv);
  vec4 texNext = texture(tex2, vUv);

  // n => -1 ~ 1
  float n = noise2(vec2(vUv.x * uNoiseScale.x, vUv.y * uNoiseScale.y));
  n = n * 0.5 - 0.5; // n => -1 ~ 0
  n = n + uProgress; // uProgress => 0 ~ 1 
  // n = n + uHover; // ホバーした場合

  n = step(0.0, n); // nが0.0以上で1を返す
  
  gl_FragColor = mix(texCurrent, texNext, n);
}