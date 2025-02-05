
// precision mediump float;

#pragma glslify: snoise = require(glsl-noise/simplex/3d);

attribute vec3 sphere;
attribute vec3 sphereNormal;

varying vec2 vUv;
varying float vProgress;
varying vec3 vSphereNormal;

uniform float uProgress;
uniform float uDelay;       // 0 〜 1
uniform float uSphereScale;
uniform float uTick;
uniform float uFreq; // 周波数 0〜0.1
uniform float uNoiseLevel;
uniform float uNoiseFreq;


void main() {
	vUv = uv;
	float time = uTick * uFreq;

	// 中央からの距離を取り、0 〜 1.5の値の範囲に。
	// → 各頂点で遅延を持たせる
	float delay = distance(uv, vec2(.5, .5)) * uDelay;

	// uProgressは0〜1で、delayを引くことでprogressが0にならない状態が生まれる
	// → 球体から平面に完全に移行しない頂点が生まれる
	// → 1. + uDelay で、1を下回らない値を作る
	float progress = uProgress * ( 1. + uDelay ) - delay;

	progress = clamp(progress, 0., 1.); // 0 〜　1の範囲内に収める
	vProgress = progress;

	vec3 s = sphere * uSphereScale; // sphereの頂点

	// ノイズを掛け合わせていく
  float noise = snoise(vec3(sphereNormal.x * uNoiseFreq, sphereNormal.y * uNoiseFreq, (sphereNormal.z - time) * uNoiseFreq));

	// 
	vSphereNormal = sphereNormal * (1. + noise * uNoiseLevel);
	
	s += s * noise * uNoiseLevel;

	vec3 p = position;

	vec3 pos = mix(s, p, progress);

	gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
}
