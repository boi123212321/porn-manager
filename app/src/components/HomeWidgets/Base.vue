<template>
  <v-card style="border-radius: 10px">
    <v-card-title>
      <v-icon medium class="mr-2">{{ icon }}</v-icon>
      {{ title }}
    </v-card-title>

    <v-card-text>
      <slot />
    </v-card-text>

    <v-card-actions>
      <slot name="actions" />
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";

@Component
export default class ActorLabelUsage extends Vue {
  @Prop() title!: string;
  @Prop() icon!: string;
}
</script>