
//   【slider-wave】遷移時にノイズを追加しよう から

// slider-wave スライダーのテキスト部分

// このvertexはplaneGeomtryのvertexShader
// なのでここでは５つのテキストのテクスチャの頂点を扱う

#pragma glslify: snoise = require(glsl-noise/simplex/2d);

uniform float uTick;
uniform float uSlideIdx; // 0〜4。planeのスライド1枚づつが持つ番号
uniform float uActiveSlideIdx; // 現在activeなスライド。lerpで渡ってくる
uniform float uSlideTotal; // スライドの総数(テクスチャの数)
uniform vec4 uParam; // Vector4(1, 1.5, 2, 21)

varying vec2 vUv;
varying float vDistPhase; // アクティブなテキストと何度離れているかの角度

void main(){
  vUv = uv;
  vec3 pos = position;
  float time = uTick * 0.001;

  // 各テキストメッシュを離して並べるための角度を算出
  // (2. * PI / uSlideTotal) → テキストmeshが回転する角度
  // (uActiveSlideIdx - uSlideIdx) → テキストがアクティブからどれくらの角度離れているか
  float distFreq = (2. * PI / uSlideTotal) * (uActiveSlideIdx - uSlideIdx);

  // 0〜360°の範囲の値が返るようにする。uActiveSlideIdxには、0から4の範囲だけではなく、大きな数値も入ってくるため角度を動的にする
  // mod → モジュラー。JSの%(剰余演算子)。distFreq を 360°で割った余りを取得。
  float distPhase = mod(distFreq, PI * 2.); 
  vDistPhase = distPhase;

  // ノイズを乗せる
  // x軸 → cosで周期性を出す。1に近づくほど大きく歪む
  // y軸 → 時間軸が入る。時間を引いているので上方向に進む
  float n = snoise(vec2(cos(uv.x * PI * 2.) * uParam.x, uv.y * uParam.y - time));
  pos.x += uParam.z * n * sin(distFreq); 
  pos.y += uParam.w * n * sin(distFreq);

  // 次へボタンを押すと左斜め上に動く
  pos.x -= 600. * sin(distFreq); // 左に。-1〜1の範囲で返る。sinは0の時は0が返す
  pos.y += 100. * sin(distFreq); // 上に

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
}
