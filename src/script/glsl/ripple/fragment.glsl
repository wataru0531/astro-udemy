
precision mediump float;

varying vec2 vUv;
// tDiffuse → RenderPassで読み込んだ通常のシーンから、
// これまで追加してきたエフェクトがテクスチャとして渡ってくる
uniform sampler2D tDiffuse; 
uniform sampler2D texRipple;

void main(){

  // 波紋のエフェクトをテクスチャとして取得
  // textureはWebGL1.0ではないので直書きしておく
  // → rippleのエフェクト自体はObクラスのShaderMaterialを使ってはないため
  vec4 ripple = texture2D(texRipple, vUv); 

  // 波紋が立っているところの座標をずらす
  // ripple.rとしているのは色のついている部分のみ取得。黒い部分は無視する
  // * .1 → 色のついている部分は歪むので範囲を小さくする
  // vec2 rippleUv = vUv + ripple.r * .1;
  vec2 rippleUv = vec2(vUv.x + ripple.r * .1, vUv.y + ripple.r * .1);

  // tDiffuseはRenderPassに渡した通常のシーンからこれまで追加してきたエフェクトが１つとなりテクスチャ
  // として渡ってきたもの。
  // 波紋によって変位されたrippleUvを使い、シーン全体のレンダリング結果tDiffuseから色をサンプリング
  // → この操作により、波紋エフェクトを適用した最終的な色が計算され、フラグメントの色として設定さる
  vec4 color = texture2D(tDiffuse, rippleUv);

  gl_FragColor = color;
  // gl_FragColor = vec4(color.r, 0, 0., 1.);

  // gl_FragColor = ripple;
  // gl_FragColor = vec4(vUv, 0., 1.);
}
