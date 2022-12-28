import { createTheme } from '@mui/material/styles';
export let appTheme = createTheme();
appTheme = createTheme(appTheme, {
    palette: {
        inverted: {
            main: appTheme.palette.primary.contrastText,
            contrastText: '#fff',
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