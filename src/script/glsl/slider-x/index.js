
// slider-x

import frag from "./fragment.glsl";
import vert from "./vertex.glsl";
import { Ob } from "../Ob.js";
import { Mesh, Group, VideoTexture } from "three";

import gsap from "gsap";
import { viewport, INode, utils } from "../../helper/index.js";

export default class extends Ob {
  beforeCreateMesh() {
    this.activeSlideIdx = 0; // アクティブなスライドの値。すべてのmeshにわたる
    this.gap = 0;
    this.margin = 80; // スライド間のgap
    this.angleRadian = 0.1; // 0.1 * 180/Math.PI ＝ 5.72958°
  }

  setupFragment() { return frag; }
  setupVertex() { return vert; }

  setupUniforms() {
    const uniforms = super.setupUniforms();
    uniforms.uDist = { value: 1.8 }; // 歪みの値。distortionの略
    uniforms.uSlideIdx = { value: 0 }; // 各スライドのメッシュの番号 0~4
    uniforms.uActiveSlideIdx = { value: this.activeSlideIdx }; // クリックされたスライドの番号
    
    return uniforms;
  }

  // 5つのmeshを生成し、groupMeshに格納していく
  // scrollMeshは単なるコンテナの役割を果たし、実際にvertexやfragmentが適用されるのはscrollMesh内の5つのメッシュとなる
  setupMesh() {
    const groupMesh = new Group();

    let i = 0;
    this.texes.forEach((tex) => {
      const mate = this.material.clone();
      mate.uniforms.tex1 = { value: tex };
      mate.uniforms.uTick = this.uniforms.uTick;
      mate.uniforms.uActiveSlideIdx = this.uniforms.uActiveSlideIdx;
      mate.uniforms.uDist = this.uniforms.uDist; // 1.8
      mate.uniforms.uSlideIdx.value = i; // 0 1 2 3 4

      // console.log(this.geometry); // _PlaneGeometry {isBufferGeometry: true …} * 5つ
      const _mesh = new Mesh(this.geometry, mate); // mesh生成
      groupMesh.add(_mesh);

      i++;
    });

    this.slides = [...groupMesh.children]; // (5) [Mesh, Mesh, Mesh, Mesh, Mesh]

    groupMesh.rotation.z = this.angleRadian;
    this.groupMesh = groupMesh;
    // console.log(this.groupMesh); // Group {children :(5) [Mesh, Mesh, Mesh, Mesh, Mesh], uuid: 'f50f5b18-fce0-4289-a019-3b416bd5277e', name: '', type: 'Group', parent: null, …}
    
    // スクロール時の変化量を受け取るためのmesh。中のgroupMeshには適用しない
    // → Obクラスのscrollは、this.meshに適用されるため
    const scrollMesh = new Group(); // scrollMesh > groupMesh とする
    scrollMesh.add(groupMesh);
    // console.log(scrollMesh); 

    return scrollMesh; 
    // → これがsceneにaddされるがグループメッシュでも問題ない。
    //   GroupはThree.jsで複数のメッシュやオブジェクトをまとめて扱うための便利なコンテナのような役割を果たす
    //   scrollMeshをsceneに追加することで、scrollMesh内のすべてのメッシュも自動的にシーンに追加された状態になる
  }

