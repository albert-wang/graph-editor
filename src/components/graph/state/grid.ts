import { vec2, Vec2, Rect } from "@graph/shared/math";
import State from ".";

export default class GridState {
  // Position is the location of the top left of the grid
  public position: Vec2;

  // The zoom level.
  // Each scale unit is how many pixels per unit in both axis
  public scale: Vec2;

  // The guide point is the point that the guides are drawn at
  public guidePoint: Vec2;

  // The repeat frame is the frame at which the animation will reset
  // to zero from. Generally the same as guidePoint.x, until specifically
  // set differently.
  public repeatFrame: number | undefined;

  private parent: State;

  constructor(parent: State, position: Vec2) {
    this.parent = parent;
    this.position = position;
    this.scale = vec2(15, 50);
    this.guidePoint = vec2(1, 0);
  }

  // Operations for moving the grid
  public pixelMove(direction: Vec2) {
    this.position.x += direction.x / this.scale.x;
    this.position.y += direction.y / this.scale.y;
  }

  public zoom(val: number) {
    const oldScale = vec2(this.scale.x, this.scale.y);

    this.scale.x += (this.scale.x * val) / 1000;
    this.scale.y += (this.scale.y * val) / 1000;

    this.scale.x = Math.min(Math.max(this.scale.x, 0.25), 10000);
    this.scale.y = Math.min(Math.max(this.scale.y, 0.25), 10000);
  }

  public setGuidePoint(p: Vec2) {
    this.guidePoint = p;
    this.guidePoint.x = Math.round(this.guidePoint.x);
    this.guidePoint.y = Math.round(this.guidePoint.y * 1000) / 1000;
  }

  // Functions to project and unproject world/pixel coordinates
  public project(p: Vec2): Vec2 {
    return vec2(
      (p.x - this.position.x) * this.scale.x,
      this.parent.bounds.y - (p.y - this.position.y) * this.scale.y
    );
  }

  public unproject(p: Vec2): Vec2 {
    return vec2(
      p.x / this.scale.x + this.position.x,
      (this.parent.bounds.y - p.y) / this.scale.y + this.position.y
    );
  }

  // Horizontal accessors

  // Horizontal minimum is the frame at the top left of the screen
  private get horizontalFractionalToNextRule() {
    // This is computed as a function of the position and scale values.
    // we prefer to land on a multiple of 5 (1, 5, 10, 15, etc.)
    if (this.position.x == 0) {
      return 0;
    }

    // Compute the next step to a factor of 5.
    const remainder = this.position.x % this.horizontalInterval;
    return remainder;
  }

  public get horizontalMinimum() {
    return (
      Math.trunc(this.position.x / this.horizontalInterval) *
      this.horizontalInterval
    );
  }

  public get horizontalPixelStart() {
    // Compute how many pixels that would be
    return -this.horizontalFractionalToNextRule * this.scale.x;
  }

  public get horizontalPixelStep() {
    return this.horizontalInterval * this.scale.x;
  }

  public get horizontalInterval() {
    // Compute the interval based on the scale.
    // The base scale is 50 pixels = 10 frames, and we scale based on that.
    const validIntervals = [
      0.01,
      0.02,
      0.05,
      0.1,
      0.25,
      0.5,
      1, // scale =
      2,
      5, // scale = 2.5
      10, // scale = 5
      20,
      50,
      100,
      200
    ];

    const scaleFactor = (10 * 5) / this.scale.x;
    for (let i = 0; i < validIntervals.length; ++i) {
      if (scaleFactor <= validIntervals[i]) {
        return validIntervals[i];
      }
    }

    return 200;
  }

  // Vertical accessors
  private get verticalFractionalToNextRule() {
    // This is computed as a function of the position and scale values.
    // we prefer to land on a multiple of 5 (1, 5, 10, 15, etc.)
    if (this.position.y == 0) {
      return 0;
    }

    // Compute the next step to a factor of 5.
    const remainder = this.position.y % this.verticalInterval;
    return remainder;
  }

  public get verticalMinimum() {
    return (
      Math.trunc(this.position.y / this.verticalInterval) *
      this.verticalInterval
    );
  }

  public get verticalPixelStart() {
    return -this.verticalFractionalToNextRule * this.scale.y;
  }

  public get verticalPixelStep() {
    return this.verticalInterval * this.scale.y;
  }

  public get verticalInterval() {
    // Compute the interval based on the scale.
    // The base scale is 50 pixels = 10 frames, and we scale based on that.
    const validIntervals = [
      0.01,
      0.02,
      0.05,
      0.1,
      0.25,
      0.5,
      1,
      2,
      5, // scale = 2.5
      10, // scale = 5
      20,
      50,
      100,
      200
    ];

    const scaleFactor = (10 * 5) / this.scale.y;
    for (let i = 0; i < validIntervals.length; ++i) {
      if (scaleFactor <= validIntervals[i]) {
        return validIntervals[i];
      }
    }

    return 200;
  }
}
