<template>
  <div>
    <div @click="edit">{{ X }}, {{ Y }}, {{ Z }}</div>
    <div class="box"></div>
    <div class="box"></div>
    <div class="box"></div>
    <div class="box"></div>
    <div class="box"></div>
    <div class="box"></div>
  </div>
</template>
<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import GraphDriver, { Animation, Player } from "@/driver/graph-driver";
import anime from "animejs";

interface AnimationStruct {
  X: number;
  Y: number;
  Z: number;
}

@Component
export default class App extends Vue {
  $refs!: {
    box: HTMLDivElement;
  };

  animation: Animation;
  player: Player;

  values: AnimationStruct = {
    X: 0,
    Y: 0,
    Z: 0
  };

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
    this.player.on("frame", (curve: Player) => {
      curve.evaluate(this.values);
    });
  }

  mounted() {
    const normalizationParams = {
      valueMultiplier: 100,
      animationInstance: anime
    };

    anime({
      targets: ".box",
      translateX: this.player.animejsProperty("X", normalizationParams),
      translateY: this.player.animejsProperty("Y", normalizationParams),
      loop: 1000,
      direction: "alternate",
      delay: anime.stagger(200)
    });

    console.log(anime.running);
  }

  edit() {
    this.animation.edit("/main.html");
  }

  public get X() {
    return this.values.X;
  }

  public get Y() {
    return this.values.Y;
  }

  public get Z() {
    return this.values.Z;
  }
}
</script>
<style scoped="true">
.box {
  background-color: red;
  height: 10px;
  width: 10px;
  margin: 2px;
}
</style>
