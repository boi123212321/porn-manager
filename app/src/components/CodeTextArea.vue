<template>
  <div
    :class="{
      'd-flex flex-column pa-2 role=\'presentation\' code-textarea-root': true,
      'white--text dark': $vuetify.theme.dark,
      'black--text light': !$vuetify.theme.dark,
    }"
  >
    <div class="d-flex align-center">
      <span
        @click="changeMode(Mode.JSON)"
        class="hover"
        :class="mode === Mode.JSON ? 'font-weight-black' : ''"
      >
        JSON </span
      >/
      <span
        @click="changeMode(Mode.YAML)"
        class="hover"
        :class="mode === Mode.YAML ? 'font-weight-black' : ''"
      >
        YAML
      </span>
      <v-spacer></v-spacer>
      <slot name="actions"></slot>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn v-on="on" icon @click="copyOutput">
            <v-icon>mdi-content-copy</v-icon>
          </v-btn>
        </template>
        <span>Copy to clipboard</span>
      </v-tooltip>
    </div>
    <v-divider class="mb-3 mt-1"></v-divider>
    <v-textarea
      class="code-textarea"
      v-bind="$attrs"
      dense
      flat
      v-model="innerValue"
      :error-messages="mergedErrorMessages"
    ></v-textarea>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import YAML from "yaml";

export enum Mode {
  JSON = "json",
  YAML = "yaml",
}

@Component({})
export default class CodeTextArea extends Vue {
  @Prop({ default: false }) value!: string;
  @Prop({ default: () => [] }) errorMessages!: string[];
  @Prop({ default: false }) ignoreEmpty!: boolean;

  innerValue = this.value;
  innerValueObj: object | null = {};
  mode: Mode | null = null;
  Mode = Mode;

  invalidError = "";
  hasValidSyntax = true;

  cleanAndValidate(outputMode: Mode | null, autoSetMode = false) {
    let value = (this.innerValue || "").replaceAll("---", "");
    if (this.ignoreEmpty && !value) {
      this.innerValueObj = null;
      this.innerValue = "";
      return;
    }

    const valueObj = this.parseValue(value, autoSetMode);
    if (valueObj) {
      this.innerValueObj = valueObj;
      if (!outputMode || outputMode === Mode.JSON) {
        this.innerValue = JSON.stringify(valueObj, null, 2);
      } else if (outputMode === Mode.YAML) {
        this.innerValue = YAML.stringify(valueObj);
      }
    }
  }

  parseValue(value: string, autoSetMode = false): object | null {
    let valueObj: object | null = null;
    this.invalidError = "";
    let triedType = "";
    try {
      if (autoSetMode) {
        if (this.mode === Mode.JSON || (!this.mode && value.includes("{") && value.includes("}"))) {
          valueObj = JSON.parse(value);
          triedType = "JSON";
          this.mode = Mode.JSON;
        } else {
          valueObj = YAML.parse(value);
          triedType = "YAML";
          this.mode = Mode.YAML;
        }
      } else {
        if (this.mode === Mode.JSON) {
          valueObj = JSON.parse(value);
          triedType = "JSON";
        } else if (this.mode === Mode.YAML) {
          valueObj = YAML.parse(value);
          triedType = "YAML";
        }
      }
      this.hasValidSyntax = true;
    } catch (err) {
      this.invalidError = `Could not parse as ${triedType}. Please check the syntax.`;
      this.hasValidSyntax = false;
    }
    return valueObj;
  }

  @Watch("value")
  onValueChange() {
    this.innerValue = this.value;
  }

  @Watch("innerValue")
  onInnerValueChange() {
    this.cleanAndValidate(this.mode, !this.mode);
    this.$emit("input", this.innerValue);
    this.$emit("hasValidSyntax", this.hasValidSyntax);
  }

  @Watch("innerValueObj")
  onInnerValueObjChange() {
    this.$emit("inputObj", this.innerValueObj);
  }

  changeMode(nextMode: Mode): void {
    if (this.hasValidSyntax) {
      // If the content can already be parsed with the current mode,
      // switch the format of the value first
      this.cleanAndValidate(nextMode, false);
      this.mode = nextMode;
    } else {
      // Otherwise, change the mode first so the parse will
      // be in the new mode
      this.mode = nextMode;
      this.cleanAndValidate(nextMode, false);
    }
  }

  copyOutput() {
    navigator.clipboard.writeText(this.innerValue).then(
      () => {
        /* clipboard successfully set */
      },
      () => {
        /* clipboard write failed */
      }
    );
  }

  get mergedErrorMessages() {
    return [...this.errorMessages, ...(this.hasValidSyntax ? [] : [this.invalidError])];
  }

  mounted() {
    this.cleanAndValidate(this.mode, true);
    this.$emit("input", this.innerValue);
    this.$emit("hasValidSyntax", this.hasValidSyntax);
  }
}
</script>

<style lang="scss" scoped>
.code-textarea-root {
  border-radius: 4px;

  &.dark {
    background: #090909;
  }
}
.code-textarea {
  font-family: monospace;
  white-space: pre-line;
}
</style>
