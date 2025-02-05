/**************************************************************

rippleのエフェクト
composerに入れて、ポストプロセスのエフェクトとして使う。
scroll-animation.jsで使用

***************************************************************/
import {
  Scene,
  OrthographicCamera,
  // WebGLRenderer,
  PlaneGeometry,
  MeshBasicMaterial,
  Mesh,
  TextureLoader,
  WebGLRenderTarget,
  ShaderMaterial,
} from "three";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";

import world from "../world";
import { viewport } from "../../helper";
import vertexShader from "./vertex.glsl";
import fragmentShader from  "./fragment.glsl";


// 画面全体の1/5のサイズが、renderTargetに渡した描画データの大きさだが、
// ShaderMaterialにテクスチャとして渡す際に、画面全体に引き伸ばされる
class Ripple {
  constructor(_tex, _vp){ // _vp → renderTargetのサイズ
    const ripple = { width: _vp.width / 10, height: _vp.height / 10 };
    this.geometry = new PlaneGeometry(ripple.width, ripple.height);
    this.material = new MeshBasicMaterial({ 
      transparent: true,
      map: _tex,
    });
    this.mesh = new Mesh(this.geometry, this.material);

    this.mesh.visible = false; // 初期表示はfalse
    this.isUsed = false; // 使い回すために使用中かどうかをこのフラグで見分ける
  }

  start(_position){
    const { material, mesh } = this;

    // 取得できた場合
    this.isUsed  = true;       // もうこのrippleオブジェクトは使ったよということ
    mesh.visible = true;  // メッシュを可視化できるようにする

    // 位置、大きさ、透明度、回転
    mesh.position.x = _position.x;
    mesh.position.y = _position.y;
    mesh.scale.x = mesh.scale.y = .2;
    material.opacity = .5;
    mesh.rotation.z = 2 * Math.PI * Math.random(); // 360 * 0から1。回転

    this.animate();
  }

  animate(){
    const { mesh, material } = this;

    // 大きさ、透明度、回転
    mesh.scale.x = mesh.scale.y = mesh.scale.x + 0.03; // ループが繰り返されるうちに0.03づつ大きくなる
    material.opacity *= .97; // ループが繰り返されるうちに.97倍で透明度が下がっていく
    mesh.rotation.z += .001;

    // マテリアルの透明度が0.01以上の時のみanimateを発火し続ける
    if(material.opacity <= 0.01){
      // ループ終了
      mesh.visible = false; // 画面上に表示されなくなる
      this.isUsed = false; // もうこのメッシュは使ってませんよに
      
    } else{
      requestAnimationFrame(() => {
        this.animate();
      })
    }
  }
}


// ポストプロセスのcomposerにレンダーターゲットに保存したrippleのエフェクトの描画データを追加
async function initRipplePass(_world, _mouse) { // scroll-animation.jsで実行
  // console.log(_world, _mouse);

  // renderTargetに渡したい描画データの大きさ → 
  const vp = {
    width: viewport.width / 5,
    height: viewport.height / 5
  }

  const rtScene = new Scene(); // シーン　renderTarget
  const rtCamera = new OrthographicCamera( // カメラ renderTarget 遠近感を加味しない
    - vp.width / 2,  // 左
    vp.width / 2,    // 右
    vp.height / 2,   // 上
    - vp.height/ 2, // 下
    0,     // near
    2    // far
  );
  rtCamera.position.z = 1;

  // レンダーターゲット(フレームバッファオブジェクト) ... 
  // → 描画データの保存先。ここにrippleのエフェクトをレンダリングしていく
  const renderTarget = new WebGLRenderTarget();
  renderTarget.setSize(vp.width, vp.height);

  const texLoader = new TextureLoader();
  const tex = await texLoader.loadAsync("/img/disps/ripple.png");
  // console.log(tex);

  const ripples = [];
  const rippleCount = 50;

  for(let i = 0; i < rippleCount; i++){
    const ripple = new Ripple(tex, vp);
    // console.log(ripple)

    rtScene.add(ripple.mesh);
    ripples.push(ripple);
  }

  // 波紋のエフェクトをテクスチャとして、RenderPassでレンダリングした描画データに追加
  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      // RenderPassで読み込んだはじめのシーンがテクスチャとしてここに渡ってくる仕様になっている
      // → 直近でcomposer.addPassで読み込んだものがテクスチャとして渡ってくる
      tDiffuse: { value: null },

      // レンダーターゲットに格納した描画データをテクスチャとして指定
      texRipple: { value: renderTarget.texture }, // 波紋のテクスチャ
    },
  });

  const pass = new ShaderPass(material); // 独自に作ったシェーダーパス
  world.addPass(pass);  // composerにパスを追加

  // mouse.jsで実行 → マウス関係の処理は、mouse.jsにまとめる
  _mouse.addMousemoveActions(onMouseMove);
  
  function onMouseMove(_mouse) { // mouse.jsのinitで実行
    // console.log(_mouse);

    const position = _mouse.getMapPos(vp.width, vp.height);
    // console.log(position); 

    // 使ってないメッシュを選択し、透明度を少しづつ上げ、波紋を大きくしていく
    // あまり波紋を作るとうっとうしいので5で割った時の余りが0の時のみ生成(tickが5の倍数の時)
    if(_mouse.tick % 5 === 0){ 
      // console.log(_mouse.tick); 

      // find...ripplesからまだ使用していないrippleを1つだけ取得
      const _ripple = ripples.find(ripple => !ripple.isUsed); // isUsedはデフォルトでfalse
      // console.log(_ripple)
      if(!_ripple) return; // もし50個使い切った場合は処理を止める
      _ripple.start(position); // 位置、透明度、大きさなどの初期化
    }
  }

  world.addRenderAction(renderRipple); // レンダリングに関する関数を格納
  // console.log(world.renderActions);

  // ここでレンダーターゲットに描画データを格納
  function renderRipple({ renderer: mainRenderer }) { // メインのレンダラーが渡ってくる
    // レンダリングの描画データの保存先をレンダーターゲット(フレームバッファオブジェクト)に設定
    mainRenderer.setRenderTarget(renderTarget); 
    mainRenderer.render(rtScene, rtCamera); // レンダーターゲットに描画データを保存
    mainRenderer.setRenderTarget(null); // レンダラーの描画対象を通常のフレームバッファに戻す
  }

  // 確認用。呼ぶとリップルの画面が見える
  function getTexture(){
    // レンダーターゲットのテクスチャを返す
    return renderTarget.texture;
  }

  function addPass(){ 
    world.addPass(pass); // composerにパスを追加する処理
  }
  // worldのaddPass → function addPass(_pass){ world.composer.addPass(_pass); }

  function removePass(){
    world.removePass(pass); // composerからパスを削除する処理
  }
  
  return { getTexture, addPass, removePass };
};

export { initRipplePass };