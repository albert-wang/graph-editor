import State from "../state";
import { SelectedPoint, SelectedPointType } from "../state/curves";
import { ControlPointType, ControlPoint, Curve } from "@/shared/curves";
import { assert } from "../util/assert";
import { Vec2, vec2 } from "@/shared/math";

import copy from "copy-to-clipboard";

export enum StateActionKeys {
  Undo = "undo",
  Redo = "redo",

  Copy = "copy-point",

  DebugShowCurves = "debug-show-curves",

  // Curve manipulation
  InsertKeyframe = "insert-keyframe",
  InsertKeyframeAllCurves = "insert-keyframe-all-curves",
  SetGuideFrame = "set-guide-frame",
  SetGuideFrameToSelectedPointFrame = "set-guide-frame-to-selected-point-frame",
  SetGuideValue = "set-guide-value",

  HandleToLinear = "handle-to-linear",
  HandleToBeizer = "handle-to-beizer",

  SnapFrame = "snap-to-frame",
  SnapValue = "snap-to-value",

  // Properties clicks
  ToggleVisible = "toggle-visible",
  ToggleLocked = "toggle-locked",
  EditName = "edit-name",
  EditValue = "edit-value",
  EditPointValue = "edit-point-value",
  EditPointFrame = "edit-point-frame",
  SubmitEdit = "submit-edit",

  // Playback
  Play6FPS = "play-6fps",
  Play12FPS = "play-12fps",
  Play24FPS = "play-24fps",
  Play30FPS = "play-30fps",
  Play60FPS = "play-60fps",
  Play90FPS = "play-90fps",
  Play120FPS = "play-120fps",
  Play144FPS = "play-144fps",
  Play240FPS = "play-240fps",

  PlayOrPause = "play-or-pause"
}

export default class StateActions {
  public static dispatch(event: string, mousePosition: Vec2, state: State) {
    const playback = function(fps: number) {
      return () => {
        state.previousPlaybackFPS = fps;
        state.playbackFPS = fps;
      };
    };

    const events = {
      [StateActionKeys.Copy]() {
        copy(JSON.stringify(state.curves.curves, null, 2));
      },
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

      [StateActionKeys.SetGuideFrameToSelectedPointFrame]() {
        if (state.selected.point) {
          state.grid.guidePoint.x = state.selected.point.position.x;
        }
      },

      [StateActionKeys.SetGuideFrame]() {
        const p = state.grid.unproject(mousePosition);
        state.grid.setGuidePoint(vec2(p.x, state.grid.guidePoint.y));
      },

      [StateActionKeys.SetGuideValue]() {
        const p = state.grid.unproject(mousePosition);
        state.grid.setGuidePoint(vec2(state.grid.guidePoint.x, p.y));
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

        // TODO: This doesn't sort the points
        selectedPoint!.point!.position.x = state.grid.guidePoint.x;
      },

      [StateActionKeys.SnapValue]() {
        state.pushUndoState();
        const selectedPoint = state.selected;
        assert(selectedPoint);
        assert(selectedPoint!.point);

        const point = selectedPoint!.point!;
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
      [StateActionKeys.Play6FPS]: playback(6),
      [StateActionKeys.Play12FPS]: playback(12),
      [StateActionKeys.Play24FPS]: playback(24),
      [StateActionKeys.Play30FPS]: playback(30),
      [StateActionKeys.Play60FPS]: playback(60),
      [StateActionKeys.Play90FPS]: playback(90),
      [StateActionKeys.Play120FPS]: playback(120),
      [StateActionKeys.Play144FPS]: playback(144),
      [StateActionKeys.Play240FPS]: playback(240),
      [StateActionKeys.PlayOrPause]() {
        if (state.playbackFPS !== 0) {
          state.playbackFPS = 0;
        } else {
          state.playbackFPS = state.previousPlaybackFPS;
        }
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