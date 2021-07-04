export type PluginEvents =
  | "actorCreated"
  | "actorCustom"
  | "sceneCreated"
  | "sceneCustom"
  | "movieCreated";

export interface PluginArg {
  name: string;
  type: boolean;
  required: boolean;
  default?: any;
  description?: string;
}

export interface IPluginInfo {
  // Taken from plugin's info.json
  events: PluginEvents[];
  arguments: PluginArg[];
  version: string;
  authors: string[];
  name: string;
  description: string;
}

export type IPluginMetadata = {
  // Used to validate usage
  requiredVersion: string;
  validateArguments: (args: unknown) => boolean;
} & { info: IPluginInfo };

export type PluginFunction<Input, Output> = (ctx: Input) => Promise<Output>;
export type Plugin<Input, Output> = PluginFunction<Input, Output> & Partial<IPluginMetadata>;

export type UnknownPlugin = Plugin<unknown, unknown>;
