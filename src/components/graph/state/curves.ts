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

type SelectedForeachCallback = (
  c: Curve,
  cp: ControlPoint | null,
  idx: number
) => void;

export class SelectedPoint {
  curve: Curve[] = [];
  point: (ControlPoint | null)[] = [];
  handle: SelectedPointType = SelectedPointType.Point;

  pointHistory: SelectionHistoryEntry[] = [];
  lastSelectedPointQuery: Vec2 = vec2(0, 0);

  public selectPoint(p: SelectedPoint) {
    this.foreach((c, p) => {
      if (p) {
        this.pointHistory.push({
          curve: c,
          point: p,
          handle: this.handle
        });
      }
    });

    while (this.pointHistory.length > 32) {
      this.pointHistory.shift();
    }

    this.point = p.point;
    if (p.curve) {
      this.curve = p.curve;
    }

    this.handle = p.handle;
  }

  public foreach(cb: SelectedForeachCallback) {
    for (let i = 0; i < this.curve.length; ++i) {
      cb(this.curve[i], this.point[i], i);
    }
  }

  public hasAnyCurves() {
    return this.curve.length !== 0;
  }

  public hasAnyPoints() {
    return this.point.length !== 0;
  }

  public isSinglePoint() {
    return this.curve.length == 1 && this.point.length == 1 && this.point[0];
  }

  public hasCurve(t: Curve): boolean {
    return this.curve.find(c => c === t) !== undefined;
  }

