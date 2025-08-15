import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
    base: "./",
    plugins: [react()],
    server: {
        host: "0.0.0.0",
        headers: {
            'Content-Security-Policy': "frame-ancestors 'self' https://*.larkoffice.com https://*.larksuite.com https://*.feishu.cn;",
        }
    },
    build: {
        rollupOptions: {
            external: ["#minpath", "#minproc", "#minurl"],
        },
    },
});
