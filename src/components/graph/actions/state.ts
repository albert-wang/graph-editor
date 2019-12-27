import State from "../state";
import { SelectedPoint } from "../state/curves";
import { ControlPointType } from "@/shared/curves";
import { assert } from "../util/assert";
import { Vec2 } from "@/shared/math";

export enum StateActionKeys {
  Undo = "undo",
  Redo = "redo",

  Copy = "copy-point",

  DebugShowCurves = "debug-show-curves",

  // Curve manipulation
  InsertKeyframe = "insert-keyframe",
  InsertKeyframeAllCurves = "insert-keyframe-all-curves",
  SetGuideFrame = "set-guide-frame",
  SetGuideValue = "set-guide-value",

  HandleToLinear = "handle-to-linear",
  HandleToBeizer = "handle-to-beizer",

  SnapFrame = "snap-to-frame",
  SnapValue = "snap-to-value"
}

export default class StateActions {
  public static dispatch(event: string, mousePosition: Vec2, state: State) {
    const events = {
      [StateActionKeys.DebugShowCurves]() {
        state.curves.curves.forEach(curve => {
          console.table({
            name: curve.name
          });

          console.table(
            curve.controlPoints.map(c => {
              return {
                type: ControlPointType[c.type],
                "back.x": c.backwardsHandle.x,
                "back.y": c.backwardsHandle.y,
                "pos.x": c.position.x,
                "pos.y": c.position.y,
                "for.x": c.forwardHandle.x,
                "for.y": c.forwardHandle.y
              };
            })
          );
        });
      },

      [StateActionKeys.Undo]() {
        state.undo();
      },

      [StateActionKeys.Redo]() {
        state.redo();
      },

      [StateActionKeys.SetGuideFrame]() {
        const p = state.grid.unproject(mousePosition);
        state.grid.guidePoint.x = Math.round(p.x);
      },

      [StateActionKeys.SetGuideValue]() {
        const p = state.grid.unproject(mousePosition);
        state.grid.guidePoint.y = Math.round(p.y * 100) / 100;
      },

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

        selectedPoint!.point!.position.x = state.grid.guidePoint.x;
      },

      [StateActionKeys.SnapValue]() {
        state.pushUndoState();
        const selectedPoint = state.selected;
        assert(selectedPoint);
        assert(selectedPoint!.point);

        const point = selectedPoint!.point!;
        const deltaY = state.grid.guidePoint.y - point.position.y;

        point.position.y += deltaY;
        point.forwardHandle.y += deltaY;
        point.backwardsHandle.y += deltaY;
      }
    };

    // @ts-ignore
    const selected = events[event];
    if (selected) {
      console.log(`dispatch action=${event}`);
      selected();
    } else {
      console.log(`not handled action=${event}`);
    }
  }
}
