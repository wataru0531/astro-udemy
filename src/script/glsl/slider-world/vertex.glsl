
// slider-world

// このvertexはplaneGeomtryのvertexShader
// なのでここでは５つのテクスチャのmeshの頂点を扱う

varying vec2 vUv;

uniform float uRadius;
uniform float uSlideIdx; // 0 〜 4。planeのスライド1枚づつが持つ番号
uniform float uActiveSlideIdx; // 現在activeなスライド。lerpで渡ってくる
uniform float uSlideTotal; // スライドの総数(テクスチャの数)
uniform float uDist; // easingの勾配 .8
uniform float uTick;

varying float vDistProgress;
varying float vScaleProgress;

void main(){
  vUv = uv;
  vec3 pos = position;

  // mod → モジュラー。JSの%(剰余演算子のこと)。余りを算出することで動的に数値を算出できる
  float activeSlideIdx = mod(uActiveSlideIdx, uSlideTotal); // 0 〜 4

  // アクティブな画像と自分自身がどれだけ離れているか。
  // 自らがactiveだったら、distは0になる
  float dist = abs(activeSlideIdx - uSlideIdx); 

  // 亀 → distは0、deepestは2.5、なのでdistProgressは、１
  // 森 → distは1、deepestは2.5、なのでdistProgressは、0.6くらい
  // → 奥側のplaneほど、distProgressの値が小さくなる
  float deepest = uSlideTotal / 2.; // 2.5 → 一番奥側
  float distProgress = abs(dist - deepest) / deepest;
  vDistProgress = distProgress;
  // easingをつける。0までは0が返る
  // 一度0.6あったものが、0まで行くので一瞬小さくなる
  float scaleProgress = clamp((distProgress - uDist) * 5., 0., 1.); 
  vScaleProgress = scaleProgress;
  pos.xy = pos.xy * (.9 + .2 * scaleProgress); // アクティブだったら必ず1.1になる

  // テクスチャをcylinderに貼り付ける
  // テクスチャのx軸の各頂点からcylinderまでの距離を取得
  // pow 数値の累乗を計算。pow
  float roundZ = uRadius - sqrt(pow(uRadius, 2.) - pow(pos.x, 2.));
  pos.z -= roundZ;

  pos.y += cos(uTick * .03) * 10.; // 上下に揺らす

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
}
