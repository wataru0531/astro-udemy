
// ボタンを押した時の回転の処理

import gsap from "gsap";

import world from "../glsl/world";
import { INode } from "../helper";

// 円柱スライダーなどのボタン機能
function mountNavBtnHandler(
  _sliderSelector, 
  _prevBtnSelector, 
  _nextBtnSelector,
  _textSelector,
){
  const prevEl = INode.getElement(_prevBtnSelector); // domならdomを返し、文字列ならqsで取得
  const nextEl = INode.getElement(_nextBtnSelector);
  // console.log(prevEl, nextEl)

  const slider = world.getObjByEl(_sliderSelector); // sliderのdomを返却
  // console.log(slider); // default {$: {…}, texes: Map(5), rect: DOMRect, radius: 502.796875, rotateAxis: _Vector3, …}
  
  const text = world.getObjByEl(_textSelector); // スライダーのテキスト部分

  function goTo(_idx){
    slider.goTo(_idx);
    if(text) text.goTo(_idx);   // テキスト部分
  }

  prevEl.addEventListener("click", () => {
    const idx = slider.activeSlideIdx - 1; // 1つ前のインデックス
    goTo(idx);
  });

  nextEl.addEventListener("click", () => {
    const idx = slider.activeSlideIdx + 1;
    goTo(idx);
  })

  return {
    goTo,
  }
}


// 反射スライダーのボタン機能
function mountSkillBtnHandler(
  _sliderSelector, 
  _prevBtnSelector, 
  _nextBtnSelector,
  _textSelector,
){
  const prevEl = INode.getElement(_prevBtnSelector); // domならdomを返し、文字列ならqsで取得
  const nextEl = INode.getElement(_nextBtnSelector);
  // console.log(prevEl, nextEl)

  const slider = world.getObjByEl(_sliderSelector); // sliderのdomを返却
  // console.log(slider); // default {$: {…}, texes: Map(5), rect: DOMRect, radius: 502.796875, rotateAxis: _Vector3, …}
  const slideUl = INode.getElement(_textSelector);
  // console.dir(slideUl)
  const slideLis  = [...slideUl.children];

  let translateX = 50;
  let prevIdx = 0;

  slideLis.forEach((_li, _idx) => {
    _li.style.translate = `-${translateX * _idx}px 0px`
  })

  function goTo(_idx){
    slider.goTo(_idx);
  }

  prevEl.addEventListener("click", () => {
    let idx = slider.activeSlideIdx - 1; // 1つ前のインデックス
    // console.log(idx)
    idx = (slider.texes.size + idx) % slider.texes.size;
    console.log(idx)
    
    goTo(idx);

    slideLis[idx].style.opacity = 1;
    slideLis[prevIdx].style.opacity = 0;
    slideUl.style.translate = `${translateX * idx}px 0px`;
    prevIdx = idx;
  });

  nextEl.addEventListener("click", () => {
    let idx = slider.activeSlideIdx + 1;
    idx = idx % slider.texes.size;
    // console.log(idx)
    goTo(idx);

    slideLis[idx].style.opacity = 1; // アクティブなテキストのみ透明度を1に
    slideLis[prevIdx].style.opacity = 0;
    slideUl.style.translate = `${translateX * idx}px 0px`;
    prevIdx = idx;
  })

}


// 反射スライダー  ScrollTriggerで連動させる処理
function mountScrollHandler(
  _sliderSelector,  // data-webglのタグ
  _triggerSelector, // section
  _textSelector     // ulタグ
){
  const slider = world.getObjByEl(_sliderSelector);
  // console.log(slider); // default {$: {…}, texes: Map(5), rect: DOMRect, radius: 502.796875, rotateAxis: _Vector3, …}
  const slideUl = INode.getElement(_textSelector);
  // console.dir(slideUl);
  const slideLis  = [...slideUl.children];
  // console.log(slideLis); // (5) [li.skill__li, li.skill__li, li.skill__li, li.skill__li, li.skill__li]

  let translateX = 50;
  let prevIdx = 0;

  slideLis.forEach((_li, _idx) => {
    _li.style.translate = `-${translateX * _idx}px 0px`
  })

  function goTo(_idx){
    slider.goTo(_idx);
  }

  const slides = { idx: 0 }
  gsap.to(slides, {
    idx: slideLis.length - 1, // idxを4まで動かす

    scrollTrigger: {
      trigger: _triggerSelector,
      start: "top 0%", // trigger要素 ビューポート
      end: "+=3000", // 3000px

      pin: true, // start位置からendまでslidesをpin留め
      scrub: true, // 数値とアニメーションを連動

      onUpdate: (scrollTrigger) => {
        // console.log(scrollTrigger.progress);
        let idx = Math.round(slides.idx); // 四捨五入
        // console.log(idx)
        idx = (slider.texes.size + idx) % slider.texes.size;
        // console.log(idx)

        if(idx === prevIdx) return; // idxに変更ないなら後続の処理は動かさない
        
        goTo(idx);

        slideLis[idx].style.opacity = 1;
        slideLis[prevIdx].style.opacity = 0;
        // slideUl.style.translate = `${translateX * idx}px 0px`;
        prevIdx = idx;
      }
    }
  });
}

export { 
  mountNavBtnHandler,
  mountSkillBtnHandler,
  mountScrollHandler,

}