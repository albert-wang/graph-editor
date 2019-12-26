import { vec2 } from "../util/math";

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

    el.addEventListener("mousedown", (e: MouseEvent) => {
      if (e.button === targetButton) {
        state.mouseDown = true;
        state.originalPosition = vec2(e.x, e.y);
        state.startingPosition = vec2(e.x, e.y);

        if (binding.modifiers["click"]) {
          if (typeof binding.value === "function" && state.mouseDown) {
            binding.value(
              vec2(0, 0),
              vec2(e.x, e.y),
              state.startingPosition,
              true
            );
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
        binding.value(delta, vec2(e.x, e.y), state.startingPosition, false);
      }
    });
  }
};
