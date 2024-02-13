import { CssBaseline, PaletteMode, ThemeProvider, createTheme, useMediaQuery } from '@mui/material'
import { Cardle, Navbar } from './components'
import { CardleProvider } from './components/cardle/controller'
import i18next from "i18next";
import { initReactI18next } from 'react-i18next';
import en from './localization/en.json';
import { FC, createContext, useEffect, useMemo, useState } from 'react';
import useLocalStorage from 'react-use-localstorage';
import { SnackbarProvider, useSnackbar } from 'notistack';
import devtools from 'devtools-detect';
import { themeOptions } from './theme';
import { useConfetti } from './util/useConfetti';

i18next
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en } },
    fallbackLng: 'en',
    interpolation: { escapeValue: true },
  })

export const ColorModeContext = createContext({ toggleColorMode: () => {} });
export const NavBarContext = createContext({ open: false, setOpen: () => {}, close: () => {} })

const DevChecker: FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const jsConfetti = useConfetti();

  useEffect(() => {
    window.addEventListener('devtoolschange', () => {
      if (!devtools.isOpen) {
        enqueueSnackbar('CHEATER CHEATER PUMPKIN EATER', { variant: 'warning' });
        console.clear();
        console.log('%cHaving a look around? If you find any bugs, report them to %cbrendan@freeman.dev', 'font-family: "Fira Code", monospace;', 'font-family: "Roboto", sans-serif; font-weight: 800; color: #34bacf;');
        jsConfetti?.addConfetti({
          emojis: ['🎃', '🤥', '🤹🏻‍♀️', '🚫', '🤡'],
       });
      }
    })
    return () => window.removeEventListener('devtoolschange', () => {});
  }, []);

  return null;
}

const App = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [darkMode, setDarkMode] = useLocalStorage('darkMode', prefersDarkMode ? 'dark' : 'light')
  const [open, setOpen] = useState(false);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setDarkMode(darkMode === 'light' ? 'dark' : 'light');
      },
    }),
    [darkMode],
  );

  const theme = useMemo(
    () =>
      createTheme({
        ...themeOptions,
        palette: {
          mode: darkMode as PaletteMode,
        },
      }),
    [darkMode],
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <NavBarContext.Provider value={{ open, setOpen: () => setOpen(true), close: () => setOpen(false) }}>
        <SnackbarProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <DevChecker />
            <CardleProvider>
              <Navbar />
              <Cardle />
            </CardleProvider>
          </ThemeProvider>
        </SnackbarProvider>
      </NavBarContext.Provider>
    </ColorModeContext.Provider>
  )
}

export default App
