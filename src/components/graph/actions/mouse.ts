import State from "../state";
import { Vec2, vec2 } from "../util/math";

import { DragEvent } from "../directives/middle-drag";

export default class MouseActions {
  public wheel(e: WheelEvent, state: State) {
    state.grid.zoom(-e.deltaY);
  }

  public middleDrag(e: DragEvent, state: State) {
    state.grid.pixelMove(vec2(-e.delta.x, e.delta.y));
  }

  public leftDrag(e: DragEvent, state: State) {
    const grid = state.grid;
    const point = grid.unproject(e.mousePosition);
    if (e.startingPosition.y < 30) {
      grid.setGuidePoint(point);
    } else {
      if (e.isClick) {
        state.selectedPoint = state.curves.trySelectPoint(point);
      } else {
        if (state.selectedPoint && state.selectedPoint.curve) {
          state.curves.modifyPoint(state.selectedPoint, point);
        }
      }
    }
  }

  public rightDrag(e: DragEvent, state: State) {
    if (e.isClick) {
      state.menu.position = state.grid.unproject(e.mousePosition);
    }
  }
}
