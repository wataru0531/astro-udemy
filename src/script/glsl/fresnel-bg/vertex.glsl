
// fresnel

varying vec2 vUv;

void main(){
  vUv = uv;

  // z-indexでhtmlの奥の方にやるので小さくなるので、大きくする
  vec3 pos = position;
  pos.xy = pos.xy * 1.5;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
}
