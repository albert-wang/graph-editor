interface Vec2 {
  x: number;
  y: number;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function vec2(x: number, y: number): Vec2 {
  return { x, y };
}

function negate(v: Vec2) {
  return vec2(-v.x, -v.y);
}

function sub(a: Vec2, b: Vec2) {
  return vec2(a.x - b.x, a.y - b.y);
}

function add(a: Vec2, b: Vec2) {
  return vec2(a.x + b.x, a.y + b.y);
}

function mul(a: Vec2, b: Vec2) {
  return vec2(a.x * b.x, a.y * b.y);
}

function div(a: Vec2, b: Vec2) {
  return vec2(a.x / b.x, a.y / b.y);
}

export { Vec2, vec2, Rect, negate, add, sub, mul, div };
