# Landing

The OpenStream marketing site, a static [Astro](https://astro.build) site with [GSAP](https://gsap.com) and [Lenis](https://lenis.darkroom.engineering) animations. It does not depend on the API or the shared packages.

## Development

It is not started by `bun run dev`. From the repository root:

```bash
bun run dev:landing
```

This starts the site on port 3002 and Caddy, and serves it on https://landing.openstream.localhost. If `bun run dev` is already running, Caddy is already up, so start only the site with `bun run --cwd apps/landing dev`.

## Deployment

The build is plain static files, so any static host works (Cloudflare Pages, Netlify, Vercel, GitHub Pages, an S3 bucket behind a CDN).

| Setting          | Value                            |
| ---------------- | -------------------------------- |
| Root directory   | repository root (Bun workspace)  |
| Install command  | `bun install`                    |
| Build command    | `bun run build --filter=landing` |
| Output directory | `apps/landing/dist`              |

| Variable         | Purpose                                               | Default                                |
| ---------------- | ----------------------------------------------------- | -------------------------------------- |
| `SITE_URL`       | Public URL of the site, for absolute links (og:image) | `https://landing.openstream.localhost` |
| `PUBLIC_APP_URL` | Where the "Open app" links point                      | `https://app.openstream.localhost`     |

## Credits

The hero clip is from [Big Buck Bunny](https://peach.blender.org), © Blender Foundation, licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).
