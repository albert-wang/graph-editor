import { Vec2, vec2 } from "@graph/shared/math";

export interface DragEvent {
  // Pixel values
  delta: Vec2;
  mousePosition: Vec2;
  startingPosition: Vec2;

  isClick: boolean;
  isMouseUp: boolean;
  isStartDrag: boolean;
  button: string;

  ctrl: boolean;
  shift: boolean;

  disableDrag: Function;
}

export default {
  bind(el: HTMLElement, binding: any) {
    const state = {
      mouseDown: false,
      originalPosition: vec2(0, 0),
      startingPosition: vec2(0, 0),
      isDragging: false
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
        state.mouseDown = true;
        state.isDragging = false;
        state.originalPosition = vec2(e.x, e.y);
        state.startingPosition = vec2(e.x, e.y);

        if (binding.modifiers["click"]) {
          if (typeof binding.value === "function" && state.mouseDown) {
            const ev: DragEvent = {
              delta: vec2(0, 0),
              mousePosition: vec2(e.x, e.y),
              startingPosition: state.startingPosition,
              isClick: true,
              isMouseUp: false,
              isStartDrag: false,
              button: binding.arg,
              ctrl: e.ctrlKey,
              shift: e.shiftKey,
              disableDrag: () => {
                state.mouseDown = false;
              }
            };

            binding.value(ev);
          }
        }
      }
    });

    el.addEventListener("mouseup", (e: MouseEvent) => {
      if (e.button === targetButton) {
        state.mouseDown = false;
        const ev: DragEvent = {
          delta: vec2(0, 0),
          mousePosition: vec2(e.x, e.y),
          startingPosition: state.startingPosition,
          isClick: false,
          isMouseUp: true,
          isStartDrag: false,
          button: binding.arg,
          ctrl: e.ctrlKey,
          shift: e.shiftKey,
          disableDrag: () => {
            state.mouseDown = false;
          }
        };

        binding.value(ev);
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
          isMouseUp: false,
          isStartDrag: false,
          button: binding.arg,
          ctrl: e.ctrlKey,
          shift: e.shiftKey,
          disableDrag: () => {
            state.mouseDown = false;
          }
        };

        if (!state.isDragging) {
          state.isDragging = true;
          ev.isStartDrag = true;
        }

        binding.value(ev);
      }
    });
  }
};
