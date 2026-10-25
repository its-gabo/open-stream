# Reverse Proxy

Serves the local apps on HTTPS custom domains with [Caddy](https://caddyserver.com/docs/install#homebrew-mac):

| URL                                  | Target                                     |
| ------------------------------------ | ------------------------------------------ |
| https://app.openstream.localhost     | Web app (`/api/*` is forwarded to the API) |
| https://mailbox.openstream.localhost | Mailpit                                    |

Install Caddy (`brew install caddy`) and run `caddy trust` once to add its local certificate authority to your system. From then on it starts automatically with `bun run dev`.

Only one Caddy instance can listen on port 443, so stop other projects' reverse proxies first.
