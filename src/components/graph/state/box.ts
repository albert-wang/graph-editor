import { Vec2, vec2, sub, pointInBox, Rect } from "@graph/shared/math";

enum BoxState {
  Inactive,
  Selecting,
}

interface BoxSelection {
  first: Vec2;
  second: Vec2;

  dragPoint: Vec2;

  state: BoxState;
}

function pointInSelectedBox(point: Vec2, sel: BoxSelection) {
  let bottomLeft = vec2(Math.min(sel.first.x, sel.second.x), Math.min(sel.first.y, sel.second.y));

  let topRight = vec2(Math.max(sel.first.x, sel.second.x), Math.max(sel.first.y, sel.second.y));

  const size = sub(topRight, bottomLeft);
  const delta = sub(point, bottomLeft);
  return delta.x >= 0 && delta.y >= 0 && delta.x < size.x && delta.y < size.y;
}

export { BoxState, BoxSelection, pointInSelectedBox };
