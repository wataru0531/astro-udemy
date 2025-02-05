
// 背景のもこもこ動画のエフェクト
// パフォーマンスが出ていないなら非表示とする
// → beforeCreateMeshで対応

import { Ob } from "../Ob";
import { utils } from "../../helper";

//
import vertexShader   from "./vertex.glsl";
import fragmentShader from "./fragment.glsl";


// TODO
// movの動画が読み込まれていない。


export default class extends Ob{
  beforeCreateMesh(){
    // パフォーマンスが悪い時はfresnel-bgのエフェクト非表示
    if(utils.isLowPerformanceMode()){
    // if(utils.definePerformanceMode(2, 60)){
      // console.log(utils.isLowPerformanceMode())
      // どの要素を非表示にするのかをコンソールに表示
      if(window.debug) console.log(this.$.el);
      throw new Error("ローパフォーマンスのため、meshの作成をスキップします。");
      // → 親クラスのObでエラーが検出されて、catchの処理に入り、空のオブジェクトが返される
    }
  }

  setupUniforms(){
    const uniforms = super.setupUniforms();
    // console.log(uniforms)
    uniforms.uReversal = { value: 0 };

    return uniforms;
  }

  setupTexes(uniforms){
    // console.log(uniforms);
    const _uniforms = super.setupTexes(uniforms);
    // console.log(_uniforms.tex1.value.source.data);
    // console.log(utils.isSafari()); // false
    
    // safariではmovが使えるが、webmは使えない。
    // → safariの場合はtex1にtex2(mov)を設定してやる。
    if(utils.isSafari()) _uniforms.tex1 = _uniforms.tex2;

    return _uniforms;
  }

  setupVertex(){
    return vertexShader;
  }

  setupFragment(){
    return fragmentShader;
  }
}

