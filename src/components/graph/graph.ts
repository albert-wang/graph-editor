import State from "./state";

import { HorizontalRuler, VerticalRuler } from "./rendering/rulers";
import GridRenderer from "./rendering/grid";
import CurveRenderer from "./rendering/curve";

import { vec2, Vec2 } from "./util/math";
import MouseActions from "./actions/mouse";

import { DragEvent } from "./directives/middle-drag";
import MenuRenderer from "./rendering/menu";

class Graph {
  private state: State;

  private horizontalRuler: HorizontalRuler;
  private verticalRuler: VerticalRuler;
  private grid: GridRenderer;
  private curves: CurveRenderer;
  private menu: MenuRenderer;

  private mouse: MouseActions;

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
    this.menu = new MenuRenderer();

    this.mouse = new MouseActions();
  }

  // Input handling.
  public keyDown(e: KeyboardEvent) {}

  public mouseWheel(e: WheelEvent) {
    this.mouse.wheel(e, this.state);
  }

  public mouseMiddleDrag(e: DragEvent) {
    this.mouse.middleDrag(e, this.state);
  }

  public mouseLeftDrag(e: DragEvent) {
    this.mouse.leftDrag(e, this.state);
  }

  public mouseRightDrag(e: DragEvent) {
    this.mouse.rightDrag(e, this.state);
  }

  public render(dt: number) {
    this.state.ctx.clearRect(0, 0, this.state.bounds.x, this.state.bounds.y);
    this.grid.render(this.state);

    this.verticalRuler.render(this.state);
    this.horizontalRuler.render(this.state);

    this.curves.render(this.state);
    this.menu.render(this.state);
  }
}

export { Graph };
