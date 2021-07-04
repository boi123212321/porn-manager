import { expect } from "chai";

import { studioCollection } from "../../src/database";
import { extractStudios } from "../../src/extractor";
import Studio from "../../src/types/studio";
import { startTestServer, stopTestServer } from "../testServer";

describe("matcher", () => {
  describe("studio", () => {
    after(() => {
      stopTestServer();
    });

    it("Should correctly match studios", async function () {
      await startTestServer.call(this);

      const vixen = new Studio("VIXEN");

      const blacked = new Studio("BLACKED");

      await studioCollection.upsert(vixen._id, vixen);
      await studioCollection.upsert(blacked._id, blacked);

      expect(await studioCollection.count()).to.equal(2);

      {
        const matches = await extractStudios(
          "/videos/Networks/VIXEN Media Group/BLACKED/BLACKED - S2018E0520 - Alina Lopez - Side Chick Games 2.mp4"
        );
        expect(matches[0]).to.equal(blacked._id);
      }

      // Add network

      const vixenNetwork = new Studio("VIXEN Media Group");
      vixen.parent = vixenNetwork._id;
      blacked.parent = vixenNetwork._id;
      await studioCollection.upsert(vixenNetwork._id, vixenNetwork);
      await studioCollection.upsert(vixen._id, vixen);
      await studioCollection.upsert(blacked._id, blacked);

      expect(await studioCollection.count()).to.equal(3);
      expect((await Studio.getSubStudios(vixenNetwork._id)).length).to.equal(2);

      {
        const matches = await extractStudios(
          "/videos/Networks/VIXEN Media Group/BLACKED/BLACKED - S2018E0520 - Alina Lopez - Side Chick Games 2.mp4"
        );
        expect(matches[0]).to.equal(blacked._id);
      }
    });
  });
});
