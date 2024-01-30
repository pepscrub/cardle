import { Box, Collapse, Container, TextField, Typography, Slider, Autocomplete, CircularProgress, Button, CardMedia, Card, CardContent, CardActions, Divider, Grid, Tooltip, useTheme } from "@mui/material";
import { FC, useState } from "react";
import { useCardle } from "./controller";
import { useTranslation } from "react-i18next";
import { BlurImage } from "../image";
import { DateTime } from "luxon";
import usePromise from "react-use-promise";
import axios from "axios";
import { Guesses } from "./guess";
import { ShareResults } from "./share-results";

const modelsCacheMap: Map<string, Promise<string[]>> = new Map();

const RevealHint: FC<{ hint: string, label: string }> = ({ hint, label }) => {
  const { inProgress } = useCardle();
  const [reveal, setReveal] = useState(false);
  const { t } = useTranslation();
  const isBaseModel = label.toLowerCase() === 'base model';
  return (
    <>
      {isBaseModel && <Tooltip title={t('game.baseModelHint')}><Typography variant="h6">{label}</Typography></Tooltip>}
      {!isBaseModel &&<Typography variant="h6">{label}</Typography>}
      <Collapse in={!reveal && inProgress}><Button onClick={() => setReveal((prev) => !prev)}>{t('game.revealHint')}</Button></Collapse>
      <Collapse in={reveal || !inProgress}><Typography variant="overline">{hint}</Typography></Collapse>
    </>
  )
}

export const Cardle: FC = () => {
  const {
    attempts,
    currentCar,
    guessAttempt,
    hints,
    inProgress,
    make,
    MIN_YEAR,
    model,
    setMake,
    setModel,
    setStep,
    setYear,
    step,
    validAnswers,
    win,
    winStep,
    year,
  } = useCardle();
  const theme = useTheme();
  const { t } = useTranslation();
  const gameData = currentCar?.gameData;
  const [makes, , makesState] = usePromise<string[]>(async () => {
    const storedMakes = JSON.parse(localStorage.getItem('makes') as string);
    if (storedMakes) return Promise.resolve(storedMakes);
    const { data } = await axios.get('/api/v1/cars/makes');
    localStorage.setItem('makes', JSON.stringify(data));
    return data;
  }, []);

  const [models, , modelsState] = usePromise<string[]>(async () => {
    if (!make) return Promise.resolve();
    const getModelsCacheMap = await modelsCacheMap.get(make);
    if (getModelsCacheMap) return Promise.resolve(getModelsCacheMap);
    const { data } = await axios.get(`/api/v1/cars/models/${make}`);
    if (!getModelsCacheMap) modelsCacheMap.set(make, data);
    return data
  }, [make]);


  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleChange = (_: unknown, newValue: number | number[], _thumb: number) => {
    if (typeof newValue === 'object') return;
    if (!win && newValue > attempts.length) return setStep(step);
    setStep(newValue)
  }

  const marks = Array.from({ length: (gameData?.length ?? 0) + 1 }).map((_, i) => ({ value: i, label: i + 1 }));
  const formatLabel = (value: number) => marks.findIndex((mark) => mark.value === value) + 1;

  
  if (!currentCar || !gameData) return <CircularProgress />

  const maxGuesses = gameData.length - 1;

  return (
    <Container sx={{ alignItems: 'stretch', display: 'flex', flexDirection: 'column', mt: 10 }}>
      <Card sx={{ boxShadow: 5, pb: 1 }}>
        <CardMedia sx={{ backgroundColor: theme.palette.action.hover, pt: 2 }}>
          <BlurImage
            blurRadius={50}
            clearArea={gameData}
            currentAttempt={step}          
            imageUrl={gameData[step >= maxGuesses ? maxGuesses : step].imgUrl}
            skipBlurring={win || !inProgress}
          />
          <Box sx={{ p: 1.5 }}>
            <Slider
              color={win ? "success" : "error"}
              marks={marks}
              max={maxGuesses}
              min={0}
              onChange={handleChange}
              size="small"
              value={step}
              valueLabelDisplay="auto"
              valueLabelFormat={formatLabel}
            />
          </Box>
        </CardMedia>
        <Box sx={{ px: 1 }}>
          <CardContent>
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography gutterBottom variant="overline">{t('branding.cardle')}</Typography>
              <Typography variant="overline">{t(win ? 'game.guessed' : 'game.guess', { count: winStep ? (winStep === 0 ? winStep : winStep) : maxGuesses - (attempts.length - 1) })}</Typography>
            </Box>
            <Collapse in={!inProgress}>
              <Typography variant="h2" sx={{ textTransform: 'capitalize' }}>{currentCar?.year} - {currentCar?.make} {currentCar?.model}</Typography>
            </Collapse>

            <Divider />
            <Grid container>
              {Object.entries(hints).map(([key, value], i) => <Grid
                key={`${value}-${i}`}
                item
                xs={6}
                sm={6}
                sx={{ display: 'flex', flexDirection: 'column', alignItems: i % 2 ? 'flex-end' : 'flex-start' }}
              >
                  <RevealHint hint={`${value}`} label={t(`game.hint.${key}`)} />
                </Grid>
              )}
            </Grid>

            <Divider />

            {/* GUESS Controllers */}
            <Collapse in={!win && inProgress} sx={{ width: '100%' }} component="search">
              <Slider
                marks
                max={DateTime.now().year}
                min={MIN_YEAR}
                onChange={(_, value) => typeof value === 'number' && setYear(value)}
                value={year}
                valueLabelDisplay="auto"
                color={validAnswers.year === null ? 'primary' : validAnswers.year ? 'success' : 'error'}
              />
              <Box sx={{ mt: 1 }}>
                {<Autocomplete
                  options={makes ?? []}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      color={validAnswers.model === null ? 'primary' : validAnswers.model ? 'success' : 'error'}
                      label="Model"
                    />
                  )}
                  onChange={(_e, value) => setMake(!value ? '' : value)}
                />
                }
                {!makes && makesState === 'pending' && <CircularProgress />}
              </Box>
              <Box sx={{ mt: 1 }}>
                  <Autocomplete
                    disabled={!models && make !== ''}
                    options={models ?? []}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        color={validAnswers.model === null ? 'primary' : validAnswers.model ? 'success' : 'error'}
                        label="Model"
                      />
                    )}
                    onChange={(_e, value) => value && setModel(value)}
                    color={validAnswers.make === null ? 'primary' : validAnswers.make ? 'success' : 'error'}
                  />
                  {!models && modelsState === 'pending' && <CircularProgress />}
              </Box>
            </Collapse>
            <Collapse in={!inProgress} sx={{ mt: 1 }}>
              <ShareResults />
            </Collapse>
          </CardContent>
          <CardActions sx={{ float: 'right' }}>
            <Collapse in={inProgress}>
              <Button onClick={() => guessAttempt(true)} color="secondary">{t('game.skip')}</Button>
              <Button onClick={() => guessAttempt()} disabled={make === '' && model === ''} size="large">{t('game.guess')}</Button>
            </Collapse>
          </CardActions>
          <Guesses />
        </Box>
      </Card>
    </Container>
  )
}