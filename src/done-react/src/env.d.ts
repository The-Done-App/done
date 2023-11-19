/** =========================================================================================
 * Filename: env.d.ts
 *
 * Description: This file contains the type definitions for the environment variables
 * 
 * Reference: https://vitejs.dev/guide/env-and-mode.html#intellisense-for-typescript
 * 
 ========================================================================================= */

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FRONTEND_URL: string;
  readonly VITE_NODE_ENV: string;
  readonly VITE_USER_POOL_ID: string;
  readonly VITE_APP_CLIENT_ID: string;
  readonly VITE_COGNITO_DOMAIN: string;
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
