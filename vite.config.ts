import { defineConfig } from 'vite'
import react from "@vitejs/plugin-react-swc"
// import swc from "unplugin-swc";
// import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: "/ffxiv_macro/",
  plugins: [
    react({tsDecorators: true}),
    // swc.vite({
    //   tsconfigFile: './tsconfig.app.json',
    //   jsc: {
    //     parser: {
    //       decorators: true,
    //       syntax: 'typescript',

    //     }
    //   },
    // })
  ],
  build: {
    rollupOptions: {
      // preserveEntrySignatures: "strict",
      output: {
        // preserveModules: true
        manualChunks: {
          "@mui-icons": ["@mui/icons-material"],
          "@mui-material": ["@mui/material"],
          "mdi-material-ui": ["mdi-material-ui"]
        }
      }
    }
  }
})
