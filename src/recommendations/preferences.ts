import Scene from "../types/scene";
import { logger } from "../utils/logger";

// Dictionary [label id] -> value
let preferences: Record<string, number> | null = null;

export async function refreshPreferences() {
  logger.verbose(`Refreshing preferences`);

  const count = await Scene.countLabelUsage([
    {
      range: {
        numViews: {
          gt: 0,
        },
      },
    },
  ]);

  const newPreferences: Record<string, number> = {};

  for (const [key, { score }] of Object.entries(count)) {
    newPreferences[key] = score;
  }

  preferences = newPreferences;
}

export async function getPreferences(): Promise<Record<string, number>> {
  if (!preferences) {
    await refreshPreferences();
  }
  return <Record<string, number>>JSON.parse(JSON.stringify(preferences));
}
