import State from "../state";
import Colors from "./colors";
import { vec2 } from "@graph/shared/math";

export default class GridRenderer {
  public static render(state: State) {
    const ctx = state.ctx;

    ctx.fillStyle = Colors.GridBackground;
    ctx.fillRect(0, 0, state.bounds.x, state.bounds.y);

    const minframe = state.curves.minimumFrame();
    const maxframe = state.curves.maximumFrame();

    const minframePosition = state.grid.project(vec2(minframe, 0));
    const maxframePosition = state.grid.project(vec2(maxframe, 0));
    ctx.fillStyle = Colors.ActiveGridBackground;
    ctx.fillRect(minframePosition.x, 0, maxframePosition.x - minframePosition.x, state.bounds.y);

    const xstep = state.grid.horizontalPixelStep;
    const xstart = state.grid.horizontalPixelStart;
    for (let x = xstart; x < state.bounds.x; x += xstep) {
      ctx.strokeStyle = Colors.BoldLine;
      ctx.beginPath();
      ctx.moveTo(Math.round(x) + 0.5, 0);
      ctx.lineTo(Math.round(x) + 0.5, state.bounds.y);
      ctx.stroke();

      ctx.strokeStyle = Colors.LightLine;
      ctx.beginPath();
      ctx.moveTo(Math.round(x + xstep / 2) + 0.5, 0);
      ctx.lineTo(Math.round(x + xstep / 2) + 0.5, state.bounds.y);
      ctx.stroke();
    }

    const ystep = state.grid.verticalPixelStep;
    const ystart = state.grid.verticalPixelStart;
    for (let y = ystart; y < state.bounds.y; y += ystep) {
      ctx.strokeStyle = Colors.BoldLine;
      ctx.beginPath();
      ctx.moveTo(0, Math.round(state.bounds.y - y) + 0.5);
      ctx.lineTo(state.bounds.x, Math.round(state.bounds.y - y) + 0.5);
      ctx.stroke();

      ctx.strokeStyle = Colors.LightLine;
      ctx.beginPath();
      ctx.moveTo(0, Math.round(state.bounds.y - (y + ystep / 2)) + 0.5);
      ctx.lineTo(state.bounds.x, Math.round(state.bounds.y - (y + ystep / 2)) + 0.5);
      ctx.stroke();
    }
  }
}
