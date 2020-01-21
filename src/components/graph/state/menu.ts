import State from "../state";
import { StateActionKeys, StateEvent, event } from "../actions";
import {
  Vec2,
  vec2,
  add,
  pointInBox,
  pointInTriangle
} from "@graph/shared/math";
import KeyboardActions from "../actions/keyboard";
import Sizes from "../rendering/sizes";
import { ControlPointType } from "@graph/shared/curves";

export enum MenuOptionType {
  Default = 0,
  Header = 1,
  Spacer = 2
}

export interface MenuOption {
  type: MenuOptionType;
  label: string;
  action: StateEvent;
  shortcut: string;

  children: MenuOption[];
  computedOffset: number;
  enabled: boolean;
}

export interface OptionTree {
  options: MenuOption[];
}

export default class Menu {
  // pixel coordinates
  position: Vec2;
  mousePosition: Vec2;
  mousePositionOnOpen: Vec2;

  tree: OptionTree;
  visible: boolean;

  optionPath: MenuOption[];

  private parent: State;

  // Used to handle some behavior with moving to child menus
  private disableBufferTriangles: boolean;

  // Used to expand child menus after some time.
  private enteredRootElementTimestamp: number;

  private simpleOption(
    label: string,
    action: StateEvent,
    enabled: boolean = true,
    children: MenuOption[] = []
  ): MenuOption {
    const keys = KeyboardActions.shortcuts;
    let shortcut = "";
    Object.keys(keys).forEach(v => {
      // @ts-ignore
      if (keys[v] === action) {
        shortcut = v;
      }
    });

    return {
      type: MenuOptionType.Default,
      label: label,
      action: action,
      children: children,
      computedOffset: 0,
      enabled: enabled,
      shortcut: shortcut
    };
  }

  private spacer() {
    return {
      type: MenuOptionType.Spacer,
      label: "",
      action: event(""),
      shortcut: "",
      children: [],
      computedOffset: 0,
      enabled: true
    };
  }

  private header(name: string) {
    return {
      type: MenuOptionType.Header,
      label: name,
      action: event(""),
      shortcut: "",
      children: [],
      computedOffset: 0,
      enabled: true
    };
  }

  constructor(parent: State) {
    this.position = vec2(0, 0);
    this.mousePosition = vec2(0, 0);
    this.mousePositionOnOpen = vec2(0, 0);
    this.optionPath = [];
    this.parent = parent;
    this.disableBufferTriangles = true;
    this.enteredRootElementTimestamp = 0;
    this.tree = { options: [] };

    this.rebuildOptions();
    this.visible = false;
  }

  public size(options: MenuOption[]): Vec2 {
    let height = 0;
    options.forEach((v: MenuOption) => {
      height += this.offsetOf(v);
    });

    return vec2(Sizes.MenuWidth, height);
  }

  public setOptionTree(options: OptionTree) {
    this.tree = options;
  }

  public show() {
    this.rebuildOptions();
    this.visible = true;
  }

  public hide() {
    this.visible = false;
  }

  public click(v: Vec2): StateEvent {
    if (this.visible) {
      this.mousePosition = v;
      this.optionPath = this.optionPathUnderMouse();

      if (this.optionPath.length) {
        const selected = this.optionPath[this.optionPath.length - 1];

        if (
          // Root selection.
          // Selected option has no children, so this is a valid selection
          (this.optionPath.length == 1 &&
            this.optionPath[0] == selected &&
            this.optionPath[0].children.length == 0) ||
          // Child selection.
          this.optionPath.length == 2
        ) {
          this.hide();
          if (selected.enabled) {
            return selected.action;
          }
        }
      }
    }

    return event("");
  }

  public setMousePosition(v: Vec2) {
    this.mousePosition = v;

    if (!this.visible) {
      this.optionPath = [];
      return;
    }

    this.optionPath = this.optionPathUnderMouse();

    if (this.optionPath.length === 0) {
      if (
        !pointInBox(
          this.mousePosition,
          add(this.position, vec2(-40, -40)),
          add(this.size(this.tree.options), vec2(80, 150))
        )
      ) {
        console.log("hiding due to no options under path");
        this.hide();
      }
    }
  }

  public setPosition(v: Vec2) {
    this.position = vec2(v.x, v.y);
    this.mousePositionOnOpen = vec2(v.x, v.y);
    if (
      this.position.x + Sizes.MenuWidth * 2 + Sizes.PropertiesWidth >
      this.parent.bounds.x
    ) {
      this.position.x -= Sizes.MenuWidth;
    }
  }

