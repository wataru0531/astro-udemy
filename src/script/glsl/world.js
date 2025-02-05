/**************************************************************

WebGL関連の記述
Three.js関連の記述

***************************************************************/
import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Raycaster,
  AxesHelper,
  Color,

} from "three";
import Stats from "stats-js";

import { Ob } from "./Ob";
import { utils, INode } from "../helper";
import mouse from "../component/mouse";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import gsap from "gsap";
import scroller from "../component/scroller";

const world = {
  os: [], // Obクラスのオブジェクトを管理
  raycaster: new Raycaster(),
  init,
  adjustWorldPosition,
  render,
  tick: 0,
  composer: null,
  renderActions: new Set(), // renderに渡したい関数を登録
  addOrbitControlGUI,
  addObj,
  removeObj,
  getObjByEl,
  addPass,
  removePass,
  addRenderAction,
  removeRenderAction,
  raycast,
  raycastingMeshes: [], // raicasting対象のmesh
  addRaycastingTarget,

};

let stats = null;

async function init(_canvas, _viewport, _background = "none") {
  // webgl:  WebGL 1.0 (OpenGL ES 2.0 Chromium) を設定
  // webgl2: WebGL 2.0 (OpenGL ES 3.0 Chromium)
  // → webgl1.0にしか対応していないデバイスの場合は2.0では動かない
  // const context = _canvas.getContext("webgl");
  // console.log(context.getParameter(context.VERSION));

  world.renderer = new WebGLRenderer({ // レンダラー
    canvas: _canvas, 
    // context,
    antialias: true,
    debug: window.debug, // 本番環境では停止。bootstrap.jsのdebugと同期さsる
    // エフェクトで個別に設定する場合 → setupMaterial、glslファイル内で
    precision: utils.isTouchDevices ? "highp" : "mediump", // 全体の設定(個別ならglslファイルかindex.jsのShadermaterialに記述)
  });
  world.renderer.setSize(_viewport.width, _viewport.height, false); // バッファに格納するサイズ(領域)を決定 false...styleタグをタグを挿入するかどうか
  world.renderer.setPixelRatio(_viewport.devicePixelRatio); // ピクセル密度を設定
  world.renderer.setClearColor(0x000000, 0);
  world.scene = new Scene(); // シーン
  world.scene.background = _background === "none" ? "none" : new Color(_background);
  world.camera = _setupPerspectiveCamera(_viewport); // カメラ。原点からの距離、カメラの設定

  // ポストプロセスを考慮してレンダリング
  world.composer = new EffectComposer(world.renderer); // ポストプロセシングを管理するオブジェクト
  const renderPass = new RenderPass(world.scene, world.camera); 
  // 通常のレンダリングしたい描画データは始めにはRenderPassに渡す必要がある
  world.composer.addPass(renderPass);
   // → このcomposerにエフェクトを格納していき、最終的な描画データをカメラに映す

  await _initObj(_viewport);  // メッシュ生成

  if(window.debug){ // デバックモードの時のみパフォーマンスを測定
    // console.log("debug");

    stats = new Stats();
    // stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom。設定しない場合はfpsが表示
    document.body.appendChild( stats.dom );
  }

  _bindEvents(); // iOSの時だけ画面をレンダリングする
}

