/**************************************************************

noise-slide

***************************************************************/
import gsap from "gsap";
import { Vector2 } from "three";

import { Ob } from "../Ob";
import vertexShader   from "./vertex.glsl";
import fragmentShader from "./fragment.glsl";


export default class extends Ob{
  setupUniforms(){
    const uniforms = super.setupUniforms(); // uniformsを取得
    uniforms.uNoiseScale = { value: new Vector2(2, 2) }; // uniformsに新たに追加

    return uniforms; // Obクラス同様に必ずリターンする
  }

  setupVertex(){
    return vertexShader;
  }

  setupFragment(){
    return fragmentShader;
  }

  debug(_folder){
    _folder.add(this.uniforms.uNoiseScale.value, "x", 0, 10, 0.1);
    _folder.add(this.uniforms.uNoiseScale.value, "y", 0, 10, 0.1);
    _folder.add(this.uniforms.uProgress, "value", 0, 1, 0.1).name('progess').listen();
    // ここをlistenすれば、toで変更した内容がguiにも反映される
    
    const datData = { next: !!this.uniforms.uProgress.value }
    
    _folder.add(datData, "next").onChange(() => {
      gsap.to(this.uniforms.uProgress, {
        value: +datData.next, // 単項プラス演算子 booleanを数値型に変換
        duration: 1.5,
        ease: "power3.inOut"
      })
    })

  }

}