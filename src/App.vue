<template>
  <div id="app">
    <canvas
      ref="canvas"
      tabIndex="0"
      v-drag:middle="middleDrag"
      v-drag:left.click="leftDrag"
      v-drag:right.click="rightDrag"
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
import { DragEvent } from "./components/graph/directives/middle-drag";

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

  // Drag and drop modifiers
  public middleDrag(e: DragEvent) {
    if (!this.graph) {
      return;
    }

    this.graph.mouseMiddleDrag(e);
  }

  public leftDrag(e: DragEvent) {
    if (!this.graph) {
      return;
    }

    this.graph.mouseLeftDrag(e);
  }

  public rightDrag(e: DragEvent) {
    if (!this.graph) {
      return;
    }

    this.graph.mouseRightDrag(e);
  }

  public mouseWheel(e: WheelEvent) {
    if (!this.graph) {
      return;
    }

    this.graph.mouseWheel(e);
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
