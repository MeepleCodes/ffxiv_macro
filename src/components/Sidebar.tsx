import { Paper, PaperProps } from "@mui/material"
import { styled } from "@mui/material/styles"
import { Property } from "csstype";

export type SidebarProps = PaperProps & {
    side?: "left" | "right",
    open: boolean,
    width: Property.Width
}
const component = (props: PaperProps) => <Paper {...props} elevation={1} square/>;

/**
 * A simple sidebar positioned within the page layout, rather than fixed position like the Navbar component.
 */
export const Sidebar = styled(
    component,
    {
        shouldForwardProp: propName => propName != "side" && propName != "open" && propName != "width"
    }
)<SidebarProps>(
    ({side, open, theme, width}) => ({
        borderWidth: 0,
        borderLeftWidth: side === "right" ? 1 : 2,
        borderRightWidth: side === "right" ? 2 : 1,
        borderColor: theme.vars.palette.divider,
        borderStyle: "solid",
        transition: theme.transitions.create("width", {easing: open ? theme.transitions.easing.easeOut : theme.transitions.easing.easeIn}),
        width: open ? width : 0,
        overflow: "hidden"
    })
);
