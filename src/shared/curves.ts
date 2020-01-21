import { Vec2 } from "./math";
import beizer from "bezier-js";
import { exhaustive } from "@/components/graph/util/exhaustive";

export enum ControlPointType {
  Linear = 0,
  Beizer = 1,
  BeizerContinuous = 2,
  LinearFlat = 3
}

export function isLinear(t: ControlPointType): boolean {
  return !isBeizer(t);
}

export function isBeizer(t: ControlPointType): boolean {
  return (
    t === ControlPointType.BeizerContinuous || t === ControlPointType.Beizer
  );
}

export class ControlPoint {
  public type: ControlPointType;
  public position: Vec2;
  public forwardHandle: Vec2;
  public backwardsHandle: Vec2;

  cachedLUT: BezierJs.Point[] | undefined = undefined;

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

  toJSON() {
    return {
      type: this.type,
      position: this.position,
      forwardHandle: this.forwardHandle,
      backwardsHandle: this.backwardsHandle
    };
  }
}

export interface CurveInformation {
  points: (ControlPoint | null)[];
  framesFromFirst: number;
  framesBetween: number;
  t: number;
}

export class Curve {
  id: number;
  name: string;
  controlPoints: ControlPoint[];

  // Editing properties.
  color: string;
  visible: boolean;
  locked: boolean;

  constructor(name: string) {
    this.id = -1;
    this.name = name;
    this.controlPoints = [];

    this.color = "#00FF00";
    this.visible = true;
    this.locked = false;
  }

  public static fromJSON(jsonObject: any): Curve {
    const result = new Curve(jsonObject.name || "Unnamed Curve");
    Object.assign(result, jsonObject);

    const cps = jsonObject.controlPoints || [];
    if (cps.length) {
      result.controlPoints = cps.map((cp: any) => {
        const c = new ControlPoint(
          cp.type,
          cp.position,
          cp.forwardHandle,
          cp.backwardsHandle
        );
        return c;
      });
    }

    return result;
  }

  public toJSON() {
    return {
      id: this.id,
      name: this.name,
      controlPoints: this.controlPoints,
      color: this.color,
      visible: this.visible,
      locked: this.locked
    };
  }

  public minimumFrame(): number {
    return this.controlPoints[0].position.x;
  }

  public maximumFrame(): number {
    return this.controlPoints[this.controlPoints.length - 1].position.x;
  }

  public minimumValue(): number {
    if (this.controlPoints.length === 0) {
      return 0;
    }

    return this.controlPoints.reduce(
      (m: number, cp: ControlPoint, i: number, arr: ControlPoint[]): number => {
        const next = arr[i + 1];
        if (!next) {
          return Math.min(m, cp.position.y);
        }

        if (isLinear(cp.type)) {
          return Math.min(cp.position.y, next.position.y);
        } else if (isBeizer(cp.type)) {
          const lut = this.getLUT(cp, next);
          return lut.reduce((m: number, p: BezierJs.Point): number => {
            return Math.min(m, p.y);
          }, lut[0].y);
        }

        // Unknown type
        return m;
      },
      this.controlPoints[0].position.y
    );
  }

  public maximumValue(): number {
    if (this.controlPoints.length === 0) {
      return 0;
    }

    return this.controlPoints.reduce(
      (m: number, cp: ControlPoint, i: number, arr: ControlPoint[]): number => {
        const next = arr[i + 1];
        if (!next) {
          return Math.max(m, cp.position.y);
        }

        if (isLinear(cp.type)) {
          return Math.max(cp.position.y, next.position.y);
        } else if (isBeizer(cp.type)) {
          const lut = this.getLUT(cp, next);
          lut.reduce((m: number, p: BezierJs.Point): number => {
            return Math.max(m, p.y);
          }, lut[0].y);
        }

        // Unknown type
        return m;
      },
      this.controlPoints[0].position.y
    );
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

      const lerp = (a: number, b: number, t: number) => {
        return (b - a) * t + a;
      };

      switch (f.type) {
        case ControlPointType.Linear:
          return lerp(f.position.y, n.position.y, info.t);
        case ControlPointType.LinearFlat:
          return f.position.y;
        case ControlPointType.Beizer:
        case ControlPointType.BeizerContinuous: {
          const lut = this.getLUT(f, n);
          const bounds = this.lutLookup(frame, lut);
          if (!bounds[0] && bounds[1]) {
            return bounds[1].y;
          } else if (!bounds[1] && bounds[0]) {
            return bounds[0].y;
          } else if (bounds[0] && bounds[1]) {
            return lerp(
              bounds[0].y,
              bounds[1].y,
              (frame - bounds[0].x) / (bounds[1].x - bounds[0].x)
            );
          } else {
            return 0;
          }
        }
        default:
          exhaustive(f.type);
          return 0;
      }
    }
  }

  // TODO: Merge implementations with controlPointsAtFrame
  private lutLookup(frame: number, lut: BezierJs.Point[]) {
    if (frame < lut[0].x) {
      return [null, lut[0]];
    }

    const last = lut[lut.length - 1];
    if (frame > last.x) {
      return [last, null];
    }

    let less = lut[0];
    let greater = lut[1];

    for (let i = 0; i < lut.length - 1; ++i) {
      if (lut[i].x <= frame) {
        less = lut[i];
        greater = lut[i + 1];
      }
    }

    return [less, greater];
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
    let greater = this.controlPoints[1];

    for (let i = 1; i < this.controlPoints.length - 1; ++i) {
      if (this.controlPoints[i].position.x <= frame) {
        less = this.controlPoints[i];
        greater = this.controlPoints[i + 1];
      }
    }

    return [less, greater];
  }

  public invalidateLUTs() {
    this.controlPoints.forEach(c => {
      c.cachedLUT = undefined;
    });
  }

  private getLUT(p: ControlPoint, n: ControlPoint) {
    let lut = p.cachedLUT;
    if (!lut || lut.length === 0) {
      const b = new beizer(
        p.position.x,
        p.position.y,
        p.forwardHandle.x,
        p.forwardHandle.y,
        n.backwardsHandle.x,
        n.backwardsHandle.y,
        n.position.x,
        n.position.y
      );

      lut = b.getLUT(128);
      p.cachedLUT = lut;
    }

    return lut;
  }
}
