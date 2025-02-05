
//  book以外のGL Transitionsでも必要な共通の関数
// 後の記述でfrag(独自の記述)、after.glslと結合させる

// index.jsからコードで使うuniformの値などを入れこんでいく

uniform sampler2D texCurrent; // 元のテクスチャの情報
uniform sampler2D texNext;    // 遷移先のテクスチャ
uniform float progress;
uniform vec4 uResolution;
varying vec2 vUv;


#pragma glslify: coverUv = require(../shader-util/coverUv.glsl);


// 現在のテクスチャーを返す関数
vec4 getFromColor(vec2 uv) {
   uv = coverUv(uv, uResolution);
   return texture(texCurrent, uv);
}

// 次のテクスチャーを返す関数
vec4 getToColor(vec2 uv) {
   uv = coverUv(uv, uResolution);
   return texture(texNext, uv);
}
