

// slider-wave スライダーのテキスト部分



uniform vec4 uResolution;
uniform sampler2D tex1;

varying vec2 vUv;
varying float vDistPhase; 

vec2 coverUv(vec2 uv, vec4 resolution){
  return (uv - .5) * resolution.zw + .5;
}

void main(){
  vec2 uv = coverUv(vUv, uResolution);
  vec4 t1 = texture(tex1, uv);

  gl_FragColor = t1;

  // アクティブなテキスト以外は表示しない
  // → smoothstepを使っているので滑らかな値が返るので、切り替え中は少し見える
  // cosは0の時に1を返す。つまり、よりアクティブに近いテキストの透明度が1になる
  // .4未満は0を返し、1.より大きいと1を返す
  float alpha = smoothstep(.4, 1., cos(vDistPhase));
  gl_FragColor.a *= alpha; 
}