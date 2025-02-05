
// slider-z

uniform float uTick;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 pos = position;

  // メッシュをたわませる
  // 頂点数が少なければうねらないし
  // pos.z += sin(PI * uv.x) * 100.;
  // pos.z += cos(PI * uv.y) * 100.;

  // x, y, z軸に波を追加
  // .03 ... 波の速さ
  // uv.x ... 波の数、多さ
  // 10. ... 振幅
  pos.z += sin(uTick * 0.02 + uv.x * 10.) * 30.0; // x軸の波
  pos.z += cos(uTick * 0.02 + uv.y * 10.) * 30.0; // y軸の波
  // pos.z += cos(uTick * .001 * uv.x * 30.) * 10.;

  // // メッシュ自体を上下に揺らす
  pos.y += sin(uTick * 0.03) * 7.;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
}
