/**************************************************************

distortion-text

***************************************************************/

// #pragma → 外部ライブラリや関数をインポートするための指令
//           2D Simplex Noise関数をインポートし、snoiseという名前で使用できるようにしている
#pragma glslify: snoise = require(glsl-noise/simplex/2d);

varying vec2 vUv;

uniform sampler2D tDiffuse;
uniform float uTick;
uniform float uProgress;
uniform float uSpeed; // 7.1
uniform float uReversal; // 0 
uniform vec4 uParam; // Vector4(1.23, 2.299, 0.493, 1.783)

void main(){
  vec2 uv = vUv;
  float time = uTick * 0.001 * uSpeed;

  // x軸 → cosで周期性を出す
  //       uv.xの範囲0.0〜1.0が、0ラジアンから 2πラジアンに拡張される
  //       cos(0)の時は1を、cos(1/2π)の時は0を、cos(2π)は1を返す
  // 　　　 x軸の値が小さくなればなるほど、x軸い対してノイズが細くなる
  //       cos( vUv.x * PI * 2)とすることで、x軸の0から1になるにつれて、
  //       1から-1の値を返すので、本来のノイズに対して横軸に対しての波を描くことになる
  // y軸 → 時間軸が入る。時間を引いているので上方向に進む
  // float n = snoise(vec2(cos(uv.x) * uParam.x, uv.y * uParam.y - time));
  float n = snoise(vec2(cos(uv.x * PI * 2.) * uParam.x, uv.y * uParam.y - time));

  // メッシュの中心のノイズが小さく、外側のノイズは大きくする
  // → 中心が0, 0になるので、それらの数値を掛け合わせているので中心は0、外側の数値は比較的大きくなる
  // float d = dot(vec2(n * uParam.z, n * uParam.w), uv - .5); // dot()...内積
  float d = dot(vec2(n * uParam.z, n * uParam.w), vec2(vUv.x - .5, vUv.y - .5)); // dot()...内積

  // ノイズによる歪みを定数に保存
  // uProgressが1の時は元の画像を表示したいので、(1. - uProgress)とする。
  // → uProgressが1になるほどノイズがなくなり通常の画像に戻っていく
  vec2 distortUv = uv + (d * .3 * (1. - uProgress));

  vec4 t1 = texture(tDiffuse, distortUv); // distortUvの値に対応するテクスチャの色を取得

  // uReversalが1になると、元の色の反転した色を取得できる(元の色は黒)
  // → これはuReversalは動的には変わらないので、debugで自らでいい感じの色をuReversalを使い設定する
  vec3 rgb = t1.rgb; // r, g, bのみ取り出す。a(透明度の部分)は取り出さない
  rgb = mix(rgb, 1. - rgb, 1. - uReversal);

  vec4 color = vec4(rgb, t1.a * uProgress); // uProgressが1になるにつれ表示される
  gl_FragColor = color;
}
