import { ThemeOptions } from "@mui/material/styles/createTheme";

export const themeOptions: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: { main: '#1c9dcb' },
    secondary: { main: '#da1fb2' },
    error: { main: '#e53935' },
    background: { default: '#151516', paper: '#1f1f23' },
  },
  components: {
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
        },
      },
    },
    MuiAppBar: {
      defaultProps: { color: 'inherit' },
    },
    MuiTooltip: { defaultProps: { arrow: true }},
    MuiButton: { defaultProps: { size: 'small' }},
    MuiButtonGroup: { defaultProps: { size: 'small' }},
    MuiCheckbox: { defaultProps: { size: 'small' }},
    MuiFab: { defaultProps: { size: 'small' }},
    MuiFormControl: { defaultProps: { margin: 'dense', size: 'small', }},
    MuiFormHelperText: { defaultProps: { margin: 'dense' }},
    MuiIconButton: { defaultProps: { size: 'small' }},
    MuiInputBase: { defaultProps: { margin: 'dense' }},
    MuiInputLabel: { defaultProps: {  margin: 'dense' }},
    MuiRadio: { defaultProps: { size: 'small' }},
    MuiTextField: { defaultProps: { margin: 'dense', size: 'small' }},
    MuiSwitch: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: {
          width: 42,
          height: 26,
          padding: 0,
          margin: 8,
        },
        switchBase: {
          padding: 1,
          '&$checked, &$colorPrimary$checked, &$colorSecondary$checked': {
            transform: 'translateX(16px)',
            color: '#fff',
            '& + $track': {
              opacity: 1,
              border: 'none',
            },
          },
          thumb: {
            width: 24,
            height: 24,
          },
          track: {
            borderRadius: 13,
            border: '1px solid #bdbdbd',
            backgroundColor: '#fafafa',
            opacity: 1,
            transition: 'background-color 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,border 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
          },
        }
      },
    },
  },
};