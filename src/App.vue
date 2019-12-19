<template>
  <div id="app">
    <canvas ref="canvas" />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { Graph } from "./components/graph/graph";

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
