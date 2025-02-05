
// slider-world

uniform vec2 uMouse;
uniform vec4 uResolution;
uniform float uHover;
uniform sampler2D tex1;

varying vec2 vUv;
varying float vDistProgress; // 奥側の値は小さく、前側の値は大きい。.2 〜 1.
varying float vScaleProgress; // 大きさのスカラ値 0 〜 1

// CSSのobject-fitのcoverのような関数
vec2 coverUv(vec2 uv, vec4 resolution){
  return (uv - .5) * resolution.zw + .5;
}

void main(){
  vec2 uv = coverUv(vUv, uResolution);
  uv = uv - .5; // -.5 〜 .5。uvの値を左右対称にする

  float scale = mix(.7, 1., vScaleProgress);
  uv = uv * scale; // 左右対称に拡大
  uv = uv + .5; // 操作が終われば、元の座標に戻す
  // → 小さい状態から元の大きさにパンさせる

  vec4 t1 = texture(tex1, uv);

  gl_FragColor = t1;
  float alphaProgress = clamp(vDistProgress + .3, 0., 1.); // .3を足して0〜1に制限
  gl_FragColor.a = mix(0., t1.a, alphaProgress); // 奥に行くほど透明度を下げる
}