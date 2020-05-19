<template>
  <div>
    {{ JSON.stringify(innerValue) }}
    <div class="mt-4" v-for="field in fields" :key="field._id">
      <v-subheader class="mb-2" style="height: 20px">{{ field.name }}</v-subheader>

      <div v-if="field.type == 'NUMBER'">
        <v-select
          clearable
          solo
          flat
          single-line
          :items="['equals', 'greater than', 'less than']"
          placeholder="Operation"
          hide-details
          class="mb-1"
        ></v-select>

        <v-text-field
          clearable
          style="width:100%"
          solo
          flat
          single-line
          :placeholder="field.name"
          v-model.number="innerValue[field._id]"
          @input="onInnerValueChange"
          hide-details
          color="primary"
          :suffix="field.unit"
        />
      </div>

      <div v-if="field.type == 'STRING'">
        <v-select
          solo
          flat
          single-line
          clearable
          :items="['equals', 'contains']"
          placeholder="Operation"
          hide-details
          class="mb-1"
        ></v-select>

        <v-text-field
          clearable
          style="width:100%"
          solo
          flat
          single-line
          :placeholder="field.name"
          v-model="innerValue[field._id]"
          @input="onInnerValueChange"
          hide-details
          color="primary"
          :suffix="field.unit"
        />
      </div>

      <div v-if="field.type == 'SINGLE_SELECT'">
        <v-select
          solo
          flat
          single-line
          clearable
          :items="['equals']"
          placeholder="Operation"
          hide-details
          class="mb-1"
        ></v-select>

        <v-select
          clearable
          style="width:100%"
          solo
          flat
          single-line
          color="primary"
          :placeholder="field.name"
          v-model="innerValue[field._id]"
          :items="field.values"
          @change="onInnerValueChange"
          hide-details
          :suffix="field.unit"
        />
      </div>

      <div v-if="field.type == 'MULTI_SELECT'">
        <v-select
          hide-details
          class="mb-1"
          solo
          flat
          single-line
          clearable
          :items="['contains']"
          placeholder="Operation"
        ></v-select>

        <v-select
          clearable
          style="width:100%"
          solo
          flat
          multiple
          single-line
          color="primary"
          :placeholder="field.name"
          v-model="innerValue[field._id]"
          :items="field.values"
          @change="onInnerValueChange"
          hide-details
          :suffix="field.unit"
        />
      </div>

      <div v-if="field.type == 'BOOLEAN'">
        <v-select
          hide-details
          class="mb-1"
          solo
          flat
          single-line
          clearable
          :items="['equals']"
          placeholder="Operation"
        ></v-select>

        <v-checkbox
          class="mt-0"
          v-model="innerValue[field._id]"
          @change="onInnerValueChange"
          color="primary"
          hide-details
          :label="innerValue[field._id]===true ? 'Yes' : 'No'"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import ApolloClient, { serverBase } from "../apollo";
import gql from "graphql-tag";

@Component
export default class CustomFieldSelector extends Vue {
  @Prop({ default: () => ({}) }) value: any;
  @Prop() fields!: any;

  innerValue = JSON.parse(JSON.stringify(this.value));

  @Watch("value", { deep: true })
  onValueChange(newVal: any) {
    this.innerValue = newVal;
  }

  onInnerValueChange(newVal: any) {
    this.$emit("input", this.innerValue);
    this.$emit("change");
  }
}
</script>

<style lang="scss" scoped>
</style>