import State from "../state";
import { Vec2, vec2, mul } from "../../../shared/math";

import { DragEvent } from "../directives/middle-drag";
import sizes from "../rendering/sizes";
import { StateActionKeys, event } from ".";

export default class MouseActions {
  public static wheel(e: WheelEvent, state: State) {
    state.dispatch(event(StateActionKeys.Zoom, vec2(e.deltaX, e.deltaY)));
  }

  public static move(e: MouseEvent, state: State) {
    if (state.menu.visible) {
      state.menu.setMousePosition(vec2(e.x, e.y));
    }
  }

  public static middleDrag(e: DragEvent, state: State) {
    if (state.isEditing()) {
      state.dispatch(event(StateActionKeys.SubmitEdit, e.mousePosition));
    }

    state.dispatch(
      event(StateActionKeys.MoveScreen, vec2(e.delta.x, e.delta.y))
    );
  }

  public static leftDrag(e: DragEvent, state: State) {
    const grid = state.grid;
    const point = grid.unproject(e.mousePosition);

    // If this is a drag that started from the top of the screen,
    // then manipulate the guide bars.
    if (
      e.startingPosition.y < sizes.HorizontalRulerHeight &&
      e.startingPosition.x < state.bounds.x - sizes.PropertiesWidth
    ) {
      state.dispatch(event(StateActionKeys.SetGuideFrame, e.mousePosition));
      state.dispatch(event(StateActionKeys.SetGuideValue, e.mousePosition));
      return;
    }

    // If this is a click
    if (e.isClick) {
      // If this is currently editing a text field, try to submit it
      if (state.isEditing()) {
        state.dispatch(event(StateActionKeys.SubmitEdit, e.mousePosition));
      }

      // If the menu is visible, try to click in the menu
      if (state.menu.visible) {
        e.disableDrag();

        const dispatch = state.menu.click(e.mousePosition);
        if (dispatch) {
          dispatch.mousePosition = state.menu.mousePositionOnOpen;
          state.dispatch(dispatch);
        }
        return;
      }

      // If this click is in the properties area, try to click in the properties area.
      if (e.mousePosition.x > state.bounds.x - sizes.PropertiesWidth) {
        e.disableDrag();

        // This is a properties click, process it.
        const dispatch = state.curves.propertiesClick(e.mousePosition);
        if (dispatch) {
          dispatch.mousePosition = e.mousePosition;
          state.dispatch(dispatch);
        }
        return;
      }

      // Otherwise, try to click a point.
      state.dispatch(event(StateActionKeys.SelectPoint, e.mousePosition));
      return;
    }

    // Otherwise, this is a straight up drag - modify the selected point iff one exists.
    if (e.isStartDrag && state.selected.point) {
      state.pushUndoState();
    }

    if (!e.isMouseUp) {
      if (state.selected && state.selected.point) {
        let scale = vec2(1, 1);
        if (e.ctrl) {
          scale = mul(scale, vec2(1, 0));
        }

        if (e.shift) {
          scale = mul(scale, vec2(0, 1));
        }

        state.curves.modifyPoint(state.selected, point, scale);
      }
    }
  }

  public static rightDrag(e: DragEvent, state: State) {
    if (e.isClick) {
      if (state.menu.visible) {
        return;
      }

      state.dispatch(event(StateActionKeys.SubmitEdit, e.mousePosition));
      state.dispatch(event(StateActionKeys.SelectPoint, e.mousePosition));
      state.dispatch(event(StateActionKeys.OpenMenu, e.mousePosition));
    }
  }
}
