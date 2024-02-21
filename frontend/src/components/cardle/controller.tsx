import { DateTime } from 'luxon';
import { enqueueSnackbar } from "notistack";
import { FC, PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from "react";
import usePromise from "react-use-promise";
import { NavBarContext } from "../../App";
import { Car, Nullable, Undefinable, setState } from "../../types";
import { compare, compareYear, generateHint, getTodaysGame } from "../../util";
import { storage } from '../../util/localstorage';
import { useConfetti } from "../../util/useConfetti";
import { Emojis, STORAGE_KEYS } from "../constants";

const MIN_YEAR = 1900;

interface ValidAnswers {
  make: Nullable<boolean>;
  model: Nullable<boolean>;
  year: Nullable<boolean>;
}

interface Stats {
  currentStreak: number;
  maxStreak: number
}

interface Context {
  attempts: string[];
  currentCar: Undefinable<Car>;
  guess: string;
  guessAttempt: (skipped?: boolean) => void;
  handleShowNext: () => void;
  handleShowPrevious: () => void;
  hints: Record<string, string>;
  inProgress: boolean;
  make: string;
  MIN_YEAR: number;
  model: string;
  setAttempts: setState<string[]>;
  setGuess: setState<string>;
  setMake: setState<string>;
  setModel: setState<string>;
  setStep: setState<number>;
  setWin: setState<boolean>;
  setYear: setState<number>;
  validAnswers: ValidAnswers,
  hardMode: boolean;
  setHardMode: setState<boolean>;
  step: number;
  win: boolean;
  winStep: Undefinable<number>;
  stats: Stats;
  year: number;
}

interface Props extends PropsWithChildren {}

const context = createContext<Undefinable<Context>>(undefined);

export const CardleProvider: FC<Props> = ({
  children
}) => {
  const [currentCar] = usePromise<Car>(async () => getTodaysGame(), []);
  const [attempts, setAttempts] = useState<string[]>([]);
  const [days, setDays] = useState<number[]>([]);
  const [guess, setGuess] = useState('');
  const [hardMode, setHardMode] = useState(storage.get('hardMode') === 'true');
  const [inProgress, setInProgress] = useState(true);
  const [make, setMake] = useState(attempts[attempts.length - 1]?.split(' ').slice(2).join(' ') ?? '');
  const [model, setModel] = useState(attempts[attempts.length - 1]?.split(' ')[1] ?? '');
  const [step, setStep] = useState<number>(attempts.length);
  const [win, setWin] = useState(false);
  const [winStep, setWinStep] = useState<number>();

  const currentYear = DateTime.now().year;
  const defaultYear = Math.round(Math.random() * (currentYear - MIN_YEAR + 1) + MIN_YEAR);
  const [year, setYear] = useState(Number(attempts[attempts.length - 1]?.split(' ')[0] ?? `${defaultYear}`));

  const gameId = `${STORAGE_KEYS.game}${String(currentCar?.index)}`
  const jsConfetti = useConfetti();
  const stats = storage.get('stats', { currentStreak: 0, maxStreak: 0 }) as Stats;
  const statsOpen = useContext(NavBarContext);
  
  const hints = ({
    ...generateHint(currentCar?.cylinders, 'cylinders'),
    ...generateHint(currentCar?.drive, 'driveTrain'),
    ...generateHint(currentCar?.transmission, 'transmission'),
    ...generateHint(currentCar?.transmissionDesc, 'transmissionDesc'),
    ...generateHint(currentCar?.fuelType, 'fuelType'),
    ...generateHint(currentCar?.vClass, 'vehicleClass'),
  });
  const [validAnswers, setValidAnswers] = useState<ValidAnswers>({ make: null, model: null, year: null });

  const guessAttempt = async (skipped?: boolean) => {
    if (!currentCar || !inProgress || win) return;
    const carYear =  Number(currentCar.year)
    const makeCheck = compare(currentCar.make, make, hardMode);
    const modelCheck = compare(currentCar.model, model, hardMode);
    const yearCheck = compareYear(carYear, year, hardMode);
  
    const isWin = makeCheck && modelCheck && yearCheck;
    const guess = `${year}_${make}_${model}`;

    storage.set(
      gameId,
      {
        attempts: [...attempts, skipped ? 'skipped' : guess],
        day: DateTime.now().startOf('day'),
        inProgress: attempts.length + 1 !== currentCar.gameData.length && !isWin,
        win: isWin,
      }
    );

    if (!make || !model) {
      setAttempts((attempt) => [...attempt, skipped ? 'skipped' : guess]);
      if (attempts.length + 1 === currentCar.gameData.length) {
        setInProgress(false);
        setWin(false);
        return
      }
      return;
    }

    setValidAnswers({ make: makeCheck, model: modelCheck, year: yearCheck });
    setAttempts((attempt) => [...attempt, guess]);

    if (makeCheck) setMake(currentCar.make)
    if (modelCheck) setModel(currentCar.model);
    if (yearCheck) setYear(carYear);
    if (makeCheck && modelCheck && yearCheck) return setWin(true);
    if (attempts.length + 1 === currentCar.gameData.length) {
      setInProgress(false);
      setWin(false);
      return
    }
  }

  const handleShowNext = () => {
    if (!currentCar) return;
    if ((winStep ? currentCar.gameData.length : attempts.length) > step) setStep((step) => step + 1)
  }

  const handleShowPrevious = () => 0 < step && setStep((step) => step - 1);

  useEffect(() => {
    if (win) return;
    setStep(attempts.length)
    if (inProgress) return;
    if (attempts.every((attempt) => attempt === 'skipped') && attempts.length === currentCar?.gameData.length) {
      enqueueSnackbar('Skip Hero', { variant: 'info', })
      jsConfetti?.addConfetti({ emojis: Emojis.skipped })
      return;
    }
    // We only want to call this at the end of the game
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempts]);

  useEffect(() => {
    if (!win || !currentCar) return;
    setWinStep(step);
    setInProgress(false);
    storage.set(gameId, { attempts: attempts, win, inProgress: false, winStep, day: DateTime.now().startOf('day'), });
    const longestStreak = stats.maxStreak < stats.currentStreak + 1 ? stats.currentStreak + 1 : stats.maxStreak;
    switch(attempts.length) {
      case 0: {
        jsConfetti?.addConfetti({ emojis: Emojis.possibleCheater });
        enqueueSnackbar('You cheated didn\'t you', { variant: 'warning' });
        break;
      }
      case 1: {
        jsConfetti?.addConfetti({ emojis: Emojis.win });
        break;
      }
      default: {
        jsConfetti?.addConfetti();
        break;
      }
    }
    if (!days.length || Math.max(...days) === 0) return
    storage.set('stats', { maxStreak: longestStreak, currentStreak: stats.currentStreak + 1 })
  }, [win, days]);

  // Calculate stats
  useEffect(() => {
    const tempDays = [];
    for (let i = 0; i < localStorage.length; i++){
      const item = localStorage.key(i);
      if (item && item?.substring(0,5) == 'game_' && !!storage.get(item).day) {
        const day = storage.get(item).day;
        const diff = DateTime.fromISO(day).startOf('day').diff(DateTime.now().startOf('day'), 'days');
        tempDays.push(diff.days);
      }
    }
    setDays(tempDays);
    if (Math.max(...tempDays) <= -2) return storage.set('stats', { maxStreak: stats.maxStreak, currentStreak: 0 })
  }, [currentCar]);

  useMemo(() => {
    if (!currentCar) return;
    const storedGame = storage.get(gameId);
    if (!storedGame) return;
    setAttempts(storedGame.attempts);
    setStep(storedGame.attempts.length);
    setWin(storedGame.win);
    setWinStep(storedGame.winStep);
    setInProgress(storedGame.inProgress);
  }, [currentCar]);

  useEffect(() => {
    if (inProgress) return;
    setTimeout(() => statsOpen.setOpen(), 1000);
  }, [inProgress]);

  return (
    <context.Provider
      value={{
        attempts,
        currentCar,
        guess,
        guessAttempt,
        handleShowNext,
        handleShowPrevious,
        hardMode,
        hints,
        inProgress,
        make,
        MIN_YEAR,
        model,
        setAttempts,
        setGuess,
        setHardMode,
        setMake,
        setModel,
        setStep,
        setWin,
        setYear,
        stats,
        step,
        validAnswers,
        win,
        winStep,
        year,
      }}
    >
      {children}
    </context.Provider>
  )
}

// Purposefully ignoring fast-refresh (isn't applicable here)
// eslint-disable-next-line react-refresh/only-export-components
export const useCardle = (): Context => {
  const name = CardleProvider.name;
  const data = useContext(context);
  if (!data) throw new Error(`Missing ${name} in tree above ${name}`);
  return data;
}