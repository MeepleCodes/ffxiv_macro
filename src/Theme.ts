import { createTheme, Theme } from '@mui/material/styles';
import type {} from '@mui/material/themeCssVarsAugmentation';
export let appTheme = createTheme({
    cssVariables: true,
});
appTheme = createTheme({
    cssVariables: true,
    palette: {
        inverted: appTheme.palette.augmentColor({
            color: {
                main: appTheme.palette.primary.contrastText
            },
            name: "inverted"
        }),
        //     main: appTheme.palette.primary.contrastText,
        //     // main: "",
        //     contrastText: '#fff',
        // },
        mode: 'dark',
        text: {
            primary: 'rgba(255,255,255,0.9)',
            secondary: 'rgba(255,255,255,0.7)',
            disabled: 'rgba(255,255,255,0.5)'
        },
        primary: appTheme.palette.augmentColor({
            color: {
                main: '#2297a6',
            }
        }),
        // primary: {
        //     main: '#2297a6',
        // },
        secondary: {
            main: '#f50057',
        },
        background: {
            paper: 'rgba(66,66,66,0.74)',
        }
    },
    components: {
        MuiCardHeader: {
            styleOverrides: {
                root: ({theme}: {theme: Theme}) => ({
                    padding: theme.spacing(1)
                })
            }
        },
        MuiTable: {
            styleOverrides: {
                stickyHeader: ({theme}: {theme: Theme}) => ({
                    ["& .MuiTableCell-head"]: {
                        background: theme.palette.background.paper
                    }
                })
            }
        }
    }
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