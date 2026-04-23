#!/bin/bash
set -e

HOSTNAME=$1
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -z "$HOSTNAME" ]; then
  echo "Usage: sudo $0 <tailscale-hostname>"
  echo "Example: sudo $0 my-machine.my-tailnet.ts.net"
  echo ""
  echo "To find your hostname: tailscale status | head -1"
  exit 1
fi

echo "Renewing certificate for $HOSTNAME..."

tailscale cert \
  --cert-file "$SCRIPT_DIR/certs/server.crt" \
  --key-file "$SCRIPT_DIR/certs/server.key" \
  "$HOSTNAME"

echo "Restarting frontend..."
docker compose -f "$SCRIPT_DIR/docker-compose.yml" restart frontend

echo "Done."
