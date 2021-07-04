import * as os from "os";

import { getConfig } from "../config";
import { HardwareAccelerationDriver } from "../config/schema";
import { FFProbeAudioCodecs, FFProbeContainers, FFProbeVideoCodecs } from "../ffmpeg/ffprobe";
import { BasicTranscoder, FFmpegOption, TranscodeOptions } from "./transcoder";

export class MP4Transcoder extends BasicTranscoder {
  currentVideoEncoder = this.videoEncoder();

  validateRequirements(): true | Error {
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
    return "libx264";
  }

  audioEncoder(): string {
    return "aac";
  }

  getBitrateParams(): FFmpegOption[] {
    // Only apply bitrate options for windows using amf driver
    if (
      os.platform() !== "win32" ||
      this.currentVideoEncoder !== "h264_amf" ||
      !this.scene.meta.bitrate
    ) {
      return [];
    }

    return [
      `-b:v ${this.scene.meta.bitrate}`,
      `-maxrate ${this.scene.meta.bitrate}`,
      `-bufsize ${this.scene.meta.bitrate * 2}`,
    ];
  }

  getTranscodeOptions(): TranscodeOptions {
    const { inputOptions, outputOptions, mimeType } = super.getTranscodeOptions();
    const transcodeConfig = getConfig().transcode;

    let vCodec =
      outputOptions.find((opt) => opt.startsWith("-c:v"))?.split(" ")[1] || this.videoEncoder();

    // Only apply hw drivers when the stream isn't already
    // compatible
    if (vCodec !== "copy" && transcodeConfig.hwaDriver) {
      switch (transcodeConfig.hwaDriver) {
        case HardwareAccelerationDriver.enum.vaapi:
          vCodec = "h264_vaapi";
          inputOptions.push(`-hwaccel vaapi`, `-hwaccel_output_format vaapi`);

          if (transcodeConfig.vaapiDevice) {
            inputOptions.push(
              `-init_hw_device vaapi=hwdev:${transcodeConfig.vaapiDevice}`,
              "-hwaccel_device hwdev",
              "-filter_hw_device hwdev"
            );
            outputOptions.push("-vf format=nv12|vaapi,hwupload");
          }

          break;
        case HardwareAccelerationDriver.enum.qsv:
          vCodec = "h264_qsv";
          inputOptions.push(
            "-init_hw_device qsv=qsv:MFX_IMPL_hw_any",
            "-hwaccel qsv",
            "-filter_hw_device qsv"
          );

          break;
        case HardwareAccelerationDriver.enum.nvenc:
          vCodec = "h264_nvenc";
          inputOptions.push("-hwaccel nvenc", "-hwaccel_output_format cuda");
          break;
        case HardwareAccelerationDriver.enum.cuda:
          vCodec = "h264_nvenc";
          inputOptions.push("-hwaccel cuda", "-hwaccel_output_format cuda");
          break;
        case HardwareAccelerationDriver.enum.amf:
          vCodec = "h264_amf";
          inputOptions.push("-hwaccel d3d11va");
          break;
        case HardwareAccelerationDriver.enum.videotoolbox:
          vCodec = "h264_videotoolbox";
          inputOptions.push("-hwaccel videotoolbox");
          break;
      }
    }

    this.currentVideoEncoder = vCodec;

    // Sometimes mpegts contains aac audio with adts headers
    // but mp4 requires raw aac: this filter converts it for us
    if (
      this.scene.meta.container === FFProbeContainers.MPEGTS &&
      this.scene.meta.audioCodec === FFProbeAudioCodecs.AAC
    ) {
      outputOptions.push("-bsf:a aac_adtstoasc");
    }

    outputOptions.push(
      "-f mp4",
      `-c:v ${vCodec}`,
      "-movflags frag_keyframe+empty_moov+faststart",
      `-preset ${transcodeConfig.h264.preset ?? "veryfast"}`,
      `-crf ${transcodeConfig.h264.crf ?? 23}`,
      ...this.getBitrateParams()
    );

    return {
      inputOptions,
      outputOptions,
      mimeType,
    };
  }
}
