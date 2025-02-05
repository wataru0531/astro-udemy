/**************************************************************

plane-sphere

***************************************************************/
import gsap from "gsap";
import { SphereGeometry, PlaneGeometry, Group } from "three";

import { Ob } from "../Ob";
import { viewport, INode } from "../../helper";

import vertexShader   from "./vertex.glsl";
import fragmentShader from "./fragment.glsl";


export default class extends Ob{
  setupUniforms(){
    // super...親のObクラスのsetupUniformsを呼び出し、uniformsに独自のプロパティを足していく
    const uniforms = super.setupUniforms();
    // console.log(super.setupUniforms()); // {uTick: {…}, uMouse: {…}, uHover: {…}, uProgress: {…}}

    uniforms.uSphereScale = { value: 2.0 }; // 球の大きさの調整
    uniforms.uDelay = { value: 0.7 };
    uniforms.uFreq = { value: 0.02 }; // 周波数
    uniforms.uNoiseLevel = { value: .2 }; // 
    uniforms.uNoiseFreq = { value: 1 };
    uniforms.uReversal = { value: 1 };
    // console.log(uniforms)

    return uniforms;
  }

  setupGeometry() {
    const wSeg   = this.rect.width  / 10;
    const hSeg   = this.rect.height / 10;
    const radius = this.rect.width / 10;  // 半径

    const plane = new PlaneGeometry(this.rect.width, this.rect.height, wSeg, hSeg);
    const sphere = new SphereGeometry(radius, wSeg, hSeg);
    
    // プログレスが進んだとしても0.5の位置が中央に来る
    sphere.rotateY(Math.PI * 3 / 2); // 270°
    sphere.translate(0, 0, - radius); // 球体を少し奥方向に移動

    // planeにsphereの頂点を足していく
    plane.setAttribute('sphere', sphere.getAttribute('position'));
    // ほうせん...面に対して垂直な直線
    plane.setAttribute("sphereNormal", sphere.getAttribute("normal"));
    // console.log(plane)

    return plane;
  }

  setupMesh(){
    this.plane = super.setupMesh(); // 親クラスの平面のmeshを代入
    // console.log(plane); // 

    // Obクラスのスクロールでmeshの位置が反映されるのはこのgroup
    // → this.planeはGroupで囲うことで、Obクラスのスクロール処理での位置変更が加わらなくなる。
    const group = new Group(); 
                              //  
    // console.log(group)

    group.add(this.plane);
    // console.log(group); // Group {isObject3D: true, uuid: '1d25b5da-e460-4a58-931a-718b1237cd5a', name: '', type: 'Group', parent: null, …}
    return group; // このgroupはthis.meshに設定される
  }

  setupVertex(){
    return vertexShader;
  }
  setupFragment(){
    return fragmentShader;
  }

  render(tick){ // world.jsのrender()で実行される
    super.render(tick);
    
    // 不要な時はこのrenderを呼ばない。ホバーされた時のみ実行させる
    // → レイキャスティングの判定によりuHoverに値が渡ってくる
    // リサイズ中にホバーしていると位置関係がバグるのでreturnする
    if(this.uniforms.uHover.value === 0 && this.resizing ) return;

    // console.log(this.$.el)
    // const rect = INode.getRect(this.$.el); // 最新のrectを取得
    // console.log(rect)
    // const { x, y } = this.getWorldPosition(rect, viewport);
    // console.log(x, y)

    // x, y軸方向に動かす → これらはGroupメッシュの中央からの移動となる
    // this.uniforms.uHover.value → 初期は0で最大値は1。初期は0なので動かない
    this.plane.position.x = (this.uniforms.uMouse.value.x - 0.5) * 50. * this.uniforms.uHover.value;
    this.plane.position.y = (this.uniforms.uMouse.value.y - 0.5) * 50. * this.uniforms.uHover.value;

    this.plane.position.z = 100 * this.uniforms.uHover.value; // z軸手前に拡大

    // マウスに対する面の傾きを定義。回転 x, yにはuv座標の0から1が渡ってくる
    // console.log(`x: ${this.uniforms.uMouse.value.x}, y: ${this.uniforms.uMouse.value.y}`)
    this.plane.rotation.x = - (this.uniforms.uMouse.value.y - 0.5) * this.uniforms.uHover.value / 1.5;
    this.plane.rotation.y = (this.uniforms.uMouse.value.x - 0.5) * this.uniforms.uHover.value / 1.5;
  }
  
  // bootstrap.jsで初期化
  debug(_folder) {
    _folder.add(this.uniforms.uReversal, "value", 0, 1, 0.1).name("uReversal").listen();
    _folder.add(this.uniforms.uSphereScale, "value", 0, 5, 0.1).name("uSphereScale").listen();
    _folder.add(this.uniforms.uNoiseFreq, "value", 0, 10, 0.01).name("uNoiseFreq").listen();
    _folder.add(this.uniforms.uNoiseLevel, "value", 0, 1, 0.01).name("uNoiseLevel").listen();
    _folder.add(this.uniforms.uFreq, "value", 0, 0.1, 0.001).name("uFreq").listen();
    _folder.add(this.uniforms.uDelay, "value", 0, 1, 0.01).name("uDelay").listen();
    _folder.add(this.uniforms.uProgress, "value", 0, 1, 0.1).name("progress").listen();
  
    const datObj = { next: !!this.uniforms.uProgress.value };
  
    _folder
      .add(datObj, "next")
      .name("Animate")
      .onChange(() => {
        gsap.to(this.uniforms.uProgress, 2, {
          value: +datObj.next,
          ease: "power2.out",
        });
      });
  }
}