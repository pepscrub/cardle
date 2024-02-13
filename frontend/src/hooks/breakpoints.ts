
import { Breakpoint, useMediaQuery, useTheme } from "@mui/material";

export const useScreen = (breakpoint: Breakpoint = 'sm'): boolean => {
  const theme = useTheme();
  const screen = useMediaQuery(theme.breakpoints.up(breakpoint));

  return screen;
};