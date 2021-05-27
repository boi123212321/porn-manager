import Scene from "../types/scene";
import { logger } from "../utils/logger";
import { getPreferences } from "./preferences";

export async function recommendUnwatchedScenes(): Promise<[Scene, number][]> {
  logger.debug(`Recommending unwatched scenes`);

  const preferences = await getPreferences();
  logger.silly(preferences);

  const recommendations: [Scene, number][] = [];

  await Scene.iterate(
    async (sc) => {
      const labels = (await Scene.getLabels(sc)).map((l) => l._id);
      // TODO: maybe take actors into account

      const score = labels.reduce((sum, labelId) => {
        const labelScore = preferences[labelId] || 0;
        const add = labelScore / labels.length || 0;
        return sum + add;
      }, 0);

      recommendations.push([sc, score]);
    },
    [
      {
        term: {
          numViews: 0,
        },
      },
    ]
  );

  return recommendations.sort((a, b) => b[1] - a[1]);
}
