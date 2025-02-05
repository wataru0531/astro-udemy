
// スライダー
// GL Transitions
// https://gl-transitions.com/gallery

// Gl Transitionsはフラグメントシェーダーを扱いトランジションさせる。
// → vertexShaderは特に扱わない(ここではy軸を上下させているだけ)

// 下記のコードが返されることでtransitionさせる
// → progressが1になると次のテクスチャに遷移

// vec4 transition (vec2 uv) {
//   return mix(
//     getFromColor(uv),
//     getToColor(uv),
//     progress
//   );
// }

import { Group, Mesh } from "three";
import gsap from "gsap";

// import { Ob } from "#/glsl/Ob";
import { Ob } from "../Ob";

import vertexShader from "./vertex.glsl";

import fsBefore from "./before.glsl";
import fsAfter from "./after.glsl";

// 各スライダーに関するフラグメントシェーダー
import square from "./square.glsl";
import gate from "./gate.glsl";
import diagonal from "./diagonal.glsl";
import flip from "./flip.glsl";
import book from "./book.glsl";
import collapse from "./collapse.glsl";
import swap from "./swap.glsl";
import verticalDirection from "./vertical-direction.glsl";
import curtain from "./curtain.glsl"

// import { config, INode } from "#/helper";
import { INode } from "../../helper";

// パターンを追加する際はこちらに記述
const fragType = {
  square,
  gate,
  diagonal,
  flip,
  book,
  collapse,
  swap,
  verticalDirection,
  curtain,

};

// bookに関する記述
const MIN_AMOUNT = -0.16;
const MAX_AMOUNT = 1.5;

export default class extends Ob {
  beforeCreateMesh() {
    const type = INode.getDS(this.$.el, "frag") ?? "gate";
    // console.log(type) // book gate など
    this.fragType = type;
    this.angleRadian = -Math.PI / 4; // y軸における角度。45°
    this.activeSlideIdx = 0;
  }

  setupUniforms() {
    const uniforms = super.setupUniforms();
    uniforms.progress = uniforms.uProgress; // GL Transitionsではprogressという変数で使っているため修正

    // book用の処理
    if (this.fragType === "book") {
      uniforms.amount = {
        value: uniforms.progress.value * (MAX_AMOUNT - MIN_AMOUNT) + MIN_AMOUNT,
      };
      uniforms.cylinderCenter = { value: uniforms.amount.value };
      // 360 degrees * uniforms.amount
      uniforms.cylinderAngle = { value: 2.0 * Math.PI * uniforms.amount.value };
      uniforms.cylinderRadius = { value: 1.0 / Math.PI / 2.0 };

      uniforms.progress._value = uniforms.progress.value;
      Object.defineProperty(uniforms.progress, 'value', {
        set: function(newValue) { // uniforms.progressのvalueい値がセットさせた時に動く関数
          this._value = newValue;
          uniforms.amount.value = uniforms.progress.value * (MAX_AMOUNT - MIN_AMOUNT) + MIN_AMOUNT;
          uniforms.cylinderCenter.value = uniforms.amount.value;
          // 360 degrees * uniforms.amount
          uniforms.cylinderAngle.value = 2.0 * Math.PI * uniforms.amount.value;
          uniforms.cylinderRadius.value = 1.0 / Math.PI / 2.0;
        },
        get: function() {
          return this._value;
        }
      });
    }

    return uniforms;
  }

  setupVertex() {
    return vertexShader;
  }

  // ここでフラグメントシェーダーを返して画像を遷移させる
  // 文字列を結合させてフラグメントシェーダーとして使う
  setupFragment() {
    const frag = fragType[this.fragType];

    // フラグメントシェーダーを結合させる
    // fsBefore → book以外のGL Transitionsでも必要な共通の関数
    // frag     → メインの処理。ここではbook
    // fsAfter  → gl_FRagColorにvec4の色を格納するだけ
    // const fs = fsBefore + frag + fsAfter;
    const fs = fsBefore + '\n' + frag + '\n' + fsAfter; 
    // → 改行を入れないとビルド時にエラーがでる
    // console.log(fs)
    return fs;
  }

  setupTexes(uniforms) {
    // uniforms.texCurrent = { value: this.texes.get(`${config.prefix.tex}1`) };
    uniforms.texCurrent = { value: this.texes.get("tex-1") }; // 初めのテクスチャ
    uniforms.texNext = { value: null }; // 遷移先のテクスチャ
    return uniforms;
  }

  setupMesh() {
    this.plane = super.setupMesh();

    const group = new Group;
    group.add(this.plane);
    this.plane.rotation.y = this.angleRadian; // 45°
    // console.log(this.angleRadian); // -0.7853981633974483
    this.plane.position.x += Math.cos(this.angleRadian); // 約.707が返る

    return group; // このgroupメッシュに関してはスクロール位置の変化を受け取る用のmeshとする
  }

  running = false;
  goTo(idx, duration = 1) {
    // console.log(idx)
    // console.log(idx % this.texes.size);
    const _idx = ((idx % this.texes.size) + this.texes.size) % this.texes.size + 1;
    // console.log(_idx); // 1 2 3 4 5 をループ

    if (this.running) return;
    this.running = true;

    // const nextTex = this.texes.get(config.prefix.tex + _idx);
    const nextTex = this.texes.get(`tex${_idx}`);
    this.uniforms.texNext.value = nextTex;
    gsap.to(this.uniforms.uProgress, {
      value: 1,
      duration,
      ease: "power2.in",

      onComplete: () => {
        this.uniforms.texCurrent.value = this.uniforms.texNext.value;
        this.uniforms.uProgress.value = 0;
        this.activeSlideIdx = idx;
        this.running = false;
      },
    });
  }

  render(tick) {
    super.render(tick);

    if (this.fragType === "book") { // book用の記述
      this.uniforms.amount.value =
        this.uniforms.progress.value * (MAX_AMOUNT - MIN_AMOUNT) + MIN_AMOUNT;
    }
  }

  afterInit() { this.goTo(0, 0); }

  debug(folder) {
    folder.add(this, "angleRadian", -Math.PI,Math.PI, 0.01).name("angleRadian").listen().onChange(() => {
      this.plane.rotation.y = this.angleRadian;
    });

    folder.add(this.uniforms.uProgress, "value", 0, 1, 0.1).name("progress").listen();

    const sliderIdx = { value: 0 };
    folder.add(sliderIdx, "value", 0, 12, 1).name("goTo").listen().onChange(() => {
      this.goTo(sliderIdx.value);
    });
  }
}
