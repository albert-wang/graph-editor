import State from "../state";
import { StateActionKeys } from "./action_keys";
import { vec2 } from "@graph/shared/math";
import { SelectedPoint, SelectedPointType } from "../state/curves";
import { ControlPoint } from "@graph/shared/curves";
import { StateEvent } from ".";

import copy from "copy-to-clipboard";

export class EditorActions {
  public static events(e: StateEvent, state: State) {
    return {
      [StateActionKeys.Zoom]() {
        state.grid.zoom(-e.mousePosition.y);
      },

      [StateActionKeys.Copy]() {
        copy(JSON.stringify(state.curves.curves, null, 2));
      },

      [StateActionKeys.Undo]() {
        state.undo();
      },

      [StateActionKeys.Redo]() {
        state.redo();
      },

      [StateActionKeys.SetGuideFrameToSelectedPointFrame]() {
        if (state.selected.point) {
          state.grid.guidePoint.x = state.selected.point.position.x;
        }
      },

      [StateActionKeys.SetGuideFrame]() {
        const p = state.grid.unproject(e.mousePosition);
        state.grid.setGuidePoint(vec2(p.x, state.grid.guidePoint.y));
      },

      [StateActionKeys.SetGuideValue]() {
        const p = state.grid.unproject(e.mousePosition);
        state.grid.setGuidePoint(vec2(state.grid.guidePoint.x, p.y));
      },

      [StateActionKeys.SubmitEdit]() {
        if (state.editingName && state.selected.curve) {
          state.pushUndoState();
          state.selected.curve.name = state.inputField.value();
        }

        if (state.editingValue && state.selected.curve) {
          const info = state.selected.curve.curveInformationAt(
            state.grid.guidePoint.x
          );

          try {
            const value = parseFloat(state.inputField.value());
            let point: ControlPoint | null = null;

            if (info.framesFromFirst === 0 && info.points[0]) {
              point = info.points[0];
            } else if (
              info.framesFromFirst === info.framesBetween &&
              info.points[1]
            ) {
              point = info.points[1];
            }

            if (point) {
              state.pushUndoState();
              const sp = new SelectedPoint();
              sp.curve = state.selected.curve;
              sp.point = point;
              sp.handle = SelectedPointType.Point;

              state.curves.modifyPoint(sp, vec2(0, value), vec2(0, 1));
            }
          } catch (e) {
            // Unparsable, fail to set.
          }
        }

        if (state.editingPointFrame && state.selected.point) {
          try {
            const value = parseFloat(state.inputField.value());

            state.pushUndoState();
            state.curves.modifyPoint(
              state.selected,
              vec2(value, 0),
              vec2(1, 0)
            );
          } catch (e) {
            // Again, unparsable
          }
        }

        if (state.editingPointValue && state.selected.point) {
          try {
            const value = parseFloat(state.inputField.value());

            state.pushUndoState();
            state.curves.modifyPoint(
              state.selected,
              vec2(0, value),
              vec2(0, 1)
            );
          } catch (e) {
            // Again, unparsable
          }
        }

        state.editingName = false;
        state.editingValue = false;
        state.editingPointValue = false;
        state.editingPointFrame = false;
      },

      [StateActionKeys.EditName]() {
        state.editingName = true;
        state.inputField.focus();
      },

      [StateActionKeys.EditValue]() {
        state.editingValue = true;
        state.inputField.focus();
      },
      [StateActionKeys.EditPointFrame]() {
        state.editingPointFrame = true;
        state.inputField.focus();
      },
      [StateActionKeys.EditPointValue]() {
        state.editingPointValue = true;
        state.inputField.focus();
      },

      [StateActionKeys.OpenMenu]() {
        state.menu.setPosition(e.mousePosition);
        state.menu.show();
      },

      [StateActionKeys.MoveScreen]() {
        state.grid.pixelMove(vec2(-e.mousePosition.x, e.mousePosition.y));
      },

      [StateActionKeys.ClearRepeatFrame]() {
        state.grid.repeatFrame = undefined;
      },

      [StateActionKeys.EditRepeatFrame]() {
        state.grid.repeatFrame = state.grid.guidePoint.x;
        console.log(state.grid.repeatFrame);
      }
    };
  }
}
