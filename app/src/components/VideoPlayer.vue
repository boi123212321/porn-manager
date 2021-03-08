<template>
  <div class="white--text">
    <v-responsive :aspect-ratio="aspectRatio" :max-height="maxHeight">
      <v-hover @input="isHoveringVideo = $event">
        <div
          :class="{ 'video-wrapper': true, hideControls: !isHoveringVideo }"
          ref="videoWrapper"
          tabindex="0"
          @mousemove="
            isHoveringVideo = true;
            startVideoHoverTimeout();
          "
          @fullscreenchange="onFullscreenChange"
        >
          <div :class="{ 'video-overlay': true, hideControls: !isHoveringVideo }">
            <v-img
              @click="togglePlay(false)"
              @dblclick="toggleFullscreen"
              :src="poster"
              cover
              max-height="100%"
              class="blurred poster"
              v-if="poster && showPoster"
            ></v-img>
            <v-img
              @click="togglePlay(false)"
              @dblclick="toggleFullscreen"
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
              <div v-if="showControls" class="bottom-bar-wrapper">
                <div class="bottom-bar-content">
                  <v-hover close-delay="200" @input="isHoveringProgressBar = $event">
                    <div
                      @mousedown.stop.prevent="onProgressBarMouseDown"
                      @touchmove.prevent="onProgressBarScrub"
                      @touchstart.prevent="onProgressBarMouseDown"
                      @touchend.prevent="onProgressBarMouseUp"
                      @click="onProgressClick"
                      ref="progressBar"
                      class="progress-bar-wrapper"
                    >
                      <div :class="{ 'time-bar': true, large: isHoveringProgressBar }">
                        <v-fade-transition>
                          <div
                            class="elevation-4 preview-window"
                            v-if="(isHoveringProgressBar || isDraggingProgressBar) && preview"
                            :style="`left: ${previewX * 100}%;`"
                          >
                            <div
                              class="preview-wrapper"
                              :style="{
                                width: '160px',
                                height: `${Math.round(160 / this.aspectRatio)}px`,
                              }"
                            >
                              <img
                                class="preview-image"
                                :style="`left: -${imageIndex * 160}px; background-position: ${
                                  imageIndex * 160
                                }`"
                                :src="preview"
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

                      <template v-if="buffered">
                        <template v-for="i in buffered.length">
                          <div
                            :key="i"
                            :class="{ 'buffer-bar': true, large: isHoveringProgressBar }"
                            :style="`left: ${
                              percentOfVideo(buffered.start(i - 1)) * 100
                            }%; right: ${100 - percentOfVideo(buffered.end(i - 1)) * 100}%;`"
                          ></div>
                        </template>
                      </template>
                      <div
                        :class="{ 'progress-bar': true, large: isHoveringProgressBar }"
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
                    <v-menu offset-y top @input="onPlaybackRateMenuToggle">
                      <template #activator="{ on, attrs }">
                        <v-btn class="text-none" text v-bind="attrs" v-on="on" small>
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
            @click="togglePlay(false)"
            @touchstart="onVideoTouchStart"
            @touchend="onVideoTouchEnd"
            @dblclick="toggleFullscreen"
            :class="{
              'video video-js': true,
              cover: fitMode === 'cover',
              contain: fitMode === 'contain',
            }"
            ref="video"
          >
            <source :src="src" type="video/mp4" />
          </video>
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

@Component
export default class VideoPlayer extends Vue {
  @Prop(String) src!: string;
  @Prop(Number) duration!: number;
  @Prop({ default: null }) poster!: string | null;
  @Prop() markers!: { _id: string; name: string; time: number }[];
  @Prop({ default: null }) preview!: string | null;
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

  isDraggingProgressBar = false;
  isHoveringProgressBar = false;
  didPauseForSeeking = false;
  applyScrubPositionTimeout: number | null = null;
  isHoveringVideo = false;
  videoHoverTimeout: null | number = null;
  isPlaybackRateMenuOpen = false;
  hidePlaybackRateMenu: null | number = null;
  fitMode: "cover" | "contain" = "contain";
  isFullscreen = false;

  touchEndTimeout: null | number = null;
  touchEndTime: number = 0;
  lastTouchClientX = -1;

  paniced = false;

  PREVIEW_START_OFFSET = PREVIEW_START_OFFSET;
  PLAYBACK_RATES = PLAYBACK_RATES;

  mounted() {
    window.addEventListener("mouseup", this.onVolumeMouseUp);
    window.addEventListener("mouseup", this.onProgressBarMouseUp);
    window.addEventListener("mousemove", this.onProgressBarScrub);

    this.player = videojs(
      this.$refs.video,
      {
        fluid: false,
        playbackRates: [0.5, 1, 1.5, 2],
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

        this.player!.on("timeupdate", (ev: Event) => {
          this.progress = this.player!.currentTime();
          this.buffered = this.player!.buffered();
          this.ended = this.player!.ended();
          this.isPlaying = this.isPlaying && !this.ended;
        });

        this.player!.on("playerresize", (ev: Event) => {
          const video = this.$refs.video as HTMLVideoElement;
          const box = video.getBoundingClientRect();
          const renderedAspectRatio = box.width / box.height;
          this.showFitOption = renderedAspectRatio !== this.aspectRatio;
        });
      }
    );
  }

  beforeDestroy() {
    window.removeEventListener("mouseup", this.onVolumeMouseUp);
    window.removeEventListener("mouseup", this.onProgressBarMouseUp);
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

  get imageIndex() {
    // The preview start is offset from the beginning of the scene.
    // If previewX is in this zone, just show the first preview we have
    if (this.previewX <= PREVIEW_START_OFFSET) {
      return 0;
    }
    // For the rest, subtract the offset to get the actual "x"
    // of the cursor in the preview
    const actualX = this.previewX - PREVIEW_START_OFFSET;
    // Multiply by 100 since there are 100 previews
    return Math.floor(actualX * 100);
  }

  get previewTime() {
    return this.formatTime(this.duration * this.previewX);
  }

  get showControls() {
    return (
      this.isPlaybackRateMenuOpen ||
      this.isVolumeDragging ||
      this.isHoveringProgressBar ||
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

  onProgressBarMouseDown() {
    this.isDraggingProgressBar = true;
  }

  onProgressBarMouseUp() {
    // Ignore global mouseup events
    if (!this.isDraggingProgressBar) {
      return;
    }

    if (this.applyScrubPositionTimeout) {
      clearTimeout(this.applyScrubPositionTimeout);
    }

    // Seek to the scrub position
    this.seek(this.progress);

    this.isDraggingProgressBar = false;
    if (this.didPauseForSeeking) {
      this.play();
      this.didPauseForSeeking = false;
    }
  }

  onProgressBarScrub(ev: MouseEvent | TouchEvent) {
    // Ignore global mousemove events
    if (!this.isDraggingProgressBar && !this.isHoveringProgressBar) {
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
    // Do not "outside" the width of rectangle
    x = Math.min(rect.right - rect.left, x);
    x = Math.max(0, x);

    this.previewX = x / rect.width;

    if (this.isDraggingProgressBar) {
      if (!this.isPaused()) {
        this.pause();
        this.didPauseForSeeking = true;
      }
      // Update our progress right away
      const time = this.previewX * this.duration;
      this.progress = time;

      // But delay the seek so we don't seek on every scrub
      this.applyScrubPosition(time);

      // For touch mode, after scrubbing, we want the controls to linger a little
      // since 'isHoveringProgressBar' won't be set to true
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

  seekRel(delta: number, text?: string) {
    if (this.isHoveringVideo) {
      this.startVideoHoverTimeout();
    }

    this.notice(`Seek: ${delta > 0 ? "+" : ""}${delta.toString()}s`);

    this.seek(Math.min(this.duration, Math.max(0, this.progress + delta)), text);
  }

  seek(time: number, text?: string, play = false): void {
    if (this.applyScrubPositionTimeout) {
      clearTimeout(this.applyScrubPositionTimeout);
    }

    if (!this.player || !this.ready) {
      return;
    }
    this.showPoster = false;

    this.player.currentTime(time);
    if (play) {
      this.play();
    }
    if (text) {
      this.notice(text);
    }
  }

  onProgressClick(ev: any) {
    if (this.applyScrubPositionTimeout) {
      clearTimeout(this.applyScrubPositionTimeout);
    }

    const progressBar = this.$refs.progressBar as Element;
    if (progressBar) {
      const rect = progressBar.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const xPercentage = x / rect.width;
      this.seek(xPercentage * this.duration, "", false);
    }
  }

  onVideoTouchStart(ev: TouchEvent): void {
    // Ignore multitouch events
    if (ev.touches.length !== 1) {
      return;
    }
    this.lastTouchClientX = ev.touches[0].clientX;
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
    pointer-events: auto;
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
