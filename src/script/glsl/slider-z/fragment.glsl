
// slider-z

#pragma glslify: coverUv = require(../shader-util/coverUv)

uniform float uTick;
uniform vec4 uResolution;
uniform float uSlideIdx;
uniform float uActiveSlideIdx;
uniform float uDist;

uniform sampler2D tex1;
varying vec2 vUv;

void main() {
  vec2 uv = coverUv(vUv, uResolution);

  // 中心の座標を0に。-.5 〜 .5
  // → スケーリングや位置をずらした時などに0から1の座標ではずれが生じるため。均等にスケーリングする
  // ここでは頂点をy軸に上下に揺らしているためuv.yもずらす。
  uv -= 0.5; 
  uv.y -= sin(uTick * 0.01) * 0.01;
  uv *= 0.8;
  uv += 0.5; // もとに戻す

  vec4 color = texture2D(tex1, uv);
  gl_FragColor = color;

  // alpha → 初期の値は1。動いている時に0になり、とまれば1になる。
  //         uDistの値を大きくすれば、1
  float alpha = clamp((1. - abs(uActiveSlideIdx - uSlideIdx) * uDist), .0, 1.);

  gl_FragColor.a *= alpha;
}
