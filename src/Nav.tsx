import * as React from 'react';
import { styled, useTheme, Theme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import AppBar, { AppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import MailIcon from '@mui/icons-material/Mail';
import { JsxElement } from 'typescript';

/**
 * Helper for making a styled options object with a shouldForwardProp() function
 * that's type safe.
 * 
 * Takes any number of property keys to omit from the forwarding, which must be
 * if type keyof T (ensuring type safety).
 * 
 * @type T Type of the props for your component
 * @param omit Properties to omit in shouldForwardProp
 * @returns A styled() options object with shouldProperProp defined
 */
function omitProps<T>(...omit: (keyof T)[]) {
    return {
        shouldForwardProp: (prop: PropertyKey) => !(omit as PropertyKey[]).includes(prop)
    }
};

export type NavProps = {
    open?: boolean,
    width?: number
}
const styledOptions = omitProps<NavProps>("open", "width");



function navStyled(component: any, generator: (props: NavProps & {theme: Theme}) => any) {
    return styled(component, styledOptions)<NavProps>((props) => {
        const propsWithDefault = {open: false, width: 240, ...props};
        return generator(propsWithDefault);
    });
}
export const NavMain = navStyled('main', ({theme, open = false, width = 240}) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${width}px`,
    ...(open && {
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
      marginLeft: 0,
    }),    
}));

export const NavAppBar = navStyled(AppBar, ({theme, open, width}) => ({
    transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
        width: `calc(100% - ${width}px)`,
        marginLeft: `${width}px`,
        transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
    }),
}));


export const NavHeader = navStyled('div', ({theme}) => ({
        display: 'flex',
        alignItems: 'center',
        padding: theme.spacing(0, 1),
        // necessary for content to be below app bar
        ...theme.mixins.toolbar,
        justifyContent: 'flex-end',
}));

export const NavDrawer = styled(Drawer, {shouldForwardProp: prop => prop !== "width"})<{width?: number}>(({width=240}) => ({
    width: width,
    flexShrink: 0,
    '& .MuiDrawer-paper': {
        width: width,
        boxSizing: 'border-box',
      },    
}));