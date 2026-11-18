import { defineConfig } from "astro/config"

export default defineConfig({
  // The public URL the site is deployed to, used for absolute links such as og:image
  site: process.env.SITE_URL ?? "https://landing.openstream.localhost",
  server: { port: 3002 },
  vite: {
    server: {
      // Served through Caddy in development
      allowedHosts: ["landing.openstream.localhost"],
    },
  },
})
