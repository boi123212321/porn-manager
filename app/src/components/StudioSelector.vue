<template>
  <div>
    <v-autocomplete
      solo
      flat
      color="primary"
      v-model="innerValue"
      :loading="loading"
      :items="studios"
      :search-input.sync="searchQuery"
      cache-items
      hide-no-data
      hint="Search for studios by typing something"
      persistent-hint
      :label="multiple ? 'Select studios' : 'Select studio'"
      :multiple="multiple"
      item-text="name"
      item-value="_id"
      clearable
      @change="onInnerValueChange"
    >
      <template v-slot:item="{ item }">
        <template>
          <v-list-item-content>
            <v-list-item-title v-html="item.name"></v-list-item-title>
            <v-list-item-subtitle v-if="item.aliases.length">
              a.k.a. {{ item.aliases.join(", ") }}
            </v-list-item-subtitle>
          </v-list-item-content>
        </template>
      </template>
    </v-autocomplete>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import ApolloClient from "../apollo";
import gql from "graphql-tag";
import studioFragment from "../fragments/studio";

@Component
export default class StudioSelector extends Vue {
  @Prop() value!: any;
  @Prop({ default: false }) multiple!: boolean;
  @Prop({ default: null }) ignore!: string; // Ignores studio ID in search results

  innerValue = this.value ? JSON.parse(JSON.stringify(this.value)) : null;

  studios: any[] = this.value ? [this.value] : [];
  searchQuery = "";

  loading = false;
  resetTimeout = null as NodeJS.Timeout | null;

  @Watch("value", { deep: true })
  onValueChange(newVal: any) {
    this.innerValue = newVal;
  }

  onInnerValueChange(newVal: string) {
    this.$emit(
      "input",
      this.studios.find((a) => a._id == newVal)
    );
  }

  thumbnail(scene: any) {
    if (scene.thumbnail)
      return `/api/media/image/${scene.thumbnail._id}?password=${localStorage.getItem(
        "password"
      )}`;
    return "";
  }

  @Watch("searchQuery")
  onSearch(newVal: string | null) {
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
    }
    if (!this.searchQuery) return;

    this.resetTimeout = setTimeout(() => {
      this.loading = true;
      this.fetchPage(this.searchQuery);
    }, 500);
  }

  async fetchPage(searchQuery: string) {
    const result = await ApolloClient.query({
      query: gql`
        query($query: StudioSearchQuery!) {
          getStudios(query: $query) {
            items {
              ...StudioFragment
            }
          }
        }
        ${studioFragment}
      `,
      variables: {
        query: {
          query: searchQuery || "",
        },
      },
    });

    this.loading = false;
    this.studios.push(...result.data.getStudios.items);

    let ids = [...new Set(this.studios.map((a) => a._id))];

    if (this.ignore !== null) {
      ids = ids.filter((id) => id != this.ignore);
    }

    this.studios = ids.map((id) => this.studios.find((a) => a._id == id)).filter(Boolean) as any[];
  }
}
</script>

<style lang="scss" scoped>
</style>