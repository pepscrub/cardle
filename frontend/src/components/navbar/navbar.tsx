import BarChartIcon from '@mui/icons-material/BarChart';
import CoffeeIcon from '@mui/icons-material/Coffee';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import EngineeringIcon from '@mui/icons-material/Engineering';
import FontDownloadIcon from '@mui/icons-material/FontDownload';
import GamepadIcon from '@mui/icons-material/Gamepad';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import MenuIcon from '@mui/icons-material/Menu';
import PublicIcon from '@mui/icons-material/Public';
import TvIcon from '@mui/icons-material/Tv';
import TwitterIcon from '@mui/icons-material/Twitter';
import { AppBar, Box, Divider, IconButton, LinearProgress, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Slide, SwipeableDrawer, Toolbar, Tooltip, Typography, useScrollTrigger } from "@mui/material";
import { DateTime } from "luxon";
import { FC, useContext, useEffect, useState } from "react";
import CountDown from 'react-countdown';
import { useTranslation } from "react-i18next";
import { NavBarContext } from "../../App";
import { storage } from "../../util/localstorage";
import { useCardle } from "../cardle/controller";
import { Settings } from "../cardle/settings";
import { GRADIENT_END_DEFAULT, GRADIENT_START_DEFAULT } from "../constants";

const DRAWER_WIDTH = '16rem';

const otherDles = [
  { title: 'cardle', href: 'https://cardle.uk', icon: <DirectionsCarIcon /> },
  { title: 'chrono', href: 'https://www.chronophoto.app/game.html', icon: <HistoryEduIcon /> },
  { title: 'frammed', href: 'https://framed.wtf', icon: <TvIcon /> },
  { title: 'gamedle', href: 'https://www.gamedle.wtf', icon: <GamepadIcon /> },
  { title: 'gtg', href: 'https://guessthe.game', icon: <GamepadIcon /> },
  { title: 'timeguesser', href: 'https://timeguessr.com', icon: <HistoryEduIcon /> },
  { title: 'tradle', href: 'https://games.oec.world/en/tradle/', icon: <EngineeringIcon /> },
  { title: 'worldle', href: 'https://worldle.teuteuf.fr', icon: <PublicIcon /> },
  { title: "contexto", href: 'https://contexto.me', icon: <FontDownloadIcon /> }
] as const;

interface Props {
  window?: () => Window;
  children: React.ReactElement;
}

const HideOnScroll: FC<Props> = ({ children, window }) => {
  const trigger = useScrollTrigger({
    target: window ? window() : undefined,
  });

  return <Slide appear={false} direction="down" in={!trigger}>
    {children}
  </Slide>
}

const calculateDateDifferencePercentage = (zone?: string): number => {
  const startTime = DateTime.now().setZone(zone).startOf('day').toJSDate();
  const timeNow = DateTime.now().setZone(zone).toJSDate();
  const endTime = DateTime.now().setZone(zone).endOf('day').toJSDate();

  const q = Math.abs(+timeNow - +startTime);
  const d = Math.abs(+endTime - +startTime);

  const percentageDifference = (q / d) * 100;
  return percentageDifference;
}

