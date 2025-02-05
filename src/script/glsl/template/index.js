/**************************************************************

テンプレ

***************************************************************/
import { Ob } from "../Ob";

//
import vertexShader   from "./vertex.glsl";
import fragmentShader from "./fragment.glsl";



// Obクラスを継承したクラスを作成。クラス名はつけなくてもいい
export default class extends Ob{

  // このようにすることで、基本的にはObクラスの処理を使いながら
  // 個別の処理をここで設定することができる

  setupVertex(){
    return vertexShader;
  }

  setupFragment(){
    return fragmentShader;
  }
}

