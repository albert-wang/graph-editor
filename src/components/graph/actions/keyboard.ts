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
    ["+"]: event(StateActionKeys.Zoom, { magnitude: -120 }),
    ["-"]: event(StateActionKeys.Zoom, { magnitude: 120 }),

    ["ArrowUp"]: event(StateActionKeys.MoveCurrentSelection, {
      scale: vec2(0, -1),
    }),
    ["ArrowDown"]: event(StateActionKeys.MoveCurrentSelection, {
      scale: vec2(0, 1),
    }),
    ["ArrowLeft"]: event(StateActionKeys.MoveCurrentSelection, {
      scale: vec2(-1, 0),
    }),
    ["ArrowRight"]: event(StateActionKeys.MoveCurrentSelection, {
      scale: vec2(1, 0),
    }),

    ["ctrl+ArrowUp"]: event(StateActionKeys.MoveCurrentSelection, {
      scale: vec2(0, -0.1),
    }),
    ["ctrl+ArrowDown"]: event(StateActionKeys.MoveCurrentSelection, {
      scale: vec2(0, 0.1),
    }),
    ["ctrl+ArrowLeft"]: event(StateActionKeys.MoveCurrentSelection, {
      scale: vec2(-0.1, 0),
    }),
    ["ctrl+ArrowRight"]: event(StateActionKeys.MoveCurrentSelection, {
      scale: vec2(0.1, 0),
    }),

    ["shift+ArrowUp"]: event(StateActionKeys.MoveCurrentSelection, {
      scale: vec2(0, -0.5),
    }),
    ["shift+ArrowDown"]: event(StateActionKeys.MoveCurrentSelection, {
      scale: vec2(0, 0.5),
    }),
    ["shift+ArrowLeft"]: event(StateActionKeys.MoveCurrentSelection, {
      scale: vec2(-0.5, 0),
    }),
    ["shift+ArrowRight"]: event(StateActionKeys.MoveCurrentSelection, {
      scale: vec2(0.5, 0),
    }),

    ["ctrl+shift+ArrowUp"]: event(StateActionKeys.MoveCurrentSelection, {
      scale: vec2(0, -0.05),
    }),
    ["ctrl+shift+ArrowDown"]: event(StateActionKeys.MoveCurrentSelection, {
      scale: vec2(0, 0.05),
    }),
    ["ctrl+shift+ArrowLeft"]: event(StateActionKeys.MoveCurrentSelection, {
      scale: vec2(-0.05, 0),
    }),
    ["ctrl+shift+ArrowRight"]: event(StateActionKeys.MoveCurrentSelection, {
      scale: vec2(0.05, 0),
    }),
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
      `received key='${e.key}' ctrl=${e.ctrlKey} alt=${e.altKey} shift=${e.shiftKey} derived=${key} action=${
        action ? action.event || action : "none"
      } mp=${action ? action.mousePosition.x : 0},${action ? action.mousePosition.y : 0}`
    );

    if (action) {
      StateActions.dispatch(action, state);
    }
  }
}
