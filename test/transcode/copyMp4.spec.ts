import { before, Suite } from "mocha";
import { FFProbeAudioCodecs, FFProbeVideoCodecs } from "../../src/ffmpeg/ffprobe";
import Scene from "../../src/types/scene";
import { expect } from "chai";
import { startTestServer, stopTestServer } from "../testServer";
import { CopyMP4Transcoder } from "../../src/transcode/copyMp4";

describe("transcoder", () => {
  describe("copyMp4", function (this: Suite) {
    before(async () => {
      await startTestServer.call(this);
    });

    after(() => {
      stopTestServer();
    });

    it("copies the video stream", () => {
      const scene = new Scene("test");
      scene.meta.videoCodec = FFProbeVideoCodecs.H264;

      const { outputOptions } = new CopyMP4Transcoder(scene).getTranscodeOptions();
      expect(outputOptions).to.include("-c:v copy");
    });

    it("copies the video stream 2", () => {
      const scene = new Scene("test") as Scene & { path: string };
      scene.meta.videoCodec = null;

      const { outputOptions } = new CopyMP4Transcoder(scene).getTranscodeOptions();
      // this transcoder only has one possible video codec output
      expect(outputOptions).to.include("-c:v copy");
    });

    it("copies the audio stream", () => {
      const scene = new Scene("test") as Scene & { path: string };
      scene.meta.audioCodec = FFProbeAudioCodecs.AAC;

      const { outputOptions } = new CopyMP4Transcoder(scene).getTranscodeOptions();
      expect(outputOptions).to.include("-c:a copy");
    });

    it("does not copy the audio stream", () => {
      const scene = new Scene("test") as Scene & { path: string };
      scene.meta.audioCodec = null;

      const { outputOptions } = new CopyMP4Transcoder(scene).getTranscodeOptions();
      expect(outputOptions).to.not.include("-c:a copy");
    });

    it("validates requirements", () => {
      const scene = new Scene("test");
      scene.meta.videoCodec = FFProbeVideoCodecs.H264;

      expect(new CopyMP4Transcoder(scene).validateRequirements()).to.be.true;
    });

    it("invalid requirements", () => {
      const scene = new Scene("test");
      scene.meta.videoCodec = null;

      expect(new CopyMP4Transcoder(scene).validateRequirements()).to.be.an("Error");
    });
  });
});
