import { State } from "./graph";
import Colors from "./rendering/colors";

export default class HorizontalRuler {
  render(state: State) {
    const ctx = state.ctx;

    ctx.fillStyle = Colors.Ruler;
    ctx.fillRect(0, 0, state.bounds.x, 30);

    const steps = state.gridSteps;
    const interval = state.gridInterval;

    let label = state.gridMinimum;
    ctx.textBaseline = "middle";
    ctx.fillStyle = Colors.Text;
    ctx.font = "9pt arial";

    for (let i = 0; i < steps; ++i) {
      const txt = `${label}`;
      const metrics = ctx.measureText(txt);
      ctx.fillText(txt, i * 50 + 30 - metrics.width / 2, 15);

      label += interval;
    }
  }
}
