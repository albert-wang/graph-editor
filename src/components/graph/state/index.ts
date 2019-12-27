import { Rect, Vec2, vec2 } from "@/shared/math";
import { Curve, ControlPoint, ControlPointType } from "@/shared/curves";

import GridState from "./grid";
import Curves, { SelectedPoint } from "./curves";
import Menu from "./menu";
import StateActions, { StateActionKeys } from "../actions/state";

// @ts-ignore
import CanvasInput from "../3rdparty/canvasinput";
import colors from "../rendering/colors";

interface InitialState {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  grid: {
    area: Rect;
  };
  bounds: Vec2;
}

export default class State {
  public ctx: CanvasRenderingContext2D;
  public canvas: HTMLCanvasElement;
  public grid: GridState;
  public bounds: Vec2;

  public curves: Curves;

  // Point selection.
  public selected: SelectedPoint;

  // Menu operation
  public menu: Menu;

  // Undo/Redo literally only affects curves.
  public undoStack: Curve[][];
  public redoStack: Curve[][];

  // Only add undo states every 500ms
  public lastUndoPushTime: number;

  // Inputfield for editing names/values
  public inputField: CanvasInput;
  public editingName: boolean;
  public editingValue: boolean;
  public editingPointValue: boolean;
  public editingPointFrame: boolean;

  constructor(gs: InitialState) {
    this.selected = new SelectedPoint();
    this.selected.curve = null;
    this.selected.point = null;

    this.ctx = gs.ctx;
    this.canvas = gs.canvas;
    this.bounds = gs.bounds;
    this.grid = new GridState(this, gs.grid.area);
    this.menu = new Menu(this);
    this.menu.position = vec2(0, 0);

    this.editingName = false;
    this.editingValue = false;
    this.editingPointValue = false;
    this.editingPointFrame = false;
    this.inputField = new CanvasInput({
      canvas: gs.canvas,
      x: 50,
      y: 50,
      fontSize: 12,
      width: 120,
      backgroundColor: colors.PropertiesBackground,
      fontColor: colors.BrightText,
      borderWidth: 1,
      borderColor: colors.BrightText,
      boxShadow: "0px 0px 0px #000",
      innerShadow: "0px 0px 0px #000",
      onsubmit: () => {
        this.dispatch(StateActionKeys.SubmitEdit, vec2(0, 0));
      }
    });

    this.curves = new Curves(this);
    const x = new Curve("X");
    x.controlPoints = [
      new ControlPoint(
        ControlPointType.Beizer,
        vec2(1, 0),
        vec2(11, 0),
        vec2(-9, 0)
      ),
      new ControlPoint(
        ControlPointType.Beizer,
        vec2(60, 10),
        vec2(70, 10),
        vec2(50, 10)
      ),
      new ControlPoint(
        ControlPointType.Linear,
        vec2(80, 7),
        vec2(90, 10),
        vec2(70, 10)
      )
    ];
    this.curves.addCurve(x);

    const y = new Curve("y");
    y.controlPoints = [
      new ControlPoint(
        ControlPointType.Beizer,
        vec2(1, 0),
        vec2(11, 0),
        vec2(-9, 0)
      ),
      new ControlPoint(
        ControlPointType.Beizer,
        vec2(60, 10),
        vec2(70, 10),
        vec2(50, 10)
      ),
      new ControlPoint(
        ControlPointType.Linear,
        vec2(80, 7),
        vec2(90, 10),
        vec2(70, 10)
      )
    ];
    this.curves.addCurve(y);

    const z = new Curve("Z");
    z.controlPoints = [
      new ControlPoint(
        ControlPointType.Beizer,
        vec2(1, 0),
        vec2(11, 0),
        vec2(-9, 0)
      ),
      new ControlPoint(
        ControlPointType.Beizer,
        vec2(60, 10),
        vec2(70, 10),
        vec2(50, 10)
      ),
      new ControlPoint(
        ControlPointType.Linear,
        vec2(80, 7),
        vec2(90, 10),
        vec2(70, 10)
      )
    ];
    this.curves.addCurve(z);

    this.undoStack = [];
    this.redoStack = [];
    this.lastUndoPushTime = 0;
  }

  // Menu dispatch functionality
  public dispatch(e: string, mp: Vec2) {
    StateActions.dispatch(e, mp, this);
  }

  // Undo/redo stack manipulation
  public pushUndoState() {
    const now = new Date().valueOf();
    if (now - this.lastUndoPushTime < 250) {
      return;
    }

    this.lastUndoPushTime = now;
    this.undoStack.push(JSON.parse(JSON.stringify(this.curves.curves)));
    while (this.undoStack.length > 64) {
      this.undoStack.shift();
    }

    this.redoStack = [];
  }

  public undo() {
    const stateCopy = JSON.parse(JSON.stringify(this.curves.curves));
    const curvesState = this.undoStack.pop();
    if (curvesState) {
      this.curves.curves = curvesState.map(c => {
        const transformed = new Curve(c.name);
        Object.assign(transformed, c);
        if (this.selected.curve && c.id == this.selected.curve.id) {
          this.selected.curve = transformed;
        }
        return transformed;
      });

      this.selected.point = null;
      this.redoStack.push(stateCopy);
    }
  }

  public redo() {
    const stateCopy = JSON.parse(JSON.stringify(this.curves.curves));
    const curvesState = this.redoStack.pop();
    if (curvesState) {
      this.curves.curves = curvesState.map(c => {
        const transformed = new Curve(c.name);
        Object.assign(transformed, c);
        if (this.selected.curve && c.id == this.selected.curve.id) {
          this.selected.curve = transformed;
        }
        return transformed;
      });

      this.selected.point = null;
      this.undoStack.push(stateCopy);
    }
  }
}
