
import gsap from "gsap";
import { 
  CylinderGeometry,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Vector3,
  VideoTexture,
} from "three";

import { Ob } from "../Ob";
import vertexShader   from "./vertex.glsl";
import fragmentShader from "./fragment.glsl";

import { utils } from '../../helper/utils.js';
import { INode } from "../../helper/INode.js";
import { viewport } from "../../helper/viewport.js";

export default class extends Ob{

  beforeCreateMesh(){
    // console.log(this.rect.width)
    this.radius = this.rect.width; // 半径とする

    // 回転軸
    // 必ずnormalizeを呼び正規化
    // → 正規化したベクトルの大きさは必ず1になる
    //   単位ベクトルとすることで、方向のみを考慮し、計算結果がベクトルの長さに影響されず、正確に方向に基づいた結果を得ることができる
    this.rotateAxis = new Vector3(.2, .8, .2).normalize();
    // console.log(this.rotateAxis); // _Vector3 {x: 0.2357022603955158, y: 0.9428090415820632, z: 0.2357022603955158}

    this.activeSlideIdx = 0;
    this.diffRad = 0;
  }

  setupTexes(_uniforms){ // 余計なテクスチャをplaneMateに付与してしまうため何もせずに返す
    return _uniforms;
  }

  setupUniforms(){
    const uniforms = super.setupUniforms();
    uniforms.uRadius = { value: this.radius };
    uniforms.uSlideIdx = { value: 0 }; // 各スライドに付与するidx
    uniforms.uSlideTotal = { value: this.texes.size };
    uniforms.uActiveSlideIdx = { value: this.activeSlideIdx }; // 
    uniforms.uDist = { value: .8 };

    return uniforms;
  }

  setupGeometry(){
    return new PlaneGeometry(this.rect.width, this.rect.height, 50, 1);
  }