  // リサイズ
  // → この中で各スライドの位置を決定する。
  // 　　world.jsのinitで一度resize処理が実行される
  async resize(duration = 1) {
    // console.log("resize running!!");
    this.resizing = true;

    // リサイズ処理はgroupMeshに適用するが、スクロールに関してはscrollMeshに適用する
    const { $: { el }, groupMesh: mesh, originalRect } = this;
    // console.log(el); // .fv__slider

    this.setupResolution(this.uniforms); // テクスチャのアスペクト更新

    const nextRect = INode.getRect(el); // リサイズ後のDOMRect
    // console.log(nextRect); // DOMRect {x: 45.1484375, y: 496.390625, width: 812.6953125, height: 457.140625, top: 496.390625, …}
    let { x, y } = this.getWorldPosition(nextRect, viewport);

    // 1つのスライの長さを、テクスチャの長さ + 80px
    this.gap = nextRect.width + this.margin;

    // x軸の値
    // Math.cos(this.angleRadian) → 傾きをとっている
    // console.log(Math.cos(this.angleRadian)); // 0.9950041652780258 
    // console.log(Math.sin(this.angleRadian)); // 0.09983341664682815
    // console.log(this.activeSlideIdx);
    x -= this.gap * Math.cos(this.angleRadian) * this.activeSlideIdx;
    // console.log(x); // -0.00390625
    // console.log(-this.gap * Math.sin(this.angleRadian) * this.activeSlideIdx);
    
    // 位置の変更。
    // x, yの位置の基準は、DOMのelの位置
    const p1 = new Promise((onComplete) => {
      gsap.to(this.groupMesh.position, {
        x, // x軸の位置
        y: - this.gap * Math.sin(this.angleRadian) * this.activeSlideIdx, // y軸の位置
        // → y軸方向にずらす
        overwrite: true,
        duration,
        onComplete, // resolve。ここまで確実に待機させる
      });
    });

    // 大きさの変更と、this.slidesのスライドを横並び
    const p2 = new Promise((onComplete) => {
      gsap.to(this.scale, {
        width: nextRect.width / originalRect.width,
        height: nextRect.height / originalRect.height,
        depth: 1,
        overwrite: true,
        duration,
        onUpdate: () => {
          this.groupMesh.scale.set(this.scale.width, this.scale.height, this.scale.depth);

          this.slides.forEach((_slide, i) => {
            // console.log(_slide); // Mesh {isObject3D: true, uuid: 'a456dc4d-5bb0-4dcf-8b59-ea070c33c74e', name: '', type: 'Mesh', parent: Group, …}
            // console.log(`slide: ${_slide}, index: ${i}`);
            // console.log(this.scale.width); // 1
            // console.log((this.gap * i) / this.scale.width);
            // 横に並ぶ。0 758 1517 2275 3034
            gsap.to(_slide.position, {
              x: (this.gap * i) / this.scale.width, // ここで横並びにする
              overwrite: true,
              duration,
              onComplete, // resolve
            });
          });
        },
        onComplete,
      });
    });

    await Promise.all([p1, p2]); // resolveを待機、解決してからthis.rectに入れる

    this.rect = nextRect;

    this.resizing = false;
  }

  render(tick) {
    this.uniforms.uTick.value = tick;
    const uActiveSlideIdx = this.uniforms.uActiveSlideIdx.value;
    const idx = utils.lerp(uActiveSlideIdx, this.activeSlideIdx, 0.07);
    // console.log(idx); // 線形補間の値 0〜1、1〜2、2〜3, 3〜4

    if(this.uniforms.uActiveSlideIdx.value === idx) return;

    const { x } = this.getWorldPosition(this.rect, viewport);

    // ここで線形補間の値を用いてスライダーを動かす
    // xはcosθ、yはsinθで角度をつけてスライドさせる
    this.groupMesh.position.x = x - this.gap * Math.cos(this.angleRadian) * idx;
    this.groupMesh.position.y = -this.gap * Math.sin(this.angleRadian) * idx;

    this.uniforms.uActiveSlideIdx.value = idx; // 
    // console.log(this.uniforms.uActiveSlideIdx.value); 
    // → 線形補間の値で更新されてvertex、fragmentに通知
  }

  playVideo(idx) {
    // console.log(this.slides); // (5) [Mesh, Mesh, Mesh, Mesh, Mesh]
    const i = idx % this.slides.length;
    const slide = this.slides.at(i); // at()...負の値も使える
    // console.log(slide)
    const tex1Value = slide.material.uniforms.tex1.value;
    this.playingVideo?.pause();

    if (tex1Value instanceof VideoTexture) {
      // 200msごとに実行される
      // → 一度の発火ごとにidを発行してはクリアするの繰り返し
      //   実装の意図としてはidを残したままで次のスライドに変化させたくないようにする
      this.playInterval = setInterval(() => {
        // アクティブなidxと各スライドのidxが一致した時
        if (this.uniforms.uActiveSlideIdx.value === idx) {
          this.playingVideo = tex1Value.source.data;
          this.playingVideo.play?.();

          clearInterval(this.playInterval);
        }
      }, 200);
    }
  }

  // this.activeSlideIdxの変更からアニメーションが始まる
  // → renderでidが線形補間で更新されていく
  goTo(idx) {
    this.activeSlideIdx = (this.texes.size + idx) % this.texes.size;
    this.playVideo(this.activeSlideIdx);
  }

  afterInit() {
    this.goTo(this.activeSlideIdx);
  }

  debug(folder) {
    folder.add(this.uniforms.uDist, "value", -2,10, 0.01).name("uDist").listen();
    folder.add(this, "angleRadian", -Math.PI, Math.PI, 0.01).name("angleRadian").listen().onChange(() => {
      this.groupMesh.rotation.z = this.angleRadian;
    });
  }
}
