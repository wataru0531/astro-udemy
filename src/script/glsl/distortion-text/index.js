/**************************************************************

distortion-text

***************************************************************/
import gsap from "gsap";
import { Vector4, } from "three";

import { Ob } from "../Ob";
import vertexShader   from "./vertex.glsl";
import fragmentShader from "./fragment.glsl";

export default class extends Ob{

  setupTexes(uniforms) {
    // console.log(this.texes); // Map(0) {size: 0}

    // this.texesの長さが0なので、このループは無視される。
    // → テクスチャ画像が設定されている場合のみループが処理される
    this.texes.forEach((tex, key) => { // uniformにテクスチャを格納
			// console.log(tex, key); // Texture{}, "tex1"

      uniforms["tDiffuse"] = { value: tex };
      // console.log(uniforms); // {uTick: {…}, tex1: {value: Texture}, tex2: {value: Texture}}
    });
    // console.log(uniforms); // {uTick: {…}, uMouse: {…}, uHover: {…}, uProgress: {…}, uSpeed: {…}, …}
    return uniforms;
  }

  setupUniforms(){
    const uniforms = super.setupUniforms();
    uniforms.uSpeed = { value: 7.1 };
    uniforms.uParam = { value: new Vector4(1.23, 2.299, 0.493, 1.783) };
    uniforms.uReversal = { value: 0 }; // テクスチャの色を変更する時に使う
    uniforms.uProgress = { value: 0 };
    return uniforms;
  }

  setupVertex(){
    return vertexShader;
  }

  setupFragment(){
    return fragmentShader;
  }

  debug(_folder){
    // _folder.open();

    _folder.add(this.uniforms.uParam.value, "x", 0, 10, 0.001).name("uParam.x").listen();
    _folder.add(this.uniforms.uParam.value, "y", 0, 10, 0.001).name("uParam.y").listen();
    _folder.add(this.uniforms.uParam.value, "z", 0, 10, 0.001).name("uParam.z").listen();
    _folder.add(this.uniforms.uParam.value, "w", 0, 10, 0.001).name("uParam.w").listen();
    
    _folder.add(this.uniforms.uProgress, "value", 0, 1, 0.1).name("uProgress").listen();
    _folder.add(this.uniforms.uReversal, "value", 0, 1, 0.1).name("uReversal").listen();
    _folder.add(this.uniforms.uSpeed, "value", 0, 10, 0.01).name("uSpeed").listen();

    const datObj = { next: !!this.uniforms.uProgress.value };
    
    _folder.add(datObj, "next").name("Animate").onChange(() => {
        gsap.to(this.uniforms.uProgress, {
          // 単行プラス演算子 
          // → オペランドを数値に変換。たとえば、文字列やブール値など、他のデータ型を数値に変換する際に使用される
          value: +datObj.next,
          duration: 2,
          ease: "power2.out",
        });
      });
    }

}