//
async function _initObj(viewport) {
  const els = INode.qsAll("[data-webgl]");
  // console.log(els) // els...配列風オブジェクト NodeList(2) [div#div1, div#div2]

  const prms = [...els].map((el) => { // Promiseを返す。
    // console.log(el); // HTMLの要素
    // console.log(el.dataset)

    // type ... WebGLのエフェクトの種類を判定
    const type = INode.getDS(el, "webgl");
    // console.log(type) // normal  gray
    
    // Obクラス初期化 //////////////////////////////////////////////
    // ダイナミックインポートで初期化したいglslファイルを取得
    // import → Promiseを返す → thenで受ける
    // default → defaultエクスポートされたオブジェクト。予約後なのでObに変更
    //           ※ defaultを格納したModuleオブジェクト → 名前付きエクスポートも保持
    return import(`./${type}/index.js`).then(({ default: Ob }) => {
      // return import(`./${type}/index.js`).then((d) => {
      // console.log(d); // Module {Symbol(Symbol.toStringTag): 'Module'}
      // console.log(Ob)

      // 静的メソッド直接呼び出し
      // オブジェクトで渡すことで順番は気にしなくて良くなる。分割代入で渡すため
      // 省略なし → Ob.init({ type: type, el: el })
      return Ob.init({ el, type });
    });
  });
  // console.log(prms); //  [Promise, Promise]

  // await ... thenと同じ働きをする。待機、resolveした値を取得の働きがある。
  // Promise.allで返したプロミス配列の順番は、...elsの順番と一致する。順番が守られる
  // console.log(prms)
  const _os = await Promise.all(prms);
  console.log(_os); // (2) [default, default]
  // → なぜdefaultが返されるのか？
  // → Ob.init() メソッドから返されるオブジェクトが export default を使ってエクスポートされたモジュールであることを示している

  _os.forEach((o) => {
    // console.log(o); // default {$: {…}, texes: Map(3), rect: DOMRect, defines: {…}, uniforms: {…}, …}
    // oが取得できてmeshプロパティがなければ処理を中断(空のオブジェクトが帰ってくるので)
    if (!o.mesh) return;

    addObj(o);  // シーンに追加、os配列に追加
  });

  await adjustWorldPosition(viewport);  // リサイズ処理、canvas、メッシュ、カメラの更新

  const afterPrms = world.os.map((o) => o.afterInit()); // 初期化が終わった後に実行したい処理
  // console.log(afterPrms); // (2) [Promise, Promise]

  await Promise.all(afterPrms); // 待機、並列で実行
}

// iOSデバイス(iPhone、iPad)の時だけ画面をレンダリングする
// 別タブで開いて戻ってきたタイミングで実行。→ iOSでエフェクトの残像が残るため
function _bindEvents(){
  // focus → ブラウザウィンドウがユーザーのアクティブな状態に戻ったときに発生するイベント
  window.addEventListener("focus", () => {
    // console.log("focus");
    if(utils.isIOS()) window.location.reload();
  })
}

// メッシュをシーンとosに追加する関数
function addObj(_o) {
  world.scene.add(_o.mesh);
  world.os.push(_o); // awaitで非同期処理が解決した順番でworld.osに格納されていく
}

// 必要無くなったオブジェクトを削除
// dispose...シーンから削除したいだけの場合もあるので、条件分岐させる。
function removeObj(o, dispose = true) {
  if(!(o instanceof Ob)){ // セレクタ文字列で渡ってきた場合など
    o = world.getObjByEl(o);
    if(!o) return;
  }

  // console.log(o);
  world.scene.remove(o.mesh); // シーンから削除
  const idx = world.os.indexOf(o);  // world.osの何番目のものを削除するかのインデックス
  world.os.splice(idx, 1);  // インデックスから1つ要素を削除

  // dispose()...使わないものを削除することになるので余計なメモリを使わなくていい
  // meshはsceneから削除したとしても、meshの内部で保持されているmaterialやgeometryはメモリに残るので削除
  if(dispose) {
    o.mesh.material.dispose();
    o.mesh.geometry.dispose();
  }
}

// HTML要素のidと一致するmesh(default {$: {…}})を取得する関数
// selector...セレクタ文字列
function getObjByEl(_selector) {
  // console.log(_selector)
  // console.log(_selector instanceof Ob)
  // 万が一、セレクタ文字列がObクラスのインスタンスだった場合はそのままセレクタを返す
  if (_selector instanceof Ob) return _selector;

  const targetEl = INode.getElement(_selector); // DOM取得
  // console.log(targetEl)

  // HTMLのDOM(セレクタ文字列で取得したもの)とosの$.el(DOM)が一致したものを返す
  const o = world.os.find((o) => o.$.el === targetEl);
  // console.log(world.os);
  // console.log(o); // default {$: {…}, texes: Map(1), rect: DOMRect, defines: {…}, uniforms: {…}, …}

  return o;
}

