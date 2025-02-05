/**************************************************************

・loadAllAssets ... 画像のキャッシュを生成 
→ /img/slider/slider_1.jpg' => Texture

・getTexByElement ... キャッシュから画像を取得
→ "tex1" => Texture　この形で取得

・ローディングアニメーションの処理
***************************************************************/
import gsap from "gsap";
import { LinearFilter, TextureLoader, VideoTexture } from "three";

import { INode } from "../helper";

const texLoader = new TextureLoader();

// テクスチャのキャッシュを管理するためのデータ構造
// → loadAllAssets、getTexByElementによって別ファイルでも更新可能
const textureCache = new Map();
// console.log(textureCache); // 0: {"/img/slider/slider_1.jpg" => Texture}

// loader.jsファイルがimportで読み込まれた時点で、関数以外のトップレベルのコードは実行される
window.textureCache = textureCache; 

const loader = {
  init,
  loadAllAssets,
  getTexByElement,
  loadImg,
  loadVideo,
  addProgressAction,
  letsBegin,
  isLoaded: false,
  addLoadingAnimation,
};

const $ = {}; // DOM要素を格納...ローディング時に活用

async function init() {
  $.globalContainer = INode.getElement("#global-container");
  $.loader = INode.getElement("#loader");
}

// 全てのURLを取得して、url => テクスチャ の状態でtextureCacheに格納
async function loadAllAssets() {
  const els = INode.qsAll("[data-webgl]");
  // console.log(els)

  for (const el of els) {
    // console.log(el); // htmlのタグ

    const data = el.dataset;
    // console.log(data); // DOMStringMap {webgl: 'particles', tex-1: '/img/diverse_image_2.jpeg', mouse: 'highlight', mouseScale: '3'}

    for (let key in data) {
      if (!key.startsWith("tex")) continue; // texから始まらないループは終了
      const url = data[key];
      // console.log(url); // /img/diverse_image_2.jpeg

      // 既に格納してあるURL以外は格納しない
      if (!textureCache.has(url)) {
        // 必要なURLをセットすればいいだけなので、ここでは第２引数はnullとする。ただ設定しているだけ
        textureCache.set(url, null);
        // console.log(textureCache); // 0: {"/img/slider/slider_1.jpg" => null}
      }
    }
  }
  // console.log(textureCache); // Map(4) {'/img/slider/slider_1.jpg' => null, '/img/slider/slider_2.jpg' => null, '/img/slider/slider_5.jpg' => null, '/img/disps/3.png' => null}
  // ここまでは url = null の状態

  const texPrms = []; // プロミスオブジェクトの配列

  // url => Texture の形でtextureCacheに格納
  textureCache.forEach((_, url) => { // value, index
    // console.log(_, url); // null '/img/diverse_image_2.jpeg'

    let prms = null;

    // 画像 / 動画をロード
    const loadFn = /\.(mp4|webm|mov)$/.test(url) ? loadVideo : loadImg;
    prms = loadFn(url).then((tex) => { // tex → Promiseの解決値
      // console.log(tex)
      textureCache.set(url, tex);
      // console.log(textureCache) // 0: {"/img/slider/slider_1.jpg" => Texture}
      
      // prms → thenでチェーンされた処理も含めたPromiseオブジェクトが格納されている
      // textureCache.set(url, tex) → thenで受けているので、この処理が終わるまでは次のloadFnには進めない。
    }).catch(() => {
      console.error("Media Download Error", url);
    });

    texPrms.push(prms);
  });
  // console.log(texPrms) // プロミスオブジェクトの配列
  // console.log(textureCache)

  // texPrmsに含まれるすべてのPromiseオブジェクトが解決されるまで待機
  await Promise.all(texPrms);
  // console.log(textureCache); // Map(4) {'/img/slider/slider_1.jpg' => Texture, '/img/slider/slider_2.jpg' => Texture, '/img/slider/slider_5.jpg' => Texture, '/img/disps/3.png' => Texture}
}

