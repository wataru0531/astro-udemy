
// メニューの開閉

import gsap from "gsap";

import { INode } from "../helper";

const menu = {
  init,
  toggle,

}

const $ = {};
// console.log($.container)
let world = null;
let scroller = null;
let isOpen = false;
let clickTl = null; // timelineのアニメーション

function init(_world, _scroller){
  world = _world;
  scroller = _scroller;
  // console.log(world, scroller)

  $.container = INode.getElement("#global-container");
  $.btn = INode.getElement(".btn-menu");
  $.wraps = INode.qsAll(".btn-menu__wrap");
  $.bars = INode.qsAll(".btn-menu__bar");
  $.page = INode.getElement("#page-container");
  // console.log($)

  clickTl = _createClickTl();

  _bindEvents();
}

// テキストスライダーの表示・非表示に関する処理 → menuが開いているときは非表示
function _toggleMeshVisibility(_isOpen){ // 初めはfalseが渡ってくる
  const fvText = world.getObjByEl(".fv__text-shader"); // PC時のみに表示
  // console.log(fvText);

  const titleEls = INode.qsAll('[data-webgl="distortion-text"]');
  // console.log(titleEls);
  titleEls.forEach(titleEl => {
    const titleObj = world.getObjByEl(titleEl);
    // console.log(titleObj); // default {$: {…}, texes: Map(1), rect: DOMRect, defines: {…}, uniforms: {…}, …}
    if(titleObj) titleObj.mesh.visible = _isOpen;
  })

  if(fvText) fvText.mesh.visible = _isOpen; 
}

function _bindEvents(){
  // pointerdown → タッチデバイスやペン、マウスなど、さまざまな入力デバイスに対応するためのイベント
  //               押された時点で反応
  // click       → クリックが完了して、押して話した時に発火
  $.btn.addEventListener("pointerdown", () => toggle());
  $.btn.addEventListener("mouseenter", () => _enter()); // PCだけ反応するようにmouse_enterとする
}

// クリック時のアニメーションのtimelineを返す処理
function _createClickTl(){
  const tl = gsap.timeline({
    defaults: { duration: .3 },
    paused: true, // 停止させておく
  });

  tl.to($.wraps[0], { // 1本目のバー
    y: 0,
    rotateZ: 225,
    
  }, "toggle") // "toggle"という目印をつけると同じタイミングで実行される
  .to($.wraps[1], { // 2本目のバー
    x: "-1em",
    opacity: 0,
  }, "toggle")
  .to($.wraps[2], { // 3本目のバー
    y: 0,
    rotateZ: -225,
  }, "toggle")
  .to($.page, {
    opacity: 0,
    duration: .1,
  })

  return tl;
}

// ハンバーガーの動き
function toggle(){
  $.container.classList.toggle("js-menu-open");

  if(isOpen){
    // 閉じる処理
    _toggleMeshVisibility(isOpen); // テキストスライダーを表示
    clickTl.reverse(); // 逆再生
    // scroller.enable(); // スクロール可能に

  } else {
    // 開く処理
    _toggleMeshVisibility(isOpen)
    clickTl.play(); // 通常再生
    // scroller.disable(); // スクロール不可能に
  }

  isOpen = !isOpen;
}

// ホバーに関する処理
function _enter(){
  const tl = gsap.timeline({ 
    defaults: { 
      stagger: { 
        each: .1  // each → 1つ１つに。amount → 全体で何秒か
      },
      duration: .3
    }, 
  });

  tl.set($.bars, { transformOrigin: "right" })
  .to($.bars, { scaleX: 0 })
  .set($.bars, { transformOrigin: "left" })
  .to($.bars, { scaleX: 1 })

}

export {
  menu,
}