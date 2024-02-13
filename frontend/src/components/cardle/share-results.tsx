import { FC, useContext, useEffect, useState } from "react";
import { useCardle } from "./controller"
import { Box, Button, Collapse, Dialog, DialogTitle, Divider, Grid, IconButton, LinearProgress, LinearProgressProps, Typography, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import ShareIcon from '@mui/icons-material/Share';
import { useSnackbar } from 'notistack';
import { NavBarContext } from "../../App";
import { DateTime } from "luxon";
import CloseIcon from '@mui/icons-material/Close';
import { Guesses, getGuessColor, yearColor } from "./guess";
import { SPECIAL_SPLIT_CHAR } from "../constants";

interface GameResults {
  attempts: string[];
  win: boolean;
  inProgress: boolean
}

enum EmojiResults {
  skipped = '🟧',
  close = '🟨',
  correct = '🟩',
  incorrect = '🟥',
}

const StatItem: FC<{ title: string; value: string }> = ({ title, value }) => (
  <Box sx={{ textAlign: 'center', p: 1 }}>
    <Typography variant="h2">{value}</Typography>
    <Typography variant="overline">{title}</Typography>
  </Box>
);

const LinearProgressWithLabel = (props: LinearProgressProps & { value: number; guesses: number; title: string }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative', my: 1.5 }}>
      <Typography variant="caption" sx={{ px: 1 }}>{props.title}</Typography>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress variant="determinate" sx={{ height: '1.25rem' }} {...props}/>
      </Box>
      <Typography
        variant="body2"
        color="text.secondary"
        style={{
          position: "absolute",
          color: "white",
          top: 0,
          left: "95%",
          transform: "translateX(-50%)",
        }}
      >
        {props.guesses}
      </Typography>
    </Box>
  );
}

export const ShareResults: FC = () => {
  const [games, setGames] = useState<GameResults[]>([]);
  const [winRate, setWinRate] = useState(0);
  const [winDisruptions, setWinDisruptions] = useState<Record<number, number>>({});
  const largestValue = Math.max(...Object.values(winDisruptions)) * 2;
  const { attempts, currentCar, inProgress, stats, hardMode } = useCardle();
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const { palette } = useTheme();
  const statsOpen = useContext(NavBarContext);
  const currentYear = Number(currentCar?.year) ?? 1984;

  const switchToEmojis = (value: string): string => {
    if (palette.success.main === value) return EmojiResults.correct;
    if (palette.warning.main === value) return EmojiResults.close;
    if (palette.error.main === value) return EmojiResults.incorrect;
    return EmojiResults.skipped;
    
  }

  useEffect(() => {
    const arr = [];
    for (let i = 0; i < localStorage.length; i++){
      const item = localStorage.key(i);
      if (item && item?.substring(0,5) == 'game_') {
          arr.push(JSON.parse(localStorage.getItem(item) as string));
      }
    }
    setGames(arr);
  }, [inProgress])

  useEffect(() => {
    const gamesWon = games.filter(({ win }) => win).length ?? 0;
    const tempObject: Record<number, number> = {};
    const values = games
      .map(({ attempts }) => attempts.length);
    Array.from({ length: Math.max(...values) }).map((_, index) => {
      if(index === 0) return;
      tempObject[index] = 0;
    })
    values
      .map((number) => tempObject[number] = (tempObject[number] ?? 0) + 1)
    setWinDisruptions(tempObject);
    
    if (gamesWon && games.length) setWinRate(gamesWon / games.length * 100)
  }, [games, inProgress]);

  const results = attempts.map((attempt) => attempt === 'skipped' ? attempt : attempt.split(SPECIAL_SPLIT_CHAR));

  const emojis = results.map((value) => {
    if (value === 'skipped') return Array.from({ length: 3 }).map(() => EmojiResults.skipped);
    const [year, make, model] = value;
    return [
      switchToEmojis(
        yearColor(
          currentYear,
          hardMode,
          palette,
          Number(year)
        )
      ),
      switchToEmojis(
        getGuessColor(
          make,
          hardMode,
          palette,
          currentCar?.make
        )
      ),
      switchToEmojis(
        getGuessColor(
          model,
          hardMode,
          palette,
          currentCar?.model
        )
      )
    ];
  })

  const text = emojis.map((value) => value.join('')).join('\n');
  
  const onClick = () => {
    const clipboardText = `${hardMode ? 'Hard' : 'Easy'} Cardle results for ${DateTime.now().toLocaleString()}, ${attempts.length}/${currentCar?.gameData.length}:\n\n${text}`
    try {
      navigator.clipboard.writeText(clipboardText);
      enqueueSnackbar(t('stats.copyToClipboard.success'), { variant: "success" })
    } catch(err) {
      enqueueSnackbar(t('stats.copyToClipboard.error'), { variant: "error" })
    }
  }

  return (
    <>
      <Button sx={{ width: '100%' }} onClick={() => statsOpen.setOpen()}>{t('stats.title')}</Button>
      <Dialog
        onClose={() => statsOpen.close()}
        open={statsOpen.open}
        sx={{ overflowX: 'hidden' }}
      >
        <DialogTitle>
          <Typography variant="h2" component="span">{t('stats.title')}</Typography>
        </DialogTitle>
        <IconButton
          aria-label="close"
          onClick={() => statsOpen.close()}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
        <Divider />
        <Grid sx={{ display: 'flex' }}>
          <StatItem title={t('stats.gamesPlayed')} value={String(games.length)} />
          <StatItem title={t('stats.won')} value={t('stats.winRate', { winRate: Math.floor(winRate) })} />
          <StatItem title={t('stats.current_streak')} value={String(stats.currentStreak)} />
          <StatItem title={t('stats.longest_streak')} value={String(stats.maxStreak)} />
        </Grid>
        <Divider />
        <Box sx={{ mt: 2 }}>
          {
            Object.entries(winDisruptions).map(([key, value]) => (
              <LinearProgressWithLabel
                key={`${key}-${value}`}
                guesses={value}
                title={key}
                value={value / largestValue * 100}
                variant="determinate"
              />
            ))
          }
        </Box>
        <Divider />
        <Guesses />
        <Collapse in={!inProgress} sx={{ my: 2, '.MuiCollapse-wrapperInner': { display: 'flex', justifyContent: 'center' } }}>
          <Button onClick={onClick}>
            {t('stats.shareYourResults')}
            <ShareIcon />
          </Button>
        </Collapse>
      </Dialog>
    </>
  )
}