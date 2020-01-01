<template>
  <div>
    <div @click="edit">{{ X }}, {{ Y }}, {{ Z }}</div>
    <div
      class="box"
      :style="{ top: `${Y * 100}px`, left: `${X * 100}px` }"
    ></div>
  </div>
</template>
<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import GraphDriver, { Animation, Player } from "@/driver/graph-driver";

interface AnimationStruct {
  X: number;
  Y: number;
  Z: number;
}

@Component
export default class App extends Vue {
  $refs!: {
    canvas: HTMLCanvasElement;
  };

  animation: Animation;
  player: Player;

  constructor() {
    super();

    this.animation = GraphDriver.createAnimationWithEndpoints(
      "SpiralIn",
      {
        X: 0,
        Y: 0
      },
      {
        X: 4,
        Y: 4
      }
    );

    this.player = this.animation.player();
    this.player.loop(Player.LoopForever);
    this.player.play();
  }

  edit() {
    this.animation.edit("/main.html");
  }

  public get X() {
    const v: AnimationStruct = {
      X: 0,
      Y: 0,
      Z: 0
    };

    this.animation.evaluate(this.player.frame, v);
    return v.X;
  }

  public get Y() {
    const v: AnimationStruct = {
      X: 0,
      Y: 0,
      Z: 0
    };

    this.animation.evaluate(this.player.frame, v);
    return v.Y;
  }

  public get Z() {
    const v: AnimationStruct = {
      X: 0,
      Y: 0,
      Z: 0
    };

    this.animation.evaluate(this.player.frame, v);
    return v.Z;
  }
}
</script>
<style scoped="true">
.box {
  background-color: red;
  height: 10px;
  width: 10px;
  position: absolute;
}
</style>
