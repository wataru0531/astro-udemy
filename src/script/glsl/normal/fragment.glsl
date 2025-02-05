

varying vec2 vUv;

uniform vec2 uMouse;
uniform vec4 uResolution;
uniform float uHover;
uniform sampler2D tex1;
uniform sampler2D tex2;
uniform float uEdge;

// CSSのobject-fitのcoverのような関数
vec2 coverUv(vec2 uv, vec4 resolution){
  // uvのxに対してresolutionのzをかける
  // uvのyに対してresolutionのwをかける
  // + .5 ...uv座標の中心点をもとに戻す

  // 例: 真四角の立方体に長方形の画像の中央を表示
  // zは 0.5 、 wは 1のとき

  // (uv - .5) ... 画像を中央に位置させる
  // uv.xに .5、uv.yに 1 をかける
  // + .5 ... uv座標の中心点をもとに戻す
  return (uv - .5) * resolution.zw + .5;
}

void main(){
  // uMouseにはホバーした部分の値が渡る
  // 第1パラメータを、第2パラメータの値が超えたら1を返す。
  vec2 mouse = step(uMouse, vUv);

  vec2 uv = coverUv(vUv, uResolution);

  vec4 tex1 = texture(tex1, uv);
  vec4 tex2 = texture(tex2, uv);

  vec4 color = mix(tex1, tex2, step(uEdge, uv.x));

  gl_FragColor = color;
}