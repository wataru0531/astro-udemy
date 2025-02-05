/**
 * Three.js
 * https://threejs.org/
 */
import * as THREE from "three";
import vertexShader from "./vertex.glsl";
import fragmentShader from "./fragment.glsl";
import GUI from "lil-gui";
import { gsap } from "gsap";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

init();
async function init() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    10,
    3000
  );

  camera.position.z = 1000;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  // renderer.setClearColor(0xffffff);
  document.body.appendChild(renderer.domElement);

  const control = new OrbitControls(camera, renderer.domElement);

  async function loadTex(url) {
    const texLoader = new THREE.TextureLoader();
    const texture = await texLoader.loadAsync(url);
    return texture;
  }

  function setupGeometry() {
    const width = 600,
      height = 300,
      wSeg = width / 2,
      hSeg = height / 2;

    const plane = new THREE.PlaneGeometry(width, height, wSeg, hSeg);

    // 対角線上に詰められた遅延時間用の頂点データ
    const intensityVertices = getDiagonalVertices(hSeg, wSeg, () => random(0, 1500), 0);
    //  printMat(delayVertices, wSeg + 1, '遅延時間行列');

    function random(a, b) {
      return a + (b - a) * Math.random();
    }

    // 対角線上に頂点を詰めた配列を返す
    function getDiagonalVertices(hSeg, wSeg, getValue, defaultValue) {
      const hSeg1 = hSeg + 1,
        wSeg1 = wSeg + 1;
      let arry = [],
        currentValue = defaultValue;
      for (let i = 0; i < hSeg1 + wSeg1 - 1; i++) {
        for (
          let j = Math.min(hSeg1, i + 1) - 1;
          j >= Math.max(0, i - wSeg1 + 1);
          j--
        ) {
          let currentIndex = j * wSeg1 + i - j;
          currentValue = getValue(currentValue, currentIndex);
          arry[currentIndex] = currentValue;
        }
      }
      return arry;
    }

    plane.setAttribute(
      "aIntensity",
      new THREE.Float32BufferAttribute(intensityVertices, 1)
    );

    return plane;
  }

  const geometry = setupGeometry();
  window.geometry = geometry;
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTexCurrent: { value: await loadTex("/img/output1.jpg") },
      uTexNext: { value: await loadTex("/img/output2.jpg") },
      uTick: { value: 0 },
      uProgress: { value: 0 },
    },
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide,
    transparent: true,
    //  wireframe: true,
  });
  
  // const material1 = new THREE.PointsMaterial({ color: 0xff0000 });
  const sphere = new THREE.Points(geometry, material);
  scene.add(sphere);

  // 軸ヘルパー
  // const axis = new THREE.AxesHelper(300);
  // scene.add(axis);

  // lil gui
  const gui = new GUI();
  gui
    .add(material.uniforms.uProgress, "value", 0, 1, 0.1)
    .name("progress")
    .listen();
  const datObj = { next: !!material.uniforms.uProgress.value };
  gui
    .add(datObj, "next")
    .name("Animate")
    .onChange(function () {
      gsap.to(material.uniforms.uProgress, {
        value: +datObj.next,
        duration: 3,
        ease: "none",
      });
    });

  function animate() {
    requestAnimationFrame(animate);

    control.update();

    material.uniforms.uTick.value++;

    renderer.render(scene, camera);
  }

  animate();
}

function printMat(targetMatrix, col = 4, label = "") {
  const mat1D = targetMatrix?.elements ?? targetMatrix?.array ?? targetMatrix;
  console.log(mat1D);
  if (!mat1D instanceof Array) return;
  setTimeout(() => {
    // 非同期でマトリクスが更新されるため、非同期で実行
    let mat2D = mat1D.reduce((arry2D, v, i) => {
      if (i % col === 0) {
        arry2D.push([]);
      }
      const lastArry = arry2D[arry2D.length - 1];
      lastArry.push(v);
      return arry2D;
    }, []);
    console.log(
      `%c${label}`,
      "font-size: 1.3em; color: red; background-color: #e4e4e4;"
    );
    console.table(mat2D);
  });
}
