import { CssBaseline } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles';
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

import { appTheme } from '../Theme';

export const Route = createRootRoute({
  component: () => (
    <>
    
      <ThemeProvider theme={appTheme}>
			  <CssBaseline/>
				<div id="bg"/>
        <Outlet />
        {/* <TanStackRouterDevtools /> */}
      </ThemeProvider>
    </>
  )
})
