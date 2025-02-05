/**************************************************************

GUIをそれぞれのメッシュ毎に設定できるようにする

***************************************************************/

const gui = {
  init,
  add,
  
}


let lilGUI = null;

// bootstrapで初期化
async function init(){
  const { default: GUI } = await import("lil-gui");

  lilGUI = new GUI();
}


// 各フォルダ内のindex.jsで初期化
function add(callback){

  // ligGUIが開発環境で初期化されていた場合、lilGUIが渡ってくる
  if(lilGUI){
    callback(lilGUI);
  }
}


export { gui };