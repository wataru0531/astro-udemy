
// 数値の計算精度。記述しない場合はmediumpがデフォルトが多い。プラットフォームや環境による
// precision lowp float;

#pragma glslify: cnoise = require(../shader-util/curl-noise); // カールノイズ
#pragma glslify: parabola = require(../shader-util/parabola); // パラボラ

varying vec2 vUv;
varying float vAlpha;
varying float vProgress;

uniform float uProgress; // 0 〜 1
uniform float uSpeed;    // .05。0 〜 .1
uniform float uPointSize; // 2
uniform float uTick;
uniform vec3 uCnoise;   // Vector3(0.005, 0, 0.01)
uniform vec3 uExpand;   // Vector3(1, 1, 1)

void main() {
    vUv = uv;
    float time = uTick * uSpeed;
    const float cameraZ = 2000.; // カメラの位置を合わせる
    vec3 pos = position;

    float progress = parabola(uProgress, .5);  // uProgressが0.5の時に1を返す。0と1の時に0を返す。第２パラメータは勾配

    // ノイズ範囲の拡大・縮小
    vec3 expand = vec3(pos.x * uExpand.x, pos.y * uExpand.y, 1.);

    // カールノイズ...3次元のベクトルが返ってくる → ノイズは-1から1の範囲の数値を返す
    vec3 noise = cnoise(vec3( 
      pos.x * uCnoise.x + time * .05, // x
      pos.y * uCnoise.y + time * .05, // y
      (pos.x + pos.y) * uCnoise.z     // z
      // time * .05
    ));

    pos += expand * noise * progress; // 3次元同士

    // 視点座標に切り替わるので(カメラを基準とした位置)、posはマイナスになる
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0); 

    // -2000の位置にある頂点がカメラに近づいてくる
    // 2000/2000 → 1。 2000/1000 → 2。　　2000/500 → 4
    gl_PointSize = uPointSize * (cameraZ / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
}
