import { GraphState } from "./graph";
import Colors from "./rendering/colors";

export default class Grid {
  render(state: GraphState) {
    const ctx = state.ctx;

    ctx.fillStyle = Colors.GridBackground;
    ctx.fillRect(0, 30, state.bounds.x, state.bounds.y);
  }
}
