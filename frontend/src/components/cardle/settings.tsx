import { Dialog, DialogContent, DialogTitle, Divider, Grid, IconButton, Switch, Typography, useTheme } from "@mui/material";
import { FC, Fragment, useContext, useEffect, useState } from "react";
import SettingsIcon from '@mui/icons-material/Settings';
import { useTranslation } from "react-i18next";
import CloseIcon from '@mui/icons-material/Close';
import { ColorModeContext } from "../../App";
import VideogameAssetIcon from '@mui/icons-material/VideogameAsset';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { MuiColorInput } from 'mui-color-input'
import { useCardle } from "./controller";
import ChildFriendlyIcon from '@mui/icons-material/ChildFriendly';
import useLocalStorage from "react-use-localstorage";
import GradientIcon from '@mui/icons-material/Gradient';
import { GRADIENT_START_DEFAULT, GRADIENT_END_DEFAULT } from "../constants";

export const Settings: FC = () => {
  const [open, setOpen] = useState(false);
  const [startColor, setStartColor] = useLocalStorage('startColor', GRADIENT_START_DEFAULT)
  const [endColor, setEndColor] = useLocalStorage('endColor', GRADIENT_END_DEFAULT)
  const { hardMode, setHardMode } = useCardle();
  const { t } = useTranslation();
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);

  useEffect(() => {
    if (startColor === '') setStartColor(GRADIENT_START_DEFAULT);
    if (endColor === '') setEndColor(GRADIENT_END_DEFAULT);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startColor, endColor]);

  const items = [
    {
      title: t('settings.hardMode.title'),
      subTitle: t('settings.hardMode.desc'),
      value: hardMode,
      onUpdate: (value: boolean) => {
        setHardMode(value);
        localStorage.setItem('hardMode', String(value));
      },
      icon: hardMode ? <VideogameAssetIcon /> : <ChildFriendlyIcon />
    },
    {
      title: t('settings.startColor.title'),
      subTitle: t('settings.startColor.desc'),
      value: startColor,
      onUpdate: (newValue: string) => setStartColor(newValue),
      colorInput: true,
      icon: <GradientIcon />
    },
    {
      title: t('settings.endColor.title'),
      subTitle: t('settings.endColor.desc'),
      value: endColor,
      onUpdate: (newValue: string) => setEndColor(newValue),
      colorInput: true,
      icon: <GradientIcon />
    },
    {
      title: t('settings.darkMode.title'),
      value: theme.palette.mode === 'dark',
      onUpdate: () => colorMode.toggleColorMode(),
      icon: theme.palette.mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />
    },
  ]

  return (
    <>
      <IconButton onClick={() => setOpen(true)} sx={{ ml: 1.5 }}>
        <SettingsIcon />
      </IconButton>
      <Dialog
        onClose={() => setOpen(false)}
        open={open}
        sx={{ '.MuiPaper-root': { width: '100%' } }}
      >
        <DialogTitle><Typography variant="h2" component="span">{t('settings.title')}</Typography></DialogTitle>
        <IconButton
          aria-label="close"
          onClick={() => setOpen(false)}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent>
          {
            items.map((item) => <Fragment key={item.title}>
              <Grid container sx={{ alignItems: 'center', display: 'flex', flexWrap: 'nowrap' }}>
                <Typography sx={{ p: 1, lineHeight: 1 }}>{item.icon}</Typography>
                <Grid sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="body1">{item.title}</Typography>
                  {item.subTitle && <Typography variant="caption">{item.subTitle}</Typography>}
                </Grid>
                {item.colorInput
                  ? <MuiColorInput format="hex8" size="small" value={item.value} onChange={item.onUpdate} sx={{ ml: 'auto', width: '9rem' }}/>
                  : typeof item.value === 'boolean' && <Switch sx={{ ml: 'auto' }} checked={item.value} onChange={({ target }) => item.onUpdate(target.checked)} />
                }
              </Grid>
              <Divider />
            </Fragment>
            )
          }
        </DialogContent>
      </Dialog>
    </>
  )
}