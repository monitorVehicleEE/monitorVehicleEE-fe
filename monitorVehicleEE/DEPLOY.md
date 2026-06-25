# Frontend deploy

This is a Vite React frontend. Environment variables are baked into the static build, so set them before building the image.

## Local Docker

```powershell
$env:VITE_API_URL="http://localhost:8000"
$env:VITE_WS_URL="ws://localhost:8000"
docker compose up -d --build
```

Open:

```text
http://localhost
```

## Deploy with a domain

Recommended domain layout:

```text
https://your-domain.com        -> frontend
https://api.your-domain.com    -> backend API and WebSocket
```

Build with public backend URLs:

```powershell
$env:VITE_API_URL="https://api.your-domain.com"
$env:VITE_WS_URL="wss://api.your-domain.com"
docker compose up -d --build
```

Then point DNS:

```text
A record: your-domain.com      -> server public IP
A record: api.your-domain.com  -> server public IP
```

Use a reverse proxy such as Nginx Proxy Manager, Caddy, Traefik, or host Nginx to terminate HTTPS certificates and route traffic.

If backend and frontend are on the same server, expose backend on an internal port such as `8000`, then route `api.your-domain.com` to `http://127.0.0.1:8000`.
