/**************************************************************

displace-slide

***************************************************************/
import gsap from "gsap";
import {
  Vector2,
  MirroredRepeatWrapping,

} from "three";

import { Ob } from "../Ob";

import vertexShader   from "./vertex.glsl";
import fragmentShader from "./fragment.glsl";


export default class extends Ob{
  // 
  setupTexes(uniforms){
    this.texes.forEach((tex, key) => {
      // console.log(tex, key); // Texture{} "texDisp"
      uniforms[key] = { value: tex };

      // 他のモジュールからもwrapSなどのプロパティを読み込んでしまうので、一度texをcloneしてからプロパティを設定
      // 元の tex オブジェクトとは別の独立したテクスチャとなるので影響を及ぼさない
      const newTex = tex.clone();
      // console.log(newTex === tex)

      newTex.wrapS = MirroredRepeatWrapping; // wrapS 横方向
      newTex.wrapT = MirroredRepeatWrapping; // wrapT 縦方向

      uniforms[key] = { value: newTex };

      // テクスチャを読み込む際に、テクスチャにプロパティを設定
      // tex.wrapT = MirroredRepeatWrapping;
      // tex.wrapS = MirroredRepeatWrapping;
    });

    return uniforms;
  }

  setupUniforms(){
    const uniforms = super.setupUniforms();

    return uniforms; // Obクラス同様に必ずリターンする
  }

  setupVertex(){
    return vertexShader;
  }

  setupFragment(){
    return fragmentShader;
  }

  debug(_folder){
    _folder.add(this.uniforms.uProgress, "value", 0, 1, 0.1).name('progess').listen();
    
    const datData = { next: !!this.uniforms.uProgress.value }
    
    _folder.add(datData, "next").onChange(() => {
      gsap.to(this.uniforms.uProgress, {
        value: +datData.next,
        duration: 1.5,
        ease: "power3.inOut"
      })
    })

  }
}
