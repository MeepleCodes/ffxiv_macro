import { Box, ListItem, ListItemIcon, ListItemText } from '@mui/material';

import { ListItemButtonLink } from '../../components/Links';

type ListItemButtonLinkProps = Parameters<(typeof ListItemButtonLink)>[0];

export type ReportNavLinkProps = {
  to: ListItemButtonLinkProps["to"],
  params: ListItemButtonLinkProps["params"],
  primary?: string,
  secondary?: string,
  icon?: string | JSX.Element
};

// ActiveLinkOptions<TRouter, TFrom, TTo, TMaskFrom, TMaskTo>

export default function ReportNavLink(props: ReportNavLinkProps) {
  const {to, params, primary, secondary, icon} = props;
  return (
    <ListItem dense disablePadding disableGutters>
      <ListItemButtonLink
        to={to}
        disableGutters
        params={params}
        activeOptions={{ exact: true }}
        activeProps={{
          selected: true,
          className: "active"
         // Tanstack types this too tightly so lie that 'selected' is a property
         // of <a>
        } as React.AnchorHTMLAttributes<HTMLAnchorElement>}
        sx={{
          position: "relative",
          "&.active .ActiveMarker": {
            visibility: "visible"
          }
        }}
      >
        {/* <Box sx={{
          width: (theme) => theme.spacing(2),
          mr: (theme) => theme.spacing(2),
          flexShrink: 0,
          textAlign: "center" }}>{idx + 1}</Box>         */}
        <ListItemIcon
          sx={{
            width: (theme) => theme.spacing(6),
            m: 0,
            p: 0,
            minWidth: 0,
            textAlign: "center",
            justifyContent: "center"
          }}
        >
          {icon}
        </ListItemIcon>
        <ListItemText
          primary={primary}
          secondary={secondary}
          primaryTypographyProps={{ noWrap: true }}
          secondaryTypographyProps={{ noWrap: true }}
          sx={{
            mr: "2px"
          }}
        />
        <Box
          className="ActiveMarker"
          sx={{
            borderColor: (theme) => theme.vars.palette.primary.main,
            borderRightWidth: 2,
            borderRightStyle: "solid",
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            visibility: "hidden"
          }}
        />
      </ListItemButtonLink>
    </ListItem>
  )
}