  public hasPoint(t: ControlPoint) {
    return this.point.find(p => p === t) !== undefined;
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
    const current = this.parent.selected;

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

        // Can only select handles if the point they belong to is already selected.
        if (current.hasPoint(point)) {
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
      current.pointHistory.length != 0 &&
      squaredDistance(current.lastSelectedPointQuery, query) <
        SELECTION_DISTANCE;

    if (useHistory) {
      // Consult the selection history and select the least recent.
      // Compute the historical rank
      const rankedPoints = candidatePoints.map(p => {
        let index = -1;
        for (let i = current.pointHistory.length - 1; i >= 0; --i) {
          const cp = current.pointHistory[i];
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
        result.point = [firstRanked.point];
        result.curve = [firstRanked.curve];
        result.handle = firstRanked.handle;
      }
    } else if (candidatePoints.length > 0) {
      // Prefer active curve, handles.
      const rankedPoints = candidatePoints.map(p => {
        let rank = 0;
        if (current.hasCurve(p.curve)) {
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
      result.point = [firstRanked.point];
      result.curve = [firstRanked.curve];
      result.handle = firstRanked.handle;
    }

    this.parent.selected.lastSelectedPointQuery = query;
    if (result.curve.length == 0 && this.parent.selected.hasAnyCurves()) {
      result.curve = [this.parent.selected.curve[0]];
    }
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
      this.parent.selected.curve = [c];
    }
  }

  public deltaBetween(point: SelectedPoint, position: Vec2): Vec2 {
    if (!point.isSinglePoint()) {
      throw "Invalid";
    }

    switch (point.handle) {
      case SelectedPointType.Backward:
        return sub(position, point.point[0]!.backwardsHandle);
      case SelectedPointType.Forward:
        return sub(position, point.point[0]!.forwardHandle);
      case SelectedPointType.Point:
        return sub(position, point.point[0]!.position);
    }
  }

  public modifyPoint(
    sp: SelectedPoint,
    position: Vec2,
    scale: Vec2 = vec2(1, 1),
    movement: Vec2 = vec2(0, 0),
    movementScale: Vec2 = vec2(1, 1)
  ) {
    // Clear out the selection history on drag.
    sp.pointHistory = [];

    sp.foreach((curve: Curve, point: ControlPoint | null) => {
      if (!point) {
        return;
      }

      curve.invalidateLUTs();

      switch (sp.handle) {
        case SelectedPointType.Backward: {
          const delta = sub(position, point.backwardsHandle);
          const modified = add(mul(delta, scale), mul(movement, movementScale));
          const next = add(point.backwardsHandle, modified);

          next.x = Math.min(next.x, point.position.x);
          point.backwardsHandle = next;

          if (point.type === ControlPointType.BeizerContinuous) {
            const p = point.backwardsHandle;
            const negated = negate(sub(p, point.position));
            const forwardDiff = sub(point.forwardHandle, point.position);
            if (negated.x === 0) {
              negated.x = 0.0001;
            }

            const scale = forwardDiff.x / negated.x;
            const mirror = add(
              point.position,
              mul(negated, vec2(scale, scale))
            );

            point.forwardHandle = mirror;
          }
          break;
        }
        case SelectedPointType.Forward: {
          const delta = sub(position, point.forwardHandle);
          const modified = add(mul(delta, scale), mul(movement, movementScale));

          const next = add(point.forwardHandle, modified);
          next.x = Math.max(next.x, point.position.x);
          point.forwardHandle = next;

          if (point.type === ControlPointType.BeizerContinuous) {
            const p = point.forwardHandle;
            const negated = negate(sub(p, point.position));
            const backwardDiff = sub(point.backwardsHandle, point.position);
            if (negated.x === 0) {
              negated.x = -0.0001;
            }

            const scale = backwardDiff.x / negated.x;
            const mirror = add(
              point.position,
              mul(negated, vec2(scale, scale))
            );

            point.backwardsHandle = mirror;
          }

          break;
        }
        case SelectedPointType.Point: {
          position.x = Math.round(position.x);

          const delta = sub(position, point.position);
          const modified = add(mul(delta, scale), mul(movement, movementScale));

          point.position = add(point.position, modified);
          point.forwardHandle = add(point.forwardHandle, modified);
          point.backwardsHandle = add(point.backwardsHandle, modified);
          break;
        }
        default:
          exhaustive(sp.handle);
      }

      this.sortCurve(curve);
    });
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

    const setInputPosition = (x: number, y: number) => {
      this.parent.inputField.style.setProperty("left", `${x.toFixed(2)}px`);
      this.parent.inputField.style.setProperty("top", `${y.toFixed(2)}px`);
    };

    const setInputValue = (v: number | string) => {
      if (typeof v === "number") {
        this.parent.inputField.value = v.toFixed(3);
        return;
      }

      if (typeof v === "string") {
        this.parent.inputField.value = v;
        return;
      }

      exhaustive(v);
    };

    const selected = this.parent.selected;

    if (selectedProperty(35, 0, offsets.value)) {
      if (selected.isSinglePoint()) {
        const point = this.parent.selected.point[0]!;

        setInputPosition(left + offsets.color, 25);

        if (this.parent.selected.handle == SelectedPointType.Point) {
          setInputValue(point.position.x);
        } else if (this.parent.selected.handle == SelectedPointType.Forward) {
          setInputValue(point.forwardHandle.x);
        } else if (this.parent.selected.handle == SelectedPointType.Backward) {
          setInputValue(point.backwardsHandle.x);
        }
        return event(StateActionKeys.EditPointFrame);
      } else if (selected.point.length >= 2) {
        setInputValue("...");
        return event(StateActionKeys.EditPointFrame);
      }
    }

    if (selectedProperty(35, offsets.value, offsets.visible)) {
      if (selected.isSinglePoint()) {
        const point = this.parent.selected.point[0]!;

        setInputPosition(left + offsets.value, 25);

        if (this.parent.selected.handle == SelectedPointType.Point) {
          setInputValue(point.position.y);
        } else if (this.parent.selected.handle == SelectedPointType.Forward) {
          setInputValue(point.forwardHandle.y);
        } else if (this.parent.selected.handle == SelectedPointType.Backward) {
          setInputValue(point.backwardsHandle.y);
        }

        return event(StateActionKeys.EditPointValue);
      } else if (selected.point.length >= 2) {
        setInputValue("...");
        return event(StateActionKeys.EditPointFrame);
      }
    }

    for (let i = 0; i < this.curves.length; ++i) {
      // From curve_properties renderer
      const heightOffset = i * 19 + 90;

      const selection = new SelectedPoint();
      selection.curve = [this.curves[i]];

      if (selectedProperty(heightOffset, 0, offsets.value)) {
        this.parent.selected.selectPoint(selection);

        setInputPosition(left + offsets.name, heightOffset - 10);
        setInputValue(this.curves[i].name);

        return event(StateActionKeys.EditName);
      }

      if (selectedProperty(heightOffset, offsets.value, offsets.visible)) {
        const info = this.curves[i].curveInformationAt(
          this.parent.grid.guidePoint.x
        );

        if (
          info.framesFromFirst == 0 ||
          info.framesFromFirst == info.framesBetween
        ) {
          this.parent.selected.selectPoint(selection);
          this.parent.inputField.style.setProperty("color", "yellow");

          setInputPosition(left + offsets.value, heightOffset - 10);
          setInputValue(this.curves[i].evaluate(this.parent.grid.guidePoint.x));
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
