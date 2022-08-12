import State from "../state";
import { Curve, ControlPoint, ControlPointType, isBeizer } from "@graph/shared/curves";

import { exhaustive } from "../util/exhaustive";

export default class CurveRenderer {
  public static render(state: State) {
    const ctx = state.ctx;
    ctx.save();

    const activeCurve = (c: Curve) => state.selected.hasCurve(c);

    // Draw inactive curves first
    state.curves.curves.forEach((curve, i) => {
      if (!activeCurve(curve) && curve.visible) {
        if (curve.locked) {
          ctx.globalAlpha = 0.6;
          ctx.setLineDash([2, 8]);
          ctx.lineDashOffset = i * 4;
        } else {
          ctx.globalAlpha = 0.3;
          ctx.setLineDash([4, 16]);
          ctx.lineDashOffset = i * 4;
        }

        CurveRenderer.renderSingleCurve(state, ctx, curve);
      }
    });

    state.curves.curves.forEach((curve) => {
      if (activeCurve(curve) && curve.visible) {
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;

        CurveRenderer.renderSingleCurve(state, ctx, curve);
      }
    });
    ctx.restore();
  }

  public static drawHandles(
    state: State,
    ctx: CanvasRenderingContext2D,
    prev: ControlPoint | null,
    current: ControlPoint,
    next: ControlPoint | null
  ) {
    ctx.save();
    const grid = state.grid;

    // Project the handles
    const cp = grid.project(current.position);
    const cp1 = grid.project(current.forwardHandle);
    const cp2 = grid.project(current.backwardsHandle);

    // Draw the lines to connect the handles with the control point.
    ctx.lineWidth = 2;
    ctx.strokeStyle = "pink";
    ctx.fillStyle = "yellow";

    // If this is not the selected point, just draw the handle.
    if (state.selected.hasPoint(current)) {
      ctx.fillStyle = "orange";

      // Only draw the backwards handle if the backwards point
      // is a beizer.
      if (prev && isBeizer(prev.type)) {
        ctx.beginPath();
        ctx.moveTo(cp.x, cp.y);
        ctx.lineTo(cp2.x, cp2.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(cp2.x, cp2.y, 3, 3, 0, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Same with the forward handle and the current point.
      if (isBeizer(current.type)) {
        ctx.beginPath();
        ctx.moveTo(cp.x, cp.y);
        ctx.lineTo(cp1.x, cp1.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(cp1.x, cp1.y, 3, 3, 0, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    ctx.beginPath();
    ctx.ellipse(cp.x, cp.y, 4, 4, 0, 0, 2 * Math.PI);
    ctx.fill();

    ctx.restore();
  }

  public static renderSingleCurve(state: State, ctx: CanvasRenderingContext2D, curve: Curve) {
    const first = curve.controlPoints[0];
    const last = curve.controlPoints[curve.controlPoints.length - 1];

    const grid = state.grid;
    const fp = grid.project(first.position);

    ctx.lineWidth = 3;
    ctx.strokeStyle = curve.color;

    // Draw the connective lines between the left and right extremes
    ctx.beginPath();
    ctx.moveTo(0, fp.y);
    ctx.lineTo(fp.x, fp.y);
    ctx.stroke();

    for (let i = 0; i < curve.controlPoints.length - 1; ++i) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = curve.color;

      let previous = null;
      if (i > 0) {
        previous = curve.controlPoints[i - 1];
      }

      const current = curve.controlPoints[i];
      const next = curve.controlPoints[i + 1];

      const cp = grid.project(current.position);
      const np = grid.project(next.position);

      switch (current.type) {
        case ControlPointType.Linear: {
          ctx.beginPath();
          ctx.moveTo(cp.x, cp.y);
          ctx.lineTo(np.x, np.y);
          ctx.stroke();

          this.drawHandles(state, ctx, previous, current, next);
          break;
        }
        case ControlPointType.LinearFlat: {
          ctx.beginPath();
          ctx.moveTo(cp.x, cp.y);
          ctx.lineTo(np.x, cp.y);
          ctx.lineTo(np.x, np.y);
          ctx.stroke();

          this.drawHandles(state, ctx, previous, current, next);
          break;
        }
        case ControlPointType.BeizerContinuous:
        case ControlPointType.Beizer: {
          const cp1 = grid.project(current.forwardHandle);
          const cp2 = grid.project(next.backwardsHandle);

          // Draw the path
          ctx.beginPath();
          ctx.moveTo(cp.x, cp.y);
          ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, np.x, np.y);
          ctx.stroke();

          this.drawHandles(state, ctx, previous, current, next);
          break;
        }
        default:
          exhaustive(current.type);
      }
    }

    ctx.lineWidth = 3;
    ctx.strokeStyle = curve.color;

    const lp = grid.project(last.position);
    ctx.beginPath();
    ctx.moveTo(lp.x, lp.y);
    ctx.lineTo(state.bounds.x, lp.y);
    ctx.stroke();

    this.drawHandles(state, ctx, curve.controlPoints[curve.controlPoints.length - 2], last, null);
  }
}
