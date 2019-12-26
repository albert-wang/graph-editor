import State from "../state";
import { vec2 } from "../util/math";

import { MenuOptionType } from "../state/menu";

export default class MenuRenderer {
  public render(state: State) {
    const menu = state.menu;
    const ctx = state.ctx;
    ctx.save();

    const position = state.grid.project(menu.position);
    position.x = Math.round(position.x);
    position.y = Math.round(position.y);

    const size = vec2(250, 250);

    ctx.fillStyle = "black";
    ctx.globalAlpha = 0.9;
    ctx.fillRect(position.x, position.y, size.x, size.y);

    ctx.fillStyle = "white";
    ctx.strokeStyle = "white";
    ctx.font = "12px arial";
    ctx.lineWidth = 0.75;

    let offset = 18;
    menu.tree.options.forEach(v => {
      switch (v.type) {
        case MenuOptionType.Default:
        case MenuOptionType.Header:
          ctx.fillText(v.label, position.x + 10, position.y + offset);
          offset += 18;
          break;
        case MenuOptionType.Spacer:
          ctx.beginPath();
          offset -= 8;
          ctx.moveTo(position.x, position.y + offset + 0.5);
          ctx.lineTo(position.x + size.x, position.y + offset + 0.5);
          ctx.stroke();
          offset += 10;
          break;
      }
    });
    // Draw the background
    // state.grid.project(state

    // Draw the options
    ctx.restore();
  }
}