  private rebuildOptions() {
    let hasSelectedPoint = false;
    if (this.parent.selected && this.parent.selected.point) {
      hasSelectedPoint = true;
    }

    let hasSelectedCurve = false;
    if (this.parent.selected && this.parent.selected.curve) {
      hasSelectedCurve = true;
    }

    const noop = event("");

    const options = [
      this.header("Curve Context Menu"),
      this.spacer(),
      this.simpleOption("Copy Curves JSON", event(StateActionKeys.Copy)),
      this.simpleOption("Play", noop, true, [
        this.header("Playback Speed"),
        this.spacer(),
        this.simpleOption(
          "Play 6fps",
          event(StateActionKeys.PlayAtFPS, vec2(0, 0), { fps: 6 })
        ),
        this.simpleOption(
          "Play 12fps",
          event(StateActionKeys.PlayAtFPS, vec2(0, 0), { fps: 12 })
        ),
        this.simpleOption(
          "Play 24fps",
          event(StateActionKeys.PlayAtFPS, vec2(0, 0), { fps: 24 })
        ),
        this.simpleOption(
          "Play 30fps",
          event(StateActionKeys.PlayAtFPS, vec2(0, 0), { fps: 30 })
        ),
        this.simpleOption(
          "Play 60fps",
          event(StateActionKeys.PlayAtFPS, vec2(0, 0), { fps: 60 })
        ),
        this.simpleOption(
          "Play 90fps",
          event(StateActionKeys.PlayAtFPS, vec2(0, 0), { fps: 90 })
        ),
        this.simpleOption(
          "Play 120fps",
          event(StateActionKeys.PlayAtFPS, vec2(0, 0), { fps: 120 })
        ),
        this.simpleOption(
          "Play 144fps",
          event(StateActionKeys.PlayAtFPS, vec2(0, 0), { fps: 144 })
        ),
        this.simpleOption(
          "Play 240fps",
          event(StateActionKeys.PlayAtFPS, vec2(0, 0), { fps: 240 })
        )
      ]),
      this.spacer(),
      this.simpleOption("Guides", noop, true, [
        this.header("Guides"),
        this.spacer(),
        this.simpleOption(
          "Frame Guide to Selected",
          event(StateActionKeys.SetGuideFrameToSelectedPointFrame),
          hasSelectedPoint
        ),
        this.simpleOption(
          "Move Frame Guide",
          event(StateActionKeys.SetGuideFrame)
        ),
        this.simpleOption(
          "Move Value Guide",
          event(StateActionKeys.SetGuideValue)
        ),
        this.simpleOption(
          "Set Repeat Frame",
          event(StateActionKeys.EditRepeatFrame)
        ),
        this.simpleOption(
          "Clear Repeat Frame",
          event(StateActionKeys.ClearRepeatFrame)
        )
      ]),
      this.spacer(),
      this.simpleOption("Interpolation", noop, hasSelectedPoint, [
        this.header("Interpolation"),
        this.spacer(),
        this.simpleOption(
          "Linear",
          event(StateActionKeys.ChangeInterpolationType, vec2(0, 0), {
            type: ControlPointType.Linear
          })
        ),
        this.simpleOption(
          "Flat",
          event(StateActionKeys.ChangeInterpolationType, vec2(0, 0), {
            type: ControlPointType.LinearFlat
          })
        ),
        this.simpleOption(
          "Beizer",
          event(StateActionKeys.ChangeInterpolationType, vec2(0, 0), {
            type: ControlPointType.Beizer
          })
        ),
        this.simpleOption(
          "Continuous Beizer",
          event(StateActionKeys.ChangeInterpolationType, vec2(0, 0), {
            type: ControlPointType.BeizerContinuous
          })
        ),
        this.spacer(),
        ...this.easings()
      ]),
      this.simpleOption("Handles", noop, hasSelectedPoint, [
        this.header("Handles"),
        this.spacer(),
        this.simpleOption("Mirror handles (value)", noop),
        this.simpleOption("Mirror handles (frame)", noop)
      ]),
      this.simpleOption(
        "Insert keyframe",
        event(StateActionKeys.InsertKeyframe)
      ),
      this.simpleOption(
        "Insert keyframe in all curves",
        event(StateActionKeys.InsertKeyframeAllCurves)
      ),
      this.simpleOption("Snap", noop, hasSelectedPoint, [
        this.header("Snap ..."),
        this.spacer(),
        this.simpleOption(
          "To selected frame",
          event(StateActionKeys.SnapFrame)
        ),
        this.simpleOption("Value to guide", event(StateActionKeys.SnapValue))
      ])
    ];

    this.computeOffsetForOptions(options);
    this.setOptionTree({
      options: options
    });
  }

