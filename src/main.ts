import Vue from "vue";
import App from "./App.vue";
import MiddleClickDrag from "@/components/graph/directives/middle-drag";

Vue.config.productionTip = false;
Vue.directive("drag", MiddleClickDrag);

new Vue({
  render: h => h(App)
}).$mount("#app");
