
// Reflect slider

// uvのx座表をスライドの枚数分を分割して、それぞれのテクスチャを取得する

varying vec2 vUv;

uniform vec4 uResolution;
uniform float uSlideTotal; // 5
uniform float uActiveSlideIdx; // 0〜5。lerpで渡ってくる
uniform sampler2D tex1;
uniform sampler2D tex2;
uniform sampler2D tex3;
uniform sampler2D tex4;
uniform sampler2D tex5;
uniform float uIsReflect; // オリジナル: 0、反射スライダー: 1

vec2 coverUv(vec2 uv, vec4 resolution){
  return (uv - .5) * resolution.zw + .5;
}

#pragma glslify: grayscale = require(../shader-util/grayscale);

// f → 区間 0., 1., 2., 3., 4.
// x → uvのx座表
// step(edge, x) → xがedgeを超えていたら1を返して、そうでなければ0を返す。0から1までしか返さない
float blockStep(float f, float x){
  // ① step(0. / 5., uv.x) * (1. - step((1.) / 5,, uv.x));
  //   → ・uv.xの.2まで順調に増加
  //     ・uv.xの.2から1が続くが、* 0 となるので 0が返る
  //      → 0. 〜 .2 の範囲だけ1が返る
  // ② step(1. / 5., uv.x) * (1. - step((2.) / 5., uv.x));
  //   →　同様に、.2 〜 .4の範囲にだけ1が返る

  return step(f/uSlideTotal, x) * (1. - step((f + 1.)/uSlideTotal, x));
}

void main(){
  vec2 uv = vUv;
  // mod モジュラー。JSの剰余演算子。余りを算出し、0〜4を返す
  // 合計数で割ることで、0, .2, .4, .6, .8 を返すことができる 
  float activeIdx = mod(uActiveSlideIdx, uSlideTotal) / uSlideTotal;

  // fract ... 少数部分のみを取得。xが.2の座標で1を取得。
  // activeIdxを加えることで、少しづつ左にずらすことができる。
  // → .2を足せば、uv.xの２回り分とれる
  // vec2 fractUv = vec2(fract(uv.x * uSlideTotal), uv.y);
  vec2 fractUv = vec2(fract((uv.x + activeIdx) * uSlideTotal), uv.y);

  fractUv = coverUv(fractUv, uResolution);

  // テクスチャ
  vec4 t1 = texture(tex1, fractUv); //  0 〜 .2
  vec4 t2 = texture(tex2, fractUv); // .2 〜 .4
  vec4 t3 = texture(tex3, fractUv); // .4 〜 .6
  vec4 t4 = texture(tex4, fractUv); // .6 〜 .8
  vec4 t5 = texture(tex5, fractUv); // .8 〜 1.

  // そのuv.xの区間のみで1を取得する。blockStep(区間, uv座表)
  // float bs1 = blockStep(0., uv.x); // 1を返す。 activeIdxは 0 〜 .8 を返すので最終的に1
  // float bs2 = blockStep(1., uv.x); 
  // float bs3 = blockStep(2., uv.x); 
  // float bs4 = blockStep(3., uv.x); 
  // float bs5 = blockStep(4., uv.x); 
  float bs1 = blockStep(0., fract(uv.x + activeIdx)); // activeIdxは 0 〜 .8 を返すので最終的に1
  float bs2 = blockStep(1., fract(uv.x + activeIdx)); 
  float bs3 = blockStep(2., fract(uv.x + activeIdx)); 
  float bs4 = blockStep(3., fract(uv.x + activeIdx)); 
  float bs5 = blockStep(4., fract(uv.x + activeIdx)); 

  // その区間におけるテクスチャを取得して連結
  vec4 color = t1*bs1 + t2*bs2 + t3*bs3 + t4*bs4 + t5*bs5;

  // グレスケール
  vec4 gray = grayscale(color);

  float center = floor(uSlideTotal / 2.); // 中央。floor 少数切り捨て
  float bsActive = blockStep(center, uv.x);

  color = mix(gray, color, bsActive); // 中央だけ1になり、他は0
  color.a *= mix(.7, 1., bsActive); // 中央以外は透明度を.7に
  color.a *= mix(1., (1. - uv.y) * .6 , uIsReflect); // meshの上方向は暗く
  // 注
  // 透明度の処理は乗算の形でないと、上書きされてしまう。
  // = を使うと上書き

  gl_FragColor = color;
}