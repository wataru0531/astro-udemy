
// slider-wave】周期に合わせて文字を表示しよう から

// slider-wave スライダーのテキスト部分

import { Ob } from "../Ob";

import vertexShader   from "./vertex.glsl";
import fragmentShader from "./fragment.glsl";
import { 
  DoubleSide,
  Group,
  Mesh,
  PlaneGeometry,
  Vector4,
} from "three";

import { utils } from '../../helper/utils.js';

export default class extends Ob{
  beforeCreateMesh(){
    this.activeSlideIdx = 0;
  }

  setupUniforms(){ // → materialに渡す
    const uniforms = super.setupUniforms();
    uniforms.uSlideIdx = { value: 0 }; // 各テキストのidx
    uniforms.uSlideTotal = { value: this.texes.size };
    uniforms.uActiveSlideIdx = { value: this.activeSlideIdx }; // アクティブなテキスト
    uniforms.uParam = { value: new Vector4(1, 1.5, 2, 21) }; // ノイズを操作
    return uniforms;
  }

  setupGeometry(){
    // 変形させるので頂点を多くしておく
    return new PlaneGeometry(this.rect.width, this.rect.height, 70, 10); 
  }

  // ここで作るmeshは内部で5つのmeshを保持してて、
  // その内部の1つ１つのmeshのmaterialにuniformsを保持している
  setupMesh(){
    const group = new Group(); // グループmeshに追加していく。meshを1まとまりにグループ化する
    // console.log(group); // Group {isObject3D: true, uuid: 'a2e12d9d-9b25-4928-91e3-b828b9ec055c', name: '', type: 'Group', parent: null, …}
    // console.log(group.children); // (5) [Mesh, Mesh, Mesh, Mesh, Mesh]
    let idx = 0;
    this.texes.forEach(tex => {
      // console.log(tex)
      // console.log(this.material.clone()); // ShaderMaterial {isMaterial: true, uuid: '3516c37c-1f28-4ec2-b30c-73e452c2f60f', name: '', type: 'ShaderMaterial', blending: 1, …}
      const planeMate = this.material.clone(); // 5枚のテクスチャにそれぞれ別のmaterialを使う
      // console.log(planeMate); // 
      planeMate.side = DoubleSide;
      planeMate.uniforms.tex1 = { value: tex }; // tex1にだけテクスチャを設定
      planeMate.uniforms.uSlideIdx.value = idx; // 各スライドに渡す番号のidx
      planeMate.uniforms.uActiveSlideIdx = this.uniforms.uActiveSlideIdx; // アクティブなidxをplaneに渡す。ここは動的に変わる
      planeMate.uniforms.uParam = this.uniforms.uParam; // アクティブなidxをテキストに渡す。ここは動的に変わる
      planeMate.uniforms.uTick = this.uniforms.uTick;

      // 同じplaneのgeometryを参照
      // → このplaneに渡したthis.geometryをvertexでで編集する。5つとも同じvertexで編集
      const planeGeo = this.geometry; 
      const plane = new Mesh(planeGeo, planeMate);
      // console.log(plane)
      group.add(plane); // meshを1まとまりに管理

      idx++;
    });

    this.slides = [...group.children];
    // console.log(this.slides); // (5) [Mesh, Mesh, Mesh, Mesh, Mesh]

    return group;
  }
  
  setupVertex(){
    return vertexShader;
  }

  setupFragment(){
    return fragmentShader;
  }

  goTo(_idx){
    this.activeSlideIdx = _idx;
  }

  render(_tick){
    // console.log(this.diffRad)
    super.render(_tick);

    const uActiveSlideIdx = this.uniforms.uActiveSlideIdx.value; // 現在のアクティブなidx
    const idx = utils.lerp(uActiveSlideIdx, this.activeSlideIdx, .07);
    // console.log(idx)
    this.uniforms.uActiveSlideIdx.value = idx; 
  }


  afterInit(){
    this.goTo(this.activeSlideIdx);
  }

  debug(_folder){
    // 軸を変更した場合は必ずnormalizeする。正規化
    // listenすることで、他の部分で指定した値が変更した場合guiが更新される
    // _folder.add(this.rotateAxis, "z", -1, 1, .01).name("rotate.z").listen()
    //   .onChange(changeRotateAxis);
    
    _folder.add(this.uniforms.uParam.value, "x", 0, 3, 0.001).name("uParam.x").listen();
    _folder.add(this.uniforms.uParam.value, "y", 0, 3, 0.001).name("uParam.y").listen();
    _folder.add(this.uniforms.uParam.value, "z", 0, 500, 1).name("uParam.z").listen();
    _folder.add(this.uniforms.uParam.value, "w", 0, 500, 1).name("uParam.w").listen();

    const sliderIdx = { value: 0 };
    _folder.add(sliderIdx, "value", 0, 4, 1).name("goTo").listen()
    .onChange(() => this.goTo(sliderIdx.value));
  }
}

