import HorizontalRuler from "./horizontal_ruler";
import Grid from "./grid";

interface Vec2 {
  x: number;
  y: number;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function vec2(x: number, y: number): Vec2 {
  return { x, y };
}

interface GridState {
  area: Rect;
}

interface GraphState {
  ctx: CanvasRenderingContext2D;
  bounds: Vec2;

  grid: GridState;
}

class State implements GraphState {
  ctx: CanvasRenderingContext2D;
  bounds: Vec2;

  grid: GridState;

  constructor(gs: GraphState) {
    this.ctx = gs.ctx;
    this.bounds = gs.bounds;
    this.grid = gs.grid;
  }

  public get gridMinimum() {
    return this.grid.area.x;
  }

  public get gridSteps() {
    return Math.floor(this.bounds.x / 50);
  }

  public get gridInterval() {
    let interval =
      Math.floor(Math.floor(this.grid.area.w / this.gridSteps) / 10) * 10;
    if (interval < 10) {
      interval = 10;
    }

    return interval;
  }
}

class Graph {
  state: State;

  horizontalRuler: HorizontalRuler;
  grid: Grid;

  constructor(ctx: CanvasRenderingContext2D, bounds: ClientRect | DOMRect) {
    this.state = new State({
      ctx: ctx,
      bounds: vec2(bounds.width, bounds.height),
      grid: {
        area: {
          x: -10,
          y: 10,
          w: 250,
          h: 20
        }
      }
    });

    this.horizontalRuler = new HorizontalRuler();
    this.grid = new Grid();
  }

  render(dt: number) {
    this.state.ctx.clearRect(0, 0, this.state.bounds.x, this.state.bounds.y);

    this.horizontalRuler.render(this.state);
    this.grid.render(this.state);
  }
}

export { State, GraphState, Graph };
