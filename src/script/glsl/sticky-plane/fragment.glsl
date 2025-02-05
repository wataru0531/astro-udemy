precision mediump float;

varying vec2 vUv;

uniform sampler2D tex1;

void main() {

  vec4 tex = texture(tex1, vUv);
  
  // gl_FragColor = vec4(vDelay, 0., 0., 1.);
  gl_FragColor = tex;
}