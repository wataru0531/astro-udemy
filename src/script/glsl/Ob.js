/**************************************************************

Obクラス
	・メッシュに関する制御
	・子クラスでメソッドなどを上書きして使う
  ・メッシュ毎に適用するWebGLをtype毎に変更する

***************************************************************/
import { PlaneGeometry, ShaderMaterial, Mesh, Vector2 } from "three";

import loader from "../component/loader";
import { utils, viewport, INode } from "../helper";
import gsap from "gsap";

class Ob {
  static async init({ el, type }) { // static → インスタンス化しなくても直接呼べる関数
    const texes = await loader.getTexByElement(el); // キャッシュからテクスチャ取得
    // console.log(texes) // 0: {"tex1" => Texture} 1: {"tex2" => Texture}

    // new this ... コンストラクト関数の初期化スタート。子クラスのインスタンス化
    // ※ new Obとした場合...Obクラスを直接インスタンス化となるため、vertexなどがオーバーライドされない
    const o = new this({ texes, el, type }); // Obクラスを継承した子クラスを参照
    // console.log(o); // default {$: {…}, texes: Map(3), rect: DOMRect, defines: {…}, uniforms: {…}, …}
    // → importしてきてnewされるのは子クラスのOb。なのでoはデフォルトオブジェクトを持つ。
    return o;
  }

  // initにより初期化(new this({texes, el, type})の部分)される
  constructor({ texes, el, type }) {
    // console.log(texes); // Map(2) {'tex1' => Texture, 'tex2' => Texture}
    // console.log(el,)
    // type ... 切り替えることによってglslファイルも切り替わる

    this.$ = { el }; // $ → DOMオブジェクト(HTML要素)
    this.texes = texes ?? []; // texesが渡って来なかったら、空配列を渡す。NULL合体演算子
    this.scale = { width: 1, height: 1, depth: 1 };
    this.resizing = false; // リサイズ中かどうか
    this.rect = this.originalRect = INode.getRect(el);
    // console.log(this.rect); // DOMRect {x: 0, y: 299.484375, width: 637, height: 400, top: 299.484375, …}

    if(!this.rect.width || !this.rect.height){ // domに幅・高さがない場合のスキップさせる(エラーとなるため)
      // debugがtrue...1の時にのみコンソールを出す
      if(window.debug){
        console.log("要素に幅と高さの設定がないため、meshの作成をスキップ", this.$.el);
      }
      return {}; // 空のオブジェクトを渡す
    }

    // tyyの中の処理のいずれかでエラーが出た場合、空のオブジェクトがリターンされる
    // エラーの場合、world.jsでシーンやosへの追加が行われない
    try{
      this.beforeCreateMesh();
      this.defines = this.setupDefines(); // glslファイルでの#defineをJS側から定義
      this.uniforms = this.setupUniforms();
      this.uniforms = this.setupTexes(this.uniforms);
      this.uniforms = this.setupResolution(this.uniforms); // (画像・動画のアスペクト比の計算)
      this.vertexShader = this.setupVertex();
      this.fragmentShader = this.setupFragment();
      this.material = this.setupMaterial(); 
      this.geometry = this.setupGeometry();
      this.mesh = this.setupMesh();
      this.disableOriginalElem(); // ドラッグ時の挙動の処理
      this.mesh.__marker = type; // typeを渡せばどの位置でエラーとなったかが分かるようにtypeを渡す
      // this.afterInit();

    } catch(e){
      if(window.debug){
        console.log(e);
      }

      return {};
    }
  } // コンストラクタ終

	beforeCreateMesh(){}// コンストラクタの初期化前に実行したい処理。子クラスで定義、ここには書かない

  // glslファイルで「#define PI 3.14」などを記述しなくても使用可能とする
  // 他にもdefinesで定義しなくてはならないのはこのように定義する
  setupDefines() {
    return {
      PI: Math.PI,
    };
  }

  setupUniforms() { // uniforms...他に必要なものは子クラスでオーバーライドされる
    return {
      uTick: { value: 0 },
      uMouse: { value: new Vector2(0.5, 0.5) }, // uv座表(0〜1)
      uAlpha: { value: 0 },
      uHover: { value: 0 }, // ホバーしている時は1
      uProgress: { value: 0 },
    };
  }