// カメラの設定
function _setupPerspectiveCamera(viewport) {
  const { near, far, aspect, fov, cameraZ } = viewport;

  const camera = new PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = cameraZ; // メッシュのz軸の値が0の時にスケールがあう。

  return camera;
}

// キャンバスのサイズ、メッシュのサイズ、カメラの更新
async function adjustWorldPosition(_viewport) {
  world.renderer.setSize(_viewport.width, _viewport.height, false);

  // メッシュの位置とサイズを変更
  // → resizeが非同期処理なので配列を返す
  const promiseResizes = world.os.map(o => o.resize()); 
  // console.log(promiseResizes); // (4) [Promise, Promise, Promise, Promise]

  // カメラの更新
  const promiseCamera = updateCamera(_viewport); // 後からPromise.allで解決するのでここではawaitしない
  // console.log(promiseCamera); // PerspectiveCamera {isObject3D: true, uuid: 'ac76fb57-a6e1-431c-8b80-7f2ed7c17cde', name: '', type: 'PerspectiveCamera', parent: null, …}

  // console.log([promiseCamera, ...promiseResizes]); // (5) [PerspectiveCamera, Promise, Promise, Promise, Promise]
  await Promise.all([promiseCamera, ...promiseResizes]);
  // → ここで並列処理させることでadjustWorldPositionの処理が終わる
}

// カメラの更新
// asyncのキーワードをつけるとPromiseオブジェクトが返されるが、ここではPromiseをreturnしているので別につけなくてもいい
// → わかりやすいのでつけているだけ
async function updateCamera(viewport) {
  const { near, far, aspect, fov } = viewport;

  // gsapは非同期で実行されるのでPromiseで待機させる
  return new Promise((resolve) => {
    gsap.to(world.camera, {
      near,
      far,
      aspect,
      fov,
      overwrite: true, // 次のリサイズ処理の時に上書きされる
      onUpdate: () => {
        world.camera.updateProjectionMatrix();
      },
      onComplete: () => {
        resolve(world.camera); // 完了したら更新後のcamaraオブジェクトを返す
      },
    });
  });
}

// レンダリング
function render() {
  requestAnimationFrame(render);

  window.debug && stats?.begin(); // パフォーマンス測定開始

  world.tick++;

  for (let i = world.os.length - 1; i >= 0; i--) { // 逆ループ
    const o = world.os[i];

    o.scroll(); // スクロール処理...位置関係を取得
    o.render(world.tick);
  }
  
  // renderに関する関数を実行
  // console.log(world.renderActions); // Set(1) {ƒ}
  world.renderActions.forEach(action => action?.(world));
  world.composer.render(); // メインのrendererをレンダリング

  window.debug && stats?.end(); // パフォーマンス測定終了
}

