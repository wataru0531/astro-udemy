/**************************************************************

波紋のエフェクトをレンダーターゲット(フレームバッファオブジェクト)に格納
この時フレームバッファの中ではテクスチャとして保持される。
↓
ShaderPassで読み込みポストプロセスのcomposerに追加
RenderPassで読み込んだテクスチャに対してエフェクトを適用し、結果を新しいフレームバッファに書き込む。
この新しいフレームバッファも内部的にはテクスチャとして扱われる。
↓
繰り返しエフェクトを追加していき最終的な描画結果をディスプレイに表示する

***************************************************************/
import {
  Scene,
  OrthographicCamera,
  WebGLRenderer,
  PlaneGeometry,
  MeshBasicMaterial,
  Mesh,
  TextureLoader,
  BoxGeometry,
  ShaderMaterial,

} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";

import { initRipplePass } from "./pass";
import vertexShader from "./vertex.glsl";


(async () => {
  const scene = new Scene(); // 通常のシーン
  const camera = new OrthographicCamera( // 通常のカメラ
    - window.innerWidth / 2,  // 左
    window.innerWidth / 2,    // 右
    window.innerHeight / 2,   // 上
    - window.innerHeight / 2, // 下
    - window.innerHeight,     // near
    window.innerHeight        // far
  );
  camera.position.z = 10;

  const renderer = new WebGLRenderer({ antialias: true }); // レンダラー
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const texLoader = new TextureLoader();
  const imageTex = await texLoader.loadAsync("/img/kaneki.avif");

  // ポストプロセス
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera); 
  // 通常のレンダリングしたい描画データはここでRenderPassに渡す必要がある
  // → composerにエフェクトを格納していく
  composer.addPass(renderPass);

  // composerを渡してエフェクトを追加
  const { onMouseMove, renderRipple, getTexture } = await initRipplePass(composer);

  // キューブ
  const boxGeo = new BoxGeometry(300, 300, 300);
  const boxMate = new ShaderMaterial({
    vertexShader,
    fragmentShader: `
    precision mediump float;

    varying vec2 vUv;
    
    void main() {
        gl_FragColor = vec4(vUv, 0., 1.);
    }
    `,
  });
  const cube = new Mesh(boxGeo, boxMate);
  cube.position.x = -200;

  // プレーン
  const imgGeo = new PlaneGeometry(480, 270);
  const imgMate = new MeshBasicMaterial({
    map: imageTex,

    // レンダーターゲットのテクスチャをマッピングする
    // map: getTexture(), // リップルの画面が見える
  });
  const plane = new Mesh(imgGeo, imgMate);
  plane.position.x = 200;

  scene.add(plane, cube);

  // renderer.domElement...canvas要素
  renderer.domElement.addEventListener("mousemove", onMouseMove);

  const controls = new OrbitControls(camera, renderer.domElement);

  animate();
  function animate() {
    requestAnimationFrame(animate);
    controls.update();

    // レンダリングの描画データの保存先をレンダーターゲット(フレームバッファオブジェクト)に設定
    // レンダーターゲットに描画データを保存
    // レンダラーの描画対象を通常のフレームバッファに戻す
    renderRipple(renderer);
    composer.render(); // ポスロプロセスを考慮したレンダリング
  }

})();

