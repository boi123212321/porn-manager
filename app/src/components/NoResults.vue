<template>
  <div class="my-3 text-center">
    <div class="mb-2">
      <i>Nothing found</i>
    </div>
    <v-icon large>mdi-magnify-close</v-icon>
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import Vue from "vue";

@Component
export default class NoResults extends Vue {}
</script>