import { CssBaseline, PaletteMode, ThemeProvider, createTheme, useMediaQuery } from '@mui/material'
import { Cardle, Navbar } from './components'
import { CardleProvider } from './components/cardle/controller'
import i18next from "i18next";
import { initReactI18next } from 'react-i18next';
import en from './localization/en.json';
import { createContext, useMemo, useState } from 'react';
import useLocalStorage from 'react-use-localstorage';
import { SnackbarProvider } from 'notistack';
import { themeOptions } from './theme';
import { GoogleAdBanner } from './components/cardle/ads';
import { DevChecker } from './util';

i18next
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en } },
    fallbackLng: 'en',
    interpolation: { escapeValue: true },
  })

export const ColorModeContext = createContext({ toggleColorMode: () => {} });
export const NavBarContext = createContext({ open: false, setOpen: () => {}, close: () => {} })

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
              <GoogleAdBanner />
            </CardleProvider>
          </ThemeProvider>
        </SnackbarProvider>
      </NavBarContext.Provider>
    </ColorModeContext.Provider>
  )
}

export default App
