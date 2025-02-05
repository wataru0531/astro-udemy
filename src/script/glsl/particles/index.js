/**************************************************************

particles カールノイズのパーティクル

***************************************************************/
import gsap from "gsap";
import {
  PlaneGeometry,
  Float32BufferAttribute,
  Points,
  Vector3,

} from "three";

import { Ob } from "../Ob";
import { utils } from "../../helper";

import vertexShader from "./vertex.glsl";
import fragmentShader from "./fragment.glsl";


export default class extends Ob{

  setupGeometry(){
    const width = this.rect.width;
    const height = this.rect.height;
    const wSeg = width  / 4;
    const hSeg = height / 4;

    const plane = new PlaneGeometry(width, height, wSeg, hSeg);
    return plane;
  }

  setupUniforms(){
    const uniforms = super.setupUniforms();
    uniforms.uPointSize = { value: 2 };
    uniforms.uSpeed = { value: 0.05 };
    uniforms.uCnoise = { value: new Vector3(0.005, 0, 0.01) };
    uniforms.uExpand = { value: new Vector3(1, 1, 1) };
    return uniforms;
  }

  setupMesh() { return new Points(this.geometry, this.material); }
  setupVertex(){ return vertexShader; }
  setupFragment(){ return fragmentShader; }

  // 独自のテクスチャをuniformsに追加
  setupTexes(uniforms){ // このuniformsは親クラスからくるthis.uniforms
    // console.log(uniforms)
    uniforms.texCurrent = { value: this.texes.get("tex1") };
    uniforms.texNext    = { value: null }; // 初期化時にはnull
    return uniforms;
  }

  running = false;

  goTo(idx, duration = 3){
    // % ... モジュラー。5で割った余りで_idxが設定。ここでは、必ず0〜4の範囲となる
    // "tex0" はないのでプラス１とする
    const _idx = (idx % 2) + 1; // 2枚なので1 → 2 → 1 → 2 → 1 ...を繰り返す

    if(this.running) return;  // trueなら終了→ idxは変化するがこれより下の処理は走らせない
    this.running = true; // 実行中

    const nextTex = this.texes.get("tex" + _idx); // 次のテクスチャを取得

    this.uniforms.texNext.value = nextTex; // 次に出すテクスチャを設定

    gsap.to(this.uniforms.uProgress, {
      value: 1,
      duration: duration,
      ease: "none",

      // 初めは画像を見せておいて、glToが始まったら画像を削除
      // 初めはwebglのフェクトは見せないで、goToが始まったらwebglのフェクトを表示
      onStart: () => {
        this.$.el.nextElementSibling?.remove(); // 画像を削除
        this.mesh.visible = true;
      },

      // アニメーションが終わったらHTMLのDOMを表示
      onComplete: () => {
        this.uniforms.texCurrent.value = this.uniforms.texNext.value; // 次の画像に現在表示中の画像をセット
        this.uniforms.uProgress.value = 0; // 0に戻す

        // console.log(this.texes.get("tex" + _idx).source.data); // 次のテクスチャのDOM
        const mediaEl = this.texes.get("tex" + _idx).source.data;
        mediaEl.classList.add("particle-child");

        const parentElement = this.$.el.parentElement;
        parentElement.appendChild(mediaEl);

        this.mesh.visible = false;
        this.running = false;

        if(mediaEl.paused){
          mediaEl.play?.();
        }
      }
    });
  }

  // 初期化時に実行。world.js
  afterInit(){
    this.goTo(0, 0);
  }
  
  // bootstrapのinit()の中で初期化
  debug(folder){
    folder.open();

    folder.add(this.uniforms.uProgress, "value", 0, 1, 0.1).name("uProgress").listen();
    folder.add(this.uniforms.uPointSize, "value", 0, 5, 0.01).name("uPointSize").listen();
    folder.add(this.uniforms.uSpeed, "value", 0, 0.1, 0.001).name("uSpeed").listen();

    folder.add(this.uniforms.uCnoise.value, "x", 0, 0.01, 0.001 ).name("uCnoise.x").listen();
    folder.add(this.uniforms.uCnoise.value, "y", 0, 0.01, 0.001 ).name("uCnoise.y").listen();
    folder.add(this.uniforms.uCnoise.value, "z", 0, 0.01, 0.001 ).name("uCnoise.z").listen();
    
    folder.add(this.uniforms.uExpand.value, "x", 0, 10, 0.01).name("uExpand.x").listen();
    folder.add(this.uniforms.uExpand.value, "y", 0, 10, 0.01).name("uExpand.y").listen();
    folder.add(this.uniforms.uExpand.value, "z", 0, 10, 0.01).name("uExpand.z").listen();

    // このvalueがスライドのid
    const sliderIdx = { value: 0 };
    folder.add(sliderIdx, "value", 0, this.texes.size, 1).name("sliderIdx").listen().onChange(() => {
      // console.log(sliderIdx.value); // onChangeが発火したら増加
      this.goTo(sliderIdx.value);
    })
  }

}

