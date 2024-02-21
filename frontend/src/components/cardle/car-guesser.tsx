import { Autocomplete, Box, Button, Card, CardActions, CardContent, CardMedia, Collapse, Container, Divider, Grid, Skeleton, Slider, TextField, Tooltip, Typography, keyframes, useTheme } from "@mui/material";
import { DateTime } from "luxon";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import usePromise from "react-use-promise";
import { useScreen } from "../../hooks/breakpoints";
import { getCarData, getDataWithCache, getDataWithStored, getGuessColor, getYearColor } from "../../util";
import { DEFAULT_MAX_GUESSES } from "../constants";
import { BlurImage } from "../image";
import { useCardle } from "./controller";
import { BottomNavResults } from "./nav-results";
import { ShareResults } from "./share-results";

const modelsCacheMap: Map<string, Promise<string[]>> = new Map();
const heartBeat = keyframes`
  0% {
    box-shadow: 0px 0px 80px -200px rgba(255,0,0,0.67);
  }
  100% {
    box-shadow: 0px 0px 72px 0px rgba(255,0,0,0.67);
  }
`;

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
    hardMode,
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
  const { t } = useTranslation();
  const isSmallScreen = useScreen();
  const gameData = currentCar?.gameData;
  const { palette } = useTheme();
  const [maxGuesses, setMaxGuesses] = useState(DEFAULT_MAX_GUESSES);
  const [guessedYear, guessedMake, guessedModel] = getCarData(attempts[attempts.length - 1])
  const [makes, , makesState] = usePromise<string[]>(async () => getDataWithStored('makes', '/api/v1/cars/makes'), []);

  const [models, , modelsState] = usePromise<string[]>(async () => {
    const currentMake = make === '' ? (guessedMake === '' ? null : guessedMake) : make;
    if (!currentMake) return Promise.resolve([]);
    return getDataWithCache(modelsCacheMap, currentMake, `/api/v1/cars/models/${currentMake}`)
  }, [make, guessedMake]);

  const handleChange = (_: unknown, newValue: number | number[]) => {
    if (typeof newValue === 'object') return;
    if (!win && newValue > attempts.length) return setStep(step);
    setStep(newValue)
  }

  const marks = Array.from({ length: (gameData?.length ?? 0) + 1 }).map((_, i) => ({ value: i, label: i + 1 }));
  const formatLabel = (value: number) => marks.findIndex((mark) => mark.value === value) + 1;

  useEffect(() => {
    if (!gameData) return;
    setMaxGuesses(gameData.length - 1)
  }, [gameData]);

  useEffect(() => {
    setMake(guessedMake);
    setModel(guessedModel);
  }, [guessedMake, guessedModel, setMake, setModel]);

  if (!currentCar || !gameData) return (
    <Container
      sx={{
        alignItems: 'stretch',
        display: 'flex',
        flexDirection: 'column',
        mt: 10,
        position: 'relative'
      }}
    >
      <Card
        sx={{
          pb: 1,
          borderColor: ({ palette }) => win
            ? palette.success.main
            : inProgress
              ? palette.divider
              : palette.error.main
        }}
        variant="outlined"
      >
        <CardMedia>
          <Box sx={{ height: '40rem', position: 'relative' }} />
          <Box sx={{ p: 1.5, px: 4 }}>
            <Skeleton width="100%" height="3rem" />
          </Box>
        </CardMedia>
        <Box sx={{ px: 4 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography gutterBottom variant="overline">{t('branding.cardle')}</Typography>
              <Skeleton width="8rem" />
            </Box>
            <Divider />
            <Grid container >
              {
                Array.from({ length: 4 }).map((_, i) => (
                  <Grid
                    key={`loader-hints-${i}`}
                    item
                    xs={6}
                    sm={6}
                    sx={{ display: 'flex', flexDirection: 'column', alignItems: i % 2 ? 'flex-end' : 'flex-start' }}
                  >
                    <Skeleton width="6rem" height="3rem" />
                    <Skeleton width="6rem" height="3rem" />
                  </Grid>
                ))
              }
            </Grid>
            <Divider />
            <Skeleton width="100%" height="3rem" />
            <Box sx={{ display: 'flex', mt: 2 }}>
              <Skeleton width="50%" height="5rem" sx={{ mr: 0.25 }} />
              <Skeleton width="50%" height="5rem" sx={{ ml: 0.25 }} />
            </Box>
          </CardContent>
          <CardActions sx={{ float: 'right' }}>
            <Collapse in={inProgress}>
              <Button disabled color="secondary">{t('game.skip')}</Button>
              <Button disabled size="large">{t('game.guess')}</Button>
            </Collapse>
          </CardActions>
        </Box>
      </Card>
      <Divider />
    </Container>
  );

  return (
    <Container
      sx={{
        alignItems: 'stretch',
        display: 'flex',
        flexDirection: 'column',
        mt: 9,
        position: 'relative',
      }}
    
    >
      <Card
        sx={{
          boxShadow: 5,
          animation: attempts.length >= maxGuesses - 1 && inProgress
            ? `${heartBeat} 1s cubic-bezier(0.62,-0.02, 0.3, 1.45) infinite alternate`
            : 'none',
          pb: 1,
          borderColor: ({ palette }) => win
            ? palette.success.main
            : inProgress
              ? palette.divider
              : palette.error.main
        }}
        variant="outlined"
      >
        <Collapse in={!inProgress} sx={{ px: 4, pt: 1, textAlign: 'center' }} unmountOnExit>
          <Typography variant="h2" sx={{ textTransform: 'capitalize' }}>{currentCar?.year} - {currentCar?.make} {currentCar?.model}</Typography>
          { currentCar?.notes?.map(({ notes }, i) => <Typography key={`note-${i}`} variant="body1">{notes}</Typography>) }
          <Divider />
        </Collapse>
        <BottomNavResults />
        <CardMedia sx={{ pt: 2 }}>
          <BlurImage
            blurRadius={50}
            clearArea={gameData}
            currentAttempt={step}
            imageUrls={gameData.map(({ imgUrl }) => imgUrl)}
            maxGuesses={maxGuesses}
            isLastGuess={step >= maxGuesses}
            skipBlurring={win || !inProgress}
          />
          <Box sx={{ p: 1.5, px: 4 }}>
            <Slider
              marks={marks}
              max={maxGuesses}
              min={0}
              onChange={handleChange}
              size="small"
              value={step}
              valueLabelDisplay="auto"
              valueLabelFormat={formatLabel}
              color={
                win
                  ? 'success'
                  : !inProgress
                    ? 'error'
                    : attempts.length <= Math.floor(maxGuesses * .5)
                      ? 'primary'
                      : attempts.length >= maxGuesses - 1
                        ? 'error'
                        : 'warning' 
              }
            />
          </Box>
        </CardMedia>
        <Box sx={{ px: 1 }}>
          <CardContent>
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography gutterBottom variant="overline" sx={{ m: 0 }}>{t('branding.cardle')}</Typography>
              <Typography variant="overline">{!isSmallScreen ? maxGuesses - (attempts.length - 1) : t(win ? 'game.guessed' : 'game.guess', { count: win ? (winStep === 0 ? 1 : winStep) : maxGuesses - (attempts.length - 1) })}</Typography>
            </Box>

            <Divider />
            <Grid container sx={{ flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'center', md: 'inherit' } }}>
              {Object.entries(hints).map(([key, value], i) => <Grid
                key={`${value}-${i}`}
                item
                xs={12}
                md={6}
                sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'center', md: i % 2 ? 'flex-end' : 'flex-start' } }}
              >
                  <RevealHint hint={`${value}`} label={t(`game.hint.${key}`)} />
                </Grid>
              )}
            </Grid>

            <Divider />

            {/* GUESS Controllers */}
            <Collapse in={!win && inProgress} sx={{ width: '100%' }} component="search" unmountOnExit>
              <Slider
                marks
                max={DateTime.now().year}
                min={MIN_YEAR}
                onChange={(_, value) => typeof value === 'number' && setYear(value)}
                value={year}
                valueLabelDisplay="auto"
                sx={{
                  color: getYearColor(Number(guessedYear ?? validAnswers.year), hardMode, palette, Number(currentCar.year ?? '1950')),
                }}
              />
              <Box sx={{ mt: 1, display: 'flex' }}>
                {<Autocomplete
                  loading={makesState === 'pending'}
                  defaultValue={guessedMake === '' ? null : guessedMake}
                  options={makes ?? []}
                  sx={{ width: '100%', mr: 0.25 }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('game.make')}
                      sx={{ '.MuiOutlinedInput-notchedOutline': {borderColor: getGuessColor(guessedMake ?? validAnswers?.make, hardMode, palette, currentCar?.make)} }}
                    />
                  )}
                  onChange={(_e, value) => setMake(!value ? '' : value)}
                />
                }
                <Autocomplete
                  loading={modelsState === 'pending'}
                  defaultValue={guessedModel === '' ? null : guessedModel}
                  options={models ?? []}
                  sx={{ width: '100%', ml: 0.25 }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('game.model')}
                      sx={{ '.MuiOutlinedInput-notchedOutline': { borderColor: getGuessColor(guessedModel ?? validAnswers?.model, hardMode, palette, currentCar?.model) } }}
                    />
                  )}
                  onChange={(_e, value) => value && setModel(value)}
                />
              </Box>
            </Collapse>
            <Collapse in={!inProgress} sx={{ mt: 1 }}>
              <ShareResults />
            </Collapse>
          </CardContent>
          <CardActions sx={{ float: 'right' }}>
            <Collapse in={inProgress} unmountOnExit>
              <Button onClick={() => guessAttempt(true)} color="secondary">{t('game.skip')}</Button>
              <Button onClick={() => guessAttempt()} disabled={make === '' && model === ''} size="large">{t('game.guess')}</Button>
            </Collapse>
          </CardActions>
        </Box>
      </Card>
    </Container>
  )
}