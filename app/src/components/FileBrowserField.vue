<template>
  <div class="d-flex align-center">
    <v-text-field v-model="innerValue" v-on="$listeners" v-bind="$attrs">
      <template #append>
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-icon v-on="on" @click.stop="showPicker = true">mdi-folder-open</v-icon>
          </template>
          <span>Browse</span>
        </v-tooltip>
      </template>
    </v-text-field>

    <FileBrowser
      v-model="showPicker"
      @select="innerValue = $event"
      :multiple="false"
      :allowFile="allowFile"
      :allowFolder="allowFolder"
      :extensions="extensions"
      :defaultValue="innerValue"
      :defaultBrowsePath="defaultBrowsePath"
    ></FileBrowser>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import FileBrowser from "./FileBrowser.vue";

@Component({
  components: {
    FileBrowser,
  },
})
export default class FileBrowserField extends Vue {
  // Input
  @Prop({ default: null }) value!: string | null;

  // Browser
  @Prop({ default: false }) multiple!: boolean;
  @Prop({ default: true }) allowFile!: boolean;
  @Prop({ default: false }) allowFolder!: boolean;
  @Prop({ default: () => [] }) extensions!: string | string[];
  @Prop({ default: "" }) defaultBrowsePath!: string | null;

  innerValue = this.value || null;
  showPicker = false;

  @Watch("value")
  onValueChange(newVal: string | null): void {
    this.innerValue = newVal;
  }

  @Watch("innerValue")
  onInnerValueChange(newVal: string | null): void {
    this.$emit("input", newVal);
  }
}
</script>
