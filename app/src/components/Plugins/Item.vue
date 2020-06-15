<template>
  <div class="d-flex">
    <div style="width: 100%">
      <v-row>
        <v-col cols="12" sm="6">
          <v-text-field
            hide-details
            placeholder="Identifier"
            solo
            flat
            single-line
            dense
            v-model="id"
          ></v-text-field>
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field hide-details placeholder="Path" solo flat single-line dense v-model="path"></v-text-field>
        </v-col>
      </v-row>
    </div>
    <div class="ml-2 d-flex align-center">
      <v-btn icon @click="$emit('delete')" color="error">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";

interface IPlugin {
  id: string;
  path: string;
  args: Record<string, string>;
}

@Component({
  components: {}
})
export default class PluginItem extends Vue {
  @Prop() value!: IPlugin;

  readValue() {
    this.id = this.value.id;
    this.path = this.value.path;
    this.args = this.value.args;
  }

  id = this.value.id;
  path = this.value.path;
  args = this.value.args;

  emitValue() {
    const newValue = JSON.parse(JSON.stringify(this.value)) as IPlugin;
    newValue.id = this.id;
    newValue.path = this.path;
    newValue.args = this.args;
    this.$emit("input", newValue);
  }

  @Watch("id")
  onIdChange() {
    this.emitValue();
  }

  @Watch("path")
  onPathChange() {
    this.emitValue();
  }
}
</script>

<style lang="scss" scoped>
.output {
  background: #090909;
  border-radius: 4px;
}
</style>