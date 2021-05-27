<template>
  <WidgetCard v-if="scenes && scenes.length" title="Recommended scenes" icon="mdi-shuffle">
    <v-row dense>
      <v-col v-for="scene in scenes" :key="scene._id" cols="6">
        <div>
          <a class="hover" :href="`#/scene/${scene._id}`">
            <v-img :src="thumbnail(scene)"> </v-img>
          </a>
          <div class="text-center title">
            {{ scene.name }}
          </div>
        </div>
      </v-col>
    </v-row>

    <template v-slot:actions>
      <v-btn block class="text-none" color="primary" text @click="nextPage">Show more</v-btn>
    </template>
  </WidgetCard>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import ApolloClient from "@/apollo";
import gql from "graphql-tag";

@Component
export default class RecommendedScenes extends Vue {
  scenes = [] as any[];
  skip = 0;

  thumbnail(scene: any) {
    if (scene.thumbnail) {
      return `/api/media/image/${scene.thumbnail._id}/thumbnail?password=${localStorage.getItem(
        "password"
      )}`;
    }
    return "/assets/broken.png";
  }

  nextPage() {
    this.getScenes();
  }

  created() {
    this.getScenes();
  }

  async getScenes() {
    const res = await ApolloClient.query({
      query: gql`
        query($skip: Int) {
          recommendUnwatchedScenes(skip: $skip, take: 4) {
            _id
            name
            actors {
              name
              thumbnail {
                _id
              }
            }
            thumbnail {
              _id
            }
          }
        }
      `,
      variables: {
        skip: this.skip,
      },
    });
    this.scenes.push(...res.data.recommendUnwatchedScenes);
    this.skip += 4;
  }
}
</script>