  setupTexes(uniforms) {
		// console.log(uniforms)
    
    this.texes.forEach((tex, key) => { // uniformにテクスチャを格納
			//  console.log(tex, key); // Texture{}, "tex1"

      uniforms[key] = { value: tex }; // キー情報を元にテクスチャを設定
      // console.log(uniforms); // {uTick: {…}, tex1: {value: Texture}, tex2: {value: Texture}}
    });

    return uniforms;
  }

  setupGeometry() { 
    return new PlaneGeometry(this.rect.width, this.rect.height, 1, 1);
  }

  setupMaterial() { // マテリアル...異なるマテリアルを使いたい場合は子クラスでオーバーライドさせる
    return new ShaderMaterial({
      defines: this.defines, // Math.PIなど。オブジェクトでわたす
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      uniforms: this.uniforms,
			transparent: true,
			alphaTest: .5, // 透明度をどれだけ厳密に見るか(.5以下の透明度は無視)

      // onBeforeCompile
      // → シェーダーのコンパイル直前に呼び出されるコールバック関数
      //   引数のshaderはThreeが自動で付与。onAfterRenderなどのコールバックもある。
      onBeforeCompile: this.onBeforeCompile, // WebGL1.0への対応。
    });
  }

  // WebGL1.0への対応 
  onBeforeCompile(shader) {
    // console.log(shader); // { isWebGL2: true, shaderID: undefined, shaderName: 'ShaderMaterial', vertexShader: '#define GLSLIFY 1\nvarying vec2 vUv;\nvoid main(){\nv…ctionMatrix*modelViewMatrix*vec4(position,1.);\n}\n', fragmentShader: '#define GLSLIFY 1\nvec3 mod289(vec3 x){\nreturn x-fl…=vec4(rgb,t1.a*uProgress);\ngl_FragColor=color;\n}\n', …}

    if (shader.isWebGL2) return; // WebGL 2.0の場合、変更は不要

    // WebGL1.0の場合はtexture関数が見つからないため、texture2Dに置換
    shader.vertexShader = shader.vertexShader.replace(/texture\(/g, 'texture2D(');
    shader.fragmentShader = shader.fragmentShader.replace(/texture\(/g, 'texture2D(');
  }

  // vertexとfragmentは子クラスで必ずオーバーライド。
  // もし継承しなかった場合はエラーを発生させる
  // vertexShader
  setupVertex() {
    throw new Error("このメソッドはオーバーライドして使用してください。");
  }
  setupFragment() {
    throw new Error("このメソッドはオーバーライドして使用してください。");
  }

  // html要素とテクスチャのアスペクト比を比較して、、修正する値を返す
  // tex1のみ取得できればアスペクト比を計算できるためtex1のみ取得
  setupResolution(uniforms) {
    // テクスチャを使ってない場合はもともとのuniformsを返して終了
    if (!this.texes.get("tex1")) return uniforms;

    // source.data ... TextureLoaderでテクスチャとしたもとのデータ
    // 　　　　　　　　 　実際のソースデータを指す。
    //                 これは通常、HTMLImageElementやHTMLVideoElementなどのDOM要素
    // console.log(this.texes); // Map(3) {'tex1' => Texture, 'tex2' => Texture, 'texDisp' => Texture}
    // console.log(this.texes.get("tex1")); // Texture {isTexture: true, uuid: '2591e714-e8fb-4fa1-8a3a-719085d5d2f2', name: '', source: Source, mipmaps: Array(0), …}
    const media = this.texes.get("tex1").source.data;
    // console.log(media)

    const mediaRect = {}; // 画像、動画自体のサイズ
    // console.log(mediaRect)

    if (media instanceof HTMLImageElement) {
      // 画像
      mediaRect.width = media.naturalWidth;
      mediaRect.height = media.naturalHeight;
    } else if (media instanceof HTMLVideoElement) {
      // 動画
      mediaRect.width = media.videoWidth;
      mediaRect.height = media.videoHeight;
    }
    // console.log(mediaRect); // {width: 1024, height: 682}

    // アスペクト比を算出 this.rect → htmlのタグのサイズ、mediaRect → 画像・動画自体のサイズ
    const resolution = utils.getResolutionUniforms(this.rect, mediaRect); 

    uniforms.uResolution = { value: resolution };
    // console.log(uniforms.uResolution); // value : Vector4 {x: 600, y: 400, z: 0.75, w: 1}

    return uniforms;
  }

  setupMesh() { // メッシュ
    return new Mesh(this.geometry, this.material); // Pointなど違うメッシュを使いたい場合は、子クラスでオーバーライド
  }

  // ドラッグ処理など、もともとのHTMLの処理など
  disableOriginalElem() {
    this.$.el.draggable = false; // 画像がドラッグで持ち上がらない
    this.$.el.style.opacity = 0; // もとのHTML要素の透明度が0になるのでメッシュのみ表示
  }

  async resize(_duration = 1) {  // メッシュの位置とサイズの更新
    this.resizing = true;
    const { mesh, originalRect } = this;
    // console.log(this);

    this.setupResolution(this.uniforms); // テクスチャのアスペクト更新

    const nextRect = INode.getRect(this.$.el); // 新しく取得したHTML要素
    // console.log(rect)
    const { x, y } = this.getWorldPosition(nextRect, viewport);
    // console.log(y)

    // gsapが完了したらthis.rectを更新する
    // → 連続でresizeが発火し続けた場合などに、アニメーションが終わる前に
    //   this.rectを更新されたりして、位置や大きさが意図しないものとなってしまう。
    const p1 = new Promise(resolve => { // 位置の変更
      // このgsapの処理は非同期で行われる
      gsap.to(mesh.position, { // 位置
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

    // サイズ ... 古いオブジェクトの大きさで割ることで、新しいオブジェクトの比を割り出せる。z軸は今回は1にしておく。
    const p2 = new Promise(resolve => {
      gsap.to(this.scale, {
        width: nextRect.width / originalRect.width,
        height: nextRect.height / originalRect.height,
        depth: 1,
        overwrite: true,
        duration: _duration,

        onUpdate: () => {
          mesh.scale.set(this.scale.width, this.scale.height, this.scale.depth);
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

  getWorldPosition(rect, canvasRect) { // HTML要素の座表をワールド座標の値に置き換えメッシュのに適用
    const x =   rect.left + rect.width  / 2 - canvasRect.width  / 2;
    const y = - rect.top  - rect.height / 2 + canvasRect.height / 2;
    return { x, y };
  }

  scroll() { // スクロール処理
    // fixedがtrueなら、スクロールに伴う処理を行わずmeshの位置がその位置で固定となる。
    // → fixedで画面に固定したまま。home.jsで指定
    if(this.fixed) return; 

    const { $: { el }, mesh } = this;
    // console.log(el)
    const rect = INode.getRect(el);
    // console.log(rect)
    const { x, y } = this.getWorldPosition(rect, viewport); // 縦スクロールなのでyのみ取得
    // console.log(y)

    // mesh.position.x = x;
    mesh.position.y = y;
  }

  render(tick) { // 個別にレンダーしたい場合もあるので追加
    this.uniforms.uTick.value = tick;
  }

  async afterInit() { // 初期化処理が終わった後に呼び出したい処理を記述
    // ここには基本的に何も書かないが、何か初期化処理が終わった後にやりたい処理があれば継承先のクラスで書く
    // console.log("afterInit start!!")
		// this.pauseVideo();
		// console.log(this.playVideo())

		// setTimeout(() => {
		// 	this.playVideo();
		// 	// console.log(this.pauseVideo())
		// }, 2000)
  }

	async playVideo(texId = "tex1"){ // 動画の再生関数。playは非同期関数
    // console.log(this.uniforms[texId])
		// console.log(this.uniforms[texId].value.source.data.play?.())
		// data → TextureLoaderで生成したDOMを格納
		// 画像にはplayはないのでオプショナルチェイニング演算子でplayがなかった場合エラーにしないと制御を加える
		// play...非同期でプロミスが返る
		await this.uniforms[texId].value.source.data.play?.();
	}

	pauseVideo(texId = "tex1") { // 動画の停止関数
    this.uniforms[texId].value.source.data.pause?.();
  }
}

export { Ob };

