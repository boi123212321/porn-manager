<template>
  <div>
    <v-layout>
      <v-flex xs6 sm4>
        <v-subheader>{{ field.name }}</v-subheader>
      </v-flex>
      <v-flex xs6 sm8>
        <v-text-field
          :value="value"
          label="Enter string"
          @change="$emit('change', { key: field.name, value: $event })"
          v-if="field.type === 0"
        />
        <v-text-field
          :value="value"
          label="Enter number"
          @change="$emit('change', { key: field.name, value: parseInt($event) })"
          v-if="field.type === 1"
        />
        <v-checkbox
          v-else-if="field.type === 2"
          :value="value"
          label="Set value"
          @change="$emit('change', { key: field.name, value: $event || false })"
        ></v-checkbox>
        <v-select
          v-else-if="field.type === 3"
          v-model="internalValue"
          :items="field.values"
          label="Select value"
          @change="$emit('change', { key: field.name, value: internalValue })"
        />
        <v-select
          v-else-if="field.type === 4"
          v-model="internalValue"
          :items="field.values"
          label="Select value(s)"
          multiple
          chips
          @change="$emit('change', { key: field.name, value: internalValue })"
        />
      </v-flex>
    </v-layout>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import CustomField from "@/classes/custom_field";

export default Vue.extend({
  props: ["field", "value"],
  data() {
    return {
      internalValue: this.value
    }
  }
});
</script>

<style lang="scss" scoped>
</style>
