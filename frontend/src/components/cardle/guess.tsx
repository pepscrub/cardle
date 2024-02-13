import { FC } from "react";
import { useCardle } from "./controller";
import { Box, Grid, useTheme, Paper, Typography, Divider, Palette, Fade, Alert } from "@mui/material";
import { useTranslation } from "react-i18next";
import { Maybe } from "../../types";
import { SPECIAL_SPLIT_CHAR, TIMER_FADEOUT, YEAR_CORRECTION, YEAR_LENIENCY } from "../constants";

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

export const yearColor = (
  attemptYear: number,
  hardMode: boolean,
  palette: Palette,
  year: number,
) => {
    const checkRange = (yearRange: number) => attemptYear >= year - yearRange && attemptYear <= year + yearRange && year !== attemptYear;
    if (hardMode) return getGuessColor(String(year), hardMode, palette, String(attemptYear));
    return checkRange(YEAR_LENIENCY)
      ? checkRange(YEAR_CORRECTION)
        ? palette.success.main
        : palette.warning.main
      : getColor(year === attemptYear, palette)
  }


export const Guesses: FC = () => {
  const { attempts, currentCar, hardMode } = useCardle();
  const { palette } = useTheme();
  const { t } = useTranslation();

  const currentYear = Number(currentCar?.year) ?? 1984;


  if (!currentCar) return <></>;

  return <Grid container sx={{ display: 'flex', flexDirection: 'column' }}>
    {
      attempts.map((attempt, i) => {
        if (attempt === 'skipped') return (
          <Fade in={true} key={`skipped-${attempt}-${i}`} timeout={(i + 1) * TIMER_FADEOUT}>
            <Paper sx={{ p: 1, backgroundColor: palette.warning.dark, textAlign: 'center', m: 1 }}>
              <Typography>{t('game.skipped')}</Typography>
            </Paper>
          </Fade>
        )
        if (!attempt.includes('_') || attempt.split('_').length < 3) return <Alert severity="error" key={`${attempt}-${i}-error`}>{t('attempt.error', { guess: attempt })}</Alert>
        const [year, make, model] = attempt.split(SPECIAL_SPLIT_CHAR);
        const replaceWithChars = (string: string, replace: string) => string.replace(replace, `_${replace}_`)


        const currentModel = () => {
          const string = model.includes(currentCar?.model)
            ? replaceWithChars(model, currentCar.model)
            : currentCar.model.includes(model)
              ? replaceWithChars(currentCar.model, model)
              : model;
          const boldText = string.match(/(?<=_)(.*?)(?=_)/)?.[0]
          const splitString = string.split('_');
          if (splitString.length >= 1) {
            return <>
              {splitString.map((string, l) => {
                const check = string.includes(boldText ?? '');
                if (string === '') return;
                return (
                  <Typography
                    key={`guess-${string}-${i}-${l}`}
                    sx={{ fontWeight: check ? 800 : 0, mr: 0.5 }}
                    component="span"
                  >
                    {`${string} `}
                  </Typography>
                )
              })}
            </>
          }
          return (
            <Typography>{string}</Typography>
          )
        }

        const commonProps = {
          alignContent: 'center',
          alignItems: 'center',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          ml: { xs: 1, xl: 0.5 },
          mx: { xs: 1, xl: 0.5 },
          my: 0.5,
          width: '100%',
        }
        const yearOffset = Number(year) - currentYear;
        const yearOffsetLabel = yearOffset > 0 ? `+${yearOffset}` : `${yearOffset}`;
        return (
          <Fade in={true} key={`${year} ${model} ${i}`} timeout={(i + 1) * TIMER_FADEOUT}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-around',
                my: 1,
                mx: { sx: 0, xl: 1 }
              }}
            >
              <Paper sx={{
                p: 1,
                color: (theme) => theme.palette.common.white,
                backgroundColor: yearColor(
                  currentYear,
                  hardMode,
                  palette,
                  Number(year),
                ),
                ...commonProps
              }}>
                <b>{year}</b>
                {yearOffset !== 0 && <Typography variant="subtitle2">{yearOffsetLabel}</Typography>}
              </Paper>
              <Paper sx={{
                p: 1,
                color: (theme) => theme.palette.common.white,
                backgroundColor: getGuessColor(make, hardMode, palette, currentCar?.make),
                ...commonProps
              }}>
                <b>{make}</b>
              </Paper>
              <Paper  sx={{
                p: 1,
                color: (theme) => theme.palette.common.white,
                backgroundColor: getGuessColor(model, hardMode, palette, currentCar?.model),
                ...commonProps
              }}>
                {currentModel()}
              </Paper>
              <Divider />
            </Box>
          </Fade>
        )
      })
    }
  </Grid>
}