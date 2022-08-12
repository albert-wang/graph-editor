import State from "../state";
import Colors from "./colors";
import { vec2, Vec2, add, pointInBox } from "@graph/shared/math";

import Menu, { MenuOptionType, MenuOption } from "../state/menu";

export default class MenuRenderer {
  public static render(state: State) {
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

    // Draw the options
    ctx.restore();
  }

  private static renderOptions(
    ctx: CanvasRenderingContext2D,
    menu: Menu,
    mouse: Vec2,
    position: Vec2,
    size: Vec2,
    options: MenuOption[],
    path: MenuOption[]
  ) {
    ctx.fillStyle = Colors.MenuBackground;
    ctx.globalAlpha = 0.9;

    ctx.fillRect(position.x, position.y, size.x, size.y + 6);

    ctx.strokeStyle = "black";
    ctx.globalAlpha = 1;
    ctx.strokeRect(position.x - 1, position.y - 1, size.x + 2, size.y + 6 + 2);

    options.forEach((v) => {
      ctx.fillStyle = Colors.BrightText;
      ctx.strokeStyle = "white";
      ctx.font = "12px arial";
      ctx.lineWidth = 1;

      if (!v.enabled) {
        ctx.fillStyle = Colors.DisabledText;
      }

      switch (v.type) {
        case MenuOptionType.Default:
          if (path.indexOf(v) !== -1) {
            ctx.save();
            ctx.fillStyle = Colors.HighlightedItem;
            ctx.fillRect(position.x, position.y + v.computedOffset - 10, size.x, 21);
            ctx.restore();

            if (v.children.length) {
              if (v.enabled) {
                this.renderOptions(
                  ctx,
                  menu,
                  mouse,
                  add(position, vec2(size.x, v.computedOffset - 30)),
                  menu.size(v.children),
                  v.children,
                  path
                );
              }
            }
          }
          ctx.fillText(v.label, position.x + 10, position.y + v.computedOffset + 2);

          if (v.children.length) {
            const metrics = ctx.measureText("⯈");
            ctx.fillText("⯈", position.x + size.x - metrics.width - 2, position.y + v.computedOffset + 2);
          } else if (v.shortcut) {
            const metrics = ctx.measureText(v.shortcut);
            ctx.fillText(v.shortcut, position.x + size.x - metrics.width - 2, position.y + v.computedOffset + 2);
          }

          break;
        case MenuOptionType.Header: {
          ctx.fillStyle = Colors.HeaderColor;
          const metrics = ctx.measureText(v.label);
          ctx.fillText(v.label, position.x + size.x - metrics.width - 2, position.y + v.computedOffset + 2);
          break;
        }
        case MenuOptionType.Spacer:
          ctx.strokeStyle = Colors.SpacerColor;
          ctx.beginPath();
          ctx.moveTo(position.x, Math.round(position.y + v.computedOffset) - 9 + 0.5);
          ctx.lineTo(position.x + size.x, Math.round(position.y + v.computedOffset) - 9 + 0.5);
          ctx.stroke();
          break;
      }
    });
  }
}
