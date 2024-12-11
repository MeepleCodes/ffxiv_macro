import { Avatar, Fab, IconButton, IconButtonProps, Menu, MenuItem, styled } from "@mui/material";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { useCurrentUser } from "../firebase/auth/FirebaseAuth";
import React, { MouseEvent } from "react";
import LoginIcon from '@mui/icons-material/Login';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';


export type UserMenuProps = Omit<IconButtonProps, "onClick" | "children">;

const auth = getAuth();
const provider = new GoogleAuthProvider();

const MenuButton = styled(IconButton)(({theme}) => ({
  // backgroundColor: `rgba(${theme.vars.palette.primary.mainChannel} / 0.5)`,
  // color: theme.vars.palette.primary.contrastText,
  // "&:hover": {
  //   backgroundColor: theme.vars.palette.primary.light,
  
  // }
}))

export default function UserMenu(props: UserMenuProps) {
  const currentUser = useCurrentUser();
  const handleSignIn = React.useCallback(() => {
    signInWithPopup(auth, provider)
      .catch((error: unknown) => {
        console.error("Error signing in", error);
      });
    handleClose();
  }, []);
  const handleSignOut = () => {
    signOut(auth)
      .catch((error: unknown) => {
        console.error("Error signing out", error);
      });
    handleClose();
  }
  const signedIn = currentUser !== null && currentUser.isAnonymous !== true;
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
      <MenuItem>{currentUser.displayName}</MenuItem>,
      <MenuItem onClick={handleSignOut}>Sign out</MenuItem>
      ]
      :
      <MenuItem onClick={handleSignIn}>
        Sign in with Google
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
      <Avatar sx={{ width: 32, height: 32, bgcolor: (theme) => theme.vars.palette.primary.main }} >
        {signedIn ? <AccountCircleIcon/> : <LoginIcon/>}
      </Avatar>
      
    </MenuButton>
  </>
}