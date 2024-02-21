import { Palette } from "@mui/material";
import axios from "axios";
import { DateTime } from "luxon";
import { SPECIAL_SPLIT_CHAR, STORAGE_KEY, YEAR_CORRECTION, YEAR_LENIENCY } from "../components/constants";
import { ArrayOrFlat, Car, Maybe, Undefinable } from "../types";
import { storage } from "./localstorage";
import { isValidUrl } from "./url";

export const generateHint = (hint: Maybe<ArrayOrFlat<string | number>>, key: string) => hint
  && ({ [key]: typeof hint === 'object'
    ? hint.filter((val) => !!val).join(', ')
    : String(hint)
  });

export const getCarData = (car?: string): string[] => car
  ?.split(SPECIAL_SPLIT_CHAR)
  ?? ['', '', ''];

export const getColor = (check: boolean, palette: Palette): string => check
      ? palette.success.main
      : palette.error.main;

export const getGuessColor = (
    check: Maybe<string>,
    hardMode: boolean,
    palette: Palette,
    value?: string,
  ): string => {

    if (check === '' || !check) return palette.divider;
    if (hardMode) {
      return value?.includes(check) && value !== check
        ? palette.warning.main
        : getColor(value === check, palette)
    }
    return getColor((value ?? '').includes(check ?? ''), palette)
  }

export const getYearColor = (
  attemptYear: number,
  hardMode: boolean,
  palette: Palette,
  year: number,
) => {
    const checkRange = (yearRange: number) => attemptYear >= year - yearRange && attemptYear <= year + yearRange && year !== attemptYear;
    if (hardMode) return getGuessColor(String(year), hardMode, palette, String(attemptYear));
    if (checkRange(YEAR_LENIENCY)) {
      if (checkRange(YEAR_CORRECTION)) {
        return palette.success.main
      }
      return palette.warning.main
    }
    return getColor(year === attemptYear, palette)
  }


export const getDataWithStored = async <T>(storageKey: STORAGE_KEY, apiUrl: string): Promise<T> => {
  const storedData: T = storage.get(storageKey)?.sort();
  if (storedData) return Promise.resolve(storedData);
  const { data } = await axios.get(apiUrl);
  // Update storage key
  storage.set(storageKey, data.sort());
  return data;
}

export const getDataWithCache = async <T>(cache: Map<string, Promise<string[]>>, cacheKey: string, apiUrl: string): Promise<T> => {
  const cacheData = await cache.get(cacheKey);
  if(cacheData) return Promise.resolve(cacheData as T);

  const { data } = await axios.get(apiUrl);
  cache.set(cacheKey, data);
  return data;
}

export const getTodaysGame = async <T>(): Promise<T> => {
  const storedDay =  storage.get('todaysGame');
  const storedDate = DateTime.now().setZone(storedDay?.resetRegion) <= DateTime.fromISO(storedDay?.date);
  if (storedDate) return Promise.resolve(storedDay.todaysGame);

  const { data } = await axios.get<Car>('/api/v1/cars/todaysGame');
  const gameData = data.gameData.filter((game) => !isValidUrl(game.imgUrl));
  const todaysGame = { ...data, gameData };
  storage.set('todaysGame', { todaysGame, date: DateTime.now().setZone(data?.resetRegion).endOf('day').toISO() })
  return todaysGame as T;
}

// COMPARISON LOGIC
export const compare = (answer: Undefinable<string>, guess: Undefinable<string>, hardMode: boolean): boolean => hardMode
  ? answer?.toLowerCase() === guess?.toLowerCase() || false
  : answer?.toLowerCase().includes(guess?.toLowerCase() ?? 'NODATA') || false

export const compareYear = (answer: number, guess: number, hardMode: boolean) => hardMode
  ? answer === guess
  : guess >= answer - YEAR_CORRECTION && guess <= answer + YEAR_CORRECTION;