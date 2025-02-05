precision mediump float;

#pragma glslify: noise2 = require(glsl-noise/simplex/2d);
#pragma glslify: noise3 = require(glsl-noise/simplex/3d);

varying vec2 vUv;
uniform sampler2D tex1;
uniform sampler2D tex2;
uniform sampler2D texDisp;
uniform float uTick;
uniform float uProgress;

float parabola( float x, float k ) {
  return pow( 4. * x * ( 1. - x ), k );
}

void main() {

  vec4 texDisp = texture(texDisp, vUv);
  float disp = texDisp.r;
  // → ピクセルが白い部分ではテクスチャが大きく変位し、より黒い部分ではあまり変位しないといった効果を出す
  //   白い部分 → 1
  //   黒い部分 → 0

  // 勾配をつける。0、1のときに0を返す。0.5で1を返す。
  disp = disp * parabola(uProgress, 1.0);
  vec2 dispUv = vec2(vUv.x, vUv.y + disp);
  vec2 dispUv2 = vec2(vUv.x, vUv.y - disp);
  
  vec4 texCurrent = texture(tex1, dispUv);
  vec4 texNext = texture(tex2, dispUv2);

  gl_FragColor = mix(texCurrent, texNext, uProgress);
}