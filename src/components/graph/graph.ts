import State from "./state";

import { HorizontalRuler, VerticalRuler } from "./rendering/rulers";
import GridRenderer from "./rendering/grid";
import CurveRenderer from "./rendering/curve";

import { vec2, Vec2 } from "../../shared/math";
import MouseActions from "./actions/mouse";

import { DragEvent } from "./directives/middle-drag";
import MenuRenderer from "./rendering/menu";
import KeyboardActions from "./actions/keyboard";
import CurvePropertiesRenderer from "./rendering/curve_properties";

class Graph {
  private state: State;
  private lastKnownMousePosition: Vec2;

  constructor(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    bounds: ClientRect | DOMRect
  ) {
    this.state = new State({
      ctx: ctx,
      canvas: canvas,
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

    this.lastKnownMousePosition = vec2(0, 0);
  }

  // Input handling.
  public keyDown(e: KeyboardEvent) {
    KeyboardActions.keyDown(e, this.lastKnownMousePosition, this.state);
  }

  public mouseMove(e: MouseEvent) {
    this.lastKnownMousePosition = vec2(e.x, e.y);
    MouseActions.move(e, this.state);
  }

  public mouseWheel(e: WheelEvent) {
    MouseActions.wheel(e, this.state);
  }

  public mouseMiddleDrag(e: DragEvent) {
    MouseActions.middleDrag(e, this.state);
  }

  public mouseLeftDrag(e: DragEvent) {
    MouseActions.leftDrag(e, this.state);
  }

  public mouseRightDrag(e: DragEvent) {
    MouseActions.rightDrag(e, this.state);
  }

  public render(dt: number) {
    this.state.ctx.clearRect(0, 0, this.state.bounds.x, this.state.bounds.y);
    GridRenderer.render(this.state);
    VerticalRuler.render(this.state);
    HorizontalRuler.render(this.state);
    CurveRenderer.render(this.state);
    CurvePropertiesRenderer.render(this.state);
    MenuRenderer.render(this.state);
  }
}

export { Graph };
