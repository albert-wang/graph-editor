import State from "../state";
import { sub, vec2, Vec2, add } from "../util/math";

import Menu, { MenuOptionType, MenuOption } from "../state/menu";

export default class MenuRenderer {
  private pointInBox(point: Vec2, upperLeft: Vec2, size: Vec2) {
    const delta = sub(point, upperLeft);
    delta.y = -delta.y;

    return delta.x < size.x && delta.y < size.y && delta.x >= 0 && delta.y >= 0;
  }

  public render(state: State) {
    const menu = state.menu;
    const ctx = state.ctx;
    const path = menu.optionPath;

    if (!menu.visible) {
      return;
    }
    ctx.save();

    this.renderOptions(
      ctx,
      menu,
      menu.mousePosition,
      menu.position,
      menu.size(menu.tree.options),
      menu.tree.options,
      path
    );

    // Draw the background
    // state.grid.project(state

    // Draw the options
    ctx.restore();
  }

  private renderOptions(
    ctx: CanvasRenderingContext2D,
    menu: Menu,
    mouse: Vec2,
    position: Vec2,
    size: Vec2,
    options: MenuOption[],
    path: MenuOption[]
  ) {
    ctx.fillStyle = "black";
    ctx.globalAlpha = 0.9;
    ctx.fillRect(position.x, position.y, size.x, size.y + 6);

    ctx.fillStyle = "white";
    ctx.strokeStyle = "white";
    ctx.font = "12px arial";
    ctx.lineWidth = 0.75;

    options.forEach(v => {
      switch (v.type) {
        case MenuOptionType.Default:
          if (path.indexOf(v) !== -1) {
            ctx.save();
            ctx.fillStyle = "blue";
            ctx.fillRect(
              position.x,
              position.y + v.computedOffset - 10,
              size.x,
              18
            );
            ctx.restore();

            if (v.children.length) {
              this.renderOptions(
                ctx,
                menu,
                mouse,
                add(position, vec2(size.x, v.computedOffset - 10)),
                menu.size(v.children),
                v.children,
                path
              );
            }
          }
          ctx.fillText(
            v.label,
            position.x + 10,
            position.y + v.computedOffset + 2
          );

          if (v.children.length) {
            const metrics = ctx.measureText(">");
            ctx.fillText(
              ">",
              position.x + size.x - metrics.width - 2,
              position.y + v.computedOffset + 2
            );
          }

          break;
        case MenuOptionType.Header:
          ctx.fillText(
            v.label,
            position.x + 10,
            position.y + v.computedOffset + 2
          );
          break;
        case MenuOptionType.Spacer:
          ctx.beginPath();
          ctx.moveTo(position.x, position.y + v.computedOffset - 9 + 0.5);
          ctx.lineTo(
            position.x + size.x,
            position.y + v.computedOffset - 9 + 0.5
          );
          ctx.stroke();
          break;
      }
    });
  }
}
