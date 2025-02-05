
// 【slider-reflect】複数Textureを一つのMeshに表示してみよう

// Reflect slider


uniform float uTick;

varying vec2 vUv;

void main(){
  vUv = uv;
  vec3 pos = position;

  pos.y += cos(uTick * .03) + 15.; // 上下にすらす

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
}
