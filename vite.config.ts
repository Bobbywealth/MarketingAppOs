import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1200,
    /**
     * NOTE:
     * We intentionally avoid custom `manualChunks` splitting here.
     *
     * Custom chunk splitting can introduce circular dependencies *between chunks*
     * (even if there are no circular imports in source), which can surface in
     * production as TDZ runtime errors like:
     *   "Cannot access 'ae' before initialization"
     *
     * Let Vite/Rollup handle chunking to ensure stable evaluation order.
     */
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
