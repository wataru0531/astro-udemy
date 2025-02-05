/**************************************************************

汎用的に使えるモジュール

***************************************************************/

import {
  Vector4,
  Vector3,
  Quaternion,
} from "three";
import { detect as detectBrowser } from "detect-browser";
import { getGPUTier } from 'detect-gpu';


// GPUのパフォーマンス測定
// ここでは、fpsがga50以上出る場合はパフォーマンスがいいことにする
let _isHighPerformanceMode;
async function definePerformanceMode(_tier = 2, _fps = 60){ // あえて低くする。通常は2, 60
  // console.log(_tier, _fps)
  const gpuTier = await getGPUTier();
  // console.log(gpuTier); // device: undefined, fps: 39, gpu: 'amd radeon pro 555x', isMobile: false, tier: 2, …}

  // if(window.debug) console.log(gpuTier);

  // tier → 階層のこと
  // 0... 15fps未満
  // 1 ... >= 15fps 以上 30fps未満
  // 2 ... >= 30fps 以上 60fps未満
  // 3 ... >= 60fps
  _isHighPerformanceMode = (gpuTier.tier >= _tier && gpuTier.fps >= _fps);
  // console.log(_isHighPerformanceMode);
}

// パーフォーマンスが良くないのであればfalseを返す
function isLowPerformanceMode(){
  return !_isHighPerformanceMode;
}


// safariかどうかを判定
const browser = detectBrowser();
function isSafari(){
  return browser.name === "safari";
}

// IOSかどうか
function isIOS(){
  const userAgent = navigator.userAgent;
  // console.log(userAgent);

  // userAgentの中に大文字でも小文字でもiPhoneという文字が入っていたらIOSデバイスと判定
  // i ... 大文字、小文字を区別しない
  if(userAgent.match(/iPhone/i) || userAgent.match(/iPad/i)){ 
    console.log("iPhone or iPad")
    return true;
  } else {
    return false;
  }
}


// タッチデバイスかどうか判定
const isTouchDevices = Boolean(
  "ontouchstart" in window ||
  (window.DocumentTouch && document instanceof DocumentTouch)
);
// console.log(isTouchDevices);

// 線形補間
// (0 〜 1 があったとしてその間の数値を取得)、その間の値は補完値によって決まる
// a...開始の値   b...終了の値   n...補完値(0 〜 1の範囲)
function lerp(a, b, n, limit = 0.001){
  // current ... 中間値(中央値ではない)
  let current = (1 - n) * a + n * b;

  // currentの値がある程度(ここでは0.001)の大きさになれば終了値のbと同じ値にする
  // bの値になることはないから。
  if (Math.abs(b - current) < limit) current = b;
  
  return current;
}

// アスペクト比を計算する関数
// toRect...HTMLのサイズ  mediaRect...画像自体のサイズ
function getResolutionUniforms(toRect, mediaRect){
  const { width: toW, height: toH } = toRect; // HTML要素の幅と高さ

  const resolution = new Vector4(toW, toH, 1, 1); // 一時的に定義
  // console.log(resolution); // Vector4 {x: 600, y: 400, z: 1, w: 1}

  if(!mediaRect) return resolution; // 画像でなかったら処理終了

  const { width: mediaW, height: mediaH } = mediaRect;
  // console.log(mediaW, mediaH); // 1024 512

  const toAspect    = toH / toW;       // HTML要素のアスペクト比 (縦 / 横)
  const mediaAspect = mediaH / mediaW; // 画像自体のアスペクト比
  // console.log(`${toAspect}, ${mediaAspect}`); // 0.6666666666666666, 0.5

  // あくまでもHTML要素にWebGLを適用させる
  let xAspect, yAspect;
  if(toAspect > mediaAspect){ // HTML要素 > 画像自体
    xAspect = ( 1 / toAspect ) * mediaAspect; // 例: 1 / 2 * 1 = 0.5
    yAspect = 1;
  }else { // HTML要素 < 画像自体
    xAspect = 1;
    yAspect = toAspect / mediaAspect; // 例: 1 / 2 = .5
  }
  // console.log(xAspect, yAspect); // 0.75 1

  // アスペクトを設定
  resolution.z = xAspect; // 第３引数にはxのアスペクト
  resolution.w = yAspect; // 第４引数にはyのアスペクト

  // console.log(resolution); // Vector4 {x: 600, y: 400, z: 0.75, w: 1}
  return resolution;
}


