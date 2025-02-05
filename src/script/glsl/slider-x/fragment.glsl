
// slider-x

#pragma glslify: coverUv = require(../shader-util/coverUv)
#pragma glslify: grayscale = require(../shader-util/grayscale)

uniform vec4 uResolution;
uniform sampler2D tex1;

varying vec2 vUv;
varying float vScaleProgress;

void main() {
  vec2 uv = coverUv(vUv, uResolution);
  // vec2 uv = vUv;

  // uvの中心を原点とする
  // → uvは通常、左下が(0, 0)、右上が(1, 1)の範囲。このまま座標変換を行うと、
  //   拡大縮小操作が不自然になる。なぜなら、左下の(0, 0)や右上の(1, 1)を基準に拡大縮小を行うと、座標系が偏ってしまうか。
  // 　この中心基準の座標系にした後、uv に拡大・縮小を行うことで、画像を中央を基準にして変形できる
  // → .5の位置で0のフラグメントを、1の位置で.5のフラグメントを受け取る
  // このuvを動かす部分は動的ではないのでずらすところは表示されない。
  // → 動的な変化をするのはvScaleProgressの部分なので、このuvをずらしていることには視覚的に動的な
  //   変化を引き起こさない。
  uv -= 0.5;

  // アクティブな画像の縮小
  // → 初期段階は1が返る。動いている時に0が返る
  float scale = mix(0.7, 1.0, vScaleProgress); 
  uv *= scale;

  uv += 0.5; // uv座標をもとに戻す

  vec4 color = texture2D(tex1, uv);
  vec4 gray = grayscale(color);

// vScaleProgress ... 動いているときは0が返るのでgray
  gl_FragColor = mix(gray, color, vScaleProgress);
}
