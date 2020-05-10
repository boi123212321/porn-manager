import { basename, extname } from "path";

import { fileIsExcluded } from "../../types/utility";
import { getConfig } from "../../config";

export function isImportableVideo(path) {
  const config = getConfig();

  return (
    [".mp4", ".webm"].includes(extname(path)) &&
    !basename(path).startsWith(".") &&
    !fileIsExcluded(config.EXCLUDE_FILES, path)
  );
}
