
// Reflect slider
// → 1枚のmeshに5枚のテクスチャを貼り付けてスライダーを制作

import { Ob } from "../Ob";

import vertexShader   from "./vertex.glsl";
import fragmentShader from "./fragment.glsl";
import { Group, DoubleSide, PlaneGeometry, VideoTexture } from "three";

import { utils } from '../../helper/utils.js';

export default class extends Ob{
  beforeCreateMesh(){
    this.activeSlideIdx = 0; // アクティブなインデックスを初期化
  }

  setupGeometry(){
    // console.log(this.texes.size)
    // console.log(this.rect.width, this.rect.height);
    return new PlaneGeometry(this.rect.width * this.texes.size, this.rect.height, 1, 1);
  }

  setupUniforms(){
    const uniforms = super.setupUniforms();
    uniforms.uSlideIdx = { value: 0 }; // 各スライドのidx
    uniforms.uSlideTotal = { value: this.texes.size };
    uniforms.uActiveSlideIdx = { value: this.activeSlideIdx }; // 現在アクティブなスライドのidx
    // 反射しない通常のmeshは0で、反射するmeshには1を付与しておく
    uniforms.uIsReflect = { value: 0 };
    return uniforms;
  }

  setupMesh(){
    // オリジナルmeshと反射版のmeshを作る
    const mesh = super.setupMesh();
    mesh.material.side = DoubleSide;
    // console.log(mesh)

    // reflectのmeshの設定 ////
    const reflect = mesh.clone();
    // console.log(reflect === mesh)
    // console.log(reflect)

    // オリジナルのmeshのmaterialと反射のmaterialを分離させ、
    // 反射スライダーに独自のuniformを追加していく(上書きの形)
    // → クローンを作成すると、ジオメトリやマテリアルはデフォルトで共有されるが、
    //   そのため、クローン後にマテリアルの設定を変更すると、オリジナルmeshのマテリアルも影響を受けてしまう
    reflect.material = reflect.material.clone();
    // console.log(mesh.material, reflect.material);

    reflect.material.alphaTest = 0;
    reflect.material.uniforms.uIsReflect.value = 1;
    reflect.material.uniforms.uTick = this.uniforms.uTick;
    reflect.material.uniforms.uActiveSlideIdx = this.uniforms.uActiveSlideIdx;
    
    const gap = 5.;
    reflect.rotation.x = Math.PI;
    reflect.position.y -= this.rect.height + gap; // 高さ分ずらす
    // console.log(reflect); // 

    const group = new Group;
    group.add(mesh, reflect); // groupの中のchildrenがworld.jsでsceneにaddされる
    // console.log(group); // Group {isObject3D: true, uuid: '7950e9ef-0d7c-4366-a23a-0598e07e1e8e', name: '', type: 'Group', parent: null, …}
    group.rotation.y = .4;

    return group;
  }
  
  setupVertex(){ return vertexShader; }
  setupFragment(){ return fragmentShader; }

  // goToは変数を決定するだけ → 滑らかに動かすのはrender
  goTo(_idx){
    this.activeSlideIdx = _idx;
    this.playVideo(_idx);
  }

  // 変数を滑らかに更新していく → スライダーに滑らかな動きを加える
  render(_tick){
    // console.log(this.diffRad);
    super.render(_tick);

    // uActiveSlideIdxを線形補間で次の値に更新する
    // this.activeSlideIdxがgoToによって変化するので、これまでのuActiveSlideIdxとでlerpし、次のactiveなidxを取得
    const uActiveSlideIdx = this.uniforms.uActiveSlideIdx.value; // 現在のアクティブなidx
    // .005でthis.diffRadよりも早く0を返す。→ 動画が再生されなくなる
    const idx = utils.lerp(uActiveSlideIdx, this.activeSlideIdx, .1);
    // console.log(idx);
    this.uniforms.uActiveSlideIdx.value = idx; 
  }

  playVideo(_idx){ // _idx 遷移先のidx
    // console.log(_idx); // 0から渡ってくる
    const offset = 2; // 初めは3番目の画像をactiveに
    // console.log(this.texes.size); // 5
    const i = ((_idx + offset) % this.texes.size) + 1;
    // console.log(i); // 3 4 5 1 2 3 4 ... 
    
    const texValue = this.uniforms["tex" + i].value;
    // console.log(this.uniforms);
    // console.log(texValue); // _Texture {isTexture: true, uuid: 'e372adc6-a105-4d5f-872b-0f3a7c5eec5b', name: '', source: Source, mipmaps: Array(0), …}

    this.playingVideo?.pause(); // 前回再生していた動画を一旦停止。?があればthis.playingVideoは未定義でもundefinedとはならない
    // console.log(texValue); // VideoTexture {isTexture: true, uuid: 'ec3fbe67-cba1-43e4-9a74-24ee5b1d80a4', name: '', source: Source, mipmaps: Array(0), …}
    if(texValue instanceof VideoTexture){

      // 回転が終わってから再生 → 200ms秒後に再生させる
      this.playInterval = setInterval(() => {
        if(this.uniforms.uActiveSlideIdx.value === _idx){ //
          // console.log("playing video", texValue.source.data);
          this.playingVideo = texValue.source.data;
          // console.log(this.playingVideo); // <video></video> domが渡ってくる
          
          this.playingVideo.play?.();

          // idがメモリに貯まるので回避する
          clearInterval(this.playInterval); 
        }
      }, 200);

    }
  }

  afterInit(){
    // 動画テクスチャの初期表示で停止させる
    setTimeout(() => {
      this.texes.forEach(tex => {
          tex.source.data.pause?.();
      });
      
      this.goTo(this.activeSlideIdx); // 動画がアクティブなら再生
    }, 50);
  }

  debug(_folder){
    const sliderIdx = { value: 0 };

    _folder.add(sliderIdx, "value", 0, 12, 1).name("goTo").listen()
    .onChange(() => this.goTo(sliderIdx.value));

    _folder.add(this.mesh.rotation, "y", -Math.PI, Math.PI, .01).name("rotationY")
  }
}

