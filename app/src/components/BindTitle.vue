<template>
  <div style="display: none"></div>
</template>

<script lang="ts">
import { Component, Vue, Watch, Prop } from "vue-property-decorator";

function sample<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

@Component({})
export default class BindTitle extends Vue {
  @Prop(String) value!: string;

  stealthMode = false;

  getStealthValue() {
    return sample([
      "Excel for Windows training",
      "Basic Microsoft Office Training",
      "How to use the Excel VLOOKUP Function",
      "powerpoint - Google Search",
      "Using Advanced Features of MS Powerpoint"
    ]);
  }

  setTitle(str: string) {
    document.title = this.stealthMode ? this.getStealthValue() : str;
  }

  mounted() {
    this.setTitle(this.value || "");
  }

  @Watch("value")
  onValueChange(str: string) {
    this.setTitle(str);
  }
}
</script>