  setupMesh(){
    const cylinderGeo = new CylinderGeometry(this.radius, this.radius, this.rect.height, 60, 1, true);
    const cylinderMaterial = new MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      alphaTest: .5, // アルファ値が0.5以上のピクセルだけを描画
      // wireframe: true,

      // color: 0xff0000,
    });

    const cylinder = new Mesh(cylinderGeo, cylinderMaterial);

    let idx = 0;

    // 5枚のテクスチャをplaneGeometryでサンプリング
    this.texes.forEach(tex => {
      // console.log(tex)
      // console.log(this.material.clone()); // ShaderMaterial {isMaterial: true, uuid: '3516c37c-1f28-4ec2-b30c-73e452c2f60f', name: '', type: 'ShaderMaterial', blending: 1, …}
      const planeMate = this.material.clone(); // 5枚のテクスチャにそれぞれ別のmaterialを使う
      planeMate.side = DoubleSide;
      planeMate.uniforms.tex1 = { value: tex }; // テクスチャを設定
      planeMate.uniforms.uSlideIdx.value = idx; // 各スライドに渡す番号のidx
      planeMate.uniforms.uActiveSlideIdx = this.uniforms.uActiveSlideIdx; // アクティブなidxをplaneに渡す。ここは動的に変わる
      planeMate.uniforms.uDist = this.uniforms.uDist;
      planeMate.uniforms.uTick = this.uniforms.uTick;
      // console.log(planeMate); // 
      // 同じplaneのgeometryを参照
      // → このplaneに渡したthis.geometryをvertexでで編集する。5つとも同じvertexで編集
      const planeGeo = this.geometry; 
      const plane = new Mesh(planeGeo, planeMate);

      // cylinderに5枚のplaneのmeshを格納(Three.jsではこれが可能)
      cylinder.add(plane); // cylinderの中央に配置される

      idx++;
    });
    // console.log(cylinder.children); // (5) [Mesh, Mesh, Mesh, Mesh, Mesh]

    // cylinderを傾ける
    // cylinder.up → 上の方向の３次元ベクトル。元々の向き
    // console.log(cylinder.up); // _Vector3 {x: 0, y: 1, z: 0}
    utils.pointTo(cylinder, cylinder.up, this.rotateAxis);
    this.slides = [...cylinder.children]; // cylinderに追加したplaneのメッシュを格納
    // console.log(this.slides); // 5) [Mesh, Mesh, Mesh, Mesh, Mesh]

    return cylinder;
  }

  async resize(_duration = 1) {  // メッシュの位置とサイズの更新
    this.resizing = true;
    const { mesh: cylinder, originalRect } = this;
    // console.log(cylinder)

    this.setupResolution(this.uniforms);

    const nextRect = INode.getRect(this.$.el); // 新しく取得したHTML要素
    // console.log(rect)
    const { x, y } = this.getWorldPosition(nextRect, viewport);
    // console.log(y)

    // gsapが完了したらthis.rectを更新する
    // → 連続でresizeが発火し続けた場合などに、アニメーションが終わる前に
    //   this.rectを更新されたりして、位置や大きさが意図しないものとなってしまう。
    const p1 = new Promise(resolve => { // 位置の変更
      // このgsapの処理は非同期で行われる
      gsap.to(cylinder.position, { // 位置
        x: x,
        y: y,
        // 何度も発火すると前のアニメーションと重複してしまうの
        // → 前に走っていたアニメーションはキャンセルする
        overwrite: true,
        duration: _duration, 
        onComplete: () => {
          resolve()
        },

      });
    });

    // cylinderの頂点を使いテクスチャの位置を調整していく
    // console.log(cylinder)
    const { position, normal } = cylinder.geometry.attributes;
    // console.log(position); // Float32BufferAttribute {isBufferAttribute: true, name: '', array: Float32Array(366), itemSize: 3, count: 122, …}
    const ONE_LOOP = cylinder.geometry.attributes.position.count / 2; // cylinderの頂点の総数の半分。x, y, z
    // console.log(ONE_LOOP); // 122

    // planeを配置する間隔
    // → 手前上側から反時計回りに１周、そして手前した側から反時計回りに1週なので1/2すると1週を取得できる
    const step = Math.floor(ONE_LOOP / this.texes.size); 
    // console.log(step); // 24

    // サイズの更新
    const p2 = new Promise(resolve => {
      gsap.to(this.scale, {
        width: nextRect.width / originalRect.width,
        height: nextRect.height / originalRect.height,
        depth: 1,
        overwrite: true,
        duration: _duration,

        onUpdate: () => {
          // z軸に関してはwidthの割合を適用する → z軸の値は1なので
          cylinder.scale.set(this.scale.width, this.scale.height, this.scale.width);

          let idx = 0;

          this.slides.forEach(plane => {
            const pickIdx = idx * step;
            // console.log(pickIdx); // 0 24 48 72 96
            // positionの1つの頂点(x, y, z)からx, zを取得
            plane.position.x = position.getX(pickIdx); 
            plane.position.z = position.getZ(pickIdx);
            // console.log(`x: ${plane.position.x}, z: ${plane.position.z}`); // // 0 317.4040222167969 -513.5704956054688 493.3145446777344 -270

            // 元々の向き(z軸方向を向いているので1)
            // → _{ x: 0, y: 0, z: 1 }; // 単にZ軸方向(奥行き方向)を示す単位ベクトル
            //   ここですべてのテクスチャzが1なので正面を向いている
            const originalDir = { x: 0, y: 0, z: 1 }; // Z軸方向(手前側の方向)を示す単位ベクトル
            const targetDir = { // 向かしたい方向。そのインデックスにおける各頂点の法線の向き(3次元ベクトル)
              x: normal.getX(pickIdx), // normal -1 〜 1の範囲
              y: 0, 
              z: normal.getZ(pickIdx) 
            };
            // console.log(targetDir)

            // テクスチャをcylinderの側面に垂直にする
            utils.pointTo(plane, originalDir, targetDir); 

            idx++;
          });

          this.radius = nextRect.width;
          cylinder.position.z = -this.radius; // z軸のpositionの更新
        },
        onComplete: () => { 
          resolve()
        },
      })
    })

    await Promise.all([p1, p2]);

    this.rect = nextRect; // oを更新
    this.resizing = false;
  }
  
  setupVertex(){
    return vertexShader;
  }

  setupFragment(){
    return fragmentShader;
  }

  // goToは変数を決定するだけ → 滑らかに動かすのはrender
  goTo(_idx){
    // console.log(_idx)
    // console.log(this.activeSlideIdx); // 無限に増減するがvertexの%で制御
    // 現在手前側のスライドと、目的地のスライドの差分を取得
    // スライドの枚数で割って、360度をかければ回転させる角度を算出できる
    // 時計回りに回したいのでマイナス
    this.diffRad -= ((_idx - this.activeSlideIdx) / this.slides.length) * Math.PI * 2;
    // console.log(this.diffRad)
    this.activeSlideIdx = _idx;
    this.playVideo(_idx);
  }

  // 変数を滑らかに更新していく → スライダーに滑らかな動きを加える
  render(_tick){
    // console.log(this.diffRad);
    super.render(_tick);

    if(this.diffRad === 0) return; // 回転が必要ないので終了

    // radは0になるが、this.diffRadは0にはならないので、radが0になったタイミングで残りの
    // this.diffRadをradに格納。そして、その数値をthis.diffRadから引けば0になる
    const rad = utils.lerp(this.diffRad, 0, .95, 0.0001) || this.diffRad; // 滑らかにスライドさせる
    // console.log(rad)
    this.mesh.rotateOnWorldAxis(this.rotateAxis, rad); // 回転を行いたい軸, 角度
    this.diffRad -= rad; // 進んだ分は引く。いつまでも0にならないので回転が止まらない
    // console.log(this.diffRad);

    // 少しづつ目的地に近づくuniformの値を取得
    // this.activeSlideIdxがgoToによって変化するので、これまでのuActiveSlideIdxとでlerpし、次のactiveなidxを取得
    const uActiveSlideIdx = this.uniforms.uActiveSlideIdx.value; // 現在のアクティブなidx
    // .005でthis.diffRadよりも早く0を返す。→ 動画が再生されなくなる
    const idx = utils.lerp(uActiveSlideIdx, this.activeSlideIdx, .05, .005);
    // console.log(idx); 
    this.uniforms.uActiveSlideIdx.value = idx; 
  }

  playVideo(_idx){ // _idx → 遷移先のidx
    const i = _idx % this.slides.length;
    
    const slide = this.slides.at(i); // at → マイナスの_idxがきても使えるようにする
    
    const tex1Value = slide.material.uniforms.tex1.value;
    this.playingVideo?.pause(); // 始めは停止
    // console.log(tex1Value); // VideoTexture {isTexture: true, uuid: 'ec3fbe67-cba1-43e4-9a74-24ee5b1d80a4', name: '', source: Source, mipmaps: Array(0), …}
    if(tex1Value instanceof VideoTexture){

      // 回転が終わってから再生 → 200ms秒後に再生させる
      this.playInterval = setInterval(() => {
        if(this.uniforms.uActiveSlideIdx.value === _idx){ // アクティブなら
          this.playingVideo = tex1Value.source.data;
          
          this.playingVideo.play?.();
          clearInterval(this.playInterval); // 何度もsetさせるので回避
        }
      }, 200);

    }
  }

  afterInit(){
    // 動画テクスチャの初期表示の制御
    this.texes.forEach(tex => {
      // console.log(tex)
      tex.source.data.pause?.();
    });

    this.goTo(this.activeSlideIdx); // 動画がアクティブなら再生
  }

  debug(_folder){
    const changeRotateAxis = () => {
      utils.pointTo(this.mesh, this.mesh.up, this.rotateAxis.normalize());
    }

    _folder.add(this.uniforms.uDist, "value", 0, 1, .01).name("uDist").listen();

    // 軸を変更した場合は必ずnormalizeする。正規化
    // listenすることで、他の部分で指定した値が変更した場合guiが更新される
    _folder.add(this.rotateAxis, "x", -1, 1, .01).name("rotate.x").listen()
      .onChange(changeRotateAxis);
    _folder.add(this.rotateAxis, "y", -1, 1, .01).name("rotate.y").listen()
      .onChange(changeRotateAxis);
    _folder.add(this.rotateAxis, "z", -1, 1, .01).name("rotate.z").listen()
      .onChange(changeRotateAxis);
    
    const sliderIdx = { value: 0 };
    _folder.add(sliderIdx, "value", 0, 4, 1).name("goTo").listen()
    .onChange(() => this.goTo(sliderIdx.value));
  }
}

