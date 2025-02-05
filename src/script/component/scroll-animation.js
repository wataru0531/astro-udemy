
// スクロールと合わせて変更していく

import gsap from "gsap";
import { INode, viewport } from "../helper";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import world from "../glsl/world";
import { initRipplePass } from "../glsl/ripple";
import mouse from "./mouse";


gsap.set(":root", {
  "--c-text": "#dadada",
  "--c-sec": "#rgba(218, 218, 218, .8)",
  "--c-main": "white",
  // radial-gradientは、backgroundプロパティに。background-colorには効かない
  "--c-bg": "radial-gradient(#000, #191919)", // 円
});

// typeにあうアニメーション
const ACTIONS = {
  progress,
  playVideo,
  fade,
  progressParticles,
  logoAnimation,
  reversal,
  ripple,

}

 // PCかスマホかでscrollTriggerのスタート位置を定義
let startTrigger = null;

// 
function registerScrollAnimations(){
  gsap.registerPlugin(ScrollTrigger);

  startTrigger = viewport.isMobile() ? "top 80%" : "top 70%";
  // console.log(startTrigger);

  const els = INode.qsAll("[data-scroll-trigger]");
  // console.log(els); // (6) [span.panel__content, span.panel__content, span.panel__content, span.panel__content, span.panel__content, span.panel__content]

  els.forEach(el => {
    const key = INode.getDS(el, "scrollTrigger");
    // console.log(key); // progress, progress, playVideo, fade
    const types = key.split(","); // ,で区切り配列に
    // console.log(types); // ['progress'] (2) ['progress', 'playVideo'] ['fade']

    types.forEach(type => {
      // console.log(type)
      // typeにあうアニメーションを実行していく
      ACTIONS?.[type](el); // ACTIONSに見合ったアニメーションが見つからない場合
    })
  })
}


// rippleの制御
// → 反射スライダーではrippleのポストプロセスを切る
async function ripple(_el){
  // console.log(_el);

  if(viewport.isMobile()) return; // PC以外の時はポストプロセスのrippleを切る
  // console.log("done")

  // ポストプロセス(rippleのエフェクト)
  const { addPass, removePass } = await initRipplePass(world, mouse);

  ScrollTrigger.create({
    trigger: _el,
    start: startTrigger, // _elのtop, ブラウザ上から80%
    onEnter: () => {
      removePass();
    },
    onLeaveBack: () => {
      addPass();
    }
  })

}


// 背景色を反転　skillセクションで発火
function reversal(_el){
  // console.log(_el);

  // 背景のfresnel、ディストーションのタイトル色も更新
  const fresnel = world.getObjByEl(".fresnel");
  // console.log(fresnel)
  const skillTitle = world.getObjByEl(".skill__title-text");
  const graphicTitle = world.getObjByEl(".graphic__title-text");

  const reversal = { value: 0 }
  function onUpdate(){
    // console.log("onUpdate")
    fresnel && (fresnel.uniforms.uReversal.value = reversal.value);
    skillTitle && (skillTitle.uniforms.uReversal.value = reversal.value);
    graphicTitle && (graphicTitle.uniforms.uReversal.value = reversal.value);
  }

  gsap.set(":root", {
    "--c-text": "#dadada",
    "--c-sec": "#rgba(218, 218, 218, .8)",
    "--c-main": "white",
    "--c-bg": "radial-gradient(#000, #191919)", // 円
  });

  ScrollTrigger.create({
    trigger: _el,
    start: startTrigger, // _elのtop, ブラウザ上から80%
    onEnter: () => {
      gsap.set(":root", {
        "--c-text": "#333",
        "--c-sec": "#rgba(51, 51, 51, .8)",
        "--c-main": "black",
        "--c-bg": "radial-gradient(#fff, #e5e5e5)", // 円
      });

      gsap.to(reversal, {
        value: 1,
        onUpdate: onUpdate,
      })
    },
    onLeaveBack: () => {
      gsap.to(":root", {
        "--c-text": "#dadada",
        "--c-sec": "#rgba(218, 218, 218, .8)",
        "--c-main": "white",
        "--c-bg": "radial-gradient(#000, #191919)", // 円
      });

      gsap.to(reversal, {
        value: 0,
        onUpdate: onUpdate,
      })
    }
  })

}

// ロゴ
function logoAnimation(_el){
  // gsap.registerPlugin(ScrollTrigger);

  ScrollTrigger.create({
    trigger: _el,
    start: "center top", // _elのtop ブラウザのtop
    onEnter: () => {
      _el.classList.add("inview");
    },
    onLeaveBack: () => {
      // console.log("onLeaveBack")
      _el.classList.remove("inview");
    }
  })
}

// 画面内に入ってきて停止なら再生させる
function playVideo(_el){
  // gsap.registerPlugin(ScrollTrigger);

  const o = world.getObjByEl(_el);
  // console.log(o)
  if(!o) return;
  const video = o.uniforms.tex1.value.source.data;
  // console.log(video); // videoタグ

  ScrollTrigger.create({
    trigger: _el,
    start: startTrigger,
    onEnter: () => {
      // console.log("onEnter")
      video.paused && video?.play();     
    },
    onEnterBack: () => { //
      // console.log("onEnterBack");
      video.paused && video?.play(); 
    },
    onLeave: () => { // 
      // console.log("onLeave");
      video?.pause();
    },
    onLeaveBack: () => { //
      // console.log("onLeaveBack");
      video?.pause();
    }
  })
}

// カールノイズのエフェクト
function progressParticles(_el){
  ScrollTrigger.create({
    trigger: _el,
    start: "center center",
    end: "center center",
    onEnter: () => {
      const o = world.getObjByEl(_el);
      if(!o) return;
      // console.log(o);
      o.goTo(1);
    },
    onEnterBack: () => { // 一度入ってきて出て、再度入ってきた時に発火
      // console.log("onEnterBack");
      const o = world.getObjByEl(_el);
      if(!o) return;
      o.goTo(0);
    },

  })
}

// progress
function progress(_el){
  // console.log(_el);

  ScrollTrigger.create({
    trigger: _el,
    start: startTrigger, // _elのtop, ブラウザ上から80%
    onEnter: () => {
      const o = world.getObjByEl(_el);
      // console.log(o); // default {$: {…}, texes: Map(1), rect: DOMRect, defines: {…}, uniforms: {…}, …}
      
      if(!o) return;
      gsap.to(o.uniforms.uProgress, 1, {
        value: 1,
      })
    },
    onLeaveBack: () => {
      const o = world.getObjByEl(_el);
      if(!o) return;
      gsap.to(o.uniforms.uProgress, 1, {
        value: 0,
      })
    }
  })

}


// fadeのアニメーション 
// CSSに定義 _commonに定義
function fade(_el){
  ScrollTrigger.create({
    trigger: _el,
    start: startTrigger,
    onEnter: () => {
      _el.classList.add("inview");
    },
    onLeaveBack: () => {
      _el.classList.remove("inview");
    }
  });
}




export {
  registerScrollAnimations,

}