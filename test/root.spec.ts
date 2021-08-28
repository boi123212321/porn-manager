import { expect } from "chai";
import { existsSync } from "fs";
import { Suite } from "mocha";
import path from "path";

import { getFFMpegURL, getFFProbeURL } from "../src/binaries/ffmpeg-download";
import { izzyPath } from "../src/binaries/izzy";
import { clearPluginWatchers } from "../src/plugins/register";
import Actor from "../src/types/actor";
import ActorReference from "../src/types/actor_reference";
import CustomField from "../src/types/custom_field";
import Image from "../src/types/image";
import Label from "../src/types/label";
import LabelledItem from "../src/types/labelled_item";
import Marker from "../src/types/marker";
import Movie from "../src/types/movie";
import MovieScene from "../src/types/movie_scene";
import Scene from "../src/types/scene";
import Studio from "../src/types/studio";
import SceneView from "../src/types/watch";
import { startTestServer, stopTestServer } from "./testServer";

describe("root", () => {
  describe("meta", async function (this: Suite) {
    it("cleans up after itself", async () => {
      await startTestServer.call(this);
      stopTestServer();
      clearPluginWatchers();
      expect(existsSync("config.test.json")).to.be.false;
      expect(existsSync("test/libary")).to.be.false;
    });
  });

  describe("main", async function (this: Suite) {
    before(async () => {
      await startTestServer.call(this);
    });

    after(() => {
      stopTestServer();
      clearPluginWatchers();
    });

    it("binaries were downloaded/already exist", () => {
      expect(existsSync(path.basename(getFFMpegURL()))).to.be.true;
      expect(existsSync(path.basename(getFFProbeURL()))).to.be.true;
      expect(existsSync(izzyPath)).to.be.true;
    });

    it("default test collections are empty", async () => {
      expect(await ActorReference.getAll()).to.be.empty;
      expect(await Actor.getAll()).to.be.empty;
      expect(await CustomField.getAll()).to.be.empty;
      expect(await Image.getAll()).to.be.empty;
      expect(await Label.getAll()).to.be.empty;
      expect(await LabelledItem.getAll()).to.be.empty;
      expect(await Marker.getAll()).to.be.empty;
      expect(await MovieScene.getAll()).to.be.empty;
      expect(await Movie.getAll()).to.be.empty;
      expect(await Scene.getAll()).to.be.empty;
      expect(await Studio.getAll()).to.be.empty;
      expect(await SceneView.getAll()).to.be.empty;
    });
  });
});
