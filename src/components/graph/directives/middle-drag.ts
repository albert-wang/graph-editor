import { Vec2, vec2 } from "../util/math";

export interface DragEvent {
  // Pixel values
  delta: Vec2;
  mousePosition: Vec2;
  startingPosition: Vec2;

  isClick: boolean;
  button: string;
}

export default {
  bind(el: HTMLElement, binding: any) {
    const state = {
      mouseDown: false,
      originalPosition: vec2(0, 0),
      startingPosition: vec2(0, 0)
    };

    const buttonMapping = {
      left: 0,
      middle: 1,
      right: 2
    };

    // @ts-ignore
    const targetButton = buttonMapping[binding.arg] || 0;

    // Disable the default right click handler
    el.addEventListener("contextmenu", (e: Event) => {
      e.preventDefault();
      return false;
    });

    el.addEventListener("mousedown", (e: MouseEvent) => {
      if (e.button === targetButton) {
        e.preventDefault();

        state.mouseDown = true;
        state.originalPosition = vec2(e.x, e.y);
        state.startingPosition = vec2(e.x, e.y);

        if (binding.modifiers["click"]) {
          if (typeof binding.value === "function" && state.mouseDown) {
            const ev: DragEvent = {
              delta: vec2(0, 0),
              mousePosition: vec2(e.x, e.y),
              startingPosition: state.startingPosition,
              isClick: true,
              button: binding.arg
            };

            binding.value(ev);
          }
        }
      }
    });

    el.addEventListener("mouseup", (e: MouseEvent) => {
      if (e.button === targetButton) {
        state.mouseDown = false;
      }
    });

    el.addEventListener("mouseleave", (e: MouseEvent) => {
      state.mouseDown = false;
    });

    el.addEventListener("mousemove", (e: MouseEvent) => {
      const delta = vec2(
        e.x - state.originalPosition.x,
        e.y - state.originalPosition.y
      );

      state.originalPosition = vec2(e.x, e.y);

      if (typeof binding.value === "function" && state.mouseDown) {
        const ev: DragEvent = {
          delta: delta,
          mousePosition: vec2(e.x, e.y),
          startingPosition: state.startingPosition,
          isClick: false,
          button: binding.arg
        };

        binding.value(ev);
      }
    });
  }
};
