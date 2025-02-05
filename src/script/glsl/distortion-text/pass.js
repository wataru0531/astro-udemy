

// ローディング時のアニメーション Distortionの歪んだ紋様
// → 新しくフォルダで作っていいが、distortion-textとほぼ同じなのでvertex、fragmentを流用する
// bootstrap.jsでコールバックとして渡す。
// loader.jsのletsBeginで発火

import { Vector4 } from "three";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";

// distortion-textの歪んだエフェクトをcomposerに追加
function initDistortionPass(_world){
  // console.log(_world);

  // meshを取得
  const o = _world.getObjByEl(".load-pp");
  // console.log(o); // default {$: {…}, texes: Map(0), scale: {…}, resizing: false, originalRect: DOMRect, …}

  const { material, uniforms } = o;
  // console.log(material); // ShaderMaterial {isMaterial: true, uuid: '78b7431e-bb79-4dc8-994b-387b35279b29', name: '', type: 'ShaderMaterial', blending: 1, …}
  
  // シーンに追加するmeshとポストプロセスで使うmeshとが同じなのでWegGL的にエラーとなるのでmeshを削除
  // → false: materialまで削除するとポストプロセスの効果がなくなるのでfalseとする
  // 注意: world.osから削除されるためある程度作り込んでから削除する必要がある。
  _world.removeObj(o, false);

  // これまでの描画データを取得
  // → tDiffuseにはこれまでの描画データが渡ってくる
  //   ・RenderPassで読み込んだはじめのシーンがテクスチャとしてここに渡ってくる仕様になっている
  //   → 直近でcomposer.addPassで読み込んだものがテクスチャとして渡ってくる
  uniforms.tDiffuse = { value: null };
  uniforms.uProgress.value = 0;
  uniforms.uReversal.value = 1; // 色反転を通常に
  //  uniforms.uSpeed = { value: 7.1 };
  uniforms.uParam = { value: new Vector4(1, 8, 7, 2) };

  material.alphaTest = 0; // alphaTextを0にするとなぜかうまくうつる。

  const pass = new ShaderPass(material); // 独自に作ったパスをシェーダーパスに追加
  _world.addPass(pass); // composerにpassを追加

  function setProgress(_value){ // プログレスを更新する処理
    uniforms.uProgress.value = _value;
  }

  // パスからエフェクトを削除する処理
  function removePass(){
    _world.removePass(pass);

    o.geometry.dispose(); // 余計なメモリを解放するために履き
    o.material.dispose();
  }

  return { 
    setProgress,
    removePass 
  };
}

export { initDistortionPass }