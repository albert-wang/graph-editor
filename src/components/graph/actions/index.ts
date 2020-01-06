import State from "../state";
import { Vec2, vec2 } from "@graph/shared/math";

import { ControlPointType } from "@graph/shared/curves";
import { StateActionKeys } from "./action_keys";

import { EditorActions } from "./editor_actions";
import { CurveActions } from "./curve_actions";

interface StateEvent {
  event: string;
  mousePosition: Vec2;
  data: any;
}

function event(
  e: string,
  p: Vec2 = vec2(0, 0),
  data: any | undefined = undefined
): StateEvent {
  return {
    event: e,
    mousePosition: p,
    data: data || {}
  };
}

class StateActions {
  public static dispatch(event: StateEvent, state: State) {
    const events = {
      ...EditorActions.events(event, state),
      ...CurveActions.events(event, state),

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

      [StateActionKeys.PlayAtFPS]() {
        state.previousPlaybackFPS = event.data.fps;
        state.playbackFPS = event.data.fps;
      },

      [StateActionKeys.PlayOrPause]() {
        if (state.playbackFPS !== 0) {
          state.playbackFPS = 0;
        } else {
          state.playbackFPS = state.previousPlaybackFPS;
        }
      }
    };

    // @ts-ignore
    const selected = events[event.event];
    if (selected) {
      console.log(`dispatch action=${event.event}`);
      selected();
    } else {
      console.log(`not handled action=${event.event}`);
    }
  }
}

export { StateActions, StateActionKeys, StateEvent, event };
