export interface EditEventPlugin {
  _key: number;
  _pluginKey: number;
  id: string;
  args: object | null;
  hasValidArgs: boolean;
  hasCustomArgs: boolean;
}

export interface EditPlugin {
  _key: number;
  id: string;
  name: string;
  path: string;
  args: object;
  version: string;
  requiredVersion: string;
  hasValidArgs: boolean;
  hasValidPath: boolean;
  hasValidVersion: boolean;
  events: string[];
  authors: string[];
  description: string;
  dirty: boolean;
}
