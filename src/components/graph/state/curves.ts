import { vec2, Vec2, add, sub } from "@/shared/math";
import { Curve, ControlPoint, ControlPointType } from "@/shared/curves";

import State from ".";
// @ts-ignore
import beizer from "bezier-js";
import { assert } from "../util/assert";
import colors from "../rendering/colors";

enum SelectedPointType {
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
            point.type === ControlPointType.Beizer &&
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
            previous.type === ControlPointType.Beizer &&
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
    // The requested insertion point is before the first frame
    if (info.points[0] === null) {
      assert(info.points[1]);
      const n = info.points[1]!;

      const position = vec2(frame, n.position.y);
      const delta = vec2(info.framesBetween / 4, 0);

      c.controlPoints.push(
        new ControlPoint(
          n.type,
          position,
          add(position, delta),
          sub(position, delta)
        )
      );
    } else if (info.points[1] === null) {
      assert(info.points[0]);
      const f = info.points[0]!;

      const position = vec2(frame, f.position.y);
      const delta = vec2(info.framesBetween / 4, 0);

      c.controlPoints.push(
        new ControlPoint(
          f.type,
          position,
          add(position, delta),
          sub(position, delta)
        )
      );
    } else {
      const f = info.points[0]!;
      const n = info.points[1]!;

      const delta = vec2(info.framesBetween / 4, 0);

      if (f.type === ControlPointType.Linear) {
        const y = (n.position.y - f.position.y) * info.t + f.position.y;
        const position = vec2(frame, y);
        c.controlPoints.push(
          new ControlPoint(
            f.type,
            position,
            add(position, delta),
            sub(position, delta)
          )
        );
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

        const y = b.get(info.t).y;
        const position = vec2(frame, y);
        c.controlPoints.push(
          new ControlPoint(
            f.type,
            position,
            add(position, delta),
            sub(position, delta)
          )
        );
      }
    }

    const res = c.controlPoints[c.controlPoints.length - 1];
    this.sortCurve(c);
    return res;
  }

  public addCurve(c: Curve) {
    c.color = colors.LineColors[this.curves.length];
    this.curves.push(c);

    if (!this.parent.selected.curve) {
      this.parent.selected.curve = c;
    }
  }

  public modifyPoint(point: SelectedPoint, position: Vec2) {
    if (!point.curve || !point.point) {
      console.log("curve or point null, skipping");
      return;
    }

    // Clear out the selection history on drag.
    this.parent.selected.pointHistory = [];

    switch (point.handle) {
      case SelectedPointType.Backward:
        point.point.backwardsHandle = position;
        break;
      case SelectedPointType.Forward:
        point.point.forwardHandle = position;
        break;
      case SelectedPointType.Point: {
        const old = vec2(point.point.position.x, point.point.position.y);
        point.point.position = position;
        point.point.position.x = Math.round(point.point.position.x);

        const delta = sub(point.point.position, old);
        point.point.forwardHandle = add(point.point.forwardHandle, delta);
        point.point.backwardsHandle = add(point.point.backwardsHandle, delta);
        point.point.position = position;
        break;
      }
    }

    this.sortCurve(point.curve);
  }

  private sortCurve(curve: Curve) {
    curve.controlPoints.sort((a, b) => {
      return a.position.x - b.position.x;
    });
  }
}
