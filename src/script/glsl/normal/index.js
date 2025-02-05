/**************************************************************

normal   Obクラスを継承したメソッド

***************************************************************/
import { BoxGeometry, SphereGeometry } from "three";

import { Ob } from "../Ob";

import { viewport, gui } from "../../helper";

//
import vertexShader   from "./vertex.glsl";
import fragmentShader from "./fragment.glsl";


// Obクラスを継承したクラスを作成。クラス名はつけなくてもいい
export default class extends Ob{
  // 基本的にはObクラスの処理を使いながら個別の処理をここで設定
  // ここにはコンストラクタがないので、Obクラスのコンストラクタが初期化される

  // setupGeometry(){
  //   // return new BoxGeometry(this.rect.width, this.rect.width, this.rect.width);
  //   return new SphereGeometry(this.rect.width, this.rect.width, this.rect.width);
  // }

  setupUniforms(){
    // super...親(OBクラス)のメソッドを読み込む。継承させる。
    const uniforms = super.setupUniforms();

    // 独自のuniformsを追加
    uniforms.uEdge = { value: 0 };

    return uniforms;
  }

  setupVertex(){
    return vertexShader;
  }

  setupFragment(){
    return fragmentShader;
  }

  // 初期化処理の際に最初にやりたい処理がある場合に発火させる
  // beforeCreateMesh(){
  //   if(window.innerWidth < 800){
  //     throw new Error("モバイル表示のため、メッシュの作成作成をスキップ")
  //   }
  // }

  // afterInit(){ // 初期化処理が終わった後に何かやりたい処理があればここに
    // console.log(texId)
    // this.pauseVideo("tex1")
  // }

  // GUIのデバック
  debug(_folder){
    // folder ... lilGUIのフォルダー
    _folder.add(this.uniforms.uEdge, "value", 0, 1, 0.01)

  }

}

