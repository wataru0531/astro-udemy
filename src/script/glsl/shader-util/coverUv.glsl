/**************************************************************

CSSのobject-fitのcoverのような関数

***************************************************************/

// 画像の中心を基準にしてスケーリングしている
vec2 coverUv(vec2 uv, vec4 resolution){
  // resolution.z → xAspect
  // resolution.w → yAspect
  // + .5 → uv座標の中心点をもとに戻す
  
  // return uv;
  // return uv * resolution.zw;
  // return uv - .5;
  // return (uv - .5) * resolution.zw;
  return (uv - .5) * resolution.zw + .5;
}


#pragma glslify: export(coverUv)
