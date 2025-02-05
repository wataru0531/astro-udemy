
// レイマーチング 光線が物体に向かって苦心する

precision highp float;

#pragma glslify: coverUv = require(../shader-util/coverUv)
#pragma glslify: rotate3d = require(glsl-rotate/rotation-3d)

uniform vec4 uResolution;
uniform vec2 uMouse; // 初期値 .5, .5
uniform float uHover;
uniform float uTick;
// uniform int uLoop;
// WebGL1.0への対応。uLoopはシェーダー内で定数で定義に変更
// → for文の条件の部分でiと比べる対象は定数ではないとエラーとなる
const int uLoop = 15;
uniform float uProgress;

uniform sampler2D tex1;
varying vec2 vUv;



// ２つの距離関数をスムーズに結合する関数。a,bは距離関数、kは係数
// ２つの関数から微分可能になるような関数を作る。（右微分係数と左微分係数が一致するような関数を作れば良い）。
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// 環境マップを返す関数, eyeは光線ray、normalはSDFの法線ベクトル
vec2 getmatcap(vec3 eye, vec3 normal) {
  vec3 reflected = reflect(eye, normal);
  float m = 2.8284271247461903 * sqrt(reflected.z + 1.0);
  return reflected.xy / m + 0.5;
}


// 立方体のSDF。
float boxSDF( vec3 p, vec3 b ){
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

// 正八面体のSDF
float octaSDF(vec3 p, float s) {
  p = abs(p);
  float m = p.x + p.y + p.z - s;
  vec3 q;
  if(3.0 * p.x < m) {
    q = p.xyz;
  } else if(3.0 * p.y < m) {

    q = p.yzx;
  } else if(3.0 * p.z < m) {

    q = p.zxy;
  } else {

    return m * 0.57735027;
  }

  float k = clamp(0.5 * (q.z - q.y + s), 0.0, s);
  return length(vec3(q.x, q.y - s + k, q.z - k));
}

// 引数として受け取ったベクトル(v)を任意の回転軸(axis)に沿って回転(angle)させる関数。回転後のベクトルを返す。
// sceneSDF内 ... rotate(p, vec3(1.0), uTick / 200.);
vec3 rotate(vec3 v, vec3 axis, float angle) {
  // rotate3dは第一引数に回転軸ベクトル、第二引数に回転角を取る
  mat4 matR = rotate3d(axis, angle);
  return (matR * vec4(v, 1.0)).xyz; // vはアフィン変換するために4次元にする。
}

// 球のSDF。半径r、中心が空間の原点
// pから球の表面までの最短距離を計算
float sphereSDF(vec3 p, float r) { 
  return length(p) - r;
}

// 空間全体のSDF
// → 複数の形状（マウスに追従する球、時間経過で変形するボックスとオクタヒドロン）を組み合わせたシーンを構築し、
//   光線がシーンのどこにあるかに応じて最短距離を計算
float sceneSDF(vec3 p) { // 光線の位置の3次元ベクトルを引数にとる
  vec3 pRotated = rotate(p, vec3(1., 1., 1.), uTick * .002); // 初めに、(1., 1., 1.)の位置で回転
  vec3 pAxisYRotete = rotate(pRotated, vec3(0., 1., 0.), uTick * .002); // 次に、(0., 1., 0.)の位置で回転

  // マウスに追従する球 → マウスの位置を使って球を生成
  float sphereMouse = sphereSDF(p - 2.5 * vec3(uMouse * uHover - vec2(0.5) * uHover, 0.0), 0.5);

  float octa = octaSDF(pAxisYRotete, 1.2);
  float box = boxSDF(pAxisYRotete, vec3(0.6));
  float mixed = mix(box, octa,  clamp(smoothstep(-0.3, 0.3, sin(uTick * 0.005)), 0.0, 1.0));

  float final = smin(sphereMouse, mixed, 0.8);

  return final;
}

// 点pにおける、SDFの等値面との法線ベクトルを求める関数。
vec3 gradSDF(vec3 p) {
  float eps = 0.001; // 微小変化量
  return normalize(vec3(sceneSDF(p + vec3(eps, 0.0, 0.0)) - sceneSDF(p - vec3(eps, 0.0, 0.0)), // x成分の偏微分
  sceneSDF(p + vec3(0.0, eps, 0.0)) - sceneSDF(p - vec3(0.0, eps, 0.0)), // y成分の偏微分
  sceneSDF(p + vec3(0.0, 0.0, eps)) - sceneSDF(p - vec3(0.0, 0.0, eps))  // z成分の偏微分
  ));
}

void main() {
  vec2 newUV = coverUv(vUv, uResolution);
  newUV = (newUV - .5) * 2.; // -1 〜 1に変更

  vec3 cPos = vec3(0.0, 0.0, 2.0); // カメラ(視点)の位置
  vec3 lPos = vec3(2.0, 2.0, 2.0); // 光源の位置

  // 光線の向き。
  // → カメラは常にZ軸マイナス方向に向け、原点の方向にrayを向ける
  // ベクトルを正規化して長さが1のベクトルに変換
  // ベクトルの正規化とは、もともとどんな長さのベクトルであっても、長さを「1」にする操作
  // → レイマーチングにおいて光線方向を示すベクトルは通常、正規化されている必要のため
  vec3 ray = normalize(vec3(newUV.x, newUV.y, -1.));
  vec3 rPos = cPos; // 光線を照射する位置。
                    // → 初期の光線の位置はカメラの位置。

  gl_FragColor = vec4(0.); // 何も衝突しなかった時の初期の色

  // レイの行進(マーチング)を行う
  // 15回ループさせて物体に衝突しなかったらループを終了
  // → そのときは上で記述したvec4(0.)が適用される
  for(int i = 0; i < uLoop; i++) { 
    if(sceneSDF(rPos) > 0.001) { // sceneSDF ... 距離関数
      // 0.001よりレイが大きい場合は物体に衝突していない
      // → レイを進める
      rPos += sceneSDF(rPos) * ray;
    } else {
      // レイマーチングのライティング(照明)
      // 0.001より小さい場合はレイが物体にぶつかったということなのでこのブロックの処理が走る
      // → ぶつかった時にどういう色をするのかをこのブロックで定義

      float amb = 0.5; // 環境光の強さ(全体を照らす光の強度)
            // 拡散光の計算。光線の位置(物体にヒットしたポイント)から光源に伸びるベクトルとSDFの法線ベクトルとの内積を計算する。
      vec3 sdfNormal = gradSDF(rPos); // 形状の表面に対する法線を求める

      // 内積がマイナスになる（角度が180度以上になる場合）場合は0にする。
      float diff = 0.9 * max(dot(normalize(lPos - rPos), sdfNormal), 0.0);

      // スフィア環境マップ作成
      vec2 matcapUV = getmatcap(ray, sdfNormal);
      vec3 color = texture2D(tex1, matcapUV).rgb; 

      // colorに光の情報をプラスしてやる
      color *= diff + amb; // 光の強度 + 全体の明るさ

      gl_FragColor = vec4(color, uProgress);

      break; // 色が設定できた場合にはすでにレイはぶつかっているのでループを抜ける
    }
  }
}
