import Scene from "../types/scene";

export enum SceneStreamTypes {
  DIRECT = "direct",
  MP4_DIRECT = "mp4_direct",
  MP4_TRANSCODE = "mp4_transcode",
  WEBM_TRANSCODE = "webm_transcode",
}

export type FFmpegOption = string;

export interface TranscodeOptions {
  inputOptions: FFmpegOption[];
  outputOptions: FFmpegOption[];
  mimeType: string;
}

export abstract class BasicTranscoder {
  scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  abstract validateRequirements(): true | Error;
  abstract isVideoValidForContainer(): boolean;
  abstract isAudioValidForContainer(): boolean;
  abstract mimeType(): string;
  abstract videoEncoder(): string;
  abstract audioEncoder(): string;
  abstract getBitrateParams(): FFmpegOption[];

  getTranscodeOptions(): TranscodeOptions {
    const outputOptions: string[] = [];

    if (this.scene.meta.videoCodec && this.isVideoValidForContainer()) {
      outputOptions.push("-c:v copy");
    } else {
      outputOptions.push(`-c:v ${this.videoEncoder()}`);
    }
    if (this.scene.meta.audioCodec && this.isAudioValidForContainer()) {
      outputOptions.push("-c:a copy");
    } else {
      outputOptions.push(`-c:a ${this.audioEncoder()}`);
    }

    return {
      inputOptions: [],
      outputOptions,
      mimeType: this.mimeType(),
    };
  }
}
