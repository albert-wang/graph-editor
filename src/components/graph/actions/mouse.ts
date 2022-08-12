import State from "../state";
import { BoxState, pointInSelectedBox } from "../state/box";
import { vec2, mul, sub } from "@graph/shared/math";
import { Curve, ControlPoint } from "@graph/shared/curves";

import { DragEvent } from "../directives/middle-drag";
import sizes from "../rendering/sizes";
import { StateActionKeys, event } from ".";
import { exhaustive } from "../util/exhaustive";
import { SelectedPoint } from "../state/curves";

export default class MouseActions {
  public static wheel(e: WheelEvent, state: State) {
    state.dispatch(event(StateActionKeys.Zoom, { magnitude: e.deltaY }));
  }

  public static move(e: MouseEvent, state: State) {
    if (state.menu.visible) {
      state.menu.setMousePosition(vec2(e.x, e.y));
    }
  }

  public static middleDrag(e: DragEvent, state: State) {
    if (state.isEditing()) {
      state.dispatch(event(StateActionKeys.SubmitEdit, {}, e.mousePosition));
    }

    state.dispatch(event(StateActionKeys.MoveScreen, {}, vec2(e.delta.x, e.delta.y)));
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
      state.dispatch(event(StateActionKeys.SetGuideFrame, {}, e.mousePosition));
      state.dispatch(event(StateActionKeys.SetGuideValue, {}, e.mousePosition));
      return;
    }

    // If this is a click
    if (e.isClick) {
      // If this is currently editing a text field, try to submit it
      if (state.isEditing()) {
        state.dispatch(event(StateActionKeys.SubmitEdit, {}, e.mousePosition));
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
      state.dispatch(event(StateActionKeys.SelectPoint, {}, e.mousePosition));
      return;
    }

    // Drag with selected point - modify the selected point iff one exists.
    if (state.selected.isSinglePoint()) {
      if (e.isStartDrag) {
        state.pushUndoState();
      }

      if (!e.isMouseUp) {
        if (state.selected) {
          let scale = vec2(1, 1);
          if (e.ctrl) {
            scale = mul(scale, vec2(1, 0));
          }

          if (e.shift) {
            scale = mul(scale, vec2(0, 1));
          }

          state.dispatch(
            event(StateActionKeys.ModifyPoint, {
              selection: state.selected,
              moveTo: point,
              moveToScale: scale,
            })
          );
        }
      }
    } else {
      // Check to see if we're on a point anywhere in the box select.
      // If we weren't, then the previous handler for a click would have
      // selected a single point, and this condition would be false.
      if (state.selected.point.length > 1) {
        if (e.isMouseUp) {
          state.dispatch(event(StateActionKeys.NormalizePointFrames));
          return;
        }

        if (e.isStartDrag) {
          state.pushUndoState();
        }

        // Alright, we're trying to drag a point, specifically newSelection.point[0]
        // Compute the delta.
        const a = state.grid.unproject(e.previousCallPosition);
        const delta = sub(point, a);

        state.dispatch(
          event(StateActionKeys.ModifyPoint, {
            selection: state.selected,
            move: delta,
            moveScale: vec2(1, 1),
          })
        );

        return;
      }

      // Try to start a box selection.
      switch (state.boxSelection.state) {
        case BoxState.Inactive: {
          if (e.isStartDrag) {
            state.boxSelection.first = point;
            state.boxSelection.second = point;

            state.boxSelection.state = BoxState.Selecting;
          }
          break;
        }
        case BoxState.Selecting: {
          state.boxSelection.second = point;
          if (e.isMouseUp) {
            state.boxSelection.state = BoxState.Inactive;

            const selection = new SelectedPoint();
            state.curves.curves.forEach((c: Curve) => {
              if (!c.visible || c.locked) {
                return;
              }

              c.controlPoints.forEach((cp: ControlPoint) => {
                if (pointInSelectedBox(cp.position, state.boxSelection)) {
                  selection.curve.push(c);
                  selection.point.push(cp);
                }
              });
            });

            if (selection.hasAnyCurves()) {
              state.selected = selection;
            }
          }
          break;
        }
        default:
          exhaustive(state.boxSelection.state);
      }
    }
  }

  public static rightDrag(e: DragEvent, state: State) {
    if (e.isClick) {
      if (state.menu.visible) {
        return;
      }

      state.dispatch(event(StateActionKeys.SubmitEdit, {}, e.mousePosition));
      state.dispatch(event(StateActionKeys.SelectPoint, {}, e.mousePosition));
      state.dispatch(event(StateActionKeys.OpenMenu, {}, e.mousePosition));
    }
  }
}