export const Navbar: FC = () => {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const statsOpen = useContext(NavBarContext);
  const { currentCar } = useCardle();
  const [progress, setProgress] = useState(calculateDateDifferencePercentage(currentCar?.resetRegion));
  const [startColor, setStartColor] = useState(storage.get('startColor', GRADIENT_START_DEFAULT));
  const [endColor, setEndColor] = useState(storage.get('endColor', GRADIENT_END_DEFAULT));

  useEffect(() => {
    window.addEventListener('storage', () => {
      setStartColor(storage.get('startColor', GRADIENT_START_DEFAULT));
      setEndColor(storage.get('endColor', GRADIENT_END_DEFAULT));
    })
    return () => window.removeEventListener('storage', () => {});
  }, [])

  const handleDrawerToggle = () => setMobileOpen(true);

  const listItems = (
    <>
      <Tooltip title={t('shamelessPlug.coffee')}>
        <IconButton
          edge="end"
          sx={{ ml: 1 }}
          href="https://www.buymeacoffee.com/pepsb"
          target="_blank"
        > 
          <CoffeeIcon />
        </IconButton>
      </Tooltip>
      <IconButton
        edge="end"
        sx={{ ml: 1 }}
        href="https://twitter.com/cardle246102"
        target="_blank"
      >
        <TwitterIcon />
      </IconButton>
      <IconButton
        edge="end"
        sx={{ ml: 1 }}
        onClick={() => statsOpen.setOpen()}
      >
        <BarChartIcon />
      </IconButton>
      <Settings />
    </>
  )

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }} component="header">
      <Typography variant="h1" sx={{ py: 1, fontSize: '1.75rem', background: startColor.slice(0, -2)}}>
        {t('branding.cardle')}
      </Typography>
      <Divider />
      <List>
        {otherDles.map(({ title, href, icon }) => (
          <Tooltip
            key={title}
            placement="right"
            title={t(`otherDles.${title}.hint`)}
          >
            <ListItem>
              <ListItemButton
                href={href}
                target="_blank"
                sx={{
                  borderRadius: '100px',
                  outline: '0',
                  transition: 'outline 125ms linear, background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms !important',
                  '&:hover': {
                    outline: (theme) => `1px solid ${theme.palette.common.white}`
                  }
                }}
              >
                <ListItemIcon>{icon}</ListItemIcon>
                <ListItemText primary={t(`otherDles.${title}.title`)}/>
              </ListItemButton>
            </ListItem>
          </Tooltip>
        ))}
        <Divider />
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            width: DRAWER_WIDTH,
            display: 'flex',
            justifyContent: 'space-evenly',
            px: 2,
            pb: 1,
          }}
        >
          {listItems}
        </Box>
      </List>
    </Box>
  );

  const container = document.body;
  const reset = DateTime.local().setZone(currentCar?.resetRegion).endOf('day');

  const background = (deg: number): string => `
    linear-gradient(${deg}deg, ${startColor} 0%, ${endColor} 100%)
  `;

  return (
    <>
      <HideOnScroll>
        <AppBar component="nav" sx={{ '& > .MuiToolbar-root': { minHeight: '3rem !important' } }}>
          <Toolbar
            sx={{
              background: background(90),
            }}
          >
            <IconButton
              tabIndex={0}
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="overline"
              sx={{
                ml: { xs: 'auto', sm: '0' },
                mr: { xs: '0', sm: 'auto' },
                cursor: 'default',
                userSelect: 'none',
                lineHeight: 0
              }}
            >
              <time>
                <CountDown
                  date={reset.toJSDate()}
                  daysInHours
                  onTick={() => setProgress(calculateDateDifferencePercentage(currentCar?.resetRegion))}
                  onComplete={() => {
                    location.reload()
                    localStorage.removeItem('todaysGame')
                  }}
                />
              </time>
            </Typography>
            <Box sx={{ display: { xs: 'none', sm: 'block' }, ml: 'auto' }}>
              {listItems}
            </Box>
          </Toolbar>
          <LinearProgress
            variant="determinate"
            value={progress}
            color="info"
          />
        </AppBar>
      </HideOnScroll>
      <nav>
        <SwipeableDrawer
          anchor="left"
          container={container}
          onOpen={() => setMobileOpen(true)}
          onClose={() => setMobileOpen(false)}
          open={mobileOpen}
          variant="temporary"
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              background: background(180),
              color: (theme) => theme.palette.common.white
            },
            '& .MuiSvgIcon-root': {
              color: (theme) => theme.palette.common.white
            }
          }} 
        >
          {drawer}
        </SwipeableDrawer>
      </nav>
    </>
  )
}