import { execSync } from "node:child_process";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// Detectar automáticamente la rama actual de Git para mostrar el indicador en desarrollo/pruebas
let gitBranch = "main";
try {
  gitBranch = execSync("git rev-parse --abbrev-ref HEAD", {
    encoding: "utf-8",
  }).trim();
} catch {
  gitBranch = "main";
}

// https://vite.dev/config/
export default defineConfig({
  base: "/haravitalis/",
  define: {
    __GIT_BRANCH__: JSON.stringify(gitBranch),
  },
  plugins: [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
  },
});
