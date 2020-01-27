import State from "../state";
import { StateActionKeys } from "./action_keys";
import { StateEvent } from ".";
import { vec2, sub, mul, add } from "@graph/shared/math";
import { SelectedPoint } from "../state/curves";
import {
  ControlPointType,
  isBeizer,
  Curve,
  ControlPoint
} from "@graph/shared/curves";

export class CurveActions {
  public static events(e: StateEvent, state: State) {
    return {
      [StateActionKeys.MoveCurrentSelection]() {
        state.pushUndoState();
        const amount = sub(
          state.grid.unproject(vec2(10, 10)),
          state.grid.unproject(vec2(0, 0))
        );

        state.curves.modifyPoint(
          state.selected,
          vec2(0, 0),
          vec2(0, 0),
          amount,
          e.data.scale
        );
      },
      [StateActionKeys.ModifyPoint]() {
        const selection = e.data.selection;
        const moveTo = e.data.moveTo || vec2(0, 0);
        const moveToScale = e.data.moveToScale || vec2(0, 0);
        const move = e.data.move || vec2(0, 0);
        const moveScale = e.data.moveScale || vec2(0, 0);

        state.curves.modifyPoint(
          selection,
          moveTo,
          moveToScale,
          move,
          moveScale
        );
      },
      [StateActionKeys.InsertKeyframeAllCurves]() {
        state.pushUndoState();

        const point = new SelectedPoint();
        state.curves.curves.forEach(c => {
          if (c.visible && !c.locked) {
            point.curve.push(c);
            point.point.push(state.curves.addPoint(c, state.grid.guidePoint.x));
          }
        });

        state.selected = point;
      },

      [StateActionKeys.InsertKeyframe]() {
        if (!state.selected.hasAnyCurves()) {
          return;
        }

        state.pushUndoState();

        const newSelection = new SelectedPoint();
        state.selected.foreach((curve: Curve) => {
          const insertedPoint = state.curves.addPoint(
            curve,
            state.grid.guidePoint.x
          );
          newSelection.curve.push(curve);
          newSelection.point.push(insertedPoint);
        });

        state.selected = newSelection;
      },

      [StateActionKeys.DeleteControlPoint]() {
        const selected = state.selected;
        if (!selected.hasAnyCurves()) {
          return;
        }

        state.pushUndoState();
        let modified = false;
        const newSelection = new SelectedPoint();

        selected.foreach((curve: Curve, point: ControlPoint | null) => {
          if (curve.controlPoints.length <= 2 || !point) {
            return;
          }

          modified = true;

          const idx = curve.controlPoints.indexOf(point);
          curve.controlPoints.splice(idx, 1);
          curve.invalidateLUTs();

          let prevIdx = Math.max(idx - 1, 0);
          newSelection.curve.push(curve);
          newSelection.point.push(curve.controlPoints[prevIdx]);
        });

        if (!modified) {
          state.deleteUndoState();
        }

        state.selected = newSelection;
      },

      [StateActionKeys.ChangeInterpolationType]() {
        state.pushUndoState();

        let modified = false;
        state.selected.foreach((curve: Curve, point: ControlPoint | null) => {
          if (point) {
            point.type = e.data.type as ControlPointType;
            curve.invalidateLUTs();
            modified = true;
          }
        });

        if (!modified) {
          state.deleteUndoState();
        }
      },

      [StateActionKeys.UseFixedControlPoints]() {
        const first: number[] = e.data.first;
        const second: number[] = e.data.second;

        // Get the next point after this one, since we have to modify its backwards handle too.
        const selected = state.selected;
        if (!selected) {
          return;
        }

        state.pushUndoState();
        let modified = false;

        selected.foreach((curve: Curve, point: ControlPoint | null) => {
          if (!point) {
            return;
          }

          const info = curve.curveInformationAt(point.position.x);
          if (!info.points[1]) {
            return;
          }

          const current = point;
          const next = info.points[1];

          if (!isBeizer(current.type)) {
            return;
          }

          const distance = sub(next.position, current.position);
          const cp1 = add(
            current.position,
            mul(vec2(first[0], first[1]), distance)
          );
          const cp2 = add(
            current.position,
            mul(vec2(second[0], second[1]), distance)
          );

          current.forwardHandle = cp1;
          next.backwardsHandle = cp2;

          curve.invalidateLUTs();
          modified = true;
        });

        if (!modified) {
          state.deleteUndoState();
        }
      },

      [StateActionKeys.ContinuousHandles]() {},

      [StateActionKeys.SnapFrame]() {
        state.pushUndoState();

        state.curves.modifyPoint(
          state.selected,
          state.grid.guidePoint,
          vec2(1, 0)
        );
      },

      [StateActionKeys.SnapValue]() {
        state.pushUndoState();

        state.curves.modifyPoint(
          state.selected,
          state.grid.guidePoint,
          vec2(0, 1)
        );
      },
      [StateActionKeys.ToggleVisible]() {
        state.pushUndoState();
        let modified = false;

        state.selected.foreach((c: Curve) => {
          c.visible = !c.visible;
          modified = true;
        });

        if (!modified) {
          state.deleteUndoState();
        }
      },

      [StateActionKeys.ToggleLocked]() {
        state.pushUndoState();
        let modified = false;

        state.selected.foreach((c: Curve) => {
          c.locked = !c.locked;
          modified = true;
        });

        if (!modified) {
          state.deleteUndoState();
        }
      },

      [StateActionKeys.SelectPoint]() {
        const point = state.grid.unproject(e.mousePosition);
        const newSelection = state.curves.trySelectPoint(point);

        // If the select point was part of a multiselect, don't change the selection,
        // but do change the handle type.
        if (newSelection.isSinglePoint() && state.selected.curve.length > 1) {
          if (state.selected.hasPoint(newSelection.point[0]!)) {
            state.selected.handle = newSelection.handle;
            return;
          }
        }

        state.selected.selectPoint(newSelection);
      }
    };
  }
}
