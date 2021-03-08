import { expect } from "chai";

import Marker from "../../src/types/marker";
import { createMarker } from "../../src/plugins/events/scene";
import { startTestServer, stopTestServer } from "../testServer";
import Scene from "../../src/types/scene";
import { sceneCollection } from "../../src/database";
import { after } from "mocha";

describe("Marker", () => {
  describe("createMarker", () => {
    after(() => {
      stopTestServer();
    });

    let sceneId: string;

    it("Should create marker", async function () {
      await startTestServer.call(this);

      const scene = new Scene("Test scene");
      sceneId = scene._id;
      await sceneCollection.upsert(sceneId, scene);

      expect(await Marker.getAll()).to.be.empty;

      const name = "Marker test",
        time = 200;
      const marker = await createMarker(sceneId, name, time);
      expect(marker?._id).to.be.a("string");
      expect(marker?.name).to.equal(name);
      expect(marker?.time).to.equal(time);

      expect(await Marker.getAll()).to.have.length(1);
    });

    it("Should not create duplicate marker", async function () {
      const marker = await createMarker(sceneId, "Marker test 2", 198);
      expect(marker).to.be.null;

      expect(await Marker.getAll()).to.have.length(1);
    });

    it("Should not create duplicate marker 2", async function () {
      const marker = await createMarker(sceneId, "Marker test 2", 202);
      expect(marker).to.be.null;

      expect(await Marker.getAll()).to.have.length(1);
    });
  });
});
