
// diverse.htmlのJavaScript

let _world = null;
let _particles = null;

export default async function ({
  world,
  mouse,
  menu,
  loader,
  viewport,
  scroller,
}){
  _world = world;

  world.addRaycastingTarget("#particles"); // レイキャスティングの対象に指定

  _particles = world.getObjByEl("#particles");
  // console.log(_particles)
  // _particles.fixed = true;

  // ローディングアニメーションを追加 → meshに対してアニメーションをかけていくので、worldの初期化後とする
  loader.addLoadingAnimation((_tl) => loadAnimation(_tl));

  const fresnel = world.getObjByEl(".fresnel"); // 背景のアニメーション
  // console.log(fresnel);
  if(fresnel) fresnel.mesh.position.z = - 1000;
}


// ローディングアニメーション
function loadAnimation(_tl){ // _tlに繋げていく
  // console.log(_tl)

  // 
  const particles = _world.getObjByEl("#particles");

  // 第１引数 → 操作する要素
  // 第２引数 → 対象の要素に対する設定
  _tl.set({}, // 空オブジェクト。実際に対象となる要素が存在しないことを表す。
    {
      onComplete: () => {
        // uProgressを.5にすることで広がた状態からスタートすることができる
        particles.uniforms.uProgress.value = .51;
        particles.goTo(0, 3)
      }
    }
  )

}
