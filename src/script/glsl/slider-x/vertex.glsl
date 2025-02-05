
// slider-x

uniform float uTick;
uniform float uSlideIdx; // 各meshに振られるidx
uniform float uActiveSlideIdx; // アクティブなidx。線形補間の値(0〜1、2〜3、3〜4、...)。
uniform float uDist; // 1.8

varying float vScaleProgress;
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vec3 pos = position;

  float scaleDown = 0.2;

  // clamp(値, min, max) ... minからmaxの範囲で値を返す
  // uSlideIdxは固定
  // abs(uActiveSlideIdx - uSlideIdx) → uActiveSlideIdxが増加すると、必ず0 〜 1を返す
  // → その1.8倍なので、1.8倍速で、0〜1の値を返す。ただ1までの到達時間が早くなるだけ
  // 初期は1が返っている状態
  float scaleProgress = clamp((1. - abs(uActiveSlideIdx - uSlideIdx) * uDist), .0, 1.);
  
  vScaleProgress = scaleProgress;
  
  pos.xy *= (0.8 + scaleDown * scaleProgress);
  // pos.xy = pos.xy * (.9 + scaleDown * scaleProgress);

  pos.y += cos(uTick * .03) * 7.; // y軸の動き

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos * 1., 1.);

  vPosition = position;
}
