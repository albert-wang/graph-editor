import { vec2, Vec2, add, sub } from "@/shared/math";

// @ts-ignore
import beizer from "bezier-js";

export enum ControlPointType {
  Linear = 0,
  Beizer = 1
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

export interface CurveInformation {
  points: (ControlPoint | null)[];
  framesFromFirst: number;
  framesBetween: number;
  t: number;
}

export class Curve {
  name: string;
  controlPoints: ControlPoint[];

  // Editing properties.
  color: string;
  visible: boolean;
  locked: boolean;

  constructor(name: string) {
    this.name = name;
    this.controlPoints = [];

    this.color = "#00FF00";
    this.visible = true;
    this.locked = false;
  }

  public minimumFrame(): number {
    return this.controlPoints[0].position.x;
  }

  public maximumFrame(): number {
    return this.controlPoints[this.controlPoints.length - 1].position.x;
  }

  public minimumValue(): number {
    return 0;
  }

  public maximumValue(): number {
    return 0;
  }

  public curveInformationAt(frame: number): CurveInformation {
    const cps = this.controlPointsAtFrame(frame);
    const result = {
      points: cps,
      framesBetween: 0,
      framesFromFirst: 0,
      t: 0
    };

    // Before first
    if (cps[0] === null) {
      if (!cps[1]) {
        // Error, invalid curve?
        return result;
      }

      result.framesBetween = cps[1].position.x - frame;
      result.framesFromFirst = result.framesBetween;
      result.t = 0;
      return result;
    } else if (cps[1] === null) {
      // After last
      if (!cps[0]) {
        return result;
      }

      result.framesBetween = frame - cps[0].position.x;
      result.framesFromFirst = 0;
      result.t = 1;
      return result;
    } else {
      if (!cps[0] || !cps[1]) {
        return result;
      }

      result.framesBetween = cps[1].position.x - cps[0].position.x;
      result.framesFromFirst = frame - cps[0].position.x;
      result.t = result.framesFromFirst / result.framesBetween;

      return result;
    }
  }

  public evaluate(frame: number): number {
    const info = this.curveInformationAt(frame);
    // The requested frame is before the first frame
    if (info.points[0] === null) {
      if (!info.points[1]) {
        // Error, invalid curve?
        return 0;
      }

      const n = info.points[1];
      return n.position.y;
    } else if (info.points[1] === null) {
      if (!info.points[0]) {
        // Error, invalid curve?
        return 0;
      }

      const f = info.points[0]!;
      return f.position.y;
    } else {
      if (!info.points[0] || !info.points[1]) {
        return 0;
      }

      const f = info.points[0];
      const n = info.points[1];

      if (f.type === ControlPointType.Linear) {
        const y = (n.position.y - f.position.y) * info.t + f.position.y;
        return y;
      } else {
        const b = new beizer(
          f.position.x,
          f.position.y,
          f.forwardHandle.x,
          f.forwardHandle.y,
          n.backwardsHandle.x,
          n.backwardsHandle.y,
          n.position.x,
          n.position.y
        );

        return b.get(info.t).y;
      }
    }
  }

  public controlPointsAtFrame(frame: number) {
    if (frame < this.controlPoints[0].position.x) {
      return [null, this.controlPoints[0]];
    }

    const last = this.controlPoints[this.controlPoints.length - 1];

    if (frame >= last.position.x) {
      return [last, null];
    }

    let less = this.controlPoints[0];
    for (let i = 1; i < this.controlPoints.length; ++i) {
      if (this.controlPoints[i].position.x <= frame) {
        less = this.controlPoints[i];
      }
    }

    let greater =
      this.controlPoints.find(c => {
        return c.position.x > frame;
      }) || last;

    return [less, greater];
  }
}
