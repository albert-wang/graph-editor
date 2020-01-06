import { Curve, ControlPoint, ControlPointType } from "@graph/shared/curves";
import { vec2 } from "../shared/math";

type FrameCallback = (p: Player) => void;

export class Player {
  public static LoopForever: number = -1;
  public onframe: FrameCallback[];

  public frame: number = 0;

  private fps: number = 0;
  private accumulatedTime: number = 0;

  private sourceAnimation: Animation;

  private loopCount: number = 1;
  private lastSeenTime = 0;

  constructor(anim: Animation) {
    this.sourceAnimation = anim;
    this.onframe = [];
  }

  public loop(n: number) {
    this.loopCount = n;
  }

  public play(fps: number = 60) {
    this.fps = 60;

    requestAnimationFrame(t => {
      this.updateWithAnimationFrame(t);
    });
  }

  public stop() {
    this.fps = 0;
    this.frame = 0;
  }

  private updateWithAnimationFrame(t: number) {
    if (this.lastSeenTime === 0) {
      this.lastSeenTime = t;
      requestAnimationFrame(t => {
        this.updateWithAnimationFrame(t);
      });
      return;
    }

    if (this.fps === 0) {
      return;
    }

    if (this.frame >= this.sourceAnimation.maximumFrame()) {
      this.frame = this.sourceAnimation.minimumFrame();
      this.accumulatedTime = 0;

      if (this.loopCount > 0) {
        this.loopCount--;
      }

      if (this.loopCount === 0) {
        return;
      }
    }

    const deltaT = t - this.lastSeenTime;
    this.lastSeenTime = t;
    this.advance(deltaT / 1000);

    requestAnimationFrame(t => {
      this.updateWithAnimationFrame(t);
    });
  }

  public advance(dt: number) {
    this.accumulatedTime += dt;
    while (this.accumulatedTime >= 1 / this.fps) {
      const originalFrame = this.frame;
      this.frame += 1;
      this.accumulatedTime -= 1 / this.fps;

      this.frame = Math.min(this.frame, this.sourceAnimation.maximumFrame());
      if (originalFrame !== this.frame) {
        this.trigger();
      }
    }
  }

  public on(v: "frame", f: FrameCallback): FrameCallback {
    this.onframe.push(f);
    return f;
  }

  public off(v: "frame", f: FrameCallback) {
    this.onframe = this.onframe.filter(c => {
      return c != f;
    });
  }

  private trigger() {
    this.onframe.forEach(c => {
      c(this);
    });
  }

  public synthesizeObject(): object {
    return this.sourceAnimation.synthesizeObjectAtFrame(this.frame);
  }

  public evaluate<T extends object>(output: T) {
    return this.sourceAnimation.evaluate(this.frame, output);
  }
}

export class Animation {
  private name: string = "";
  private curves: Curve[] = [];

  private editingChannel: BroadcastChannel | null = null;

  // Editing overrides
  private overrideFrame = 0;
  private overrideCurves: Curve[] = [];

  constructor(name: string) {
    this.name = name;
    if (this.loadEditingState()) {
      this.setupEditingChannel();
    }
  }

  public setCurves(c: Curve[]) {
    this.curves = c;
  }

  public player(): Player {
    return new Player(this);
  }

  public synthesizeObjectAtFrame(f: number): object {
    let curves = this.curves;

    if (this.editingChannel) {
      f = this.overrideFrame;
      curves = this.overrideCurves;
    }

    let output = {};
    curves.forEach(c => {
      if (output.hasOwnProperty(c.name)) {
        // @ts-ignore
        output[c.name] = c.evaluate(f);
      }
    });

    return output;
  }

  public evaluate<T extends object>(f: number, output: T) {
    let curves = this.curves;

    if (this.editingChannel) {
      f = this.overrideFrame;
      curves = this.overrideCurves;
    }

    curves.forEach(c => {
      if (output.hasOwnProperty(c.name)) {
        // @ts-ignore
        output[c.name] = c.evaluate(f);
      }
    });

    return output;
  }

