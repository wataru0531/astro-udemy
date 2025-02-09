
// 垂直に流れるスライダー

// constの場合は初期値を入れる必要がある
const vec2 direction = vec2(0.0, 1.0); // = vec2(0.0, 1.0)

vec4 transition (vec2 uv) {
  vec2 p = uv + progress * sign(direction);
  vec2 f = fract(p);
  return mix(
    getToColor(f),
    getFromColor(f),
    step(0.0, p.y) * step(p.y, 1.0) * step(0.0, p.x) * step(p.x, 1.0)
  );
}
