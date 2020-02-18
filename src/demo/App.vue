<template>
  <div>
    <div @click="edit">Edit</div>
    <div @click="play">Play</div>
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
    this.player.loop(4);
    window.anime = anime;
  }

  mounted() {
    this.play();
  }

  play() {
    const normalizationParams = {
      valueMultiplier: 100,
      animationInstance: anime
    };

    anime({
      targets: ".box",
      translateX: this.player.animejsProperty("X", normalizationParams),
      translateY: this.player.animejsProperty("Y", normalizationParams),
      direction: "alternate",
      delay: anime.stagger(200)
    });
  }

  edit() {
    this.animation.edit("/main.html");
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
