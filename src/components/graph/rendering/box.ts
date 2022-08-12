import State from "../state";
import { vec2, sub } from "@graph/shared/math";

import Colors from "./colors";
import { BoxState } from "../state/box";

export default class BoxRenderer {
  public static render(state: State) {
    if (state.boxSelection.state == BoxState.Inactive) {
      return;
    }

    const ctx = state.ctx;
    ctx.save();

    let topLeft = vec2(
      Math.min(state.boxSelection.first.x, state.boxSelection.second.x),
      Math.max(state.boxSelection.first.y, state.boxSelection.second.y)
    );

    let bottomRight = vec2(
      Math.max(state.boxSelection.first.x, state.boxSelection.second.x),
      Math.min(state.boxSelection.first.y, state.boxSelection.second.y)
    );

    topLeft = state.grid.project(topLeft);
    bottomRight = state.grid.project(bottomRight);

    const size = sub(bottomRight, topLeft);

    ctx.fillStyle = Colors.BoxFill;
    ctx.globalAlpha = 0.1;

    ctx.beginPath();
    ctx.rect(topLeft.x, topLeft.y, size.x, size.y);
    ctx.fill();

    ctx.fillStyle = Colors.BoxBorder;
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.rect(topLeft.x, topLeft.y, size.x, size.y);
    ctx.stroke();

    ctx.restore();
  }
}
