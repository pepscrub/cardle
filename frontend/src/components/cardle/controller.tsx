import { PropsWithChildren, FC, createContext, useContext, useState, useEffect, useMemo } from "react";
import { ArrayOrFlat, Car, Maybe, Nullable, Undefinable, setState } from "../../types";
import { DateTime } from 'luxon';
import usePromise from "react-use-promise";
import axios from "axios";
import JSConfetti from "js-confetti";

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
  /**
   * TODO: Store data in localStorage
   * Something like: { gameId: { gameData }}
   * allows for replayOther days feature
   */
  const [currentCar] = usePromise<Car>(async () => {
    const { data } = await axios.get('/api/v1/cars/todaysGame');
    return data;
  }, []); // TODO: Get from basic backend
  const currentYear = DateTime.now().year;
  const defaultYear = Math.round(Math.random() * (currentYear - MIN_YEAR + 1) + MIN_YEAR);
  const generateHint = (hint: Maybe<ArrayOrFlat<string | number>>, key: string) => hint && ({ [key]: typeof hint === 'object' ? hint.filter((val) => !!val).join(', ') : String(hint) })
  const [guess, setGuess] = useState('');
  const [attempts, setAttempts] = useState<string[]>([]);
  const [model, setModel] = useState('');
  const [make, setMake] = useState('');
  const [win, setWin] = useState(false);
  const [inProgress, setInProgress] = useState(true);
  const [step, setStep] = useState<number>(attempts.length);
  const [winStep, setWinStep] = useState<number>();
  const [hardMode, setHardMode] = useState(Boolean(localStorage.getItem('hardMode')) ?? false);
  const stats: Stats = JSON.parse(localStorage.getItem('stats') as string ?? JSON.stringify({ currentStreak: 0, maxStreak: 0 }))
  const gameId = `game_${String(currentCar?.index)}`
  const [days, setDays] = useState<number[]>([]);
  
  const [year, setYear] = useState(defaultYear);
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
    const currentMake = make.toLowerCase().includes(currentCar.make.toLowerCase());
    const currentModel = model.toLowerCase().includes(currentCar.model.toLowerCase())
    const currentYear = hardMode ? year === carYear : year >= carYear - 2 && year <= carYear + 2;
    
    localStorage.setItem(gameId, JSON.stringify({
      attempts: [...attempts, skipped ? 'skipped' : `${year} ${make} ${model}`],
      day: DateTime.now().startOf('day'),
      inProgress: attempts.length + 1 !== currentCar.gameData.length,
      win,
    }));

    if (!make || !model) {
      setAttempts((attempt) => [...attempt, skipped ? 'skipped' : `${year} ${make} ${model}`]);
      if (attempts.length + 1 === currentCar.gameData.length) {
        setInProgress(false);
        setWin(false);
        return
      }
      return;
    }
    
    setValidAnswers({ make: currentMake, model: currentModel, year: currentYear });
    setAttempts((attempt) => [...attempt, `${year} ${make} ${model}`]);

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
    if (win) return;
    setStep(attempts.length)
  }, [attempts]);

  useEffect(() => {
    if (!win || !currentCar || !days.length) return;
    setWinStep(step);
    setInProgress(false);
    localStorage.setItem(gameId, JSON.stringify({ attempts: attempts, win, inProgress: false, winStep, day: DateTime.now().startOf('day'), }));
    const longestStreak = stats.maxStreak < stats.currentStreak + 1 ? stats.currentStreak + 1 : stats.maxStreak;
    // setStats(JSON.stringify({ maxStreak: longestStreak, currentStreak: JSON.parse(stats).currentStreak + 1 }))
    const jsConfetti = new JSConfetti();
    jsConfetti.addConfetti();
    if (Math.max(...days) === 0) return
    localStorage.setItem('stats', JSON.stringify({ maxStreak: longestStreak, currentStreak: stats.currentStreak + 1 }))
  }, [win, days]);

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