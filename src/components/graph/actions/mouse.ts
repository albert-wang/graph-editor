import State from "../state";
import { Vec2, vec2 } from "../../../shared/math";

import { DragEvent } from "../directives/middle-drag";
import sizes from "../rendering/sizes";

export default class MouseActions {
  public static wheel(e: WheelEvent, state: State) {
    state.grid.zoom(-e.deltaY);
  }

  public static move(e: MouseEvent, state: State) {
    if (state.menu.visible) {
      state.menu.setMousePosition(vec2(e.x, e.y));
    }
  }

  public static middleDrag(e: DragEvent, state: State) {
    state.grid.pixelMove(vec2(-e.delta.x, e.delta.y));
  }

  public static leftDrag(e: DragEvent, state: State) {
    const grid = state.grid;
    const point = grid.unproject(e.mousePosition);
    if (
      e.startingPosition.y < sizes.HorizontalRulerHeight &&
      e.startingPosition.x < state.bounds.x - sizes.PropertiesWidth
    ) {
      grid.setGuidePoint(point);
    } else {
      if (e.isClick) {
        if (state.menu.visible) {
          const dispatch = state.menu.click(e.mousePosition);
          if (dispatch) {
            state.dispatch(dispatch, state.menu.mousePositionOnOpen);
          }
          e.disableDrag();
        } else {
          const newSelection = state.curves.trySelectPoint(point);
          state.selected.selectPoint(newSelection);
        }
      } else {
        if (e.isStartDrag && state.selected.point) {
          state.pushUndoState();
        }

        if (!e.isMouseUp) {
          if (state.selected && state.selected.point) {
            state.curves.modifyPoint(state.selected, point);
          }
        }
      }
    }
  }

  public static rightDrag(e: DragEvent, state: State) {
    if (e.isClick) {
      const point = state.grid.unproject(e.mousePosition);
      const newSelection = state.curves.trySelectPoint(point);
      state.selected.selectPoint(newSelection);

      state.menu.setPosition(e.mousePosition);
      state.menu.show();
    }
  }
}
