import State from "../state";
import Colors from "./colors";

class HorizontalRulerRenderer {
  render(state: State) {
    const ctx = state.ctx;

    // Render the background
    ctx.fillStyle = Colors.Ruler;
    ctx.fillRect(0, 0, state.bounds.x, 30);

    const step = state.grid.horizontalPixelStep;
    const interval = state.grid.horizontalInterval;
    const pixelStart = state.grid.horizontalPixelStart;

    // Render labels
    let label = state.grid.horizontalMinimum;
    ctx.textBaseline = "middle";
    ctx.fillStyle = Colors.Text;
    ctx.font = "9pt arial";

    for (let x = 0; x < state.bounds.x + 50; x += step) {
      let txt = `${label}`;
      if (interval <= 0.1) {
        txt = label.toFixed(2);
      }

      const metrics = ctx.measureText(txt);
      ctx.fillText(txt, x - metrics.width + pixelStart, 15);

      label += interval;
    }

    // Render the ruler.
    const location = state.grid.project(state.grid.guidePoint);
    ctx.strokeStyle = Colors.GuideLine;
    ctx.beginPath();
    ctx.moveTo(Math.round(location.x) + 0.5, 30);
    ctx.lineTo(Math.round(location.x) + 0.5, state.bounds.y);
    ctx.stroke();

    const txt = `${state.grid.guidePoint.x}`;
    const metrics = ctx.measureText(txt);
    const width = Math.max(metrics.width + 8, 20);
    const padding = (width - metrics.width) / 2;

    ctx.fillStyle = Colors.GuideLine;
    ctx.beginPath();
    ctx.rect(location.x - metrics.width / 2 - padding, 0, width, 30);
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.fillText(txt, location.x - metrics.width / 2, 15);
  }
}

class VerticalRulerRenderer {
  render(state: State) {
    const ctx = state.ctx;

    const step = state.grid.verticalPixelStep;
    const interval = state.grid.verticalInterval;
    const pixelStart = state.grid.verticalPixelStart;

    let label = state.grid.verticalMinimum;
    ctx.textBaseline = "bottom";
    ctx.fillStyle = Colors.Text;
    ctx.font = "9pt arial";

    for (let y = 0; y < state.bounds.y + 50; y += step) {
      let txt = `${label}`;
      if (interval <= 0.1) {
        txt = label.toFixed(2);
      }

      const metrics = ctx.measureText(txt);

      ctx.fillText(
        txt,
        15 - metrics.width / 2,
        state.bounds.y - (y + pixelStart - 5)
      );
      label += interval;
    }

    // Render the ruler.
    const location = state.grid.project(state.grid.guidePoint);
    ctx.strokeStyle = Colors.GuideLine;
    ctx.beginPath();
    ctx.moveTo(0, Math.round(location.y) + 0.5);
    ctx.lineTo(state.bounds.x, Math.round(location.y) + 0.5);
    ctx.stroke();
  }
}

export {
  HorizontalRulerRenderer as HorizontalRuler,
  VerticalRulerRenderer as VerticalRuler
};
