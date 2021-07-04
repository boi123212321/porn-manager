import { getConfig } from "../config";
import { FFProbeAudioCodecs, FFProbeVideoCodecs } from "../ffmpeg/ffprobe";
import { BasicTranscoder, FFmpegOption, TranscodeOptions } from "./transcoder";

export class CopyMP4Transcoder extends BasicTranscoder {
  validateRequirements(): true | Error {
    // If the video codec is not valid for mp4, that means we can't just copy
    // the video stream. We should use another transcoder
    if (!this.scene.meta.videoCodec || !this.isVideoValidForContainer()) {
      return new Error(`Video codec "${this.scene.meta.videoCodec}" is not valid for mp4`);
    }
    return true;
  }

  isVideoValidForContainer(): boolean {
    return (
      !!this.scene.meta.videoCodec &&
      [FFProbeVideoCodecs.H264, FFProbeVideoCodecs.H265, FFProbeVideoCodecs.VP9].includes(
        this.scene.meta.videoCodec
      )
    );
  }

  isAudioValidForContainer(): boolean {
    return (
      !!this.scene.meta.audioCodec &&
      [FFProbeAudioCodecs.AAC, FFProbeAudioCodecs.MP3, FFProbeAudioCodecs.OPUS].includes(
        this.scene.meta.audioCodec
      )
    );
  }

  mimeType(): string {
    return "video/mp4";
  }

  videoEncoder(): string {
    return "copy";
  }

  audioEncoder(): string {
    return "aac";
  }

  getBitrateParams(): FFmpegOption[] {
    return [];
  }

  getTranscodeOptions(): TranscodeOptions {
    const { inputOptions, outputOptions, mimeType } = super.getTranscodeOptions();
    const h264Config = getConfig().transcode.h264;

    outputOptions.push(
      "-movflags frag_keyframe+empty_moov+faststart",
      `-preset ${h264Config.preset ?? "veryfast"}`,
      `-crf ${h264Config.crf ?? 23}`,
      ...this.getBitrateParams()
    );

    return {
      inputOptions,
      outputOptions,
      mimeType,
    };
  }
}
