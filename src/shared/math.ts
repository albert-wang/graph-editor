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

function dot(a: Vec2, b: Vec2) {
  return a.x * b.x + a.y * b.y;
}

function pointInBox(point: Vec2, upperLeft: Vec2, size: Vec2) {
  const delta = sub(point, upperLeft);

  return delta.x < size.x && delta.y < size.y && delta.x >= 0 && delta.y >= 0;
}

// See realtime collision detection
function baycentric(point: Vec2, triangle: Vec2[]): number[] {
  const v0 = sub(triangle[1], triangle[0]);
  const v1 = sub(triangle[2], triangle[0]);
  const v2 = sub(point, triangle[0]);

  const d00 = dot(v0, v0);
  const d01 = dot(v0, v1);
  const d11 = dot(v1, v1);
  const d20 = dot(v2, v0);
  const d21 = dot(v2, v1);

  const denom = d00 * d11 - d01 * d01;

  const v = (d11 * d20 - d01 * d21) / denom;
  const w = (d00 * d21 - d01 * d20) / denom;
  const u = 1.0 - v - w;
  return [u, v, w];
}

function pointInTriangle(point: Vec2, triangle: Vec2[]) {
  const b = baycentric(point, triangle);
  return b[0] >= 0 && b[1] >= 0 && b[2] >= 0;
}

export {
  Vec2,
  vec2,
  Rect,
  negate,
  add,
  sub,
  mul,
  div,
  dot,
  pointInBox,
  pointInTriangle
};
