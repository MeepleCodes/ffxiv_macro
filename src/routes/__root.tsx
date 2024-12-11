import { Box, CssBaseline } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles';
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { ConfirmProvider } from "material-ui-confirm";
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

import { appTheme } from '../Theme';
import Rail from './-Rail';

export const Route = createRootRoute({
  component: () => (
    <>
    
      <ThemeProvider theme={appTheme}>
        <ConfirmProvider>
          <CssBaseline/>
          <div id="bg"/>
          <Box
            sx={{
              display: "flex",
              width: "100vw",
              height: "100vh",
              maxHeight: "100vh",
              flexDirection: "row",
              alignItems: "stretch",
              overflow: "hidden"
              // gridTemplateRows: "minmax(56px, min-content) 1fr",
              // gridTemplateColumns: `min-content  1fr`,
              // gridTemplateAreas: `"rail drawer toolbar"
              //                     "rail drawer main   "`
            }}
          >
            <Rail/>
            <Box
              sx={{
                flex: 1,
                alignSelf: "stretch"
              }}
            >
              <Outlet />
            </Box>
          </Box>
          {/* <TanStackRouterDevtools /> */}
        </ConfirmProvider>
      </ThemeProvider>
    </>
  )
})
