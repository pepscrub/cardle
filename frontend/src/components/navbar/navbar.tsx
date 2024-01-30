import { useScrollTrigger, Slide, AppBar, Toolbar, Typography, Box, Drawer, Divider, List, IconButton } from "@mui/material";
import { FC, useContext, useState } from "react";
import MenuIcon from '@mui/icons-material/Menu';
import { NavBarContext } from "../../App";
import { useCardle } from "../cardle/controller";
import { DateTime } from "luxon";
import CountDown from 'react-countdown';
import BarChartIcon from '@mui/icons-material/BarChart';
import { Settings } from "../cardle/settings";

const DRAWER_WIDTH = 240;

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

export const Navbar: FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const statsOpen = useContext(NavBarContext);
  const { currentCar } = useCardle();

  const handleDrawerToggle = () => {
    setMobileOpen((prevState) => !prevState);
  };

  const listItems = (
    <>
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
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        Nothing here yet
      </Typography>
      <Divider />
      <List>
        {listItems}
      </List>
    </Box>
  );

  const container = document.body;
  return (
    <>
      <HideOnScroll>
        <AppBar component="nav">
          <Toolbar sx={{  }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
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
              }}
            >
              <time>
                <CountDown
                  date={DateTime.local().setZone(currentCar?.region).endOf('day').toJSDate()}
                  daysInHours
                />
              </time>
            </Typography>
            <Box sx={{ display: { xs: 'none', sm: 'block' }, ml: 'auto' }}>
              {listItems}
            </Box>
          </Toolbar>
        </AppBar>
      </HideOnScroll>
      <nav>
        <Drawer
          container={container}
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
        >
          {drawer}
        </Drawer>
      </nav>
    </>
  )
}