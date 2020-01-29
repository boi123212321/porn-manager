<template>
  <div>
    <v-autocomplete
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
          </v-list-item-content>
        </template>
      </template>
    </v-autocomplete>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import ApolloClient, { serverBase } from "../apollo";
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
    this.$emit("input", this.studios.find(a => a._id == newVal));
  }

  thumbnail(scene: any) {
    if (scene.thumbnail)
      return `${serverBase}/image/${
        scene.thumbnail._id
      }?password=${localStorage.getItem("password")}`;
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
    try {
      const query = `query:'${searchQuery || ""}'`;

      const result = await ApolloClient.query({
        query: gql`
          query($query: String) {
            getStudios(query: $query) {
              ...StudioFragment
            }
          }
          ${studioFragment}
        `,
        variables: {
          query
        }
      });

      this.loading = false;
      this.studios.push(...result.data.getStudios);

      let ids = [...new Set(this.studios.map(a => a._id))];

      if (this.ignore !== null) {
        ids = ids.filter(id => id != this.ignore);
      }

      this.studios = ids
        .map(id => this.studios.find(a => a._id == id))
        .filter(Boolean) as any[];
    } catch (err) {
      throw err;
    }
  }
}
</script>

<style lang="scss" scoped>
</style>