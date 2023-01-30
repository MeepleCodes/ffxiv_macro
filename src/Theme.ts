import { createTheme } from '@mui/material/styles';
export let appTheme = createTheme();
appTheme = createTheme(appTheme, {
    palette: {
        inverted: {
            main: appTheme.palette.primary.contrastText,
            contrastText: '#fff',
        },
        mode: 'dark',
        text: {
            primary: 'rgba(255,255,255,0.9)',
            secondary: 'rgba(255,255,255,0.7)',
            disabled: 'rgba(255,255,255,0.5)'
          },
        primary: {
            main: '#2297a6',
        },
        secondary: {
          main: '#f50057',
        },
        background: {
          paper: 'rgba(66,66,66,0.84)',
        },        
    },
});
declare module '@mui/material/styles' {
    interface Palette {
        inverted: Palette['primary'];
    }
  
    interface PaletteOptions {
        inverted: PaletteOptions['primary'];
    }
}
declare module '@mui/material/FormControl' {
    interface FormControlPropsColorOverrides {
      inverted: true;
    }
}