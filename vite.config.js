import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    appType: "spa", // Ensures Vite serves index.html for all client-side navigation routes
    server: {
        host: true,
        port: 3000,
        historyApiFallback: true, // Rewrites unknown routes back to index.html
        watch: {
            usePolling: true,
        },
    },
});