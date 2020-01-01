import State from "../state";
import { ControlPointType, ControlPoint, Curve } from "@graph/shared/curves";
import { Vec2, vec2 } from "@graph/shared/math";
import { StateActionKeys } from "./action_keys";

import EditorActions from "./editor_actions";
import CurveActions from "./curve_actions";

export { StateActionKeys };
export default class StateActions {
  public static dispatch(event: string, mousePosition: Vec2, state: State) {
    const playback = function(fps: number) {
      return () => {
        state.previousPlaybackFPS = fps;
        state.playbackFPS = fps;
      };
    };

    const events = {
      ...EditorActions.events(mousePosition, state),
      ...CurveActions.events(mousePosition, state),

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
