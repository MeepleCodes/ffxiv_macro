// vite.config.ts
import { defineConfig } from "file:///workspaces/ffxiv_macro/.yarn/__virtual__/vite-virtual-d6c1fdb0f2/3/home/node/.yarn/berry/cache/vite-npm-5.3.5-3cbb728ee4-10c0.zip/node_modules/vite/dist/node/index.js";
import react from "file:///workspaces/ffxiv_macro/.yarn/__virtual__/@vitejs-plugin-react-swc-virtual-84d671f047/3/home/node/.yarn/berry/cache/@vitejs-plugin-react-swc-npm-3.7.0-912ad09852-10c0.zip/node_modules/@vitejs/plugin-react-swc/index.mjs";
import { TanStackRouterVite } from "file:///workspaces/ffxiv_macro/.yarn/__virtual__/@tanstack-router-plugin-virtual-8a5cde1d17/3/home/node/.yarn/berry/cache/@tanstack-router-plugin-npm-1.45.13-7dbe55f8b5-10c0.zip/node_modules/@tanstack/router-plugin/dist/esm/vite.js";
var vite_config_default = defineConfig({
  base: "/ffxiv_macro/",
  plugins: [
    TanStackRouterVite(),
    react({ tsDecorators: true })
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
  server: {
    port: 5175
  },
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
  },
  test: {
    dir: "src"
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvd29ya3NwYWNlcy9mZnhpdl9tYWNyb1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL3dvcmtzcGFjZXMvZmZ4aXZfbWFjcm8vdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL3dvcmtzcGFjZXMvZmZ4aXZfbWFjcm8vdml0ZS5jb25maWcudHNcIjsvLy8gPHJlZmVyZW5jZSB0eXBlcz1cInZpdGVzdFwiIC8+XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIlxuaW1wb3J0IHsgVGFuU3RhY2tSb3V0ZXJWaXRlIH0gZnJvbSAnQHRhbnN0YWNrL3JvdXRlci1wbHVnaW4vdml0ZSdcbi8vIGltcG9ydCBzd2MgZnJvbSBcInVucGx1Z2luLXN3Y1wiO1xuLy8gaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgYmFzZTogXCIvZmZ4aXZfbWFjcm8vXCIsXG4gIHBsdWdpbnM6IFtcbiAgICBUYW5TdGFja1JvdXRlclZpdGUoKSxcbiAgICByZWFjdCh7dHNEZWNvcmF0b3JzOiB0cnVlfSksXG4gICAgLy8gc3djLnZpdGUoe1xuICAgIC8vICAgdHNjb25maWdGaWxlOiAnLi90c2NvbmZpZy5hcHAuanNvbicsXG4gICAgLy8gICBqc2M6IHtcbiAgICAvLyAgICAgcGFyc2VyOiB7XG4gICAgLy8gICAgICAgZGVjb3JhdG9yczogdHJ1ZSxcbiAgICAvLyAgICAgICBzeW50YXg6ICd0eXBlc2NyaXB0JyxcblxuICAgIC8vICAgICB9XG4gICAgLy8gICB9LFxuICAgIC8vIH0pXG4gIF0sXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDUxNzVcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAvLyBwcmVzZXJ2ZUVudHJ5U2lnbmF0dXJlczogXCJzdHJpY3RcIixcbiAgICAgIG91dHB1dDoge1xuICAgICAgICAvLyBwcmVzZXJ2ZU1vZHVsZXM6IHRydWVcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgXCJAbXVpLWljb25zXCI6IFtcIkBtdWkvaWNvbnMtbWF0ZXJpYWxcIl0sXG4gICAgICAgICAgXCJAbXVpLW1hdGVyaWFsXCI6IFtcIkBtdWkvbWF0ZXJpYWxcIl0sXG4gICAgICAgICAgXCJtZGktbWF0ZXJpYWwtdWlcIjogW1wibWRpLW1hdGVyaWFsLXVpXCJdXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHRlc3Q6IHtcbiAgICBkaXI6IFwic3JjXCJcbiAgfVxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFDQSxTQUFTLG9CQUFvQjtBQUM3QixPQUFPLFdBQVc7QUFDbEIsU0FBUywwQkFBMEI7QUFLbkMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsTUFBTTtBQUFBLEVBQ04sU0FBUztBQUFBLElBQ1AsbUJBQW1CO0FBQUEsSUFDbkIsTUFBTSxFQUFDLGNBQWMsS0FBSSxDQUFDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFXNUI7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxFQUNSO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxlQUFlO0FBQUE7QUFBQSxNQUViLFFBQVE7QUFBQTtBQUFBLFFBRU4sY0FBYztBQUFBLFVBQ1osY0FBYyxDQUFDLHFCQUFxQjtBQUFBLFVBQ3BDLGlCQUFpQixDQUFDLGVBQWU7QUFBQSxVQUNqQyxtQkFBbUIsQ0FBQyxpQkFBaUI7QUFBQSxRQUN2QztBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsTUFBTTtBQUFBLElBQ0osS0FBSztBQUFBLEVBQ1A7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
