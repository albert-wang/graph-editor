<template>
  <div id="app">
    <canvas
      ref="canvas"
      tabIndex="0"
      v-drag:middle="middleDrag"
      v-drag:left.click="leftDrag"
      v-drag:right.click="rightDrag"
      @keydown="keyDown"
      @wheel="mouseWheel"
      @mousemove="mouseMove"
    />

    <form @submit="submitAction">
      <input type="text" class="graph-input" ref="input" />
    </form>
  </div>
</template>

<script lang="ts">
//@ts-ignore
import VueContext from "vue-context";

import { Component, Vue } from "vue-property-decorator";
import { Graph } from "./components/graph/graph";
import { vec2, Vec2, negate } from "@graph/shared/math";
import { DragEvent } from "./components/graph/directives/middle-drag";

@Component
export default class App extends Vue {
  $refs!: {
    canvas: HTMLCanvasElement;
    input: HTMLInputElement;
  };

  graph?: Graph;

  constructor() {
    super();
  }

  mounted() {
    const bodyEl = document.querySelector("body")!;
    const bounds = bodyEl.getBoundingClientRect();
    const canvas = this.$refs.canvas;

    window.addEventListener("resize", this.resize);
    window.addEventListener("beforeunload", this.close);

    canvas.width = bounds.width;
    canvas.height = bounds.height;

    this.graph = new Graph(canvas.getContext("2d")!, canvas, bounds, this.$refs.input);

    requestAnimationFrame((t: number) => {
      this.renderGraph(t);
    });
  }

  public keyDown(e: KeyboardEvent) {
    if (!this.graph) {
      return;
    }

    this.graph.keyDown(e);
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

  public mouseMove(e: MouseEvent) {
    if (!this.graph) {
      return;
    }

    this.graph.mouseMove(e);
  }

  public close() {
    if (!this.graph) {
      return;
    }

    this.graph.close();
  }

  public submitAction(e: Event) {
    e.preventDefault();

    if (!this.graph) {
      return false;
    }

    this.graph.submitInput();
    return false;
  }

  public resize() {
    const bodyEl = document.querySelector("body")!;
    const bounds = bodyEl.getBoundingClientRect();
    const canvas = this.$refs.canvas;

    canvas.width = bounds.width;
    canvas.height = bounds.height;

    if (this.graph) {
      this.graph.resize(bounds);
    }
  }

  public renderGraph(t: number) {
    if (this.graph) {
      this.graph.render(t);
    }

    requestAnimationFrame((t: number) => {
      this.renderGraph(t);
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

.graph-input {
  font-size: 12px;
  width: 120px;
  border-width: 1px;
  box-shadow: 0px 0px 0px #000;
  position: absolute;

  background-color: #4f4f4f;
  color: #dfdfdf;
  border-color: #dfdfdf;
}
</style>
