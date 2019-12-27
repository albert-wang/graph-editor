import State from "../state";
import Colors from "./colors";
import Sizes from "./sizes";
import { Curve } from "@/shared/curves";
import { Vec2, vec2 } from "@/shared/math";

export default class CurvePropertiesRenderer {
  private static vert(ctx: CanvasRenderingContext2D, x: number, h: number) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, h);
    ctx.stroke();
  }

  private static horz(
    ctx: CanvasRenderingContext2D,
    y: number,
    left: number,
    right: number
  ) {
    ctx.beginPath();
    ctx.moveTo(left, y + 0.5);
    ctx.lineTo(right, y + 0.5);
    ctx.stroke();
  }

  public static render(state: State) {
    // Render the background.
    const ctx = state.ctx;
    const left = state.bounds.x - Sizes.PropertiesWidth;
    ctx.save();
    ctx.fillStyle = Colors.PropertiesBackground;
    ctx.fillRect(left, 0, Sizes.PropertiesWidth, state.bounds.y);
    ctx.strokeStyle = "black";
    CurvePropertiesRenderer.vert(ctx, left, state.bounds.y);
    ctx.stroke();

    // Render the table.
    ctx.fillStyle = Colors.BrightText;
    ctx.strokeStyle = Colors.BoldLine;
    ctx.font = "9pt arial";

    ctx.fillText("Curve", left + 10, 10);
    ctx.fillText("Value", left + 200, 10);
    CurvePropertiesRenderer.vert(ctx, left + 190, state.bounds.y);

    ctx.fillText("V", left + 300, 10);
    CurvePropertiesRenderer.vert(ctx, left + 290, state.bounds.y);

    ctx.fillText("L", left + 330, 10);
    CurvePropertiesRenderer.vert(ctx, left + 320, state.bounds.y);
    CurvePropertiesRenderer.horz(ctx, 19, left, state.bounds.x);

    const frame = state.grid.guidePoint.x;

    state.curves.curves.forEach((c, i) => {
      CurvePropertiesRenderer.renderSingleProperty(ctx, frame, left, c, i);
    });

    ctx.restore();
  }

  private static rect(
    ctx: CanvasRenderingContext2D,
    position: Vec2,
    size: Vec2,
    color: string
  ) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.fillRect(position.x, position.y, size.x, size.y);
    ctx.restore();
  }

  private static checkbox(
    ctx: CanvasRenderingContext2D,
    position: Vec2,
    filled: boolean
  ) {
    ctx.save();
    ctx.fillStyle = "white";
    ctx.strokeStyle = "white";

    if (filled) {
      ctx.translate(position.x + 4, position.y - 4);
      ctx.rotate(3.14159 / 4);
      ctx.beginPath();
      ctx.fillRect(0, 0, 8, 8);
    } else {
      ctx.translate(position.x + 3, position.y - 3);
      ctx.rotate(3.14159 / 4);
      ctx.beginPath();
      ctx.strokeRect(0, 0, 6, 6);
    }
    ctx.restore();
  }

  public static renderSingleProperty(
    ctx: CanvasRenderingContext2D,
    frame: number,
    left: number,
    c: Curve,
    i: number
  ) {
    const columnOffsets = {
      color: 10,
      name: 25,
      value: 200,
      visible: 300,
      locked: 330
    };
    const heightOffset = i * 19 + 35;

    this.rect(
      ctx,
      vec2(left + columnOffsets.color, heightOffset - 6),
      vec2(10, 10),
      c.color
    );

    ctx.fillText(
      c.name || "Unnamed Curve",
      left + columnOffsets.name,
      heightOffset
    );

    const info = c.curveInformationAt(frame);
    const value = c.evaluate(frame).toFixed(3);
    if (
      info.framesFromFirst == 0 ||
      info.framesFromFirst == info.framesBetween
    ) {
      ctx.fillStyle = "yellow";
    } else {
      ctx.fillStyle = "#00FF00";
    }

    ctx.fillText(`${value}`, left + columnOffsets.value, heightOffset);
    ctx.fillStyle = Colors.BrightText;

    this.checkbox(
      ctx,
      vec2(left + columnOffsets.visible, heightOffset - 3),
      c.visible
    );

    this.checkbox(
      ctx,
      vec2(left + columnOffsets.locked, heightOffset - 3),
      c.locked
    );
  }
}
