precision lowp float;

varying vec2 vUv;
varying float vAlpha;

uniform sampler2D tex1;
uniform sampler2D tex2;
uniform float uProgress;
varying float vProgress;

// gl_PointCoordについての説明
// https://khronos.org/registry/OpenGL-Refpages/gl4/html/gl_PointCoord.xhtml

void main() {

  if(vProgress > 0.1 && distance(gl_PointCoord, vec2(0.5, 0.5)) > 0.5) {
    discard;
  }

  vec4 tCurrent = texture(tex1, vUv);
  vec4 tNext = texture(tex2, vUv);
  vec4 color = mix(tCurrent, tNext, uProgress);
  color.a = vAlpha;
  gl_FragColor = color;
}

