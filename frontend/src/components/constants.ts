const prodEnvs = ['production', 'prod']

export const YEAR_LENIENCY = 10;
export const YEAR_CORRECTION = 5;
export const TIMER_FADEOUT = 250;
export const DEFAULT_MAX_GUESSES = 9;
export const SPECIAL_SPLIT_CHAR = '_';
export const API_URL =  prodEnvs.some((prod) => prod === process.env.NODE_ENVIRONMENT ) ? location.href : process.env.backendURLDev;
export const GRADIENT_START_DEFAULT = '#1053c6';
export const GRADIENT_END_DEFAULT = '#9042b8';

export const Emojis = {
  skipped: ['⏩'],
  possibleCheater: ['🤔', '🤥'],
  win: ['💯', '🏆', '✨', '🏅', '☄️'],
  cheater: ['🎃', '🤥', '🤹🏻‍♀️', '🚫', '🤡'],
};

export enum EMOJI_RESULTS {
  skipped = '🟧',
  close = '🟨',
  correct = '🟩',
  incorrect = '🟥',
}
export enum STORAGE_KEYS {
  game = 'game_',
  todaysGame = 'todaysGame',
  stats = 'stats',
  hardMode = 'hardMode',
  makes = 'makes'
}
export type STORAGE_KEY = 'todaysGame' | 'stats' | 'hardMode' | 'makes'