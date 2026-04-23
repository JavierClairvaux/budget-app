# Family Budget App

A self-hosted expense tracker for families. Built with FastAPI, SQLite, and React. Designed to run on your home server and be accessed privately over Tailscale.

## Features

- Track income and expenses by category
- Family-wide shared budgets with monthly auto-copy
- Per-member transaction history
- Dashboard with spending charts (by category and by member)
- Dark mode
- HTTP and HTTPS support
- Admin role for managing categories and budgets

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI + SQLite (SQLAlchemy) |
| Frontend | React + Vite + Tailwind CSS |
| Auth | JWT (python-jose + passlib) |
| Serving | nginx (reverse proxy) |
| Deployment | Docker Compose |
| Networking | Tailscale |

## Project Structure

```
budget-app/
├── backend/
│   └── app/
│       ├── models/       # SQLAlchemy models
│       ├── routers/      # API endpoints
│       ├── schemas/      # Pydantic schemas
│       ├── auth.py       # JWT auth
│       ├── database.py   # DB connection
│       └── main.py       # FastAPI app
├── frontend/
│   └── src/
│       ├── api/          # Axios client
│       ├── context/      # Auth + theme context
│       ├── components/   # Layout, sidebar
│       └── pages/        # Dashboard, Transactions, Budgets, Categories
├── certs/                # TLS certificates (not committed)
├── data/                 # SQLite database (not committed)
└── docker-compose.yml
```

## Setup

### 1. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set a secure random `SECRET_KEY`:

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### 2. Build and run

```bash
docker compose up --build -d
```

The app runs at:
- `http://localhost:3000` — frontend
- `http://localhost:8000/docs` — API explorer (FastAPI)

### 3. Create your account

The first registered account is automatically made admin.

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Your Name", "email": "you@example.com", "password": "yourpassword"}'
```

Or use the interactive API docs at `http://localhost:8000/docs`.

Family members can register themselves the same way, or you can register them via curl.

## Tailscale Setup

1. Install Tailscale on your server and each family member's device
2. Invite family members to your tailnet (free plan supports up to 3 users)
3. Access the app at `http://your-machine-name.your-tailnet.ts.net:3000`

## HTTPS Setup

HTTPS is optional. If no certs are found the app runs HTTP only. If certs are present in `./certs/`, nginx automatically enables HTTPS on port 3443.

### Using Tailscale certificates (recommended)

Tailscale provides free valid HTTPS certificates for your tailnet hostname:

```bash
sudo tailscale cert \
  --cert-file ./certs/server.crt \
  --key-file ./certs/server.key \
  your-machine-name.your-tailnet.ts.net

docker compose restart frontend
```

### Using self-signed certificates (testing only)

```bash
openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
  -keyout ./certs/server.key \
  -out ./certs/server.crt \
  -subj "/CN=localhost"

docker compose restart frontend
```

> **Note:** Keep `certs/` out of version control. Add `certs/*.key` and `certs/*.crt` to `.gitignore`.

### Certificate renewal

Tailscale certificates expire every 90 days. Use the included script to renew:

```bash
sudo ./renew-cert.sh your-machine-name.your-tailnet.ts.net
```

#### Reminder via cron (dunst)

Add this to your user crontab (`crontab -e`) to get a desktop notification every two months as a reminder to renew:

```
0 9 1 */2 * DISPLAY=:0 DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$(id -u)/bus dunstify -u normal "SSL Certificate Renewal" "Tailscale cert expires soon. Run: sudo /path/to/budget-app/renew-cert.sh your-machine.your-tailnet.ts.net"
```

> Replace `/path/to/budget-app` and the hostname with your actual values. Dunst must be running for the notification to appear.

## Database

The SQLite database is stored at `./data/budget.db` on the host — it persists across container rebuilds and restarts.

### Backup

```bash
cp ./data/budget.db ./data/budget_$(date +%Y%m%d).db
```

### Restore

```bash
docker compose down
cp your_backup.db ./data/budget.db
docker compose up -d
```

## Admin vs Member

| Action | Admin | Member |
|---|---|---|
| Add transactions | Yes | Yes |
| Delete own transactions | Yes | Yes |
| Delete others' transactions | Yes | No |
| Manage categories | Yes | No |
| Manage budgets | Yes | No |

## Useful Commands

```bash
# Start
docker compose up -d

# Stop
docker compose down

# View logs
docker compose logs -f

# Rebuild after code changes
docker compose up --build -d

# Restart frontend only (e.g. after cert renewal)
docker compose restart frontend
```
