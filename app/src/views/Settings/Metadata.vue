<template>
  <SettingsWrapper>
    <v-card-title class="pl-0 pt-0">Custom Data Fields</v-card-title>
    <v-card class="mb-2">
      <v-card-text>
        <CustomFieldCreator />
      </v-card-text>
    </v-card>
  </SettingsWrapper>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import CustomFieldCreator from "@/components/CustomFieldCreator.vue";
import SettingsWrapper from "@/components/SettingsWrapper.vue";

@Component({
  components: {
    CustomFieldCreator,
    SettingsWrapper,
  },
})
export default class CustomFields extends Vue {}
</script>
