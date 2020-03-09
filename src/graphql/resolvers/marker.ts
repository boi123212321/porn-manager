import Marker from "../../types/marker";

export default {
  async labels(marker: Marker) {
    return await Marker.getLabels(marker);
  }
};
