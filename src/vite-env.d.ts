/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGE_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;

  readonly VITE_FFLOGS_PUBLIC_API: string;
  readonly VITE_FFLOGS_OAUTH_URL: string;
  readonly VITE_FFLOGS_TOKEN_PATH: string;
  readonly VITE_FFLOGS_AUTH_PATH: string;
  readonly VITE_FFLOGS_CLIENT_ID: string;
  readonly VITE_FFLOGS_CLIENT_SECRET: string;
  readonly VITE_FFLOGS_V1_API: string;
  readonly VITE_FFLOGS_V1_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}