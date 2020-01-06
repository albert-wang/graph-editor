import { StateActions, StateActionKeys, event } from ".";
import State from "../state";
import { Vec2, vec2 } from "../../../shared/math";

export default class KeyboardActions {
  public static shortcuts: Object = {
    ["ctrl+z"]: event(StateActionKeys.Undo),
    ["ctrl+y"]: event(StateActionKeys.Redo),
    ["ctrl+c"]: event(StateActionKeys.Copy),
    ["ctrl+Spc"]: event(StateActionKeys.SetGuideFrame),
    ["shift+Spc"]: event(StateActionKeys.SetGuideValue),
    ["s"]: event(StateActionKeys.SetGuideFrameToSelectedPointFrame),

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

    // @ts-ignore
    const action = KeyboardActions.shortcuts[key];
    action.mousePosition = p;

    console.log(
      `received key='${e.key}' ctrl=${e.ctrlKey} alt=${e.altKey} shift=${
        e.shiftKey
      } derived=${key} action=${action ? action.key || action : "none"}`
    );

    if (action) {
      StateActions.dispatch(action, state);
    }
  }
}
