import ChildFriendlyIcon from '@mui/icons-material/ChildFriendly';
import CloseIcon from '@mui/icons-material/Close';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import GradientIcon from '@mui/icons-material/Gradient';
import LightModeIcon from '@mui/icons-material/LightMode';
import SettingsIcon from '@mui/icons-material/Settings';
import VideogameAssetIcon from '@mui/icons-material/VideogameAsset';
import { Dialog, DialogContent, DialogTitle, Divider, Grid, IconButton, Switch, Typography, useTheme } from "@mui/material";
import { MuiColorInput } from 'mui-color-input';
import { FC, Fragment, useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { ColorModeContext } from "../../App";
import { storage } from "../../util/localstorage";
import { GRADIENT_END_DEFAULT, GRADIENT_START_DEFAULT } from "../constants";
import { useCardle } from "./controller";

export const Settings: FC = () => {
  const [open, setOpen] = useState(false);
  const [startColor, setStartColor] = useState(storage.get('startColor', GRADIENT_START_DEFAULT));
  const [endColor, setEndColor] = useState(storage.get('endColor', GRADIENT_END_DEFAULT));
  const { hardMode, setHardMode } = useCardle();
  const { t } = useTranslation();
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);

  const updateColor = (key: string, color: string) => {
    if (key === 'startColor') setStartColor(color);
    if (key === 'endColor') setEndColor(color);
    storage.set(key, color)
  }

  const items = [
    {
      title: t('settings.hardMode.title'),
      subTitle: t('settings.hardMode.desc'),
      value: hardMode,
      onUpdate: (value: boolean) => {
        setHardMode(value);
        storage.set('hardMode', value);
      },
      updateChecked: true,
      icon: hardMode ? <VideogameAssetIcon /> : <ChildFriendlyIcon />
    },
    {
      title: t('settings.startColor.title'),
      subTitle: t('settings.startColor.desc'),
      value: startColor,
      onUpdate: (newValue: string) => updateColor('startColor', newValue),
      colorInput: true,
      icon: <GradientIcon />
    },
    {
      title: t('settings.endColor.title'),
      subTitle: t('settings.endColor.desc'),
      value: endColor,
      onUpdate: (newValue: string) => updateColor('endColor', newValue),
      colorInput: true,
      icon: <GradientIcon />
    },
    {
      title: t('settings.darkMode.title'),
      value: theme.palette.mode === 'dark',
      onUpdate: () => colorMode.toggleColorMode(),
      updateChecked: true,
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
        sx={{
          '.MuiPaper-root': {
            width: '100%',
          },
        }}
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
                  : item.updateChecked && <Switch sx={{ ml: 'auto' }} checked={item.value} onChange={({ target }) => item.onUpdate(target.checked)} />
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