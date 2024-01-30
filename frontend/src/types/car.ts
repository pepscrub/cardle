import { Nullable, ArrayOrFlat } from "./generics";

export interface Car {
  _id: string;
  make: string;
  model: string;
  id: string;
  year: string;
  index: number;
  cylinders: ArrayOrFlat<string>;
  displacement: ArrayOrFlat<string>;
  drive: ArrayOrFlat<string>;
  engId: ArrayOrFlat<string>;
  engDesc: ArrayOrFlat<string[]>;
  fuelType: ArrayOrFlat<string>;
  vClass: ArrayOrFlat<string>;
  transmission: ArrayOrFlat<string>;
  transmissionDesc: Nullable<ArrayOrFlat<string>>;
  forcedInduction: Nullable<ArrayOrFlat<string>>;
  gameData: GameData[];
  region: string;
}

export interface GameData {
  x: number;
  y: number;
  width: number;
  height: number;
  imgUrl: string;
}