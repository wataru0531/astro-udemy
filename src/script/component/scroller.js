/**************************************************************

スクロールに関する処理

***************************************************************/
import gsap from "gsap";
import Scrollbar, { ScrollbarPlugin } from "smooth-scrollbar";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { INode } from "../helper";

const scroller = {
  init,
  disable,
  enable,
  scrolling: false, // スクロールしているかどうか

};

// スクロールトリガー スムーススクロールバー 連携
function init(_disableSmoothScrollbar = false) { // trueのときは慣性スクロールを入れない
  gsap.registerPlugin(ScrollTrigger); // ScrollTriggerを使えるようにする。

  if(_disableSmoothScrollbar) return; // ここで処理を止める

  // use ... Scrollbarの機能を拡張
  //         → DisablePluginを定義し、smooth-scrollbarのtransformDeltaメソッドをオーバーライドすることで、スクロールを無効にする処理を追加
  Scrollbar.use(DisablePlugin); // 

  const pageContainer = INode.getElement("#page-container");
  // SmoothScrollbar.init(pageContainer);

  // スムーススクロールトリガーとスムーススクロールバーを同時に使えるようにする。
  // スクロールバーの直が更新された場合、強制的にすクロールトリガーの値も更新される。
  const scrollBar = Scrollbar.init(pageContainer, { delegateTo: document }); // スクロールバーで発生したイベントをdocumentにも伝える

  scroller.scrollBar = scrollBar;

  ScrollTrigger.scrollerProxy(pageContainer, {
    //
    scrollTop(value) {
      if (arguments.length) {
        scrollBar.scrollTop = value; // setter
      }
      return scrollBar.scrollTop; // getter  スクロールバーと同期されるようになる
    },
    // getBoundingClientRect() {
    //   return {top: 0, left: 0, width: window.innerWidth, height: window.innerHeight};
    // }
  });

  scrollBar.addListener(_onScroll); // スクロールされれれば発火されつづける

  ScrollTrigger.defaults({
    scroller: pageContainer,
  });

  // const el = INode.getElement("[data-webgl]");
}

// スクロールされた時に発火
// WebGLのエフェクトがスクロール中に発火しないようにする
// svgカーソルは非表示にする
function _onScroll(){
  // console.log("_onScroll running!!");
  ScrollTrigger.update(); // 

  _disableHover(50); 
}

// スクロール中はbodyにpointer-events: none;を付与していおく
const marker = "disable-hover";
const bodyClassList = document.body.classList;
let timerId = null;

function _disableHover(_time){
  // console.log("disableHover running!!");
  if(!bodyClassList.contains(marker)){
    bodyClassList.add(marker);
    // scrollしているかどうか
    // → この時はレイキャスを切る
    scroller.scrolling = true;  
  }

  clearTimeout(timerId);
  timerId = setTimeout(() => {
    bodyClassList.remove(marker);
    scroller.scrolling = false;
  }, _time);
}

// スクロール可能かどうかを制御するプラグイン
// ScrollbarPluginを継承して、必要なメソッドをオーバーライドして使う
// https://idiotwu.github.io/smooth-scrollbar/
// https://github.com/idiotWu/smooth-scrollbar/blob/HEAD/docs/plugin.md/
class DisablePlugin extends ScrollbarPlugin{
  static pluginName = "disable";

  static defaultOptions = {
    disable: false,
    // → この値がtrueの時にスクロールを禁止する処理を作っていく
  }

  // delta どれだけスクロールしたか差分。
  // オーバーライドする
  transformDelta(delta){
    // console.log(delta);

    // { x: 0, y: 0 } → スクロールできなくする
    return this.options.disable ? { x: 0, y: 0 } : delta;
  }

}

// defaultOptionsのdisableを変更する処理
function disable(){
  scroller.scrollBar.updatePluginOptions("disable", {
    disable: true,
  });
}

function enable(){
  scroller.scrollBar.updatePluginOptions("disable", {
    disable: false,
  });
}


export default scroller;
