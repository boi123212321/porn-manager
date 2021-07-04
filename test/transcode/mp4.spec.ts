import { Suite } from "mocha";
import { FFProbeAudioCodecs, FFProbeVideoCodecs } from "../../src/ffmpeg/ffprobe";
import Scene from "../../src/types/scene";
import { expect } from "chai";
import { startTestServer, stopTestServer } from "../testServer";
import { MP4Transcoder } from "../../src/transcode/mp4";
import { HardwareAccelerationDriver } from "../../src/config/schema";
import * as os from "os";

describe("transcoder", () => {
  describe("mp4", () => {
    describe("main tests", function (this: Suite) {
      before(async () => {
        await startTestServer.call(this);
      });

      after(() => {
        stopTestServer();
      });

      it("copies the video stream", () => {
        const scene = new Scene("test");
        scene.meta.videoCodec = FFProbeVideoCodecs.H264;

        const { outputOptions } = new MP4Transcoder(scene).getTranscodeOptions();
        expect(outputOptions).to.include("-c:v copy");
      });

      it("transcodes the video stream", () => {
        const scene = new Scene("test") as Scene & { path: string };
        scene.meta.videoCodec = "unknown" as FFProbeVideoCodecs;

        const { outputOptions } = new MP4Transcoder(scene).getTranscodeOptions();
        expect(outputOptions).to.include("-c:v libx264");
      });

      it("copies the audio stream", () => {
        const scene = new Scene("test") as Scene & { path: string };
        scene.meta.audioCodec = FFProbeAudioCodecs.AAC;

        const { outputOptions } = new MP4Transcoder(scene).getTranscodeOptions();
        expect(outputOptions).to.include("-c:a copy");
        expect(outputOptions).to.not.include("-c:a aac");
      });

      it("does not copy the audio stream", () => {
        const scene = new Scene("test") as Scene & { path: string };
        scene.meta.audioCodec = "unknown" as FFProbeAudioCodecs;

        const { outputOptions } = new MP4Transcoder(scene).getTranscodeOptions();
        expect(outputOptions).to.include("-c:a aac");
      });

      it("validates requirements", () => {
        const scene = new Scene("test");
        scene.meta.videoCodec = FFProbeVideoCodecs.H264;

        expect(new MP4Transcoder(scene).validateRequirements()).to.be.true;
      });

      it("validates requirements 2", () => {
        const scene = new Scene("test");
        scene.meta.videoCodec = "unknown" as FFProbeVideoCodecs;

        expect(new MP4Transcoder(scene).validateRequirements()).to.be.true;
      });
    });

    describe("unique cases", () => {
      afterEach(() => {
        stopTestServer();
      });

      it("does not transcode when compatible", async function () {
        await startTestServer.call(this, {
          transcode: { hwaDriver: HardwareAccelerationDriver.enum.vaapi },
        });

        const scene = new Scene("test") as Scene & { path: string };

        scene.meta.videoCodec = FFProbeVideoCodecs.H264;

        const { outputOptions } = new MP4Transcoder(scene).getTranscodeOptions();
        expect(outputOptions).to.not.include("-c:v h264_vaapi");
      });

      it("transcodes using selected driver", async function () {
        await startTestServer.call(this, {
          transcode: { hwaDriver: HardwareAccelerationDriver.enum.vaapi },
        });

        const scene = new Scene("test") as Scene & { path: string };

        scene.meta.videoCodec = "unknown" as FFProbeVideoCodecs;

        const { outputOptions } = new MP4Transcoder(scene).getTranscodeOptions();
        expect(outputOptions).to.include("-c:v h264_vaapi");
      });

      it("applies bitrate params when necessary for amf", async function () {
        await startTestServer.call(this, {
          transcode: { hwaDriver: HardwareAccelerationDriver.enum.amf },
        });

        const scene = new Scene("test") as Scene & { path: string };
        scene.meta.bitrate = 1000;

        scene.meta.videoCodec = "unknown" as FFProbeVideoCodecs;

        const { outputOptions } = new MP4Transcoder(scene).getTranscodeOptions();
        expect(outputOptions).to.include("-c:v h264_amf");

        if (os.type() === "Windows_NT") {
          expect(outputOptions.some((opt) => opt.includes("-maxrate"))).to.be.true;
        } else {
          expect(outputOptions.some((opt) => opt.includes("-maxrate"))).to.be.false;
        }
      });
    });
  });
});
