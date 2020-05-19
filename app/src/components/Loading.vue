<template>
  <div class="my-3 text-center">
    <div class="mb-2">
      <i>Loading...</i>
    </div>
    <v-progress-circular color="primary" :width="4" :size="35" indeterminate></v-progress-circular>
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import Vue from "vue";

@Component
export default class NoResults extends Vue {}
</script>