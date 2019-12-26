import { vec2, Vec2, add, sub } from "@/components/graph/util/math";
import State from ".";

export enum ControlPointType {
  Linear = 0,
  Beizer = 1
}

enum SelectedPointType {
  Point = 0,
  Forward = 1,
  Backward = 2
}

export class ControlPoint {
  public type: ControlPointType;
  public position: Vec2;
  public forwardHandle: Vec2;
  public backwardsHandle: Vec2;

  constructor(
    type: ControlPointType,
    position: Vec2,
    forward: Vec2,
    backward: Vec2
  ) {
    this.type = type;
    this.position = position;
    this.forwardHandle = forward;
    this.backwardsHandle = backward;
  }
}

export class Curve {
  name: string;
  controlPoints: ControlPoint[];

  constructor(name: string) {
    this.name = name;
    this.controlPoints = [];
  }
}

export class SelectedPoint {
  curve: Curve | null = null;
  point: ControlPoint | null = null;
  handle: SelectedPointType = SelectedPointType.Point;
}

export default class Curves {
  public curves: Curve[] = [];
  private parent: State;

  constructor(parent: State) {
    this.parent = parent;
  }

  public trySelectPoint(query: Vec2): SelectedPoint {
    const result = new SelectedPoint();

    const squaredDistance = (a: Vec2, b: Vec2) => {
      const dx = b.x - a.x;
      const dy = b.y - a.y;

      return dx * dx + dy * dy;
    };

    const SELECTION_DISTANCE = squaredDistance(
      this.parent.grid.unproject(vec2(0, 0)),
      this.parent.grid.unproject(vec2(15, 15))
    );

    for (let i = 0; i < this.curves.length; ++i) {
      const curve = this.curves[i];
      for (let j = 0; j < curve.controlPoints.length; ++j) {
        const point = curve.controlPoints[j];

        if (squaredDistance(query, point.position) < SELECTION_DISTANCE) {
          result.curve = curve;
          result.point = point;
          result.handle = SelectedPointType.Point;
        }

        if (this.parent.selectedPoint && this.parent.selectedPoint.point) {
          // Can only select handles if the point they belong to is already selected.
          const sp = this.parent.selectedPoint.point;
          if (point !== sp) {
            continue;
          }

          // Select the forward handle iff this is a beizer curve
          if (
            point.type === ControlPointType.Beizer &&
            squaredDistance(query, point.forwardHandle) < SELECTION_DISTANCE
          ) {
            result.curve = curve;
            result.point = point;
            result.handle = SelectedPointType.Forward;
          }

          // Select the backwards handle iff the previous path was a beizer
          const previous = j > 0 ? curve.controlPoints[j - 1] : null;
          if (
            previous &&
            previous.type === ControlPointType.Beizer &&
            squaredDistance(query, point.backwardsHandle) < SELECTION_DISTANCE
          ) {
            result.curve = curve;
            result.point = point;
            result.handle = SelectedPointType.Backward;
          }
        }
      }
    }

    return result;
  }

  public modifyPoint(point: SelectedPoint, position: Vec2) {
    if (!point.curve || !point.point) {
      return;
    }

    switch (point.handle) {
      case SelectedPointType.Backward:
        point.point.backwardsHandle = position;
        break;
      case SelectedPointType.Forward:
        point.point.forwardHandle = position;
        break;
      case SelectedPointType.Point: {
        const delta = sub(position, point.point.position);
        point.point.forwardHandle = add(point.point.forwardHandle, delta);
        point.point.backwardsHandle = add(point.point.backwardsHandle, delta);
        point.point.position = position;
        break;
      }
    }
  }
}
