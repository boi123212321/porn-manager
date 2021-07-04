import { before, Suite } from "mocha";
import { WebmTranscoder } from "./../../src/transcode/webm";
import { FFProbeAudioCodecs, FFProbeVideoCodecs } from "../../src/ffmpeg/ffprobe";
import Scene from "../../src/types/scene";
import { expect } from "chai";
import { startTestServer, stopTestServer } from "../testServer";

describe("transcoder", () => {
  describe("webm", function (this: Suite) {
    before(async () => {
      await startTestServer.call(this);
    });

    after(() => {
      stopTestServer();
    });

    it("copies the video stream", () => {
      const scene = new Scene("test");
      scene.meta.videoCodec = FFProbeVideoCodecs.VP9;

      const { outputOptions } = new WebmTranscoder(scene).getTranscodeOptions();
      expect(outputOptions).to.include("-c:v copy");
    });

    it("does not copy the video stream", () => {
      const scene = new Scene("test") as Scene & { path: string };
      scene.meta.videoCodec = FFProbeVideoCodecs.H265;

      const { outputOptions } = new WebmTranscoder(scene).getTranscodeOptions();
      expect(outputOptions).to.not.include("-c:v copy");
    });

    it("copies the audio stream", () => {
      const scene = new Scene("test") as Scene & { path: string };
      scene.meta.audioCodec = FFProbeAudioCodecs.OPUS;

      const { outputOptions } = new WebmTranscoder(scene).getTranscodeOptions();
      expect(outputOptions).to.include("-c:a copy");
    });

    it("does not copy the audio stream", () => {
      const scene = new Scene("test") as Scene & { path: string };
      scene.meta.audioCodec = FFProbeAudioCodecs.MP3;

      const { outputOptions } = new WebmTranscoder(scene).getTranscodeOptions();
      expect(outputOptions).to.not.include("-c:a copy");
    });
  });
});
