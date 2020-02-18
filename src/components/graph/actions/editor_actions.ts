import State from "../state";
import { StateActionKeys } from "./action_keys";
import { vec2 } from "@graph/shared/math";
import { SelectedPoint, SelectedPointType } from "../state/curves";
import { Curve, ControlPoint } from "@graph/shared/curves";
import { StateEvent } from ".";

import copy from "copy-to-clipboard";

export class EditorActions {
  public static events(e: StateEvent, state: State) {
    return {
      [StateActionKeys.Zoom]() {
        state.grid.zoom(-e.data.magnitude);
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
        if (state.selected.isSinglePoint()) {
          state.grid.guidePoint.x = state.selected.point[0]!.position.x;
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
          // This only modifies the first selected curve
          if (state.selected.curve.length > 0) {
            state.selected.curve[0].name = state.inputField.value;
          }
        }

        if (state.editingValue && state.selected.curve) {
          let value = 0;
          try {
            value = parseFloat(state.inputField.value);
          } catch (e) {
            return;
          }

          state.pushUndoState();
          let modified = false;
          const seenCurves: Record<number, boolean> = {};

          state.selected.foreach((c: Curve) => {
            if (seenCurves[c.id]) {
              return;
            }

            const info = c.curveInformationAt(state.grid.guidePoint.x);

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
              modified = true;
              const sp = new SelectedPoint();
              sp.curve = [c];
              sp.point = [point];
              sp.handle = SelectedPointType.Point;

              state.curves.modifyPoint(sp, vec2(0, value), vec2(0, 1));
            }

            seenCurves[c.id] = true;
          });

          if (!modified) {
            state.deleteUndoState();
          }
        }

        if (state.editingPointFrame) {
          try {
            const value = parseFloat(state.inputField.value);

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

        if (state.editingPointValue) {
          try {
            const value = parseFloat(state.inputField.value);

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
        state.canvas.focus();
      },

      [StateActionKeys.EditName]() {
        state.editingName = true;

        state.inputField.style.setProperty("visibility", "visible");
        state.inputField.focus();
      },

      [StateActionKeys.EditValue]() {
        state.editingValue = true;

        state.inputField.style.setProperty("visibility", "visible");
        state.inputField.focus();
      },
      [StateActionKeys.EditPointFrame]() {
        state.editingPointFrame = true;

        state.inputField.style.setProperty("visibility", "visible");
        state.inputField.focus();
      },

      [StateActionKeys.EditPointValue]() {
        state.editingPointValue = true;

        state.inputField.style.setProperty("visibility", "visible");
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
        const p = state.grid.unproject(e.mousePosition);

        state.grid.repeatFrame = Math.round(p.x);
      },

      [StateActionKeys.ClearStartRepeatFrame]() {
        state.grid.startRepeatFrame = undefined;
      },

      [StateActionKeys.EditStartRepeatFrame]() {
        const p = state.grid.unproject(e.mousePosition);

        state.grid.startRepeatFrame = Math.round(p.x);
      }
    };
  }
}
