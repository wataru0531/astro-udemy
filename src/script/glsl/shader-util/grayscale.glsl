/**************************************************************

テクスチャの色情報を渡すとグレ-の色に変換

***************************************************************/

// tex...テクスチャの色。４つの成分を持つ
vec4 grayscale(vec4 tex) {
  vec3 gray = vec3(0.299, 0.587, 0.114);

  // dotでグレーの色の合計値を算出し、その合計値をvec3で3次元ベクトルに変換して返している
  // dot() → texのrgb成分 と grayベクトルの内積を計算
  // 　r * 0.299 + g * 0.587 + b * 0.114 という計算を行い、グレースケールの値を得ます。
  vec4 grayT = vec4(vec3(dot(tex.rbg, gray)), tex.a);

  return grayT;
}

#pragma glslify: export(grayscale)

// #pragma
// → シェーダーコードの中で特別な指示(コンパイラに対するヒントや設定)を指定するために使用されるディレクティブ

// glslify 
// → GLSLコードをモジュール化、他のGLSLコードと簡単に組み合わせて使用するためのツール
//   GLSLコードの依存関係を管理し、コードを再利用可能にすることが目的。

// #pragma glslify
// → GLSLコード内でglslifyの機能を有効化