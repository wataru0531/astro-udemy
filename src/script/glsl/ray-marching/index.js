
// レイマーチング

import gsap from "gsap";

// ダイナミックインポートされるため拡張子あり、相対パスで指定
import frag from "./fragment.glsl";
import vert from "./vertex.glsl";
import { Ob } from "../Ob.js";
import { viewport } from "../../helper/index.js";

export default class extends Ob {
  // setupMaterial() {
  //   const material = super.setupMaterial();
  //   material.precision = utils.isTouchDevices ? "highp" : "lowp";
  //   return material;
  // }

  setupUniforms() {
    const uniforms = super.setupUniforms();
    // uniforms.uLoop = { value: 15 }; // WebGL1.0への対応
    uniforms.uProgress = { value: 1 };
    uniforms.uDPR = { value: viewport.devicePixelRatio };

    return uniforms;
  }

  setupFragment() { return frag; }
  setupVertex() { return vert; }

  debug(folder) {
    folder.add(this.uniforms.uProgress, "value", 0, 1, 0.1).name("progress").listen();

    const datObj = { next: !!this.uniforms.uProgress.value };
    folder.add(datObj, "next").name("Animate").onChange(() => {
        gsap.to(this.uniforms.uProgress, {
          value: +datObj.next, // 単行プラス演算子。booleanをintに
          duration: 1.0,
          ease: "power4.inOut",
        });
      });
  }
}
