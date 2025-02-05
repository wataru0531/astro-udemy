

// マウスカーソルのアニメーション
// 拡大、スタック(張り付き) 

import { INode } from "../helper/INode.js";

// 拡大
const highlight = {
  enter: (_mouse, { currentTarget }) => {
    // console.log(el.dataset.mouse)
    // console.log(INode.getDS(el, "mouse"));
    // console.log(currentTarget); 
    
    // 要素のdata属性の値を取得
    const scale = INode.getDS(currentTarget, "mouseScale") || 1;
    _mouse.$.innerCircle.style.visibility = "hidden";

    // console.log(scale)
    // targetオブジェクト を _newTargetオブジェクトで上書き
    _mouse.setTarget({
      scale: scale,
      fillOpacity: 1
    })
  },
  leave: (_mouse, _event) => {  // 元に戻す
    _mouse.$.innerCircle.style.visibility = "visible";

    _mouse.setTarget({
      scale: _mouse.initial.scale,
      fillOpacity: _mouse.initial.fillOpacity
    })
  },

}

// 張り付き
const stuck = {
  enter: (_mouse, { currentTarget }) => {
    // console.log(currentTarget); // <button></button>
    _mouse.stopTrackMousePos(); // 位置情報を更新しない

    const scale = INode.getDS(currentTarget, "mouseScale") || 1;
    // console.log(scale)
    const rect = INode.getRect(currentTarget);
    // console.log(rect); // DOMRect {x: 644.0390625, y: 739.703125, width: 120, height: 123.5, top: 739.703125, …}
    
    _mouse.$.innerCircle.style.visibility = "hidden";

    // console.log(rect.x, rect.width/2)
    _mouse.setTarget({ 
      x: rect.x + rect.width / 2,  // x軸の位置
      y: rect.y + rect.height / 2, // y軸
      // マウスカーソルの半径に対するボタンの半径の割合を算出
      scale: (rect.width / 2 / _mouse.initial.r) * scale,
      fillOpacity: 1,
    });
  },

  leave: (_mouse, _event) => {  // 元に戻す
    _mouse.startTrackMousePos();

    _mouse.$.innerCircle.style.visibility = "visible";

    _mouse.setTarget({
      scale: _mouse.initial.scale,
      fillOpacity: _mouse.initial.fillOpacity
    });
  },
}

// 隠す
const hide = {
  enter(mouse) {
    mouse.$.innerCircle.style.visibility = "hidden";

    mouse.setTarget({
      scale: 0,
    });
  },
  leave(mouse) {
    mouse.$.innerCircle.style.visibility = "visible";

    mouse.setTarget({
      scale: mouse.initial.scale,
    });
  },
};


export const handlers = {
  highlight,
  stuck,
  hide,
}
