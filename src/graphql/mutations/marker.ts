import Marker from "../../types/marker";
import * as database from "../../database";
import CrossReference from "../../types/cross_references";

interface ICreateMarkerArgs {
  scene: string;
  name: string;
  time: number;
  rating?: number | null;
  favorite?: boolean | null;
  bookmark?: boolean | null;
}

export default {
  async createMarker(
    _: any,
    { scene, name, time, rating, favorite, bookmark }: ICreateMarkerArgs
  ) {
    const marker = new Marker(name, scene, time);

    if (typeof rating == "number") {
      if (rating < 0 || rating > 10) throw new Error("BAD_REQUEST");
      marker.rating = rating;
    }

    if (typeof favorite == "boolean") marker.favorite = favorite;

    if (typeof bookmark == "boolean") marker.bookmark = bookmark;

    await database.insert(database.store.markers, marker);

    const crossReference = new CrossReference(scene, marker._id);
    await database.insert(database.store.crossReferences, crossReference);

    return marker;
  },
  async removeMarkers(_: any, { ids }: { ids: string[] }) {
    for (const id of ids) {
      await Marker.remove(id);
    }
    return true;
  }
};
