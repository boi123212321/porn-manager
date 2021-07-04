<template>
  <div class="white--text">
    <v-responsive :aspect-ratio="aspectRatio" :max-height="maxHeight">
      <v-hover @input="isHoveringVideo = $event">
        <div
          :class="{ 'video-wrapper': true, hideControls: !isHoveringVideo }"
          ref="videoWrapper"
          tabindex="0"
          @touchstart="onVideoTouchStart"
          @touchend="onVideoTouchEnd"
          @dblclick="toggleFullscreen"
          @mousedown="mouseDownVideo = true"
          @mousemove="
            isHoveringVideo = true;
            startVideoHoverTimeout();
          "
          @fullscreenchange="onFullscreenChange"
        >
          <div :class="{ 'video-overlay': true, hideControls: !isHoveringVideo }">
            <v-img
              :src="poster"
              cover
              max-height="100%"
              class="blurred poster"
              v-if="poster && showPoster"
            ></v-img>
            <v-img
              class="poster text-center"
              :src="poster"
              contain
              max-height="100%"
              v-if="poster && showPoster"
            ></v-img>
            <v-fade-transition>
              <div v-if="videoNotice" class="notice pa-2">{{ videoNotice }}</div>
            </v-fade-transition>

            <v-fade-transition>
              <!-- Prevent mouse/touch events from going -->
              <!-- to video wrapper and triggering play/pause -->
              <div
                v-if="showControls"
                class="bottom-bar-wrapper"
                @click.stop
                @touchstart.stop
                @touchend.stop
                @mousedown.stop
              >
                <div class="bottom-bar-content">
                  <v-hover close-delay="200" @input="isHoveringProgressBarDelayed = $event">
                    <div
                      @mouseenter="isHoveringProgressBarExact = true"
                      @mouseleave="isHoveringProgressBarExact = false"
                      @mousedown.prevent="onProgressBarMouseDown"
                      @touchmove.prevent="onProgressBarScrub"
                      @touchstart.prevent="onProgressBarMouseDown"
                      @touchend.prevent="onVideoMouseUp"
                      ref="progressBar"
                      class="progress-bar-wrapper"
                    >
                      <!-- Use 'isHoveringProgressBarDelayed' to include the hover close delay -->
                      <div :class="{ 'time-bar': true, large: isHoveringProgressBarDelayed }">
                        <v-fade-transition>
                          <div
                            class="elevation-4 preview-window"
                            v-if="
                              (isHoveringProgressBarDelayed || isDraggingProgressBar) && preview
                            "
                            :style="`left: ${previewX}px;`"
                          >
                            <div class="preview-wrapper" :style="previewStyle">
                              <img
                                class="preview-image"
                                :style="`left: -${
                                  imageIndex * SINGLE_PREVIEW_WIDTH
                                }px; background-position: ${imageIndex * SINGLE_PREVIEW_WIDTH}`"
                                :src="preview.src"
                              />
                            </div>
                            <v-card
                              tile
                              class="preview-time text-none text-truncate font-weight-bold"
                            >
                              {{ previewTime }}
                            </v-card>
                          </div>
                        </v-fade-transition>
                      </div>

                      <template v-for="(range, i) in bufferedRanges">
                        <div
                          :key="i"
                          :class="{ 'buffer-bar': true, large: isHoveringProgressBarDelayed }"
                          :style="`left: ${percentOfVideo(range.start) * 100}%; right: ${
                            100 - percentOfVideo(range.end) * 100
                          }%;`"
                        ></div>
                      </template>
                      <div
                        v-if="isHoveringProgressBarDelayed"
                        :class="{ 'seek-bar': true, large: isHoveringProgressBarDelayed }"
                        :style="`width: ${previewPercent * 100}%;`"
                      ></div>
                      <div
                        :class="{ 'progress-bar': true, large: isHoveringProgressBarDelayed }"
                        :style="`width: ${progressPercent * 100}%;`"
                      ></div>
                      <v-tooltip v-for="marker in markers" :key="marker.id" bottom>
                        <template v-slot:activator="{ on }">
                          <v-hover v-slot:default="{ hover }">
                            <div
                              @click="seek(marker.time)"
                              v-on="on"
                              :class="`marker ${hover ? 'hover' : ''}`"
                              :style="`left: ${percentOfVideo(marker.time) * 100}%;`"
                            ></div>
                          </v-hover>
                        </template>
                        {{ marker.name }}
                      </v-tooltip>
                    </div>
                  </v-hover>

                  <div class="control-bar px-1 align-center d-flex">
                    <v-btn dark @click="togglePlay(false)" icon>
                      <v-icon>{{
                        ended ? "mdi-replay" : isPlaying ? "mdi-pause" : "mdi-play"
                      }}</v-icon>
                    </v-btn>
                    <v-hover v-slot:default="{ hover }" close-delay="100">
                      <!-- close-delay to allow the user to jump the gap and hover over volume wrapper -->
                      <div>
                        <transition name="slide-up">
                          <div v-if="hover" class="volume-bar-background">
                            <div
                              ref="volumeBar"
                              class="volume-bar-wrapper"
                              @click="onVolumeClick"
                              @mousedown="onVolumeMouseDown"
                              @mousemove="onVolumeDrag"
                            >
                              <div class="volume-bar"></div>
                              <div
                                v-if="!isMuted"
                                class="current-volume-bar"
                                :style="`height: ${volume * 100}%;`"
                              ></div>
                              <!-- subtract half the circle's height so the center of the circle
                          is exactly at top of the current volume bar  -->
                              <div
                                v-if="!isMuted"
                                class="current-volume-position"
                                :style="`bottom: calc(${volume * 100}% - 5px);`"
                              ></div>
                            </div>
                          </div>
                        </transition>
                        <v-btn dark @click="toggleMute" icon>
                          <v-icon>{{ isMuted ? "mdi-volume-mute" : "mdi-volume-high" }}</v-icon>
                        </v-btn>
                      </div>
                    </v-hover>
                    <span class="mx-2 body-2"
                      >{{ formatTime(progress) }} / {{ formatTime(duration) }}</span
                    >
                    <v-spacer></v-spacer>
                    <v-menu offset-y top @input="onPlaybackRateMenuToggle" attach>
                      <template #activator="{ on, attrs }">
                        <v-btn class="text-none" dark text v-bind="attrs" v-on="on" small>
                          {{ `${playbackRate}x` }}
                        </v-btn>
                      </template>

                      <v-list>
                        <v-list-item-group
                          color="primary"
                          :value="playbackRate"
                          @change="selectPlaybackRate"
                        >
                          <v-list-item
                            v-for="rate in PLAYBACK_RATES"
                            :key="rate"
                            dense
                            :value="rate"
                          >
                            <v-list-item-content>
                              <v-list-item-title v-text="`${rate}x`"></v-list-item-title>
                            </v-list-item-content>
                          </v-list-item>
                        </v-list-item-group>
                      </v-list>
                    </v-menu>
                    <v-menu offset-y top @input="onStreamTypeMenuToggle" attach>
                      <template #activator="{ on, attrs }">
                        <v-btn class="text-none" dark text v-bind="attrs" v-on="on" small>
                          {{ currentSource() ? currentSource().label : "select a source" }}
                        </v-btn>
                      </template>

                      <v-list>
                        <v-list-item-group
                          color="primary"
                          :value="currentStreamType()"
                          @change="selectStreamType"
                        >
                          <v-list-item
                            v-for="source in sources"
                            :key="source.streamType"
                            dense
                            :value="source.streamType"
                          >
                            <v-list-item-content>
                              <v-list-item-title v-text="source.label"></v-list-item-title>
                            </v-list-item-content>
                          </v-list-item>
                        </v-list-item-group>
                      </v-list>
                    </v-menu>
                    <v-btn
                      dark
                      @click="fitMode = fitMode === 'contain' ? 'cover' : 'contain'"
                      icon
                      v-if="hasDimensions(dimensions) && showFitOption"
                    >
                      <v-icon>{{
                        fitMode === "contain"
                          ? "mdi-arrow-expand-horizontal"
                          : "mdi-arrow-expand-vertical"
                      }}</v-icon>
                    </v-btn>
                    <v-btn
                      v-if="showTheaterMode"
                      dark
                      @click="$emit('theaterMode', !theaterMode)"
                      icon
                    >
                      <v-icon :size="theaterMode ? 16 : 24"> mdi-rectangle-outline </v-icon>
                    </v-btn>
                    <v-btn dark @click="toggleFullscreen" icon>
                      <v-icon>{{ isFullscreen ? "mdi-fullscreen-exit" : "mdi-fullscreen" }}</v-icon>
                    </v-btn>
                  </div>
                </div>
              </div>
            </v-fade-transition>
          </div>
          <video
            :class="{
              'video video-js': true,
              cover: fitMode === 'cover',
              contain: fitMode === 'contain',
            }"
            ref="video"
          ></video>
        </div>
      </v-hover>
    </v-responsive>
    <v-card
      v-if="paniced"
      style="z-index: 99999; position: fixed; left: 0; top: 0; width: 100%; height: 100%"
    ></v-card>
  </div>
</template>

<script lang="ts">
import "video.js/dist/video-js.css";

import videojs, { VideoJsPlayer } from "video.js";
import { Component, Vue, Prop } from "vue-property-decorator";
import moment from "moment";
import { BufferedRange, SceneSource } from "../types/scene";

const LS_IS_MUTED = "player_is_muted";
const LS_VOLUME = "player_volume";
const LS_PLAYBACK_RATE_VALUES = "playback_rate_values";
const LS_PLAYBACK_RATE = "playback_rate";

const MUTE_THRESHOLD = 0.02;

const VOLUME_INCREMENT_PERCENTAGE = 0.05;

const PREVIEW_START_OFFSET = 0.02;

const PLAYBACK_RATES = JSON.parse(localStorage.getItem(LS_PLAYBACK_RATE_VALUES) || "null") ?? [
  2.0,
  1.5,
  1.25,
  1,
  0.75,
  0.5,
  0.25,
];

const TOUCH_DOUBLE_TAP_TIME = 300;

const HOVER_VIDEO_TIMEOUT_DELAY = 3000;

const SCRUB_TO_SEEK_DELAY = 300;

const SINGLE_PREVIEW_WIDTH = 160;

@Component
export default class VideoPlayer extends Vue {
  @Prop() sources!: SceneSource[];
  @Prop(Number) duration!: number;
  @Prop({ default: null }) poster!: string | null;
  @Prop() markers!: { _id: string; name: string; time: number }[];
  @Prop({ default: null }) preview!: {
    src: string;
    dimensions?: { width?: number; height?: number };
  } | null;
  @Prop({ default: null }) dimensions!: { height: number; width: number } | null;
  @Prop({ default: null }) maxHeight!: number | string | null;
  @Prop({ default: false }) showTheaterMode!: boolean;
  @Prop({ default: false }) theaterMode!: boolean;

  player: VideoJsPlayer | null = null;

  ready = false;

  showFitOption = true;
  videoNotice = "";
  noticeTimeout: null | number = null;
  previewX = 0;
  previewPercent = 0;
  progress = 0;
  buffered: videojs.TimeRange | null = null;
  ended = false;
  isPlaying = false;
  showPoster = true;
  playbackRate = (() => {
    const value = parseFloat(localStorage.getItem(LS_PLAYBACK_RATE) ?? "1.0");
    if (!PLAYBACK_RATES.includes(value)) {
      return 1;
    }
    return value;
  })();

  isVolumeDragging = false;
  isMuted = localStorage.getItem(LS_IS_MUTED) === "true";
  volume = parseFloat(localStorage.getItem(LS_VOLUME) ?? "1");

  transcodeOffset = 0;

  mouseDownVideo = false;
  isDraggingProgressBar = false;
  isHoveringProgressBarExact = false;
  isHoveringProgressBarDelayed = false;
  didPauseForSeeking = false;
  applyScrubPositionTimeout: number | null = null;
  isHoveringVideo = false;
  videoHoverTimeout: null | number = null;
  isPlaybackRateMenuOpen = false;
  hidePlaybackRateMenu: null | number = null;
  isStreamTypeMenuOpen = false;
  hideStreamTypeMenu: null | number = null;
  fitMode: "cover" | "contain" = "contain";
  isFullscreen = false;

  touchEndTimeout: null | number = null;
  touchEndTime: number = 0;
  lastTouchClientX = -1;

  paniced = false;

  PREVIEW_START_OFFSET = PREVIEW_START_OFFSET;
  PLAYBACK_RATES = PLAYBACK_RATES;
  SINGLE_PREVIEW_WIDTH = SINGLE_PREVIEW_WIDTH;

  mounted() {
    window.addEventListener("mouseup", this.onVolumeMouseUp);
    window.addEventListener("mouseup", this.onVideoMouseUp);
    window.addEventListener("mousemove", this.onProgressBarScrub);

    this.player = videojs(
      this.$refs.video,
      {
        sources: this.sources.map((s) => ({ ...s, src: s.url, type: s.mimeType })),
        fluid: false,
        userActions: {
          doubleClick: true,
          hotkeys: (ev: videojs.KeyboardEvent): void => {
            if (ev.which === 32) {
              // SPACE
              ev.preventDefault();
              this.togglePlay();
            } else if (ev.which === 38) {
              // UP
              ev.preventDefault();
              this.setVolume(this.player!.volume() + VOLUME_INCREMENT_PERCENTAGE, true);
            } else if (ev.which === 40) {
              // DOWN
              ev.preventDefault();
              this.setVolume(this.player!.volume() - VOLUME_INCREMENT_PERCENTAGE, true);
            }
          },
        },
      },
      () => {
        this.ready = true;

        this.setVolume(this.volume);
        if (this.isMuted) {
          this.mute();
        }
        this.selectPlaybackRate(this.playbackRate);

        this.player!.on("timeupdate", () => {
          if (!this.isDraggingProgressBar) {
            this.progress = this.transcodeOffset + this.player!.currentTime();
          }
          this.buffered = this.player!.buffered();
          this.ended = this.player!.ended();
          this.isPlaying = this.isPlaying && !this.ended;
        });

        this.player!.on("playerresize", () => {
          const video = this.$refs.video as HTMLVideoElement;
          const box = video.getBoundingClientRect();
          const renderedAspectRatio = box.width / box.height;
          this.showFitOption = Math.abs(renderedAspectRatio - this.aspectRatio) > 0.01;
        });

        this.player!.on("error", this.onPlayerError);
      }
    );
  }

  onPlayerError(): void {
    const error = this.player!.error();
    if (!error) {
      return;
    }

    if (error.code === error.MEDIA_ERR_SRC_NOT_SUPPORTED) {
      // If for some reason videojs couldn't not play a source, but did
      // not attempt to go to the next, trigger it manually

      const sIdx = this.sources.findIndex((s) => s.streamType === this.currentSource()?.streamType);
      if (sIdx < this.sources.length - 1) {
        const nextSource = this.sources[sIdx + 1];
        this.player?.src({
          ...nextSource,
          src: nextSource.url,
          type: nextSource.mimeType,
        });
        this.player!.load();
      }
    }
  }

  beforeDestroy() {
    window.removeEventListener("mouseup", this.onVolumeMouseUp);
    window.removeEventListener("mouseup", this.onVideoMouseUp);
    window.removeEventListener("mousemove", this.onProgressBarScrub);

    if (this.player) {
      this.player.dispose();
    }
  }

  panic() {
    this.paniced = true;
    this.pause();
    this.player?.dispose();
    window.location.replace(localStorage.getItem("pm_panic") || "https://google.com");
  }

  formatTime(secs: number) {
    return moment().startOf("day").seconds(secs).format("H:mm:ss");
  }

  currentProgress() {
    return this.progress;
  }

  currentSource(): SceneSource | undefined {
    // We can type this as SceneSource, since we passed the whole object
    // on player creation
    return (this.player?.currentSource() as unknown) as SceneSource;
  }

  currentStreamType(): string | undefined {
    return this.currentSource()?.streamType;
  }

  get imageIndex() {
    // The preview start is offset from the beginning of the scene.
    // If previewPercent is in this zone, just show the first preview we have
    if (this.previewPercent <= PREVIEW_START_OFFSET) {
      return 0;
    }
    // For the rest, subtract the offset to get the actual "x"
    // of the cursor in the preview
    const actualX = this.previewPercent - PREVIEW_START_OFFSET;
    // Multiply by 100 since there are 100 previews
    return Math.floor(actualX * 100);
  }

  get previewTime() {
    return this.formatTime(this.duration * this.previewPercent);
  }

  get previewStyle() {
    let previewHeight =
      this.preview?.dimensions?.height || Math.floor(SINGLE_PREVIEW_WIDTH / this.aspectRatio);

    return {
      width: `${SINGLE_PREVIEW_WIDTH}px`,
      height: `${previewHeight}px`,
    };
  }

  get showControls() {
    return (
      this.isPlaybackRateMenuOpen ||
      this.isStreamTypeMenuOpen ||
      this.isVolumeDragging ||
      this.isHoveringProgressBarDelayed ||
      this.isDraggingProgressBar ||
      this.isHoveringVideo
    );
  }

  hasDimensions(
    dimensions: {
      width?: number;
      height?: number;
    } | null
  ): dimensions is { width: number; height: number } {
    return (
      !!dimensions &&
      typeof dimensions?.width === "number" &&
      dimensions?.width > 0 &&
      typeof dimensions?.height === "number" &&
      dimensions?.height > 0
    );
  }

  get aspectRatio() {
    if (!this.hasDimensions(this.dimensions)) {
      // Default aspect ratio
      return 16 / 9;
    }
    return this.dimensions.width / this.dimensions.height;
  }

  startVideoHoverTimeout() {
    if (this.videoHoverTimeout) {
      window.clearTimeout(this.videoHoverTimeout);
    }
    this.videoHoverTimeout = window.setTimeout(() => {
      this.isHoveringVideo = false;
    }, HOVER_VIDEO_TIMEOUT_DELAY);
  }

  async toggleFullscreen() {
    const videoWrapper = this.$refs.videoWrapper as HTMLElement & {
      mozRequestFullScreen?(): Promise<void>;
      webkitRequestFullscreen?(): Promise<void>;
      msRequestFullscreen?(): Promise<void>;
    };

    if (!videoWrapper) return;

    if (this.isFullscreen) {
      document.exitFullscreen();
    } else {
      const requestFullscreen =
        videoWrapper.requestFullscreen ||
        videoWrapper.webkitRequestFullscreen ||
        videoWrapper.mozRequestFullScreen ||
        videoWrapper.msRequestFullscreen;
      if (requestFullscreen) {
        try {
          // Invoke function with element context
          await requestFullscreen.call(videoWrapper);
        } catch (err) {
          // Browser refused fullscreen for some reason, do nothing
        }
      }
    }
  }

  onFullscreenChange() {
    const videoWrapper = this.$refs.videoWrapper as HTMLElement;
    this.isFullscreen =
      !!videoWrapper && !!document.fullscreenElement && document.fullscreenElement === videoWrapper;
  }

  setVolume(volume: number, notice = false): void {
    if (!this.player || !this.ready) {
      return;
    }

    if (this.isHoveringVideo) {
      this.startVideoHoverTimeout();
    }

    if (volume <= MUTE_THRESHOLD) {
      this.mute();
    } else {
      if (volume > 1) {
        volume = 1;
      }
      if (notice) {
        this.notice(`Volume: ${(volume * 100).toFixed(0)}%`);
      }

      this.unmute();
      this.volume = volume;
      localStorage.setItem(LS_VOLUME, volume.toString());
      this.player.volume(volume);
    }
  }

  onVolumeClick(ev: any) {
    const volumeBar = this.$refs.volumeBar as Element;
    if (volumeBar) {
      const rect = volumeBar.getBoundingClientRect();
      const y = (ev.clientY - rect.bottom) * -1;
      const yPercentage = y / rect.height;
      this.setVolume(yPercentage);
    }
  }

  onVolumeMouseDown() {
    this.isVolumeDragging = true;
  }

  onVolumeMouseUp() {
    this.isVolumeDragging = false;
  }

  onVolumeDrag(ev) {
    if (this.isVolumeDragging) {
      this.onVolumeClick(ev);
    }
  }

  onProgressBarMouseDown(ev: MouseEvent | TouchEvent) {
    this.isDraggingProgressBar = true;
    // Scrub right away so the user doesn't have to move
    // their mouse
    this.onProgressBarScrub(ev);
  }

  onVideoMouseUp(ev: MouseEvent | TouchEvent) {
    if (!this.isDraggingProgressBar) {
      if (this.mouseDownVideo) {
        // If we weren't dragging the progress bar, but did originally
        // press on the video element, toggle play and exit func
        this.mouseDownVideo = false;
        this.togglePlay(false);
      }

      // Ignore non video related mouseup events: exit func
      return;
    }

    if (this.applyScrubPositionTimeout) {
      clearTimeout(this.applyScrubPositionTimeout);
    }

    const progressBar = this.$refs.progressBar as Element;
    if (progressBar) {
      const rect = progressBar.getBoundingClientRect();
      const clientX =
        window.TouchEvent && ev instanceof window.TouchEvent
          ? ev.changedTouches[0].clientX
          : (ev as MouseEvent).clientX;
      const x = clientX - rect.left;
      const xPercentage = x / rect.width;
      this.seek(Math.min(this.duration, Math.max(0, xPercentage * this.duration)), "", false);
    }

    this.isDraggingProgressBar = false;
    if (this.didPauseForSeeking) {
      this.play();
      this.didPauseForSeeking = false;
    }
  }

  onProgressBarScrub(ev: MouseEvent | TouchEvent) {
    // Ignore global mousemove events
    // Check 'isHoveringProgressBarExact' instead of 'isHoveringProgressBarDelayed'
    // so we can stop scrubbing as soon as the mouse leaves the hover zone,
    // while still displaying the progress bar for a short time
    if (!this.isDraggingProgressBar && !this.isHoveringProgressBarExact) {
      return;
    }

    const progressBar = this.$refs.progressBar as Element;
    // Ignore multitouch events
    if (
      !progressBar ||
      (window.TouchEvent && ev instanceof window.TouchEvent && ev.touches.length !== 1)
    ) {
      return;
    }

    const rect = progressBar.getBoundingClientRect();
    const clientX =
      window.TouchEvent && ev instanceof window.TouchEvent
        ? ev.touches[0].clientX
        : (ev as MouseEvent).clientX;
    let x = clientX - rect.left;
    // Do not go "outside" the width of rectangle
    x = Math.min(rect.right - rect.left, x);
    x = Math.max(0, x);

    this.previewPercent = x / rect.width;

    const sideOffset = SINGLE_PREVIEW_WIDTH / 2 + 5;
    // Prevent preview window "overflowing" the container
    this.previewX = Math.max(Math.min(x, rect.width - sideOffset), sideOffset);

    if (this.isDraggingProgressBar) {
      if (!this.isPaused()) {
        this.pause();
        this.didPauseForSeeking = true;
      }
      // Update our progress right away
      const time = this.previewPercent * this.duration;
      this.progress = time;

      // But delay the seek so we don't seek on every scrub
      this.applyScrubPosition(time);

      // For touch mode, after scrubbing, we want the controls to linger a little
      // since 'isHoveringProgressBarDelayed' won't be set to true
      this.isHoveringVideo = true;
      this.startVideoHoverTimeout();
    }
  }

  applyScrubPosition(time: number): void {
    if (this.applyScrubPositionTimeout) {
      clearTimeout(this.applyScrubPositionTimeout);
    }

    this.applyScrubPositionTimeout = window.setTimeout(() => {
      this.seek(time);
    }, SCRUB_TO_SEEK_DELAY);
  }

  percentOfVideo(time: number) {
    return time / this.duration;
  }

  get progressPercent() {
    return this.percentOfVideo(this.progress);
  }

  get bufferedRanges(): BufferedRange[] {
    if (!this.buffered) {
      return [];
    }
    const bufferedRanges: BufferedRange[] = [];
    for (let i = 0; i < this.buffered.length; i++) {
      bufferedRanges.push({
        start: this.transcodeOffset + this.buffered.start(i),
        end: this.transcodeOffset + this.buffered.end(i),
      });
    }
    return bufferedRanges;
  }

  seekRel(delta: number, text?: string) {
    if (this.isHoveringVideo) {
      this.startVideoHoverTimeout();
    }

    this.notice(`Seek: ${delta > 0 ? "+" : ""}${delta.toString()}s`);

    this.seek(Math.min(this.duration, Math.max(0, this.progress + delta)), text);
  }

  seek(time: number, text?: string, play = false, ignoreCurrentTime = false): void {
    if (this.applyScrubPositionTimeout) {
      clearTimeout(this.applyScrubPositionTimeout);
    }

    if (!this.player || !this.ready) {
      return;
    }

    // If we are seeking to the same time we already have, ignore it
    if (
      !ignoreCurrentTime &&
      Math.abs(time - this.transcodeOffset - this.player.currentTime()) <= 0.01
    ) {
      return;
    }

    this.showPoster = false;

    const currentSource = this.currentSource()!;
    let resumeAfterReset = false;

    if (
      !currentSource.transcode ||
      (this.transcodeOffset < time &&
        this.bufferedRanges.find((range) => range.start <= time && range.end >= time))
    ) {
      // If we are not transcoding, or if the time is already buffered
      // seek directly to the time. Subtract the transcode offset since the
      // player doesn't know the real start time
      this.player.currentTime(time - this.transcodeOffset);
    } else {
      // Else we are transcoding, and the time isn't buffered.
      // We'll change the src and reload, to make the player request
      // for the transcode to start at the seek time

      if (!this.isPaused()) {
        this.pause();
        resumeAfterReset = true;
      }

      this.transcodeOffset = time;
      this.progress = this.transcodeOffset;
      // Reset the buffer while we load the new url
      this.buffered = null;

      const src = new URL(window.location.origin + currentSource.url);
      src.searchParams.set("start", time.toString());
      this.player.src({
        ...currentSource,
        src: src.toString().replace(window.location.origin, ""),
        type: currentSource.mimeType,
      });

      this.player.load();
    }

    if (play || resumeAfterReset) {
      this.play();
    }
    if (text) {
      this.notice(text);
    }
  }

  onVideoTouchStart(ev: TouchEvent): void {
    // Ignore multitouch events
    if (ev.touches.length !== 1) {
      return;
    }

    if (this.showPoster) {
      // If the poster is being shown, just start playing
      this.play();
    } else {
      this.lastTouchClientX = ev.touches[0].clientX;
    }
  }

  onVideoTouchEnd(ev: TouchEvent): void {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - this.touchEndTime;
    if (this.touchEndTimeout) {
      clearTimeout(this.touchEndTimeout);
    }

    if (tapLength > 0 && tapLength < TOUCH_DOUBLE_TAP_TIME) {
      // Double tap
      const video = this.$refs.video as HTMLVideoElement;
      if (video && this.lastTouchClientX !== -1) {
        const rect = video.getBoundingClientRect();
        const x = this.lastTouchClientX - rect.left;
        const xPercentage = x / rect.width;
        if (xPercentage <= 0.25) {
          this.seekRel(-5);
          this.lastTouchClientX = -1;
        } else if (xPercentage >= 0.75) {
          this.seekRel(5);
          this.lastTouchClientX = -1;
        } else {
          this.toggleFullscreen();
        }
      }
    } else {
      this.touchEndTimeout = window.setTimeout(() => {
        // Single tap
        if (this.isHoveringVideo) {
          this.togglePlay();
        } else {
          this.isHoveringVideo = true;
          this.startVideoHoverTimeout();
        }
        if (this.touchEndTimeout) {
          clearTimeout(this.touchEndTimeout);
        }
      }, TOUCH_DOUBLE_TAP_TIME);
    }

    this.touchEndTime = currentTime;
  }

  notice(text: string, duration = 1500) {
    if (this.noticeTimeout) {
      clearTimeout(this.noticeTimeout);
    }
    this.videoNotice = text;
    this.noticeTimeout = window.setTimeout(() => {
      this.videoNotice = "";
    }, duration);
  }

  play(notice = false): void {
    if (!this.player || !this.ready) {
      return;
    }

    (this.$refs.video as HTMLVideoElement).focus();

    this.player.play();
    this.isPlaying = true;
    this.showPoster = false;

    if (notice) {
      this.notice("Play");
    }
  }

  isPaused(): boolean {
    return this.player?.paused() ?? true;
  }

  pause(notice = false): void {
    if (!this.player || !this.ready) {
      return;
    }

    this.player.pause();
    this.isPlaying = false;

    if (notice) {
      this.notice("Paused");
    }
  }

  togglePlay(notice = false): void {
    if (!this.player || !this.ready) {
      return;
    }

    if (this.isHoveringVideo) {
      this.startVideoHoverTimeout();
    }

    if (this.player.paused()) {
      this.play(notice);
    } else {
      this.pause(notice);
    }
  }

  mute(notice = false): void {
    if (!this.player || !this.ready) {
      return;
    }

    if (notice) {
      this.notice("Muted");
    }

    this.player.muted(true);
    this.isMuted = true;
    localStorage.setItem(LS_IS_MUTED, "true");
  }

  unmute(notice = false): void {
    if (!this.player || !this.ready) {
      return;
    }

    if (notice) {
      this.notice("Unmuted");
    }

    this.player.muted(false);
    this.isMuted = false;
    localStorage.setItem(LS_IS_MUTED, "false");
  }

  toggleMute(notice = false): void {
    if (!this.player || !this.ready) {
      return;
    }

    if (this.isHoveringVideo) {
      this.startVideoHoverTimeout();
    }

    if (this.player.muted()) {
      this.unmute(notice);
    } else {
      this.mute(notice);
    }
  }

  selectPlaybackRate(rate: number): void {
    if (!this.player) {
      return;
    }

    this.player.playbackRate(rate);
    this.playbackRate = rate;
    localStorage.setItem(LS_PLAYBACK_RATE, rate.toString());
  }

  onPlaybackRateMenuToggle(isOpen: boolean): void {
    if (this.hidePlaybackRateMenu) {
      window.clearTimeout(this.hidePlaybackRateMenu);
    }
    if (isOpen) {
      this.isPlaybackRateMenuOpen = true;
    } else {
      // Delay setting this to false, so that the controls will still be shown
      // until the menu is hidden and the main controls hover is triggered
      this.hidePlaybackRateMenu = window.setTimeout(() => {
        this.isPlaybackRateMenuOpen = false;
      }, 10);
    }
  }

  selectStreamType(streamType: string): void {
    if (!this.player) {
      return;
    }

    const source = this.sources.find((s) => s.streamType === streamType);
    if (!source) {
      return;
    }
    let resumeAfterReset = false;
    let seekAfterReset = false;
    if (!this.isPaused()) {
      this.pause();
      resumeAfterReset = true;
    }

    const oldProgress = this.progress;
    const src = new URL(window.location.origin + source.url);

    // Reset the buffer while we load the new url
    this.buffered = null;
    this.transcodeOffset = 0;

    if (source.transcode) {
      this.transcodeOffset = oldProgress;
      this.progress = this.transcodeOffset;

      src.searchParams.set("start", this.transcodeOffset.toString());
    } else {
      // When not transcoding, we'll have to seek to
      // the old time once the source is loaded since the player
      // starts from the beginning
      seekAfterReset = true;
    }

    this.player.one("loadedmetadata", () => {
      if (seekAfterReset) {
        this.seek(oldProgress);
      }
      if (resumeAfterReset) {
        this.play();
      }
    });

    this.player.src({
      ...source,
      src: src.toString().replace(window.location.origin, ""),
      type: source.mimeType,
    });
    this.player.load();
  }

  onStreamTypeMenuToggle(isOpen: boolean): void {
    if (this.hideStreamTypeMenu) {
      window.clearTimeout(this.hideStreamTypeMenu);
    }
    if (isOpen) {
      this.isStreamTypeMenuOpen = true;
    } else {
      // Delay setting this to false, so that the controls will still be shown
      // until the menu is hidden and the main controls hover is triggered
      this.hideStreamTypeMenu = window.setTimeout(() => {
        this.isStreamTypeMenuOpen = false;
      }, 10);
    }
  }
}
</script>

<style lang="scss" scoped>
.video-wrapper {
  cursor: pointer;
  position: relative;
  outline: none;
  height: 100%;
  width: 100%;

  // Vertically center the video
  display: flex;
  flex-direction: column;
  justify-content: center;
  background-color: #000000;

  &.hideControls {
    cursor: none;
  }
}

.video {
  // Make sure video does not overflow wrapper
  height: 100%;
  width: 100%;

  .video {
    outline: none;

    &.contain {
      object-fit: contain;
    }

    &.cover {
      object-fit: cover;
    }
  }
}

.video-overlay {
  pointer-events: none;
  overflow: hidden;
  z-index: 11;
  cursor: pointer;
  position: absolute;
  width: 100%;
  height: 100%;

  &.hideControls {
    cursor: none;
  }

  .volume-bar-background {
    position: absolute;
    height: 110px;
    background-color: #121420ee;
    width: 30px;
    top: -110px;
    padding-bottom: 5px;
    // We need more padding at the top, since the current volume circle pokes past the track
    padding-top: 10px;
    user-select: none;

    &.slide-up-enter-active,
    &.slide-up-leave-active {
      transition: transform 100ms ease-out;
      transform-origin: bottom;
    }

    &.slide-up-enter,
    &.slide-up-leave-to {
      transform: scaleY(0);
    }

    .volume-bar-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
      cursor: pointer;

      .volume-bar {
        position: absolute;
        background-color: #202a3b;
        left: 50%;
        transform: translateX(-50%);
        width: 4px;
        height: 100px;
        bottom: 0;
      }

      .current-volume-bar {
        position: absolute;
        background-color: #1c59ca;
        left: 50%;
        transform: translateX(-50%);
        width: 4px;
        height: 35px;
        bottom: 0;
      }

      .current-volume-position {
        position: absolute;
        background-color: #ffffff;
        left: 50%;
        transform: translateX(-50%);
        width: 10px;
        height: 10px;
        border-radius: 50%;
      }
    }
  }

  $controlBarHeight: 36px;

  .control-bar {
    height: $controlBarHeight;
    width: 100%;

    background: #121420ee;
  }

  $barHeight: 6px;
  $barHeightLarge: 12px;

  // Make the wrapper taller than the actual displayed bars
  // so the user has more area to scrub on (especially on touch devices)
  $extendedBarHeight: 16px;

  .progress-bar-wrapper {
    position: relative;
    cursor: pointer;

    height: $extendedBarHeight;

    .time-bar {
      position: absolute;
      bottom: 0;
      width: 100%;
      height: $barHeight;
      background: #303a4b;

      transition: height 100ms ease-in-out;

      &.large {
        height: $barHeightLarge;
      }

      .preview-window {
        position: absolute;
        bottom: 20px;
        transform: translateX(-80px);

        .preview-wrapper {
          position: relative;
          overflow: hidden;
          user-select: none;

          .preview-image {
            position: absolute;
            height: 100%;
          }

          .preview-time {
            width: 100%;
            font-size: 14px;
          }
        }
      }
    }

    @mixin bar {
      pointer-events: none;
      position: absolute;
      bottom: 0;
      height: $barHeight;

      transition: height 100ms ease-out;

      &.large {
        height: $barHeightLarge;
      }
    }

    .progress-bar {
      @include bar;
      left: 0px;
      background: #1c59ca;
    }

    .buffer-bar {
      @include bar;
      background: white;
      opacity: 0.2;
    }

    .seek-bar {
      @include bar;
      background: white;
      opacity: 0.3;
    }

    .marker {
      position: absolute;
      bottom: 0;
      width: 4px;
      height: 12px;

      transition: all 0.15s ease-in-out;
      border-radius: 4px;
      background: #489fb4;

      &.hover {
        background: #19c0fd;
        height: 16px;
      }
    }
  }

  .bottom-bar-wrapper {
    cursor: default;
    pointer-events: auto;
    position: absolute;
    bottom: 0px;
    left: 0px;
    width: 100%;
  }

  .bottom-bar-content {
    position: relative;
    height: 100%;
    width: 100%;
  }

  .notice {
    background: #333333aa;
    position: absolute;
    left: 10px;
    top: 10px;
    border-radius: 6px;
  }

  .poster {
    // Prevent the poster intercepting 'touchstart' events:
    // Since it's rendered conditionnally, if it's hidden after the 'touchstart'
    // it won't trigger a 'touchend' event
    pointer-events: none;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;

    &.blurred {
      filter: blur(8px);
    }
  }
}
</style>