// キャッシュから取得したテクスチャを要素それぞれに返す処理
// また、img要素・video要素がelに渡ってきた場合は、完全に読み込んでから、
async function getTexByElement(el) {
  // console.log(el); // htmlのタグ
  const texes = new Map(); // tex1 => Texture で格納
  // console.log(texes) // 0: {"tex1" => Texture} 1: {"tex2" => Texture}

  const data = el.dataset; // data- 以外の部分を含むオブジェクトを返す
  // console.log(data) // DOMStringMap {webgl: '', tex-1: '/img/slider/slider_1.jpg', tex-2: '/img/slider/slider_2.jpg'}

  let mediaLoaded = null; // プロミスを格納

  // ループを１回に制御(HTML要素の最初の画像の高ささえ取得できればいいので)
  let first = true;

  for (let key in data) {
    // console.log(key) // webgl tex-1 tex-2
    if (!key.startsWith("tex")) continue; // tex以外の属性はループを抜ける

    const url = data[key]; // url取得
    // data ... DOMStringMap { tex-1: '/img/slider/slider_1.jpg', tex-2: '/img/slider/slider_2.jpg'}
    // console.log(url) // /img/slider/slider_1.jpg

    // console.log(textureCache); 
    const tex = textureCache.get(url);  // キャッシュからurlに見合うテクスチャを取得
    // console.log(tex)

    // keyのハイフンを削除して、{ tex1 => Texture } の形でマップに格納
    // console.log(key)
    key = key.replace("-", "");
    texes.set(key, tex);
    // console.log(texes) // 0: {"tex1" => Texture}

    // Promiseオブジェクトが返されて、el.srcでロード開始。
    // srcでロードは開始されているが、後から、await MediaLoadedでresolve()が発火して完全にロードが完了するまでは次の処理に進めない
    // 画像のロード
    if (first && el instanceof HTMLImageElement) {
      mediaLoaded = new Promise((resolve) => {
        el.onload = () => { // onload → 画像が完全に読み込まれた時点でコールバックが発火
          resolve(); // resolveが発火すると次の処理へ
        };
      });
      el.src = url; // el.srcのsrc → サーバーに対してリクエストを自動に発行し読み込み開始。これも非同期
      first = false; // HTML要素の2つ目以降の画像のループには入らないように
    }

    // videoのロード
    if (first && el instanceof HTMLVideoElement) {
      mediaLoaded = new Promise((resolve) => {
        // onloadeddata → 動画の1フレーム目が読み込まれたらコールバック発火
        //                動画が完全に読み込まれたわけではなく、再生できる状態(最初のフレームが表示できる状態)になったことを示します。
        el.onloadeddata = () => {
          resolve();
        };
      });

      el.src = url;
      el.load(); // 動画のロードが開始。ブラウザによっては動かない可能性がるので念のために設定
      first = false;
    }
  }
  // console.log(mediaLoaded)

  await mediaLoaded;

  // console.log(texes)
  return texes;
}


// 画像ロード
let total = 0; // loadImg、loadVideoが発火したときに+1
let progress = 0; // loadImg、loadVideoがPromise.allで解決したら+1
let _progressAction = null; // コールバック関数を格納する関数

async function loadImg(url) {
  incrementTotal(); // 読み込み対象の合計値(分母)に +１

  try {
    const tex = await texLoader.loadAsync(url);
    // console.log(tex) // Texture {isTexture: true, uuid: 'a03c7dcc-a2d0-426e-b25a-0dbbc9f80ab1', name: '', source: Source, mipmaps: Array(0), …}
    // レティナディスプレイなどの解像度の高い時にどのように色を取得するか
    // LinearFilter...隣のテクスチャの中間値を取得
    tex.magFilter = LinearFilter;
    tex.minFilter = LinearFilter;
    tex.needsUpdate = false; // テクスチャのアップデート

    // console.log(tex); // Texture {isTexture: true, uuid: '5af63e21-a0d0-4ed7-a6c5-3b25ca0a8397', name: '', source: Source, mipmaps: Array(0), …}
    return tex; // → プロミスでラップされる
  } catch(e){
    throw new Error;
  } finally { // 必ず実行される
    incrementProgress(); // 読み込みが完了した時(分子) + 1
  }
}

