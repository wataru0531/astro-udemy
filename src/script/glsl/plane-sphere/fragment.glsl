

// precision mediump float;

varying vec2 vUv;
varying float vProgress;
varying vec3 vSphereNormal; // 法線の情報

uniform float uTick;
uniform sampler2D tex1;
uniform float uHover;
uniform vec4 uResolution;
uniform float uReversal;

#pragma glslify: coverUv = require(../shader-util/coverUv) // object-fit
#pragma glslify: grayscale = require(../shader-util/grayscale) // テクスチャをグレーに


void main() {
  vec2 uv = coverUv(vUv, uResolution);
  vec4 tex = texture(tex1, vUv); // 
  vec4 gray = grayscale(tex); // テクスチャをグレーに
  vec4 planeColor = mix(gray, tex, uHover); // ホバー時に本来の色に
  
  // 法線に数値をかけあわせる
  vec3 ray = vec3(cos(uTick * 0.01) * .3, sin(uTick * .01) * .3 , 1.);

  // rayとvSphereNormalを掛け合わせる(内積ととる)
  // dot()...内積。
  // fresnel...ray.x * vSphereNormal.x + ray.y * vSphereNormal.y + ray.z * vSphereNormal.z
  float fresnel = dot(ray, vSphereNormal) * .5;

  // 
  vec3 sphereRGB = mix(vec3(fresnel), 1. - vec3(fresnel), uReversal);

  // 球の時の色
  vec4 sphereColor = vec4(sphereRGB, .7);

  vec4 color = mix(sphereColor, planeColor, vProgress);
  
  gl_FragColor = color;
}
