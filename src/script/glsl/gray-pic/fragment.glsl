

varying vec2 vUv;
uniform vec4 uResolution; // Vector4 {x: 600, y: 400, z: 0.75, w: 1}
uniform float uHover;
uniform sampler2D tex1;


// vec2 coverUv(vec2 uv, vec4 resolution){
  // uvのxに対してresolutionのzをかける
  // uvのyに対してresolutionのwをかける
  // + .5 ...uv座標の中心点をもとに戻す

  // 例: 真四角の立方体に長方形の画像の中央を表示
  // zは 0.5 、 wは 1のとき

  // (uv - .5) ... 画像を中央に位置させる
  // uv.xに .5、uv.yに 1 をかける
  // + .5 ... uv座標の中心点をもとに戻す
//   return (uv - .5) * resolution.zw + .5;
// }

#pragma glslify: coverUv = require(../shader-util/coverUv)
#pragma glslify: grayscale = require(../shader-util/grayscale)

void main() {
    vec2 uv = coverUv(vUv, uResolution);

    vec4 t1 = texture2D(tex1, uv);
    // vec4 t1 = texture(tex1, vUv);

    vec4 grayT1 = grayscale(t1);
    vec4 color = mix(grayT1, t1, uHover);

    gl_FragColor = color;
}