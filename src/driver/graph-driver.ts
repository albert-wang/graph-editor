import { Curve, ControlPoint, ControlPointType } from "@graph/shared/curves";
import { vec2 } from "../shared/math";

import { getInstanceAnimationAndTween } from "./anime-integration";

type FrameCallback = (p: Player) => void;

interface NormalizeParameters {
  domain?: number[];
  range?: number[];
}

interface AnimeJSNormalizeParameters {
  valueMultiplier?: number;
  animationInstance?: any;
}

const standardNormalizeParameters: NormalizeParameters = {
  domain: [0, 1],
  range: [0, 1]
};

const PlaybackFPS = 60;

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

  public play() {
    this.fps = PlaybackFPS;

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

  public underlyingAnimationIsBeingEdited() {
    return typeof this.sourceAnimation.overridenFrame() !== "undefined";
  }

  // Fairly specific library transformation function.
  public animejsProperty(
    name: string,
    normalizeParams: AnimeJSNormalizeParameters = {},
    additional: any = {}
  ) {
    const curve = this.sourceAnimation.curve(name);
    if (!curve) {
      console.log("No curve ", name);
      return {};
    }

    const value = [0, 1];
    if (normalizeParams.valueMultiplier) {
      value[1] = normalizeParams.valueMultiplier;
    }

    const easing = () => {
      const tweenFunction = this.normalized(name, { domain: [0, 1] });
      const val = (t: number) => {
        let delay = 0;
        if (
          normalizeParams.animationInstance &&
          this.underlyingAnimationIsBeingEdited()
        ) {
          const anime = normalizeParams.animationInstance;
          const info = getInstanceAnimationAndTween(anime, val);
          if (info) {
            // Extract the delay
            delay = info.tween.delay;

            // Setup the restart looper iff we haven't done it before
            if (!info.instance.__original_complete_callback) {
              // Save the old complete callback
              info.instance.__original_complete_callback =
                info.instance.complete;

              // Setup the new complete callback
              info.instance.complete = () => {
                requestAnimationFrame(() => {
                  if (this.underlyingAnimationIsBeingEdited()) {
                    // Restart if the animation is being edited.
                    info.instance.restart();
                  } else {
                    // Otherwise, invoke the original callback.
                    if (info.instance.__original_complete_callback) {
                      info.instance.complete =
                        info.instance.__original_complete_callback;
                      info.instance.__original_complete_callback(info.instance);
                    }
                  }
                });
              };
            }
          }
        }

        return tweenFunction(t, delay / 1000);
      };

      return val;
    };

    const res = {
      value: value,
      duration:
        ((curve.maximumFrame() - curve.minimumFrame()) / PlaybackFPS) * 1000,
      easing: easing,
      ...additional
    };

    return res;
  }

  // Returns a function that takes in a single number in the params' domain, and
  // then outputs a number in the params' range, following the curve
  // given as the prop.
  // Both the range and the domain must either be two element arrays, representing
  // the minimum and maximum value of the range, or empty, which then uses the
  // original range or domain.
  public normalized(
    prop: string,
    normalizeParams: NormalizeParameters = standardNormalizeParameters
  ) {
    return (t: number, delay: number = 0) => {
      // Setup inputs
      let inputDomain: number[] = normalizeParams.domain || [];
      let inputRange: number[] = normalizeParams.range || [];

      // We reevaluate the curve every time since it can change
      // due to editor actions.
      const curve = this.sourceAnimation.curve(prop);

      // No such curve, return default values.
      if (!curve) {
        if (inputRange.length === 0) {
          return 0;
        }

        return inputRange[0];
      }

      const min = curve.minimumValue();
      const max = curve.maximumValue();

      const minF = curve.minimumFrame();
      const maxF = curve.maximumFrame();

      let domain = inputDomain;
      if (domain.length === 0) {
        domain = [minF, maxF];
      }

      let range = inputRange;
      if (range.length === 0) {
        range = [min, max];
      }

      const domainDelta = domain[1] - domain[0];
      let f = 0;
      if (Math.abs(domainDelta) > 0.000001) {
        f = minF + ((maxF - minF) * (t - domain[0])) / domainDelta;
      }

      const overrideFrame = this.sourceAnimation.overridenFrame();
      if (overrideFrame) {
        f = overrideFrame;

        if (delay !== 0) {
          f = Math.floor(f - delay * PlaybackFPS);
          f = Math.min(f, maxF);
          f = Math.max(f, minF);
        }
      }

      const v = curve.evaluate(f);
      const minMaxDelta = max - min;
      if (Math.abs(minMaxDelta) < 0.000001) {
        return range[0];
      } else {
        const res =
          range[0] + ((v - min) / minMaxDelta) * (range[1] - range[0]);
        return res;
      }
    };
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

  public curve(name: string): Curve | undefined {
    const nameP = (c: Curve) => {
      return c.name === name;
    };

    if (this.editingChannel) {
      return this.overrideCurves.find(nameP);
    }

    return this.curves.find(nameP);
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
      // @ts-ignore
      output[c.name] = c.evaluate(f);
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

    try {
      let parsedStatus = { editing: false, curves: [] };
      parsedStatus = JSON.parse(status);
      if (!parsedStatus.editing) {
        return false;
      }

      this.overrideCurves = parsedStatus.curves.map((c: any) => {
        return Curve.fromJSON(c);
      });

      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
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

  public overridenFrame(): number | undefined {
    if (this.editingChannel) {
      return this.overrideFrame;
    }
    return undefined;
  }

  public maximumFrame(): number {
    let curves = this.curves;

    if (this.editingChannel) {
      curves = this.overrideCurves;
    }

    if (curves.length == 0) {
      return 0;
    }

    const maxframe = curves.reduce((m: number, c: Curve): number => {
      return Math.max(m, c.maximumFrame());
    }, curves[0].maximumFrame());

    return maxframe;
  }

  public minimumFrame(): number {
    let curves = this.curves;

    if (this.editingChannel) {
      curves = this.overrideCurves;
    }

    if (curves.length == 0) {
      return 0;
    }

    const minframe = curves.reduce((m: number, c: Curve): number => {
      return Math.min(m, c.minimumFrame());
    }, curves[0].minimumFrame());

    return minframe;
  }

  public maximumValue() {
    let curves = this.curves;

    if (this.editingChannel) {
      curves = this.overrideCurves;
    }

    if (curves.length === 0) {
      return 0;
    }

    const minValue = curves.reduce((m: number, c: Curve): number => {
      return Math.min(m, c.maximumValue());
    }, curves[0].maximumValue());

    return minValue;
  }

  public minimumValue() {
    let curves = this.curves;

    if (this.editingChannel) {
      curves = this.overrideCurves;
    }

    if (curves.length === 0) {
      return 0;
    }

    const minValue = curves.reduce((m: number, c: Curve): number => {
      return Math.min(m, c.minimumValue());
    }, curves[0].minimumValue());

    return minValue;
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
