import {
  vec2,
  Vec2,
  add,
  sub,
  mul,
  pointInBox,
  negate
} from "@graph/shared/math";

import {
  Curve,
  ControlPoint,
  ControlPointType,
  isBeizer
} from "@graph/shared/curves";

import State from ".";

import { exhaustive } from "../util/exhaustive";
import colors from "../rendering/colors";
import sizes from "../rendering/sizes";
import { StateEvent, event, StateActionKeys } from "../actions";

export enum SelectedPointType {
  Point = 0,
  Forward = 1,
  Backward = 2
}

interface SelectionHistoryEntry {
  curve: Curve;
  point: ControlPoint;
  handle: SelectedPointType;
}

export class SelectedPoint {
  curve: Curve | null = null;
  point: ControlPoint | null = null;
  handle: SelectedPointType = SelectedPointType.Point;

  pointHistory: SelectionHistoryEntry[] = [];
  lastSelectedPointQuery: Vec2 = vec2(0, 0);

  public selectPoint(p: SelectedPoint) {
    if (this.point) {
      if (this.curve) {
        this.pointHistory.push({
          curve: this.curve,
          point: this.point,
          handle: this.handle
        });
      }

      while (this.pointHistory.length > 32) {
        this.pointHistory.shift();
      }
    }

    this.point = p.point;
    if (p.curve) {
      this.curve = p.curve;
    }

    this.handle = p.handle;
  }
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
      this.parent.grid.unproject(vec2(7, 7))
    );

    const candidatePoints: SelectionHistoryEntry[] = [];
    for (let i = 0; i < this.curves.length; ++i) {
      const curve = this.curves[i];
      if (!curve.visible || curve.locked) {
        continue;
      }

      for (let j = 0; j < curve.controlPoints.length; ++j) {
        const point = curve.controlPoints[j];

        if (squaredDistance(query, point.position) < SELECTION_DISTANCE) {
          candidatePoints.push({
            curve: curve,
            point: point,
            handle: SelectedPointType.Point
          });
        }

        if (this.parent.selected.point) {
          // Can only select handles if the point they belong to is already selected.
          const sp = this.parent.selected.point;
          if (point !== sp) {
            continue;
          }

          // Select the forward handle iff this is a beizer curve
          if (
            isBeizer(point.type) &&
            squaredDistance(query, point.forwardHandle) < SELECTION_DISTANCE
          ) {
            candidatePoints.push({
              curve: curve,
              point: point,
              handle: SelectedPointType.Forward
            });
          }

          // Select the backwards handle iff the previous path was a beizer
          const previous = j > 0 ? curve.controlPoints[j - 1] : null;
          if (
            previous &&
            isBeizer(previous.type) &&
            squaredDistance(query, point.backwardsHandle) < SELECTION_DISTANCE
          ) {
            candidatePoints.push({
              curve: curve,
              point: point,
              handle: SelectedPointType.Backward
            });
          }
        }
      }
    }

    // Only use the historical discrimination method iff the clicks are
    // close enough to be ambiguous and there is history
    const useHistory =
      this.parent.selected.pointHistory.length != 0 &&
      squaredDistance(this.parent.selected.lastSelectedPointQuery, query) <
        SELECTION_DISTANCE;

    if (useHistory) {
      // Consult the selection history and select the least recent.
      // Compute the historical rank
      const rankedPoints = candidatePoints.map(p => {
        let index = -1;
        for (
          let i = this.parent.selected.pointHistory.length - 1;
          i >= 0;
          --i
        ) {
          const cp = this.parent.selected.pointHistory[i];
          if (
            cp.curve == p.curve &&
            cp.handle == p.handle &&
            cp.point == p.point
          ) {
            index = i;
            break;
          }
        }

        return {
          curve: p.curve,
          point: p.point,
          handle: p.handle,
          rank: index
        };
      });

      rankedPoints.sort((a, b) => {
        return a.rank - b.rank;
      });

      if (rankedPoints.length > 0) {
        const firstRanked = rankedPoints[0];
        result.point = firstRanked.point;
        result.curve = firstRanked.curve;
        result.handle = firstRanked.handle;
      }
    } else if (candidatePoints.length > 0) {
      // Prefer active curve, handles.
      const rankedPoints = candidatePoints.map(p => {
        let rank = 0;
        if (p.curve == this.parent.selected.curve) {
          rank -= 2;
        }

        if (p.handle != SelectedPointType.Point) {
          rank -= 1;
        }

        return {
          curve: p.curve,
          point: p.point,
          handle: p.handle,
          rank: rank
        };
      });

      rankedPoints.sort((a, b) => {
        return a.rank - b.rank;
      });

      // Prefer the handles if we don't have history
      const firstRanked = rankedPoints[0];
      result.point = firstRanked.point;
      result.curve = firstRanked.curve;
      result.handle = firstRanked.handle;
    }

    this.parent.selected.lastSelectedPointQuery = query;
    return result;
  }

  public addPoint(c: Curve, frame: number) {
    const info = c.curveInformationAt(frame);
    const value = c.evaluate(frame);
    const position = vec2(frame, value);
    const delta = vec2(info.framesBetween / 4, 0);
    const prototype = info.points[0] || info.points[1];

    const res = new ControlPoint(
      prototype!.type,
      position,
      add(position, delta),
      sub(position, delta)
    );

    c.controlPoints.push(res);
    this.sortCurve(c);
    return res;
  }

  public addCurve(c: Curve) {
    c.id = this.curves.length;
    c.color = colors.LineColors[this.curves.length];
    this.curves.push(c);

    if (!this.parent.selected.curve) {
      this.parent.selected.curve = c;
    }
  }

  public modifyPoint(
    point: SelectedPoint,
    position: Vec2,
    scale: Vec2 = vec2(1, 1)
  ) {
    if (!point.curve || !point.point) {
      console.log("curve or point null, skipping");
      return;
    }

    // Clear out the selection history on drag.
    this.parent.selected.pointHistory = [];
    point.curve.invalidateLUTs();

    switch (point.handle) {
      case SelectedPointType.Backward: {
        const delta = sub(position, point.point.backwardsHandle);
        const modified = mul(delta, scale);
        const next = add(point.point.backwardsHandle, modified);

        next.x = Math.min(next.x, point.point.position.x);
        point.point.backwardsHandle = next;

        if (point.point.type === ControlPointType.BeizerContinuous) {
          const p = point.point.backwardsHandle;
          const negated = negate(sub(p, point.point.position));
          const forwardDiff = sub(
            point.point.forwardHandle,
            point.point.position
          );
          if (negated.x === 0) {
            negated.x = 0.0001;
          }

          const scale = forwardDiff.x / negated.x;
          const mirror = add(
            point.point.position,
            mul(negated, vec2(scale, scale))
          );

          point.point.forwardHandle = mirror;
        }

        break;
      }
      case SelectedPointType.Forward: {
        const delta = sub(position, point.point.forwardHandle);
        const modified = mul(delta, scale);

        const next = add(point.point.forwardHandle, modified);
        next.x = Math.max(next.x, point.point.position.x);
        point.point.forwardHandle = next;

        if (point.point.type === ControlPointType.BeizerContinuous) {
          const p = point.point.forwardHandle;
          const negated = negate(sub(p, point.point.position));
          const backwardDiff = sub(
            point.point.backwardsHandle,
            point.point.position
          );
          if (negated.x === 0) {
            negated.x = -0.0001;
          }

          const scale = backwardDiff.x / negated.x;
          const mirror = add(
            point.point.position,
            mul(negated, vec2(scale, scale))
          );

          point.point.backwardsHandle = mirror;
        }

        break;
      }
      case SelectedPointType.Point: {
        position.x = Math.round(position.x);

        const delta = sub(position, point.point.position);
        const modified = mul(delta, scale);

        point.point.position = add(point.point.position, modified);
        point.point.forwardHandle = add(point.point.forwardHandle, modified);
        point.point.backwardsHandle = add(
          point.point.backwardsHandle,
          modified
        );

        point.point.position.x = Math.round(point.point.position.x);
        break;
      }
      default:
        exhaustive(point.handle);
    }

    this.sortCurve(point.curve);
  }

  public propertiesClick(query: Vec2): StateEvent {
    const offsets = sizes.PropertyColumnOffsets;
    const left = this.parent.bounds.x - sizes.PropertiesWidth;
    const selectedProperty = function(
      height: number,
      offset: number,
      nextOffset: number
    ) {
      return pointInBox(
        query,
        vec2(left + offset, height - 10),
        vec2(nextOffset - offset - 12, 20)
      );
    };

    if (selectedProperty(35, 0, offsets.value)) {
      if (this.parent.selected.point) {
        const point = this.parent.selected.point;
        this.parent.inputField.x(left + offsets.color);
        this.parent.inputField.y(25);

        if (this.parent.selected.handle == SelectedPointType.Point) {
          this.parent.inputField.value(point.position.x.toFixed(3));
        } else if (this.parent.selected.handle == SelectedPointType.Forward) {
          this.parent.inputField.value(point.forwardHandle.x.toFixed(3));
        } else if (this.parent.selected.handle == SelectedPointType.Backward) {
          this.parent.inputField.value(point.backwardsHandle.x.toFixed(3));
        }

        return event(StateActionKeys.EditPointFrame);
      }
    }

    if (selectedProperty(35, offsets.value, offsets.visible)) {
      if (this.parent.selected.point) {
        const point = this.parent.selected.point;
        this.parent.inputField.x(left + offsets.value);
        this.parent.inputField.y(25);
        if (this.parent.selected.handle == SelectedPointType.Point) {
          this.parent.inputField.value(point.position.y);
        } else if (this.parent.selected.handle == SelectedPointType.Forward) {
          this.parent.inputField.value(point.forwardHandle.y.toFixed(3));
        } else if (this.parent.selected.handle == SelectedPointType.Backward) {
          this.parent.inputField.value(point.backwardsHandle.y.toFixed(3));
        }

        return event(StateActionKeys.EditPointValue);
      }
    }

    for (let i = 0; i < this.curves.length; ++i) {
      // From curve_properties renderer
      const heightOffset = i * 19 + 90;

      const selection = new SelectedPoint();
      selection.curve = this.curves[i];

      if (selectedProperty(heightOffset, 0, offsets.value)) {
        this.parent.selected.selectPoint(selection);
        this.parent.inputField.x(left + offsets.name);
        this.parent.inputField.y(heightOffset - 10);
        this.parent.inputField.value(selection.curve.name);

        return event(StateActionKeys.EditName);
      }

      if (selectedProperty(heightOffset, offsets.value, offsets.visible)) {
        const info = selection.curve.curveInformationAt(
          this.parent.grid.guidePoint.x
        );

        if (
          info.framesFromFirst == 0 ||
          info.framesFromFirst == info.framesBetween
        ) {
          this.parent.selected.selectPoint(selection);
          this.parent.inputField.x(left + offsets.value);
          this.parent.inputField.y(heightOffset - 10);
          this.parent.inputField.fontColor("yellow");
          this.parent.inputField.value(
            selection.curve.evaluate(this.parent.grid.guidePoint.x)
          );

          return event(StateActionKeys.EditValue);
        }
      }

      if (selectedProperty(heightOffset, offsets.visible, offsets.locked)) {
        this.parent.selected.selectPoint(selection);

        return event(StateActionKeys.ToggleVisible);
      }

      if (
        selectedProperty(heightOffset, offsets.locked, sizes.PropertiesWidth)
      ) {
        this.parent.selected.selectPoint(selection);

        return event(StateActionKeys.ToggleLocked);
      }
    }

    return event("");
  }

  public maximumFrame(): number {
    if (this.curves.length === 0) {
      return 0;
    }

    return this.curves.reduce((v, c) => {
      return Math.max(v, c.maximumFrame());
    }, this.curves[0].maximumFrame());
  }

  public minimumFrame(): number {
    if (this.curves.length === 0) {
      return 0;
    }

    return this.curves.reduce((v, c) => {
      return Math.min(v, c.minimumFrame());
    }, this.curves[0].minimumFrame());
  }

  private sortCurve(curve: Curve) {
    curve.controlPoints.sort((a, b) => {
      return a.position.x - b.position.x;
    });

    curve.invalidateLUTs();
  }
}
