import { Dictionary } from "../types/utility";
import {
  IImportedScene,
  IImportedActor,
  IImportedLabel,
  IImportedMovie,
  IImportedStudio,
  IImportedCustomField
} from "./types";

export interface ICreateOptions {
  scenes?: Dictionary<IImportedScene>;
  actors?: Dictionary<IImportedActor>;
  labels?: Dictionary<IImportedLabel>;
  movies?: Dictionary<IImportedMovie>;
  studios?: Dictionary<IImportedStudio>;
  customFields?: Dictionary<IImportedCustomField>;
}

export async function createFromFileData(opts: ICreateOptions) {}
