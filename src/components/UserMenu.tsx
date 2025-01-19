import { Avatar, IconButton, IconButtonProps, Menu, MenuItem, styled } from "@mui/material";

import React, { MouseEvent } from "react";
import LoginIcon from '@mui/icons-material/Login';
import { useSession } from "../supabase/auth";
import supabase from "../supabase/client";


export type UserMenuProps = Omit<IconButtonProps, "onClick" | "children">;


const MenuButton = styled(IconButton)(() => ({
  // backgroundColor: `rgba(${theme.vars.palette.primary.mainChannel} / 0.5)`,
  // color: theme.vars.palette.primary.contrastText,
  // "&:hover": {
  //   backgroundColor: theme.vars.palette.primary.light,
  
  // }
}))

export default function UserMenu(props: UserMenuProps) {
  const session = useSession();
  const handleSignIn = React.useCallback(() => {
    void supabase.auth.signInWithOAuth({provider: "discord", options: {
      redirectTo: document.location.toString()
    }});
    handleClose();
  }, []);
  const handleSignOut = () => {
    void supabase.auth.signOut();
  }
  const signedIn = session !== null && session.user.is_anonymous !== true;
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement|null>(null);
  const isOpen = anchorEl != null;
  const handleOpen = (e: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(e.currentTarget);
  }
  const handleClose = () => {
    setAnchorEl(null);
  }
  const id = React.useId();
  return <>
    <Menu
      id={id}
      anchorEl={anchorEl}
      open={isOpen}
      onClose={handleClose}
      slotProps={{
        paper: {
          sx: {
            mt: 1.5
          }
        }
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}      
      >
      {signedIn ? [
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      <MenuItem key="signedin-1" onClick={() => {console.log(session.user)}}>Signed in as {session.user.user_metadata.custom_claims.global_name as string}</MenuItem>,
      <MenuItem key="signedin-2" onClick={handleSignOut}>Sign out</MenuItem>
      ]
      :
      <MenuItem onClick={handleSignIn}>
        Sign in with Discord
      </MenuItem>
      }
    </Menu>
    <MenuButton
      onClick={handleOpen}
      aria-controls={isOpen ? id : undefined}
      aria-haspopup="true"
      aria-expanded={isOpen ? 'true' : undefined}

      {...props}
      size="small"
    >
      <Avatar sx={{ width: 32, height: 32, bgcolor: (theme) => theme.vars.palette.primary.main }} src={signedIn ? session.user.user_metadata.avatar_url as string : undefined}>
        {/* {signedIn ? <AccountCircleIcon/> : <LoginIcon/>} */}
        {!signedIn && <LoginIcon/>}
      </Avatar>
      
    </MenuButton>
  </>
}