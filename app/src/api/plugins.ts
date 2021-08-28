import Axios, { AxiosResponse } from "axios";

export interface ConfigPlugin {
  id: string;
  path: string;
  args: object;
  version: string;
  requiredVersion: string;
  name: string;
  events: string[];
  authors: string[];
  description: string;
}

export type PluginCheck = Omit<ConfigPlugin, "id" | "args"> & {
  arguments: unknown[];
  hasValidArgs: boolean;
  hasValidVersion: boolean;
};

export type GlobalConfigValue = boolean | string | number | string[];

export interface PluginRes {
  register: Record<string, ConfigPlugin>;
  events: Record<string, (string | [string, object])[]>;
  global: Record<string, GlobalConfigValue>;
}

interface EditPluginsConfig {
  [x: string]: unknown;
  register: Record<string, { path: string; args: Record<string, unknown> }>;
  events: Record<string, (string | [string, object])[]>;
}

export async function getPluginsConfig(): Promise<AxiosResponse<PluginRes>> {
  return Axios.get<PluginRes>("/api/plugins", {
    params: { password: localStorage.getItem("password") },
  });
}

export async function savePluginsConfig(
  config: EditPluginsConfig
): Promise<AxiosResponse<PluginRes>> {
  return Axios.post<PluginRes>("/api/plugins", config, {
    params: { password: localStorage.getItem("password") },
  });
}

export async function validatePlugin(
  path: string,
  args?: object
): Promise<AxiosResponse<PluginCheck>> {
  return await Axios.post<PluginCheck>(
    "/api/plugins/validate",
    { path, args },
    { params: { password: localStorage.getItem("password") } }
  );
}

export async function downloadPlugins(urls: string[]): Promise<AxiosResponse<{ id: string; path: string }[]>> {
  return await Axios.post<{ id: string; path: string }[]>(
    "/api/plugins/downloadBulk",
    { urls },
    { params: { password: localStorage.getItem("password") } }
  );
}
