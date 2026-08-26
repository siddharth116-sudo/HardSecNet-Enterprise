# Production Deployment Guide (Cloud)

Deploys the full HardSecNet stack on any Linux server (AWS EC2, Hetzner,
Oracle Cloud, ...) with **automatic free HTTPS** — no manual certificates.

```
internet ──> Caddy (80/443, auto Let's Encrypt) ──> nginx (dashboard + /api proxy) ──> Flask backend ──> MongoDB / Redis
```

Only Caddy is exposed to the internet. The backend, MongoDB, and Redis live
on a private Docker network and cannot be reached from outside.

## Prerequisites
- A Linux server (2 GB RAM recommended) with ports **80** and **443** open.
- A domain name pointing at the server's public IP (a free
  [DuckDNS](https://www.duckdns.org) subdomain works fine).
- Docker: `curl -fsSL https://get.docker.com | sudo sh`

## 1. Get the code
```bash
git clone https://github.com/siddharth116-sudo/HardSecNet-Enterprise.git
cd HardSecNet-Enterprise/deployment
```

## 2. Configure
```bash
cp .env.example .env
nano .env
```
Fill in every value. Generate the random secrets with:
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
```
Key settings:
- `DOMAIN` — your domain (e.g. `hardsecnet.duckdns.org`). Caddy fetches the
  HTTPS certificate for it automatically.
- `BOOTSTRAP_ADMIN_PASSWORD` — first-boot password for the `admin` user.
- `AGENT_API_KEY` — **always set this on a public server**; every agent must
  present it, otherwise anyone could submit fake reports.

## 3. Build and run
```bash
docker compose up -d --build
```
First build takes a few minutes. Check status / logs:
```bash
docker compose ps
docker compose logs -f
```

## 4. Validate
- Open `https://<your-domain>` — the dashboard loads with a valid padlock.
- Log in as `admin` with your `BOOTSTRAP_ADMIN_PASSWORD`, then change it.
- Create a client in the **Clients** view and enroll a host from anywhere:
  ```bash
  python hardsecnet_agent.py --server https://<your-domain> \
      --key <AGENT_API_KEY> --workspace-token <token-from-Clients-view> --once
  ```

## Maintenance
- **Update**: `git pull`, then `docker compose up -d --build`
- **Backup**: back up the `mongo_data` volume regularly
  (`docker run --rm -v deployment_mongo_data:/data -v $(pwd):/backup alpine tar czf /backup/mongo-backup.tar.gz /data`).
- **Full teardown** (e.g. before your cloud trial ends):
  `docker compose down -v` then terminate the server.

## Local / offline variant
For an air-gapped or LAN deployment without a public domain, Caddy cannot get
a Let's Encrypt certificate. Use the self-signed PKI instead: run
`python pki_setup.py`, mount `../certs` into the frontend, and switch the
frontend volume back to `nginx/nginx.conf` (the TLS-enabled config kept for
this purpose).
