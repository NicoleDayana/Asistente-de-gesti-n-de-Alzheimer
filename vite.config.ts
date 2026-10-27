import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
// base relativo para que el sitio funcione en GitHub Pages aunque el
// repositorio se publique bajo /nombre-del-repositorio/.
export default defineConfig({
  base: "./",
  // Permite vistas previas detrás de proxies/hosts temporales (entornos de desarrollo).
  preview: { allowedHosts: true },
  server: { allowedHosts: true },
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
