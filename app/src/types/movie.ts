import IActor from "./actor";
import IScene from "./scene";

export default interface IMovie {
  _id: string;
  name: string;
  description: string | null;
  releaseDate: number | null;
  rating: number | null;
  favorite: boolean;
  bookmark: number | null;

  frontCover: {
    _id: string;
    color: string | null;
    meta: {
      dimensions: {
        width: number;
        height: number;
      };
    };
  } | null;
  backCover: {
    _id: string;
    meta: {
      dimensions: {
        width: number;
        height: number;
      };
    };
  } | null;
  spineCover: {
    _id: string;
    meta: {
      dimensions: {
        width: number;
        height: number;
      };
    };
  } | null;
  studio: any;
  scenes: IScene[];
  actors: IActor[];
  labels: {
    _id: string;
    name: string;
  }[];

  duration: number | null;
  size: number | null;
}
