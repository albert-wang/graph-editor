import { StateActions, StateActionKeys, event, StateEvent } from ".";
import State from "../state";
import { Vec2, vec2 } from "@graph/shared/math";

export default class KeyboardActions {
  public static shortcuts: Record<string, StateEvent> = {
    ["ctrl+z"]: event(StateActionKeys.Undo),
    ["ctrl+y"]: event(StateActionKeys.Redo),
    ["ctrl+c"]: event(StateActionKeys.Copy),
    ["ctrl+Spc"]: event(StateActionKeys.SetGuideFrame),
    ["shift+Spc"]: event(StateActionKeys.SetGuideValue),
    ["s"]: event(StateActionKeys.SetGuideFrameToSelectedPointFrame),
    ["Backspace"]: event(StateActionKeys.DeleteControlPoint),

    ["ctrl+i"]: event(StateActionKeys.InsertKeyframeAllCurves),
    ["i"]: event(StateActionKeys.InsertKeyframe),
    ["ESC"]: event(StateActionKeys.SubmitEdit),

    ["/"]: event(StateActionKeys.DebugShowCurves),
    ["Spc"]: event(StateActionKeys.PlayOrPause),
    ["+"]: event(StateActionKeys.Zoom, vec2(0, -120)),
    ["-"]: event(StateActionKeys.Zoom, vec2(0, 120))
  };

  public static keyDown(e: KeyboardEvent, p: Vec2, state: State) {
    let key = e.key;
    if (key == "Escape") {
      key = "ESC";
    }

    if (key == " ") {
      key = "Spc";
    }

    if (e.shiftKey) {
      key = `shift+${key}`;
    }

    if (e.ctrlKey) {
      key = `ctrl+${key}`;
    }

    if (e.altKey) {
      key = `alt+${key}`;
    }

    const action = KeyboardActions.shortcuts[key];
    if (action) {
      action.mousePosition = p;
    }

    console.log(
      `received key='${e.key}' ctrl=${e.ctrlKey} alt=${e.altKey} shift=${
        e.shiftKey
      } derived=${key} action=${action ? action.event || action : "none"}`
    );

    if (action) {
      StateActions.dispatch(action, state);
    }
  }
}
