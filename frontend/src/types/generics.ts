import { Dispatch, SetStateAction } from "react";

// Generics
export type Nullable<T> = T | null;
export type Undefinable<T> = T | undefined;
export type Maybe<T> = Nullable<Undefinable<T>>;
export type ArrayOrFlat<T> = T | T[];

export type setState<T = string> = Dispatch<SetStateAction<T>>