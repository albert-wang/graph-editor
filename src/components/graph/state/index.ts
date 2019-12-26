import { Rect, Vec2, vec2 } from "@/components/graph/util/math";

import GridState from "./grid";
import Curves, {
  Curve,
  ControlPoint,
  ControlPointType,
  SelectedPoint
} from "./curves";

interface InitialState {
  ctx: CanvasRenderingContext2D;
  grid: {
    area: Rect;
  };
  bounds: Vec2;
}

export default class State {
  public ctx: CanvasRenderingContext2D;
  public grid: GridState;
  public bounds: Vec2;

  public curves: Curves;

  // Point selection.
  selectedPoint: SelectedPoint | undefined;

  constructor(gs: InitialState) {
    this.ctx = gs.ctx;
    this.bounds = gs.bounds;
    this.grid = new GridState(this, gs.grid.area);

    this.curves = new Curves(this);
    const curve = new Curve("X");
    curve.controlPoints = [
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
    this.curves.curves.push(curve);
  }
}
