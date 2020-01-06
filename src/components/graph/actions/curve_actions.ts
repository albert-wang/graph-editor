import State from "../state";
import { StateActionKeys } from "./action_keys";
import { StateEvent } from ".";
import { vec2, sub, mul, add } from "@graph/shared/math";
import { SelectedPoint } from "../state/curves";
import { ControlPointType, isBeizer } from "@graph/shared/curves";

export class CurveActions {
  public static events(e: StateEvent, state: State) {
    return {
      [StateActionKeys.InsertKeyframeAllCurves]() {
        state.pushUndoState();

        const point = new SelectedPoint();

        state.curves.curves.forEach(c => {
          point.point = state.curves.addPoint(c, state.grid.guidePoint.x);
          point.curve = c;
        });

        state.selected = point;
      },

      [StateActionKeys.InsertKeyframe]() {
        state.pushUndoState();
        if (!state.selected.curve) {
          return;
        }

        const insertedPoint = state.curves.addPoint(
          state.selected.curve,
          state.grid.guidePoint.x
        );

        const point = new SelectedPoint();
        point.curve = state.selected.curve;
        point.point = insertedPoint;

        state.selected = point;
      },

      [StateActionKeys.ChangeInterpolationType]() {
        state.pushUndoState();

        const selectedPoint = state.selected;
        selectedPoint!.point!.type = e.data.type as ControlPointType;
      },

      [StateActionKeys.UseFixedControlPoints]() {
        const first: number[] = e.data.first;
        const second: number[] = e.data.second;

        // Get the next point after this one, since we have to modify its backwards handle too.
        const selected = state.selected;
        if (!selected || !selected.point || !selected.curve) {
          return;
        }

        const info = selected.curve.curveInformationAt(
          selected.point.position.x
        );
        if (!info.points[1]) {
          return;
        }

        const current = selected.point;
        const next = info.points[1];

        if (!isBeizer(current.type)) {
          return;
        }

        state.pushUndoState();
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
        if (state.selected.curve) {
          state.selected.curve.visible = !state.selected.curve.visible;
        }
      },

      [StateActionKeys.ToggleLocked]() {
        state.pushUndoState();
        if (state.selected.curve) {
          state.selected.curve.locked = !state.selected.curve.locked;
        }
      },

      [StateActionKeys.SelectPoint]() {
        const point = state.grid.unproject(e.mousePosition);
        const newSelection = state.curves.trySelectPoint(point);

        state.selected.selectPoint(newSelection);
      }
    };
  }
}
