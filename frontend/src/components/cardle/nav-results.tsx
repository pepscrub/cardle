import { Box, Button, Grow, useTheme } from "@mui/material";
import { FC } from "react";
import { useCardle } from "./controller";
import { useTranslation } from "react-i18next";
import YouTubeIcon from '@mui/icons-material/YouTube';
import GoogleIcon from '@mui/icons-material/Google';
import { TIMER_FADEOUT } from "../constants";
import { useScreen } from "../../hooks/breakpoints";
import PublicIcon from '@mui/icons-material/Public';

export const BottomNavResults: FC = () => {
  const { currentCar, inProgress } = useCardle();
  const { t } = useTranslation();
  const theme = useTheme();
  const isLargeScreen = useScreen('xl');
  const search = `${currentCar?.year} ${currentCar?.make} ${currentCar?.model}`;
  const platforms = [
    {
      label: t('results.platform.youtube'),
      href: inProgress ? 'https://noCheatingForYou.com' : `https://youtube.com/results?search_query=${search}`,
      icon: <YouTubeIcon />,
      color: theme.palette.error.main,
    },
    {
      label: t('results.platform.wiki'),
      href: inProgress ? 'https://noCheatingForYou.com' : `https://en.wikipedia.org/wiki/Special:Search?go=Go&search=${search}`,
      icon: <PublicIcon />,
      color: theme.palette.info.main,
    },
    {
      label: t('results.platform.google'),
      href: inProgress ? 'https://noCheatingForYou.com' : `https://www.google.com/search?q=${search}`,
      icon: <GoogleIcon />,
      color: theme.palette.success.main,
    },
  ] as const;
  return (
      <Box
        sx={{
          flexDirection: 'column',
          flexWrap: 'wrap',
          alignContent: 'stretch',
          justifyContent: 'space-between',
          position: 'absolute',
          right: `-${theme.spacing(13)}`,
          top: `-${theme.spacing(0.4)}`,

        }}
      >
        { platforms.map(({ label, href, icon, color }, i) => (
          <Grow
            key={`bottom-label-${label}`}
            in={!inProgress && isLargeScreen}
            timeout={TIMER_FADEOUT * (i + 1)}
            style={{ transformOrigin: 'left' }}
          >
            <Box>
              <Button
                startIcon={icon}
                href={href}
                sx={{
                  color,
                  width: '100%',
                  justifyContent: 'flex-start',
                  m: .5,
                  p: 2,
                  outline: '0px solid #000',
                  transition: 'outline 125ms linear, background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms !important',
                  '&:hover': {
                    outline: `1px solid ${color}`
                  }
                }}
                target="_blank"
              >
                {label}
              </Button>
            </Box>
          </Grow>
        )) }
      </Box>
  )
}