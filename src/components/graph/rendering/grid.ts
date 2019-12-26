import State from "../state";
import Colors from "./colors";

export default class GridRenderer {
  render(state: State) {
    const ctx = state.ctx;

    ctx.fillStyle = Colors.GridBackground;
    ctx.fillRect(0, 0, state.bounds.x, state.bounds.y);

    const xstep = state.grid.horizontalPixelStep;
    const xstart = state.grid.horizontalPixelStart;
    for (let x = xstart; x < state.bounds.x; x += xstep) {
      ctx.strokeStyle = Colors.BoldLine;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, state.bounds.y);
      ctx.stroke();

      ctx.strokeStyle = Colors.LightLine;
      ctx.beginPath();
      ctx.moveTo(x + xstep / 2, 0);
      ctx.lineTo(x + xstep / 2, state.bounds.y);
      ctx.stroke();
    }

    const ystep = state.grid.verticalPixelStep;
    const ystart = state.grid.verticalPixelStart;
    for (let y = ystart; y < state.bounds.y; y += ystep) {
      ctx.strokeStyle = Colors.BoldLine;
      ctx.beginPath();
      ctx.moveTo(0, state.bounds.y - y);
      ctx.lineTo(state.bounds.x, state.bounds.y - y);
      ctx.stroke();

      ctx.strokeStyle = Colors.LightLine;
      ctx.beginPath();
      ctx.moveTo(0, state.bounds.y - (y + ystep / 2));
      ctx.lineTo(state.bounds.x, state.bounds.y - (y + ystep / 2));
      ctx.stroke();
    }
  }
}
