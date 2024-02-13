import { PropsWithChildren, FC, createContext, useContext, useState, useEffect, useMemo } from "react";
import { ArrayOrFlat, Car, Maybe, Nullable, Undefinable, setState } from "../../types";
import { DateTime } from 'luxon';
import usePromise from "react-use-promise";
import axios from "axios";
import { NavBarContext } from "../../App";
import { enqueueSnackbar } from "notistack";
import { YEAR_CORRECTION } from "../constants";
import { useConfetti } from "../../util/useConfetti";

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

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
}

export const CardleProvider: FC<Props> = ({
  children
}) => {
  const [currentCar] = usePromise<Car>(async () => {
    const storedDay = JSON.parse(localStorage.getItem('todaysGame') as string);
    const storedDate = DateTime.now().setZone(storedDay?.resetRegion).diff(DateTime.fromISO(storedDay?.date)).as('hours');
    if (storedDate && storedDate < 24) return Promise.resolve(storedDay.todaysGame);

    const { data } = await axios.get<Car>('/api/v1/cars/todaysGame');
    const gameData = data.gameData.filter((game) => !isValidUrl(game.imgUrl));
    const todaysGame = { ...data, gameData };
    localStorage.setItem('todaysGame', JSON.stringify({ todaysGame, date: DateTime.now().setZone(currentCar?.resetRegion).endOf('day').toISO() }))
    return todaysGame;
  }, []);
  const currentYear = DateTime.now().year;
  const defaultYear = Math.round(Math.random() * (currentYear - MIN_YEAR + 1) + MIN_YEAR);
  const generateHint = (hint: Maybe<ArrayOrFlat<string | number>>, key: string) => hint && ({ [key]: typeof hint === 'object' ? hint.filter((val) => !!val).join(', ') : String(hint) });
  const jsConfetti = useConfetti();
  const [guess, setGuess] = useState('');
  const [attempts, setAttempts] = useState<string[]>([]);
  const [model, setModel] = useState(attempts[attempts.length - 1]?.split(' ')[1] ?? '');
  const [make, setMake] = useState(attempts[attempts.length - 1]?.split(' ').slice(2).join(' ') ?? '');
  const [win, setWin] = useState(false);
  const [inProgress, setInProgress] = useState(true);
  const [step, setStep] = useState<number>(attempts.length);
  const [winStep, setWinStep] = useState<number>();
  const [hardMode, setHardMode] = useState(localStorage.getItem('hardMode') === 'true');
  const stats: Stats = JSON.parse(localStorage.getItem('stats') as string ?? JSON.stringify({ currentStreak: 0, maxStreak: 0 }))
  const gameId = `game_${String(currentCar?.index)}`
  const [days, setDays] = useState<number[]>([]);
  const [year, setYear] = useState(Number(attempts[attempts.length - 1]?.split(' ')[0] ?? `${defaultYear}`));

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
    const currentMake = hardMode
      ? make?.toLowerCase() === currentCar.make.toLowerCase()
      : currentCar.make.toLowerCase().includes(make?.toLowerCase())
      const currentModel = hardMode
      ? model?.toLowerCase() === currentCar.model.toLowerCase()
      : currentCar.model.toLowerCase().includes(model?.toLocaleLowerCase())
      const currentYear = hardMode ? year === carYear : year >= carYear - YEAR_CORRECTION && year <= carYear + YEAR_CORRECTION;
  
    const isWin = currentMake && currentModel && currentYear;
    const guess = `${year}_${make}_${model}`;

    localStorage.setItem(gameId, JSON.stringify({
      attempts: [...attempts, skipped ? 'skipped' : guess],
      day: DateTime.now().startOf('day'),
      inProgress: attempts.length + 1 !== currentCar.gameData.length && !isWin,
      win: isWin,
    }));

    if (!make || !model) {
      setAttempts((attempt) => [...attempt, skipped ? 'skipped' : guess]);
      if (attempts.length + 1 === currentCar.gameData.length) {
        setInProgress(false);
        setWin(false);
        return
      }
      return;
    }
    
    setValidAnswers({ make: currentMake, model: currentModel, year: currentYear });
    setAttempts((attempt) => [...attempt, guess]);

    if (currentMake) setMake(currentCar.make)
    if (currentModel) setModel(currentCar.model);
    if (currentYear) setYear(carYear);
    if (currentMake && currentModel && currentYear) return setWin(true);
    if (attempts.length + 1 === currentCar.gameData.length) {
      setInProgress(false);
      setWin(false);
      return
    }
    // TODO: Backend code for guessing and validating guess
  }

  const handleShowNext = () => {
    if (!currentCar) return;
    if ((winStep ? currentCar.gameData.length : attempts.length) > step) setStep((step) => step + 1)
  }

  const handleShowPrevious = () => {
    if (0 < step) setStep((step) => step - 1)
  }

  useEffect(() => {
    if (attempts.every((attempt) => attempt === 'skipped') && attempts.length === currentCar?.gameData.length) {
      enqueueSnackbar('Skip Hero', { variant: 'info', })
      jsConfetti?.addConfetti({ emojis: ['⏩'] })
      return;
    }
    if (win) return;
    setStep(attempts.length)
  }, [attempts]);

  useEffect(() => {
    if (!win || !currentCar) return;
    setWinStep(step);
    setInProgress(false);
    localStorage.setItem(gameId, JSON.stringify({ attempts: attempts, win, inProgress: false, winStep, day: DateTime.now().startOf('day'), }));
    const longestStreak = stats.maxStreak < stats.currentStreak + 1 ? stats.currentStreak + 1 : stats.maxStreak;
    switch(attempts.length) {
      case 0: {
        jsConfetti?.addConfetti({ emojis: ['🤔', '🤥'] });
        enqueueSnackbar('You cheated didn\'t you', { variant: 'warning' });
        break;
      }
      case 1: {
        jsConfetti?.addConfetti({ emojis: ['💯', '🏆', '✨', '🏅', '☄️'] });
        break;
      }
      default: {
        jsConfetti?.addConfetti();
        break;
      }
    }
    if (!days.length || Math.max(...days) === 0) return
    localStorage.setItem('stats', JSON.stringify({ maxStreak: longestStreak, currentStreak: stats.currentStreak + 1 }))
  }, [win, days]);

  // Calculate stats
  useEffect(() => {
    const tempDays = [];
    for (let i = 0; i < localStorage.length; i++){
      const item = localStorage.key(i);
      if (item && item?.substring(0,5) == 'game_' && !!JSON.parse(localStorage.getItem(item) as string).day) {
        const day = JSON.parse(localStorage.getItem(item) as string).day;
        const diff = DateTime.fromISO(day).startOf('day').diff(DateTime.now().startOf('day'), 'days');
        tempDays.push(diff.days);
      }
    }
    setDays(tempDays);
    if (Math.max(...tempDays) <= -2) return localStorage.setItem('stats', JSON.stringify({ maxStreak: stats.maxStreak, currentStreak: 0 }))
  }, [currentCar]);

  useMemo(() => {
    if (!currentCar) return;
    const storedGame = JSON.parse(localStorage.getItem(gameId) as string);
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