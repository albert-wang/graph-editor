import StateActions, { StateActionKeys } from "./state";
import State from "../state";
import { Vec2 } from "../../../shared/math";

export default class KeyboardActions {
  public static shortcuts: Object = {
    ["ctrl+z"]: StateActionKeys.Undo,
    ["ctrl+y"]: StateActionKeys.Redo,
    ["ctrl+Spc"]: StateActionKeys.SetGuideFrame,
    ["shift+Spc"]: StateActionKeys.SetGuideValue,
    ["s"]: StateActionKeys.SetGuideFrameToSelectedPointFrame,

    ["ctrl+i"]: StateActionKeys.InsertKeyframeAllCurves,
    ["i"]: StateActionKeys.InsertKeyframe,
    ["ESC"]: StateActionKeys.SubmitEdit,

    ["/"]: StateActionKeys.DebugShowCurves,
    ["Spc"]: StateActionKeys.PlayOrPause
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

    console.log(
      `received key='${e.key}' ctrl=${e.ctrlKey} alt=${e.altKey} shift=${e.shiftKey} derived=${key} action=${action}`
    );

    if (action) {
      StateActions.dispatch(action, p, state);
    }
  }
}