// レイキャスト
// 光線を飛ばした時にぶつかるものがあるかどうかの処理
function raycast() {
  // タッチデバイス、Raycasting対象のmeshがない時スキップ
  // → 1つでもfalseであればスキップ
  // console.log(world.raycastingMeshes)
  // console.log(utils.isTouchDevices); 
  // console.log(scroller.scrolling)
  if(
    utils.isTouchDevices
    || world.raycastingMeshes.length === 0
    || scroller.scrolling // スクロール中はレイキャストをさせない
  ) return; 

  const clipPos = mouse.getClipPos(); // クリップ座標(-1〜1)取得

  // setFromCamera(マウス座標, カメラ) ... 特定のカメラの位置と向きを設定し、そのカメラからの光線の方向を表すためのメソッド
  world.raycaster.setFromCamera(clipPos, world.camera);

  // raycastingの監視対象を決定
  const meshes = world.raycastingMeshes;
  const intersects = world.raycaster.intersectObjects(meshes); // 光線でぶつかったメッシュが手前側に近い順に配列で格納
  const intersect = intersects[0]; // ぶつかった最も手前側の要素を取得
  // console.log(meshes)
  // console.log(intersects); 
  // console.log(intersect)
  
  for (let i = meshes.length - 1; i >= 0; i--) { // 逆ループ
    const _mesh = meshes[i];
    // console.log(_mesh)

    if (!_mesh.material?.uniforms) continue; // uniformsを持っていないmeshはスキップして次のループ(axesHelperなど)
    
    // 光線とぶつかった要素のみ色を変更
    const uHover = _mesh.material.uniforms.uHover; // uHoverの初期値は0
    if (intersect?.object === _mesh) {
      // console.log(_mesh); 
      // メッシュのuMouseの値にホバー箇所のuv座標の値を格納
      // console.log(intersect.uv); // 
      _mesh.material.uniforms.uMouse.value = intersect.uv; // 初期値: Vector2(0.5, 0.5)
      uHover._endValue = 1;
    } else {
      uHover._endValue = 0;
    }
    uHover.value = utils.lerp(uHover.value, uHover._endValue, 0.05); // uHoverに線形補間で値を渡す
  }
}

// Raycastingの対象となるmeshを格納(各ページで格納する)
function addRaycastingTarget(_selector){
  const o = world.getObjByEl(_selector);
  // console.log(o);
  if(o.mesh.children.length === 0 ){ // 通常のo
    world.raycastingMeshes.push(o.mesh);

  } else {  // groupメッシュを使っていて、その子要素をレイキャスティングの監視対象に渡したい時
    world.raycastingMeshes.push(...o.mesh.children);
  }
}

// OrbitControlsの制御
// lil-guiに追加するための関数
let axesHelper = null;

function addOrbitControlGUI(_gui) {
  // ON、OFFを切り替えるためのオブジェクト
  // trueの時がOrbitControlsが有効
  const isActive = { value: false };

  _gui.add(isActive, "value")
    .name('OrbitControl')
    .onChange(() => {
      if(isActive.value) {
        // AxesHelperを追加
        axesHelper = new AxesHelper(1000);
        world.scene.add(axesHelper);

        _attachOrbitControl();
      } else {
        world.scene.remove(axesHelper);
        axesHelper?.dispose(); // リソースの削除(バッファから削除)

        _detachOrbitControl();
      }
    });
}

// OrbitControls
let orbitControl = null;

// チェックをつけた場合
function _attachOrbitControl() {
  // ダイナミックインポートでOrbitControlsをインポート

  import("three/examples/jsm/controls/OrbitControls").then((module) => {
    // console.log(module); // Module {Symbol(Symbol.toStringTag): 'Module'}
    orbitControl = new module.OrbitControls(
      world.camera,
      world.renderer.domElement
    );

    // domElement ... canvas要素。
    // canvas要素のデフォルトのz-indexは-1なので、OrbitControlsが動かせないために設定
    world.renderer.domElement.style.zIndex = 1;
  });
}

// チェックを外した場合
function _detachOrbitControl() {
  // OrbitControlsの破棄
  orbitControl?.dispose();

  world.renderer.domElement.style.zIndex = -1;
}

// composerにパスを追加する処理
function addPass(_pass){
  world.composer.addPass(_pass);
}

// composerからパスを削除する処理
function removePass(_pass){
  world.composer.removePass(_pass);
}

// renderに関する関数を格納する処理
function addRenderAction(_callback){
  world.renderActions.add(_callback);
}

// renderに関する関数を削除する処理
function removeRenderAction(_callback){
  world.renderActions.remove(_callback);
}


export default world;