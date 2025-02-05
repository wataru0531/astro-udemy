// 


import { PlaneGeometry, Float32BufferAttribute, Points } from "three";
import gsap from "gsap";

import { Ob } from "../Ob";
import vertexShader from "./vertex.glsl";
import fragmentShader from "./fragment.glsl";

import { utils } from "../../helper";

export default class extends Ob {
  setupGeometry() {
    const width = this.rect.width,
      height = this.rect.height,
      wSeg = width / 4,
      hSeg = height / 4;

    const plane = new PlaneGeometry(width, height, wSeg, hSeg);

    // ランダムな数値(0〜1500)の頂点データ
    const intensityVertices = utils.getDiagonalVertices(
      hSeg,
      wSeg,
      // カメラからオブジェクトまでの距離が1000。
      // カメラをカメラを飛び越えて手前に1500くらいまで粒子が飛べばいい感じになる
      () => random(0, 1500),
      0
    );

    function random(a, b) {
      return a + (b - a) * Math.random();
    }

    plane.setAttribute( "aIntensity", new Float32BufferAttribute(intensityVertices, 1));

    return plane;
  }

  setupMesh() {
    return new Points(this.geometry, this.material);
  }

  setupVertex() {
    return vertexShader;
  }

  setupFragment() {
    return fragmentShader;
  }

  setupTexes(uniforms) {
    // texCurrent → スタート地点の画像に使う。goTo発火時はtexNextが渡ってくる
    // texNext → goToが発火時に格納
    uniforms.texCurrent = { value: this.texes.get("tex1") };
    uniforms.texNext = { value: null };
    return uniforms;
  }

  running = false;

  goTo(idx, _duration = 3) { // sliderIdxが変化したら発火
    // 0 〜 5が返り、+1。次の_idxが渡ってくる。
    const _idx = (idx % 5) + 1; // 剰余演算子。余りを返す。

    // トランジション中は処理を受け付けないようにする
    // _idxまでは取得し、連続では通さない
    // → デバッグを連続クリックしても、progressが動いている最中はidxは変化するがprogressは動かないようにする
    if (this.running) return; 
    this.running = true;

    const nextTex = this.texes.get("tex" + _idx); // 次に表示するテクスチャ
    // console.log(nextTex)
    this.uniforms.texNext.value = nextTex;

    gsap.to(this.uniforms.uProgress, {
      value: 1,
      duration: _duration,
      ease: "none",

      onStart: () => {
        // 挿入したimg要素を削除。最初は取れてこないんで?でエラーを回避
        // console.log(this.$.el.nextElementSibling)
        this.$.el.nextElementSibling?.remove(); // this.$.el → el: div.particle-slide
        this.mesh.visible = true; // スタートしたタイミングでmeshを表示
      },

      onComplete: () => {
        this.uniforms.texCurrent.value = this.uniforms.texNext.value; // 現在のテクスチャに設定
        this.uniforms.uProgress.value = 0;
        const imgEl = this.texes.get("tex" + _idx).source.data; // img要素を取得
        const parentElement = this.$.el.parentElement;
        // console.log(parentElement); // <div id="particle-slide"></div>
        parentElement.append(imgEl);

        this.mesh.visible = false; // 終わればmesh非表示
        this.running = false; // 再びprogressを動かせるようにする
      },
    });
  }

  afterInit() { // Obのインスタンスが終わり次第発火。
    // console.log("afterInit done")
    this.goTo(0, 0); // tex1、最初の画像を返す
  }

  debug(_folder) {
    _folder.add(this.uniforms.uProgress, "value", 0, 1, 0.1).name("progress").listen();

    const sliderIdx = { value: 0 };

    // スライダーの枚数分を入れる。ここでは5枚
    _folder.add(sliderIdx, "value", 0, 5, 1).name("sliderIdx").listen()
      .onChange(() => {
        this.goTo(sliderIdx.value);
      });
  }
}
