import { FC } from "react";
import { useCardle } from "./controller";
import { Box, Grid, useTheme, Paper, Fade, Typography, Divider } from "@mui/material";
import { Undefinable } from "../../types";
import { useTranslation } from "react-i18next";

export const Guesses: FC = () => {
  const { attempts, currentCar, hardMode } = useCardle();
  const { palette } = useTheme();
  const { t } = useTranslation();

  const getColor = (value: Undefinable<string>, check: string): string => value === check || value?.includes(check)
      ? palette.success.main
      : palette.error.main;

  const year = Number(currentCar?.year) ?? 1984;

  const yearColor = (attemptYear: number) => {
    if (hardMode) return getColor(currentCar?.year, String(attemptYear));
    return attemptYear >= year - 10 && attemptYear <= year + 10  && year !== attemptYear
      ? palette.warning.main
      : year === attemptYear
        ? palette.success.main
        : palette.error.main;
  }
  
  return <Grid container sx={{ display: 'flex', flexDirection: 'column' }}>
    {
      attempts.map((attempt, i) => {
        const [year, make, model] = attempt.split(' ');
        if (attempt === 'skipped') return (
          <Fade in={true} key={`${year} ${model} ${i}`}>
            <Paper sx={{ p: 1, backgroundColor: palette.warning.dark, textAlign: 'center', m: 1 }}>
              <Typography>{t('game.skipped')}</Typography>
            </Paper>
          </Fade>
        )
        return (
          <Fade in={true} key={`${year} ${model} ${i}`}>
            <Box sx={{ display: 'flex', justifyContent: 'space-around', my: 1 }}>
              <Paper sx={{ p: 1, color: (theme) => theme.palette.common.white, backgroundColor: yearColor(Number(year)), width: '100%', mx: 1  }}>
                {year}
              </Paper>
              <Paper sx={{ p: 1, color: (theme) => theme.palette.common.white, backgroundColor: getColor(currentCar?.make, make), width: '100%', mx: 1 }}>
                {make}
              </Paper>
              <Paper  sx={{ p: 1, color: (theme) => theme.palette.common.white, backgroundColor: getColor(currentCar?.model, model), width: '100%', mx: 1 }}>
                {model}
              </Paper>
              <Divider />
            </Box>
          </Fade>
        )
      })
    }
  </Grid>
}