// 対角線上に頂点を詰めた配列を返す関数
function getDiagonalVertices(hSeg, wSeg, getValue, defaultValue) {
  const hSeg1 = hSeg + 1,
    wSeg1 = wSeg + 1;
  let arry = [],
    currentValue = defaultValue;
  for (let i = 0; i < hSeg1 + wSeg1 - 1; i++) {
    for (
      let j = Math.min(hSeg1, i + 1) - 1;
      j >= Math.max(0, i - wSeg1 + 1);
      j--
    ) {
      let currentIndex = j * wSeg1 + i - j;
      currentValue = getValue(currentValue, currentIndex);
      arry[currentIndex] = currentValue;
    }
  }
  
  return arry;
}


// 行列のデバッグに使う関数
function printMat(targetMatrix, col = 4, label = '') {
  const mat1D = targetMatrix?.elements ?? targetMatrix?.array ?? targetMatrix;
  console.log(mat1D)
  
  if(!mat1D instanceof Array) return;
  setTimeout(() => { // 非同期でマトリクスが更新されるため、非同期で実行
    let mat2D = mat1D.reduce((arry2D, v, i) => {
      if (i % col === 0) {
        arry2D.push([]);
      }
      const lastArry = arry2D[arry2D.length - 1];
      lastArry.push(v);
      return arry2D;
    }, []);
    console.log(`%c${label}`, 'font-size: 1.3em; color: red; background-color: #e4e4e4;')
    console.table(mat2D)
  })
}

// cylinderのスライダーで使用。テクスチャを側面に貼り付ける
// _mesh 向きを変えたいmesh
// originalDir → 元の向き(z軸方向に1) { x: 0, y: 0, z: 1 }
// targetDir   → 変更後の向き(そのmeshの垂直方向を向かしたいので法線の向き)
function pointTo(_mesh, originalDir, targetDir) {
  
  // 回転軸の計算 → ただ垂直なベクトルを算出しているだけ
  // normalize → 正規化。Math.acosに渡すのは、-1〜1の範囲でないと正確な結果が出ない
  const _originalDir = new Vector3(originalDir.x, originalDir.y, originalDir.z).normalize();
  // console.log(_originalDir); // _Vector3 {x: 0, y: 0, z: 1} 全て同じ。ベクトルの長さは1
  const _targetDir = new Vector3(targetDir.x, targetDir.y, targetDir.z).normalize();
  // console.log(_targetDir); // 少数だがベクトルの長さは1

  // crossVectors → 外積(垂直なベクトルが返る)
  //                new Vector3()でオブジェクトを生成してcrossVectors()を使っている
  const dir = new Vector3().crossVectors(_originalDir, _targetDir).normalize();
  // console.log(new Vector3()); // _Vector3 {x: 0, y: 0, z: 0}
  // console.log(dir)

  // 内積の結果から回転角を求める → ベクトルとベクトルのなす角(ここでは回転角)
  // → z軸の向き(手前向き)とそれぞれのテクスチャの法線ベクトルとのなす角を取得。
  //   ここではベクトルが正規化されているので長さは1。
  //   なので1 * 1 の内積なのでcosを取得できることになる。A・B = cosθ
  // acos → cosの逆関数。アークコサイン。cosを入れることで角度を算出
  const dot = _originalDir.dot(_targetDir); // _originalDirと_targetDirの内積
  const rad = Math.acos(dot); 
  // console.log(rad); // 0 144 71 65 149

  const q = new Quaternion(); // クォータニオンオブジェクトを作成

  q.setFromAxisAngle(dir, rad); // 回転軸, 回転させたい角度を設定
  _mesh.rotation.setFromQuaternion(q);  // 回転を適用
}


const utils = {
  lerp,
  getResolutionUniforms,
  getDiagonalVertices,
  printMat,
  pointTo,
  isTouchDevices,
  isSafari,
  definePerformanceMode,
  isLowPerformanceMode,
  isIOS,

}

export { utils };