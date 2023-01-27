import { Theme } from '@mui/material/styles';
import { styled, Drawer, AppBar } from '@mui/material';


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
}

export type NavProps = {
    open?: boolean,
    fullHeightDrawer?: boolean,
    width?: number,
}
const styledOptions = omitProps<NavProps>("open", "width");



function navStyled(component: any, generator: (props: NavProps & {theme: Theme}) => any) {
    return styled(component, styledOptions)<NavProps>((props) => {
        const propsWithDefault = {open: false, width: 240, fullHeightDrawer: false, ...props};
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

export const NavAppBar = navStyled(AppBar, ({theme, open, width, fullHeightDrawer}) => ({
    transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    ...(!fullHeightDrawer && {zIndex: theme.zIndex.drawer + 1}),
    ...(open && fullHeightDrawer && {
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