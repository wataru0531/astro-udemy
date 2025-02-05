
// precision lowp float;

#pragma glslify: coverUv = require(../shader-util/coverUv);

varying vec2 vUv;

// texCurrentとtexNextはJS側で交互にくるように設定
uniform sampler2D texCurrent; 
uniform sampler2D texNext;
uniform float uProgress; // 0 〜 1
uniform vec4 uResolution;

// gl_PointCoordについての説明
// https://khronos.org/registry/OpenGL-Refpages/gl4/html/gl_PointCoord.xhtml

void main() {
  vec2 uv = coverUv(vUv, uResolution); // アスペクトを考慮したuvとする

  vec4 tCurrent = texture(texCurrent, uv);
  vec4 tNext = texture(texNext, uv);

  vec4 color = mix(tCurrent, tNext, uProgress);
  // color.a = vAlpha;
  
  gl_FragColor = color;
}