// 動画ロード
// 前半の記述 → urlに紐づいた動画が再生可能かどうかを判定するためだけの記述
// 後半のPromiseの記述 → 動画の読み込みが完了するまで待機し、動画が再生可能になった時点でPromiseを解決する記述
async function loadVideo(url) {
  const video = INode.htmlToEl("<video></video>");
  // console.log(video)

  // split(".") ... ドットを境に分割した文字列を配列として取得
  // pop()      ... 末尾の要素を取得
  // console.log(url.split("."))
  let extension = url.split(".").pop();
  // console.log(extension);

   // 拡張子がmovの場合は、quicktimeに変更
   // → movはQuickTimeフォーマットで保存された動画ファイル
   //   ブラウザやその他のメディアプレイヤーで再生する際に、適切に認識されないことがある。
   //   拡張子をquicktimeに変更することで、ブラウザにこの動画がQuickTimeフォーマットであることを明示し、
   //   再生互換性を向上させる
  if (extension === "mov") extension = "quicktime";
  // console.log(extension)

  // 再生不可の時はnullを返す
  // 再生可能の場合 → "maybe"、"probably" が返ってくる
  // 再生不可の場合 →　"" 空文字が返ってくる
  // → !"" ... true になる
  if (!video.canPlayType(`video/${extension}`)) return null;

  incrementTotal(); // 合計値に+1

  // Promiseで非同期処理
  return new Promise((resolve, reject) => {
    // 画像テクスチャと違い、videoタグを生成してからVideoTextureに渡す必要がある
    // <video>要素を使用して動画をロードし、再生状態を保持しておく

    const video = INode.htmlToEl(`
      <video
        autoplay
        loop
        muted         // 音量を出さない
        playsInline   // 動画がフルスクリーンにならないように調整
        defaultMuted  // デフォルトの初期状態のミュート状態(safariで必要な場合がある)
      ></video>
    `);

    // oncanplay →  video.srcで動画がロードされ、再生可能になったら発火
    video.oncanplay = () => {
      const tex = new VideoTexture(video); // 生成したvideoをテクスチャに変換。このためにvideoを生成しておく
      // console.log(tex)
      incrementProgress(); // 読み込みが完了した分をプラス1

      // LinearFilter ... 補間によってなめらかに表示させる
      tex.magFilter = LinearFilter; // テクスチャが拡大されるとき(テクスチャのピクセルがスクリーンのピクセルより少ない場合)に適用されるフィルタ
      tex.minFilter = LinearFilter; // ピクセル間の色を補間し、滑らかに表示。これにより、拡大時のジャギー(ギザギザ)が軽減され、ぼやけた感じに表示される。

      video.play(); // 読み込んだ後にビデオの再生
      video.oncanplay = null; // 2度動画が初期化されるのを防止

      resolve(tex); // videのテクスチャを返す
    };

    video.onerror = () => { // エラーが発生した場合。iPhoneでロードが完了しない問題
      incrementProgress(); // 読み込みエラーでも読み込んだ値に+1
      reject();
    }

    video.src = url; // srcでロードが始まる → ロードの完了でoncanplayに渡したコールバックが発火
  });
}

// loadImg、loadVideoが発火したタイミングで発火 合計数に +1
function incrementTotal() { 
  total++;
}

// loadImg, loadVideoがPromise.allで解決してから発火 読み込んだ値に+1、ローディングの関数を登録
function incrementProgress() {
  progress++;

  if(_progressAction) {
    _progressAction(progress, total); // 数値のカウントアップ
  }
  // → incrementProgressが発火するたびに、loaderPercent.innerHTMLが呼ばれてdomが更新される
  // console.log(progress, total);
}

// 実行したいアニメーションの関数を渡す(今回はカウンター)
function addProgressAction(_callback) {
  _progressAction = _callback;
}

// ローディングスタート時のアニメーション
function _loadingAnimationStart() {
  const tl = gsap.timeline();

  // タイムラインで処理をつないでいく
  tl.to($.loader.firstElementChild, {
    // $.loader.firstElementChild ... loader-inner
    opacity: 0,
    y: 10,
    duration: .3,
    delay: 0.8, 
  })
    .set($.globalContainer, {
      visibility: "visible",
    })
    .set($.loader, {
      display: "none",
    });

  return tl;
}

// ローディングアニメーションが終わってから実行される関数
async function _loadingAnimationEnd(_tl){
  // console.log("running");

  // これらのopacityを徐々に上げていく
  const page = INode.qsAll("#page-container, #asides");
  // console.log(page);
  return new Promise(resolve => {
    _tl.to(page, {
      opacity: 1,
      duration: 1,
  
      onComplete: () => {
        loader.isLoaded = true;
        resolve();
      }
    });
  })
  
}


let loadingAnimation = null;

function addLoadingAnimation(_loadingAnimation){
  loadingAnimation = _loadingAnimation;
}

async function letsBegin() { // ローディングアニメーションを発火させるための関数
  const tl = _loadingAnimationStart();

  // ローディング中のアニメーションを実行
  loadingAnimation && loadingAnimation(tl);

  // ローシングアニメーションが終わった時に実装
  return await _loadingAnimationEnd(tl);
}


export default loader;
