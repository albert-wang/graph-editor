import State from "../state";
import { StateActionKeys } from "./action_keys";
import { StateEvent } from ".";
import { vec2 } from "@graph/shared/math";
import { assert } from "../util/assert";
import { SelectedPoint } from "../state/curves";
import { ControlPointType } from "@graph/shared/curves";

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

      [StateActionKeys.HandleToLinear]() {
        state.pushUndoState();

        const selectedPoint = state.selected;
        assert(selectedPoint);
        assert(selectedPoint!.point);

        selectedPoint!.point!.type = ControlPointType.Linear;
      },

      [StateActionKeys.HandleToBeizer]() {
        state.pushUndoState();

        const selectedPoint = state.selected;
        assert(selectedPoint);
        assert(selectedPoint!.point);

        selectedPoint!.point!.type = ControlPointType.Beizer;
      },

      [StateActionKeys.SnapFrame]() {
        state.pushUndoState();

        const selectedPoint = state.selected;
        assert(selectedPoint);
        assert(selectedPoint!.point);

        // TODO: This doesn't sort the points
        selectedPoint!.point!.position.x = state.grid.guidePoint.x;
      },

      [StateActionKeys.SnapValue]() {
        state.pushUndoState();
        const selectedPoint = state.selected;
        assert(selectedPoint);
        assert(selectedPoint!.point);

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
