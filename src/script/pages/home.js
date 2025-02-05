

// トップページの実装

import { INode } from "../helper/INode.js";
import { mountNavBtnHandler, mountScrollHandler, mountSkillBtnHandler } from "../component/slide-hangler";
import { initDistortionPass } from "../glsl/distortion-text/pass.js";
import { utils } from "../helper/utils.js";

let _world = null; 
let _goTo = null;
let _setProgress = null;
let _removePass = null

export default async function({
  world,
  mouse,
  menu,
  loader,
  viewport,
  scroller,

}){
  _world = world;
  // console.log(world); // {os: Array(3), raycaster: Raycaster, init: ƒ, adjustWorldPosition: ƒ, render: ƒ, …}addObj: ƒ addObj(_o)addOrbitControlGUI: ƒ addOrbitControlGUI(_gui)addPass: ƒ addPass(_pass)addRenderAction: ƒ addRenderAction(_callback)adjustWorldPosition: async ƒ adjustWorldPosition(_viewport)camera: PerspectiveCamera {isObject3D: true, uuid: 'e7176dd0-d1fb-445a-bc93-9174abdefe78', name: '', type: 'PerspectiveCamera', parent: null, …}composer: EffectComposer {renderer: WebGLRenderer, _pixelRatio: 1, _width: 1146, _height: 938, renderTarget1: WebGLRenderTarget, …}getObjByEl: ƒ getObjByEl(_selector)init: async ƒ init(canvas, viewport)os: (3) [default, default, default]raycast: ƒ raycast()raycaster: Raycaster {ray: Ray, near: 0, far: Infinity, camera: PerspectiveCamera, layers: Layers, …}removeObj: ƒ removeObj(o, dispose = true)removePass: ƒ removePass(_pass)removeRenderAction: ƒ removeRenderAction(_callback)render: ƒ render()renderActions: Set(1) {ƒ}renderer: WebGLRenderer {isWebGLRenderer: true, domElement: canvas#canvas, debug: {…}, autoClear: true, autoClearColor: true, …}scene: Scene {isObject3D: true, uuid: '301893ec-b449-4449-871d-cb46da8ce662', name: '', type: 'Scene', parent: null, …}tick: 252[[Prototype]]: Object

  // Raycastingの対象を格納
  const planeEls = INode.qsAll(".panel__media");
  planeEls.forEach(planeEl => _world.addRaycastingTarget(planeEl));

  // ローディングアニメーションを追加 → meshに対してアニメーションをかけていくので、_worldの初期化後とする
  loader.addLoadingAnimation((_tl) => loadAnimation(_tl));

  // distortion-textの歪んだエフェクトをcomposerに追加
  const { setProgress, removePass } = initDistortionPass(_world);
  _setProgress = setProgress;
  _removePass = removePass;

  // スライダー関係の操作
  const { goTo } = mountNavBtnHandler( // 円柱スライダーのボタン機能
    ".fv__slider", 
    ".fv__btn.prev", ".fv__btn.next", 
    ".fv__text-shader" // スライダーのテキスト
  ); 
  _goTo = goTo;

  // テキストシェーダーを手前側に移動する
  const fvTextShader = _world.getObjByEl(".fv__text-shader");
  // console.log(fvTextShader);
  if(fvTextShader) fvTextShader.mesh.position.z = 200;

  // mountSkillBtnHandler( // 反射スライダーのボタン機能
  //   ".skill__slider",
  //   ".fv__btn.prev", ".fv__btn.next", 
  //   ".skill__ul" // スライダーのテキスト
  // );

  // mountScrollHandler( // 反射スライダー。ScrollTRiggerを使った処理
  //   ".skill__slider", // data-webglのタグ
  //   ".skill", // section
  //   ".skill__ul" // ul
  // )

  // スライダーの位置を固定する場合。スクロール処理を無効にする。Ob.js
  // const fvSlider = _world.getObjByEl(".fv__slider");
  // fvSlider.fixed = true;

  // パフォーマンスによってはレイマーチングを削除してグレイピックを表示する
  // console.log(utils.isLowPerformanceMode());
  if(utils.isLowPerformanceMode()){ // パフォーマンスが悪ければtrueを返す
    // パフォーマンスが悪い場合の処理

    _world.removeObj(".vision__raymarching");
    // console.log(_world.os)
    _world.addRaycastingTarget(".vision__fallback"); // レイキャスティングの対象にする

  } else { 
    // パフォーマンスが良い場合の処理
    // console.log("high")

    _world.removeObj(".vision__fallback");
    _world.addRaycastingTarget(".vision__raymarching");
  }

  const fresnel = _world.getObjByEl(".fresnel"); // 背景のアニメーション
  // console.log(fresnel);
  if(fresnel) fresnel.mesh.position.z = - 1000;

}

// ローディングアニメーション
function loadAnimation(_tl){
  // console.log(_tl)

  // const fvSlider = _world.getObjByEl(".fv__slider");
  // console.log(fvSlider);

  // 奥方向から手前方向に移動してくるアニメーション
  _goTo(5);
  // const { mesh } = fvSlider;
  // const z = mesh.position.z;
  // mesh.position.z = -2000; // 奥へ移動しておく
  // gsap.to(mesh.position, { z: z, duration: 2 })

  const distortionProgress = { value: 0 };
  // タイムラインに追加。スタート時のアニメーションが終わってから実行するため
  _tl.to(distortionProgress, {
    value: 1,
    duration: .3,
    onUpdate: () => {
      // console.log(distortionProgress.value);
      _setProgress(distortionProgress.value);
    },
    onComplete: () => {
      _removePass(); // ポストプロセスのShaderPassから削除
    },
  })

}
