/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Render (or other) backend API root, e.g. https://your-app.onrender.com/api */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