  private easings(): MenuOption[] {
    const easing = (name: string, values: number[]) => {
      return this.simpleOption(
        name,
        event(StateActionKeys.UseFixedControlPoints, vec2(0, 0), {
          first: [values[0], values[1]],
          second: [values[2], values[3]]
        })
      );
    };

    return [
      easing("Smoothstep (1)", [0.25, 0, 0.75, 1]),
      easing("Smoothstep (2)", [0.35, 0, 0.65, 1]),
      easing("Sine in", [0.47, 0, 0.745, 0.715]),
      easing("Sine out", [0.39, 0.575, 0.565, 1]),
      easing("Sine in-out", [0.445, 0.05, 0.55, 0.95])
    ];
  }

  private optionPathUnderMouse(): MenuOption[] {
    const size = this.size(this.tree.options);
    const result: MenuOption[] = [];

    // again, assumption is that there are only two levels of menu
    // If the submenu is expanded, then as long as the mouse is within
    // a fairly large area of the menu, don't change the root node of the option path.
    if (this.optionPath.length && this.optionPath[0].children.length) {
      const root = this.optionPath[0];
      const childSize = this.size(root.children);

      const inRootOption = pointInBox(
        this.mousePosition,
        vec2(this.position.x, this.position.y + root.computedOffset),
        vec2(size.x, this.offsetOf(root))
      );

      const inChildMenu = pointInBox(
        this.mousePosition,
        add(this.position, vec2(size.x, root.computedOffset - 10)),
        childSize
      );

      const upperLeft = vec2(
        this.position.x + 30,
        this.position.y + root.computedOffset - 10
      );

      let inUpperBufferTriangle = pointInTriangle(this.mousePosition, [
        upperLeft,
        add(upperLeft, vec2(size.x, 0)),
        add(upperLeft, vec2(size.x, -15))
      ]);

      const lowerLeft = add(upperLeft, vec2(0, this.offsetOf(root)));
      let inLowerBufferTriangle = pointInTriangle(this.mousePosition, [
        lowerLeft,
        add(lowerLeft, vec2(size.x, childSize.y)),
        add(lowerLeft, vec2(size.x, 0))
      ]);

      // If we were ever in the child menu, disable the upper and lower buffer triangles
      if (this.disableBufferTriangles) {
        inLowerBufferTriangle = false;
        inUpperBufferTriangle = false;
      }

      const inChildBuffer = pointInBox(
        this.mousePosition,
        add(this.position, vec2(size.x - 15, root.computedOffset - 65)),
        add(childSize, vec2(50, 65))
      );

      if (
        inRootOption ||
        inChildMenu ||
        inUpperBufferTriangle ||
        inLowerBufferTriangle ||
        inChildBuffer
      ) {
        if (inChildMenu) {
          root.children.forEach(c => {
            if (
              pointInBox(
                this.mousePosition,
                add(upperLeft, vec2(size.x, c.computedOffset - 30)),
                vec2(childSize.x, this.offsetOf(c))
              )
            ) {
              result.push(root);
              result.push(c);
            }
          });

          if (result.length == 0) {
            result.push(root);
          }

          this.disableBufferTriangles = true;
          return result;
        } else {
          return [root];
        }
      }
    }

    this.tree.options.forEach(v => {
      const upperLeft = vec2(
        this.position.x,
        this.position.y + v.computedOffset - 10
      );
      if (
        pointInBox(
          this.mousePosition,
          upperLeft,
          vec2(size.x, this.offsetOf(v))
        )
      ) {
        result.push(v);

        // Compute a minimum time to enable the buffer triangles
        const now = new Date().valueOf();
        if (
          // If the buffer triangles are disabled
          this.disableBufferTriangles &&
          // And the selected root option has changed
          v != this.optionPath[0]
        ) {
          // Start the timer
          this.enteredRootElementTimestamp = now;
        }

        // Otherwise, if it has been 500 milliseconds, enable the buffer triangles
        if (now - this.enteredRootElementTimestamp > 500) {
          this.disableBufferTriangles = false;
        }
      }

      // assume only one level
      const childSize = this.size(v.children);
      v.children.forEach(c => {
        if (
          pointInBox(
            this.mousePosition,
            add(upperLeft, vec2(size.x, c.computedOffset - 10)),
            vec2(childSize.x, this.offsetOf(c))
          )
        ) {
          result.push(v);
          result.push(c);
          this.disableBufferTriangles = true;
        }
      });
    });

    return result;
  }

  private offsetOf(option: MenuOption): number {
    switch (option.type) {
      case MenuOptionType.Spacer:
        return 2;
    }

    return 20;
  }

  private computeOffsetForOptions(options: MenuOption[]) {
    let height = 12;
    options.forEach(v => {
      v.computedOffset = height;
      height += this.offsetOf(v);

      if (v.children.length) {
        this.computeOffsetForOptions(v.children);
      }
    });
  }
}
