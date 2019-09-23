<template>
  <v-dialog :value="videos.length || processing.length" persistent>
    <v-card>
      <v-card-title>Add new videos</v-card-title>
      <v-card-text>
        <v-card class="pa-2 mb-2" v-for="video in videos" :key="video.path">
          <v-text-field :color="$store.getters['globals/secondaryColor']" label="Video name" :value="video.name" @change="video.name = $event"></v-text-field>
          <p class="sec--text">{{ video.path}}</p>
          <v-combobox
          :color="$store.getters['globals/secondaryColor']"
            :value="video.labels"
            :items="$store.getters['videos/getLabels']"
            label="Add or choose labels"
            multiple
            chips
            @change="video.labels = $event"
          ></v-combobox>
          <v-autocomplete
          :color="$store.getters['globals/secondaryColor']"
            :value="video.actors"
            :items="$store.state.actors.items"
            chips
            label="Select actors"
            item-text="name"
            item-value="id"
            multiple
            clearable
            @change="video.actors = $event"
          >
            <template v-slot:selection="data">
              <v-chip pill>
                <v-avatar left>
                  <img :src="$store.getters['images/idToPath'](data.item.thumbnails[0])" />
                </v-avatar>
                {{ data.item.name }}
              </v-chip>
            </template>
            <template v-slot:item="data">
              <template v-if="typeof data.item !== 'object'">
                <v-list-item-content v-text="data.item"></v-list-item-content>
              </template>
              <template v-else>
                <v-list-item-avatar>
                  <img :src="$store.getters['images/idToPath'](data.item.thumbnails[0])" />
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title v-html="data.item.name"></v-list-item-title>
                  <v-list-item-subtitle v-html="data.item.group"></v-list-item-subtitle>
                </v-list-item-content>
              </template>
            </template>
          </v-autocomplete>
        </v-card>
        <div v-if="processing.length" class="text-center">
          <v-progress-circular indeterminate :size="80" :width="5" :color="$store.getters['globals/secondaryColor']"></v-progress-circular>
          <div class="mt-2 subheading">
            {{ processing.length }}
            <span>{{ processing.length == 1 ? 'video' : 'videos' }} processing...</span>
          </div>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn :disabled="generatingThumbnails" text @click="videos = []">Cancel</v-btn>
        <v-btn :disabled="generatingThumbnails" @click="add" :color="$store.getters['globals/secondaryColor']">Add</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import asyncPool from "tiny-async-pool";
import ffmpeg, { FfprobeData } from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import Video from "@/classes/video";
import Image from "@/classes/image";
import { takeScreenshots } from "@/util/thumbnails";
import { toTitleCase } from "../util/string";
import { exportToDisk } from "../util/library";

@Component
export default class VideoImporter extends Vue {
  videos = [] as {
    name: string;
    path: string;
    size: number;
    labels?: string[];
    actors?: string[];
  }[];

  processing = [] as {
    name: string;
    path: string;
    size: number;
    labels?: string[];
    actors?: string[];
  }[];

  push(
    vids: { name: string; path: string; size: number; labels?: string[] }[]
  ): void {
    vids.forEach(vid => {
      vid.labels = [];
    });
    this.videos.push(...vids);
  }

  async add() {
    ffmpeg.setFfmpegPath(this.$store.state.globals.settings.ffmpegPath);
    ffmpeg.setFfprobePath(this.$store.state.globals.settings.ffprobePath);

    this.processing.push(...this.videos);
    this.videos = [];

    const videos = (<{ name: string; path: string; size: number }[]>(
      this.processing
    )).map(file => Video.create(file));

    videos.forEach(video => {
      let extraInfo = this.processing.find(
        (v: { path: string }) => v.path == video.path
      );
      let labels = extraInfo.labels as string[];

      if (labels && labels.length) {
        labels = labels.map(label => toTitleCase(label));
      }

      video.labels = labels || [];
      video.actors = extraInfo.actors || [];
    });

    let customFieldNames = this.$store.getters[
      "globals/getCustomFieldNames"
    ] as string[];

    this.generatingThumbnails = true;

    if (!fs.existsSync("library/")) {
      fs.mkdirSync("library/");
    }

    if (!fs.existsSync("library/images/")) {
      fs.mkdirSync("library/images/");
    }

    const thumbnailPath = "library/images/thumbnails/";

    if (!fs.existsSync(thumbnailPath)) {
      fs.mkdirSync(thumbnailPath);
    }

    await asyncPool(1, videos, video => {
      return new Promise(async (resolve, reject) => {
        customFieldNames.forEach(field => {
          video.customFields[field] = null;
        });

        let metadata = (await new Promise((resolve, reject) => {
          ffmpeg.ffprobe(video.path, (err, metadata) => {
            if (err) return reject(err);
            resolve(metadata);
          });
        })) as FfprobeData;

        let amount = Math.max(
          1,
          Math.floor(
            metadata.format.duration /
              this.$store.state.globals.settings.thumbnailsOnImportInterval
          )
        );

        video.duration = metadata.format.duration;
        video.dimensions = {
          width: metadata.streams[0].width,
          height: metadata.streams[0].height
        };

        console.log(`Generating ${amount} thumbnails...`);

        await takeScreenshots({
          file: video.path,
          pattern: `thumbnail-${video.id}-%s.jpg`,
          count: amount,
          thumbnailPath
        });

        let files = fs.readdirSync(thumbnailPath) as any[];
        files = files.filter(name => name.includes(`thumbnail-${video.id}`));

        files = files.map(name => {
          let filePath = path.resolve(
            process.cwd(),
            "library/images/thumbnails/",
            name
          );
          return {
            name,
            path: filePath,
            size: fs.statSync(filePath).size,
            time: fs.statSync(filePath).mtime.getTime()
          };
        });

        files.sort((a, b) => a.time - b.time);

        let images = files.map(file => Image.create(file));

        images.forEach(image => {
          image.video = video.id;
          image.labels = video.labels;
          image.actors = video.actors;
        });

        this.$store.commit("images/add", images);

        video.thumbnails.push(...images.map(i => i.id));

        video.coverIndex = Math.floor(images.length / 2);

        this.$store.commit("videos/add", [video]);

        this.processing = this.processing.filter(
          (v: { path: string }) => v.path != video.path
        );

        resolve();
      });
    });

    this.generatingThumbnails = false;

    exportToDisk();
  }

  get generatingThumbnails() {
    return this.$store.state.videos.generatingThumbnails;
  }

  set generatingThumbnails(value: boolean) {
    this.$store.commit("videos/generatingThumbnails", value);
  }
}
</script>

<style>
</style>
