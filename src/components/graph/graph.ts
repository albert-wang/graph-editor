import State from "./state";

import { HorizontalRuler, VerticalRuler } from "./rendering/rulers";
import GridRenderer from "./rendering/grid";
import CurveRenderer from "./rendering/curve";

import { vec2, Vec2 } from "./util/math";

class Graph {
  state: State;

  horizontalRuler: HorizontalRuler;
  verticalRuler: VerticalRuler;
  grid: GridRenderer;
  curves: CurveRenderer;

  constructor(ctx: CanvasRenderingContext2D, bounds: ClientRect | DOMRect) {
    this.state = new State({
      ctx: ctx,
      bounds: vec2(bounds.width, bounds.height),
      grid: {
        area: {
          x: -10,
          y: -10,
          w: 250,
          h: 20
        }
      }
    });

    this.horizontalRuler = new HorizontalRuler();
    this.verticalRuler = new VerticalRuler();
    this.grid = new GridRenderer();
    this.curves = new CurveRenderer();
  }

  public trySelectPoint(point: Vec2) {
    this.state.selectedPoint = this.state.curves.trySelectPoint(point);
  }

  public modifyPoint(pos: Vec2) {
    if (this.state.selectedPoint && this.state.selectedPoint.curve) {
      this.state.curves.modifyPoint(this.state.selectedPoint, pos);
    }
  }

  public render(dt: number) {
    this.state.ctx.clearRect(0, 0, this.state.bounds.x, this.state.bounds.y);
    this.grid.render(this.state);

    this.verticalRuler.render(this.state);
    this.horizontalRuler.render(this.state);

    this.curves.render(this.state);
  }
}

export { Graph };
