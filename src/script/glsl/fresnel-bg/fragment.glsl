
// fresnel

varying vec2 vUv;

uniform vec4 uResolution;
uniform float uReversal;
uniform sampler2D tex1;

#pragma glslify: coverUv = require("../shader-util/coverUv");

void main(){

  vec4 color = texture(tex1, vUv);

  // color.aが0.1未満 → 黒の場合
  // → フラグメントを破棄する。
  //   位置関係によりfresnelの裏に位置したモデルが見えなくなる可能性があるため。
  if(color.a < 0.1){
    // 透明な部分が緑で見えるようになる
    // color.g = 1.;
    // color.a = 1.;

    discard;
  }

  // 元の色か、反転した色か
  vec3 rgb = mix(color.rbg, 1. - color.rgb, uReversal);

  gl_FragColor = vec4(rgb, color.a);
}
