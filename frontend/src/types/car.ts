import { ArrayOrFlat, Nullable } from "./generics";

export interface Car {
  _id: string;
  cylinders: ArrayOrFlat<string>;
  displacement: ArrayOrFlat<string>;
  drive: ArrayOrFlat<string>;
  engDesc: ArrayOrFlat<string[]>;
  engId: ArrayOrFlat<string>;
  forcedInduction: Nullable<ArrayOrFlat<string>>;
  fuelType: ArrayOrFlat<string>;
  gameData: GameData[];
  id: string;
  index: number;
  make: string;
  model: string;
  notes?: Record<'notes', string>[];
  resetRegion: string;
  transmission: ArrayOrFlat<string>;
  transmissionDesc: Nullable<ArrayOrFlat<string>>;
  vClass: ArrayOrFlat<string>;
  year: string;
}

export interface GameData {
  x: number;
  y: number;
  width: number;
  height: number;
  imgUrl: string;
}