<template>
  <div id="app">
    <canvas
      ref="canvas"
      tabIndex="0"
      v-drag:middle="middleDrag"
      v-drag:left.click="leftDrag"
      @wheel="mouseWheel"
      @mousedown="mouseDown"
    />
  </div>
</template>

<script lang="ts">
//@ts-ignore
import VueContext from "vue-context";

import { Component, Vue } from "vue-property-decorator";
import { Graph } from "./components/graph/graph";
import { vec2, Vec2, negate } from "@/components/graph/util/math";

@Component
export default class App extends Vue {
  $refs!: {
    canvas: HTMLCanvasElement;
  };

  graph?: Graph;

  constructor() {
    super();
  }

  mounted() {
    const bodyEl = document.querySelector("body")!;
    const bounds = bodyEl.getBoundingClientRect();

    this.$refs.canvas.width = bounds.width;
    this.$refs.canvas.height = bounds.height;

    this.graph = new Graph(this.$refs.canvas.getContext("2d")!, bounds);

    this.renderGraph(0);
  }

  public mouseDown(e: MouseEvent) {
    if (e.button == 2) {
      // awet
    }
  }

  public keyDown(e: KeyboardEvent) {
    if (!this.graph) {
      return;
    }
  }

  public leftDrag(_: Vec2, position: Vec2, start: Vec2, isClick: boolean) {
    if (!this.graph) {
      return;
    }

    const grid = this.graph.state.grid;
    if (start.y < 30) {
      grid.setGuidePoint(grid.unproject(position));
    } else {
      if (isClick) {
        this.graph.trySelectPoint(grid.unproject(position));
      } else {
        this.graph.modifyPoint(grid.unproject(position));
      }
    }
  }

  public mouseWheel(e: WheelEvent) {
    if (!this.graph) {
      return;
    }

    this.graph.state.grid.zoom(-e.deltaY);
  }

  // Drag and drop modifiers
  public middleDrag(v: Vec2) {
    if (!this.graph) {
      return;
    }

    this.graph.state.grid.pixelMove(vec2(-v.x, v.y));
  }

  public renderGraph(t: number) {
    if (this.graph) {
      this.graph.render(0);
    }

    requestAnimationFrame(() => {
      this.renderGraph(0);
    });
  }
}
</script>

<style>
html,
body {
  height: 100%;
  width: 100%;

  padding: 0;
  margin: 0;

  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  overflow: hidden;
}

#app {
  height: 100%;
  width: 100%;
}
</style>
