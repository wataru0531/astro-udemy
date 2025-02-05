
// slider-z

import frag from "./fragment.glsl";
import vert from "./vertex.glsl";
import { Ob } from "../Ob.js";
import { Mesh, Group, VideoTexture, PlaneGeometry } from "three";

import gsap from "gsap";
import { viewport, INode, utils } from "../../helper/" 

export default class extends Ob {
  beforeCreateMesh() {
    this.activeSlideIdx = 0;
    this.gap = viewport.width / 4; // z軸方向の間隔
    // console.log(this.gap); //
    this.angleRadian = -Math.PI / 7; // 0.448rad * 180/π ＝ 25.669°
  }

  // テクスチャをうねらせるために頂点の数を多くしておく
  setupGeometry() { return new PlaneGeometry(this.rect.width, this.rect.height, 100, 50); }
  setupFragment() { return frag; }
  setupVertex() { return vert; }

  setupUniforms() {
    const uniforms = super.setupUniforms();
    uniforms.uDist = { value: 1.8 };
    uniforms.uSlideIdx = { value: 0 }; // 各スライドのメッシュの番号 0~4
    uniforms.uActiveSlideIdx = { value: this.activeSlideIdx }; // クリックされたスライドの番号
    
    return uniforms;
  }

  // scrollMesh > groupMesh > 5つのmesh 
  // scrollMeshがObクラスのスクロール位置の変更を受ける
  // リサイズはgroupMeshが受ける
  setupMesh() {
    const groupMesh = new Group();

    let i = 0;
    this.texes.forEach((tex) => {
      const mate = this.material.clone();
      mate.uniforms.tex1 = { value: tex };
      mate.uniforms.uTick = this.uniforms.uTick;
      mate.uniforms.uActiveSlideIdx = this.uniforms.uActiveSlideIdx;
      mate.uniforms.uDist = this.uniforms.uDist;
      mate.uniforms.uSlideIdx.value = i;
      const _mesh = new Mesh(this.geometry, mate); // mesh化
      groupMesh.add(_mesh);
      i++;
    });

    this.slides = [...groupMesh.children];

    groupMesh.rotation.y = this.angleRadian; // y軸を中心に0.448rad回転
    this.groupMesh = groupMesh;

    const scrollMesh = new Group();
    scrollMesh.add(groupMesh);

    return scrollMesh;
  }

  // 位置を決める
  // world.jsのinitで初期化
  async resize(duration = 1) {
    this.resizing = true;
    // console.log(this)
    const { $: { el }, originalRect } = this;

    this.setupResolution(this.uniforms);

    const nextRect = INode.getRect(el);
    let { x } = this.getWorldPosition(nextRect, viewport);

    this.gap = viewport.width / 4;
    x += this.gap * Math.sin(this.angleRadian) * this.activeSlideIdx;

    const p1 = new Promise((onComplete) => {
      gsap.to(this.groupMesh.position, {
        x, // xの位置。ここではsin
        z: this.gap * Math.cos(this.angleRadian) * this.activeSlideIdx, // yの位置。cos
        overwrite: true, // → このトゥイーンの中でアニメーションの競合が起きた場合は最新のもので上書きする
        duration,
        onComplete,
      });
    });

    // 5つのmeshの位置を決定、大きさの変更
    const p2 = new Promise((onComplete) => {
      gsap.to(this.scale, {
        width: nextRect.width / originalRect.width,
        height: nextRect.height / originalRect.height,
        depth: nextRect.width / originalRect.width,
        overwrite: true,
        duration,
        onUpdate: () => {
          this.groupMesh.scale.set(this.scale.width, this.scale.height, this.scale.depth);

          this.slides.forEach((_slide, i) => {
            // console.log((-i * this.gap) / this.scale.depth);
            // console.log(this.scale.depth)
            // -0  -125  -250  -375  -500

            gsap.to(_slide.position, {
              z: (-i * this.gap) / this.scale.depth, // 奥行きを決定。
              overwrite: true,
              duration,
              onComplete,
            });
          });
        },
        onComplete,
      });
    });

    await Promise.all([p1, p2]);

    this.rect = nextRect;

    this.resizing = false;
  }

  render(tick) {
    this.uniforms.uTick.value = tick;
    const uActiveSlideIdx = this.uniforms.uActiveSlideIdx.value;
    const idx = utils.lerp(uActiveSlideIdx, this.activeSlideIdx, 0.07);
    // idxは線形補間で値が渡ってくる

    if(this.uniforms.uActiveSlideIdx.value === idx) return;

    // 位置を更新する
    const { x } = this.getWorldPosition(this.rect, viewport);
    this.groupMesh.position.x = x + this.gap * Math.sin(this.angleRadian) * idx;
    this.groupMesh.position.z = this.gap * Math.cos(this.angleRadian) * idx;

    this.uniforms.uActiveSlideIdx.value = idx;
  }

  playVideo(idx) {
    const i = idx % this.slides.length;
    const slide = this.slides.at(i);
    const tex1Value = slide.material.uniforms.tex1.value;
    this.playingVideo?.pause();
    if (tex1Value instanceof VideoTexture) {
      this.playInterval = setInterval(() => {
        if (this.uniforms.uActiveSlideIdx.value === idx) {
          this.playingVideo = tex1Value.source.data;
          this.playingVideo.play?.();
          clearInterval(this.playInterval);
        }
      }, 200);
    }
  }

  goTo(idx) {
    this.activeSlideIdx = (this.texes.size + idx) % this.texes.size;
    this.playVideo(this.activeSlideIdx);
  }

  afterInit() {
    this.goTo(this.activeSlideIdx);
  }

  debug(folder) {
    folder.add(this.uniforms.uDist, "value", -2,10, 0.01).name("uDist").listen();
    folder.add(this, "angleRadian", -Math.PI,Math.PI, 0.01).name("angleRadian").listen().onChange(() => {
      this.groupMesh.rotation.y = this.angleRadian;
    });
  }
}
