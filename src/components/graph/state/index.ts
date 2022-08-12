import { Rect, Vec2, vec2 } from "@graph/shared/math";
import { Curve, ControlPoint, ControlPointType } from "@graph/shared/curves";

import GridState from "./grid";
import Curves, { SelectedPoint } from "./curves";
import Menu from "./menu";
import { BoxState, BoxSelection } from "./box";
import { StateActions, StateActionKeys, StateEvent, event } from "../actions";

interface InitialState {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  inputField: HTMLInputElement;

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
  public boxSelection: BoxSelection;

  // Menu operation
  public menu: Menu;

  // Undo/Redo literally only affects curves.
  public undoStack: Curve[][];
  public redoStack: Curve[][];

  // Only add undo states every 500ms
  public lastUndoPushTime: number;

  // Inputfield for editing names/values
  public inputField: HTMLInputElement;
  public editingName: boolean;
  public editingValue: boolean;
  public editingPointValue: boolean;
  public editingPointFrame: boolean;

  // Playback FPS.
  public previousPlaybackFPS: number;
  public playbackFPS: number;
  private accumulatedTime: number;
  private lastSeenPlaybackTime: number;

  constructor(gs: InitialState) {
    this.selected = new SelectedPoint();
    this.selected.curve = [];
    this.selected.point = [];

    this.boxSelection = {
      first: vec2(0, 0),
      second: vec2(0, 0),
      dragPoint: vec2(0, 0),
      state: BoxState.Inactive,
    };

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

    this.inputField = gs.inputField;

    // A set of debug curves
    this.curves = new Curves(this);
    const x = new Curve("X");
    x.controlPoints = [
      new ControlPoint(ControlPointType.Beizer, vec2(1, 0), vec2(11, 0), vec2(-9, 0)),
      new ControlPoint(ControlPointType.BeizerContinuous, vec2(60, 10), vec2(70, 10), vec2(50, 10)),
      new ControlPoint(ControlPointType.Linear, vec2(80, 7), vec2(90, 10), vec2(70, 10)),
    ];
    this.curves.addCurve(x);

    const y = new Curve("Y");
    y.controlPoints = [
      new ControlPoint(ControlPointType.Beizer, vec2(1, -5), vec2(11, -5), vec2(-9, -5)),
      new ControlPoint(ControlPointType.BeizerContinuous, vec2(60, 5), vec2(70, 5), vec2(50, 5)),
      new ControlPoint(ControlPointType.Linear, vec2(80, 7), vec2(90, 10), vec2(70, 10)),
    ];
    this.curves.addCurve(y);

    this.undoStack = [];
    this.redoStack = [];
    this.lastUndoPushTime = 0;
    this.playbackFPS = 0;
    this.accumulatedTime = 0;
    this.lastSeenPlaybackTime = 0;
    this.previousPlaybackFPS = 60;
  }

  // Menu dispatch functionality
  public dispatch(e: StateEvent) {
    StateActions.dispatch(e, this);
  }

  public submitInput() {
    this.dispatch(event(StateActionKeys.SubmitEdit));
  }

  public isEditing() {
    return this.editingName || this.editingPointFrame || this.editingPointValue || this.editingValue;
  }

  // Playback functionality.
  public update(hrt: number) {
    if (this.playbackFPS === 0) {
      this.lastSeenPlaybackTime = hrt;
      return;
    }

    if (this.lastSeenPlaybackTime === 0) {
      this.lastSeenPlaybackTime = hrt;
      return;
    }

    const dt = (hrt - this.lastSeenPlaybackTime) / 1000;
    this.lastSeenPlaybackTime = hrt;

    this.accumulatedTime += dt;
    while (this.accumulatedTime >= 1 / this.playbackFPS) {
      this.accumulatedTime -= 1 / this.playbackFPS;
      this.grid.setGuidePoint(vec2(this.grid.guidePoint.x + 1, this.grid.guidePoint.y));

      const repeatFrame =
        typeof this.grid.repeatFrame === "undefined" ? this.curves.maximumFrame() : this.grid.repeatFrame;

      if (this.grid.guidePoint.x > repeatFrame) {
        this.grid.guidePoint.x = this.curves.minimumFrame();
      }
    }
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

  public deleteUndoState() {
    this.undoStack.pop();
  }

  public undo() {
    const stateCopy = JSON.parse(JSON.stringify(this.curves.curves));
    const curvesState = this.undoStack.pop();
    if (curvesState) {
      this.curves.curves = curvesState.map((c) => {
        const transformed = Curve.fromJSON(c);

        this.selected.foreach((curve: Curve, _, i: number) => {
          if (curve.id === c.id) {
            this.selected.curve[i] = c;
          }
        });

        return transformed;
      });

      this.selected.point = [];
      this.redoStack.push(stateCopy);
    }
  }

  public redo() {
    const stateCopy = JSON.parse(JSON.stringify(this.curves.curves));
    const curvesState = this.redoStack.pop();
    if (curvesState) {
      this.curves.curves = curvesState.map((c) => {
        const transformed = Curve.fromJSON(c);
        this.selected.foreach((curve: Curve, _, i: number) => {
          if (curve.id === c.id) {
            this.selected.curve[i] = c;
          }
        });
        return transformed;
      });

      this.selected.point = [];
      this.undoStack.push(stateCopy);
    }
  }
}
