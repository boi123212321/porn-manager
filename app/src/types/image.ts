import IActor from "./actor";

export default interface IImage {
  _id: string;
  name: string;
  labels: {
    _id: string;
    name: string;
  }[];
  scene: {
    _id: string;
    name: string;
  };
  actors: IActor[];
  bookmark: boolean;
  favorite: boolean;
  rating: number | null;
  color?: string | null;
}