  public edit(grapheditor: string) {
    if (this.loadEditingState()) {
      return;
    }

    window.localStorage.setItem(
      `status-${this.name}`,
      JSON.stringify({
        editing: true,
        curves: this.curves
      })
    );

    this.setupEditingChannel();
    window.open(grapheditor + `?animation=${this.name}`, this.name);
  }

  private loadEditingState() {
    const status = window.localStorage.getItem(`status-${this.name}`);
    if (!status) {
      return;
    }

    let parsedStatus = { editing: false };
    try {
      parsedStatus = JSON.parse(status);
    } catch (e) {
      console.error(e);
      return;
    }

    return parsedStatus.editing;
  }

  public setupEditingChannel() {
    this.editingChannel = new BroadcastChannel(this.name);
    this.editingChannel.onmessage = ev => {
      try {
        const e = JSON.parse(ev.data);
        switch (e.event) {
          case "state": {
            this.overrideFrame = e.data.frame;
            this.overrideCurves = e.data.curves.map((c: any) => {
              return Curve.fromJSON(c);
            });
            break;
          }
          case "close": {
            this.overrideFrame = 0;
            this.curves = this.overrideCurves;
            this.overrideCurves = [];
            if (this.editingChannel) {
              this.editingChannel.close();
              this.editingChannel = null;
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
  }

  public maximumFrame(): number {
    let curves = this.curves;

    if (this.editingChannel) {
      curves = this.overrideCurves;
    }

    const maxframe = curves.reduce((m: number, c: Curve): number => {
      return Math.max(m, c.maximumFrame());
    }, 0);

    return maxframe;
  }

  public minimumFrame(): number {
    let curves = this.curves;

    if (this.editingChannel) {
      curves = this.overrideCurves;
    }

    const minframe = curves.reduce((m: number, c: Curve): number => {
      return Math.min(m, c.minimumFrame());
    }, 0);

    return minframe;
  }
}

interface Keyframe {
  frame: number;
  keyframe: object;
}

export default class GraphDriver {
  public static createAnimationWithKeyframes(
    animation: string,
    keyframes: Keyframe[]
  ): Animation {
    const result = new Animation(animation);

    const sortedFrames = keyframes.sort((a: Keyframe, b: Keyframe) => {
      return a.frame - b.frame;
    });

    // Get all keys.
    const allKeys = keyframes.flatMap(v => {
      return Object.keys(v.keyframe);
    });

    const uniqueKeys = [...new Set(allKeys)];

    // Foreach key
    const curves = uniqueKeys.map((k: string) => {
      const curve = new Curve(k);

      // Foreach frame
      sortedFrames.forEach((frame: Keyframe) => {
        if (frame.keyframe.hasOwnProperty(k)) {
          // If this keyframe affects this property, add in a control point.

          // @ts-ignore
          const value = frame.keyframe[k] as number;
          const cp = new ControlPoint(
            ControlPointType.Beizer,
            vec2(frame.frame, value),
            vec2(frame.frame + 10, value),
            vec2(frame.frame - 10, value)
          );

          curve.controlPoints.push(cp);
        }
      });

      curve.invalidateLUTs();
      return curve;
    });

    result.setCurves(curves);
    return result;
  }

  public static createAnimationWithEndpoints(
    animation: string,
    start: object,
    end: object
  ): Animation {
    return GraphDriver.createAnimationWithKeyframes(animation, [
      {
        frame: 1,
        keyframe: start
      },
      {
        frame: 60,
        keyframe: end
      }
    ]);
  }

  public static loadAnimation(animation: string, curves: any[]): Animation {
    const result = new Animation(animation);
    result.setCurves(
      curves.map(c => {
        return Curve.fromJSON(c);
      })
    );
    return result;
  }
}
