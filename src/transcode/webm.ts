import { getConfig } from "../config";
import { FFProbeAudioCodecs, FFProbeVideoCodecs } from "../ffmpeg/ffprobe";
import { BasicTranscoder, FFmpegOption, TranscodeOptions } from "./transcoder";

export class WebmTranscoder extends BasicTranscoder {
  validateRequirements(): true | Error {
    return true;
  }

  mimeType(): string {
    return "video/webm";
  }

  videoEncoder(): string {
    return "libvpx-vp9";
  }

  audioEncoder(): string {
    return "libopus";
  }

  isVideoValidForContainer(): boolean {
    return (
      !!this.scene.meta.videoCodec &&
      [FFProbeVideoCodecs.VP8, FFProbeVideoCodecs.VP9].includes(this.scene.meta.videoCodec)
    );
  }

  isAudioValidForContainer(): boolean {
    return (
      !!this.scene.meta.audioCodec &&
      [FFProbeAudioCodecs.VORBIS, FFProbeAudioCodecs.OPUS].includes(this.scene.meta.audioCodec)
    );
  }

  getBitrateParams(): FFmpegOption[] {
    return [
      "-b:v 0", // Bitrate must be 0 to use constant quality (like x264) instead of constrained quality
    ];
  }

  getTranscodeOptions(): TranscodeOptions {
    const { inputOptions, outputOptions, mimeType } = super.getTranscodeOptions();
    const webmConfig = getConfig().transcode.webm;

    outputOptions.push(
      "-f webm",
      `-deadline ${webmConfig.deadline}`,
      `-cpu-used ${webmConfig.cpuUsed}`,
      "-row-mt 1", // Enable tile row multithreading
      `-crf ${webmConfig.crf}`,
      ...this.getBitrateParams()
    );

    return {
      inputOptions,
      outputOptions,
      mimeType,
    };
  }
}
