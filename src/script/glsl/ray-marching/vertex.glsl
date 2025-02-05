
// レイマーチング
// 頂点データは扱わない

precision highp float;

varying vec2 vUv;

void main() {
  vUv = uv;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
