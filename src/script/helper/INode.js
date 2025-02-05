/**************************************************************

DOM操作ヘルパー( DOMApi )

***************************************************************/

const INode = {
  qs(selector, scope) {  // querySelector(セレクタ文字列, DOM)
    return (scope || document).querySelector(selector);
  },

  qsAll(selector, scope) { // querySelectorAll
    const els = (scope || document).querySelectorAll(selector);
    return Array.from(els);
  },

  htmlToEl(htmlStr) { // 文字列をDOMに変換
    const div = document.createElement("div");
    div.innerHTML = htmlStr;
    return div.firstElementChild;
  },

  // targetがDOMかどうか判定。セレクタ文字列だったらfalseを返す
  // Element  ... DOMの実体。DOMツリーから取得された要素。querySelectorで取得してきたDOM など
  // selector ... 単なる文字列r。#global-containerなど、CSSで指定するものをセレクタ。
  isElement(target) {
    // console.log(target instanceof Element)
    return target instanceof Element;
  },

  // Domでもセレクタ文字のどちらでもDOMを返す
  getElement(elementOrSelector) {
    // console.log(elementOrSelector)
    return this.isElement(elementOrSelector) ? elementOrSelector : this.qs(elementOrSelector);
  },

  getRect(el) { // DOMRectオブジェクトを返却
    el = this.getElement(el);
    return el.getBoundingClientRect();
  },

  // データセットを渡されたkey情報をもとにして、data属性の値を取得
  // 例　data-mouse → INode(el, "mouse") → このdata-mouseの値を取得
  getDS(elementOrSelector, key) {
    const el = this.getElement(elementOrSelector);
    // console.log(el);
    // console.log(el.dataset); //DOMStringMap {page: 'diverse'}

    return el.dataset?.[key];
  },

  // 指定された要素が特定のdata-属性を持っているかどうかを判定
  // hasDS(el, 'webgl'); → data-webgl のwebglを持っているかどうか
  hasDS(el, key) {
    el = this.getElement(el);
    return key in el?.dataset;
  },
};

export { INode };
