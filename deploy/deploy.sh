#!/usr/bin/env bash
set -euo pipefail
# deploy.sh
# Usage:
#   cp deploy/deploy.env.template deploy/deploy.env
#   edit deploy/deploy.env
#   ./deploy/deploy.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/deploy.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE. Copy deploy.env.template and fill it." 
  exit 1
fi
# shellcheck disable=SC1090
source "$ENV_FILE"

if [[ -z "${SSH_HOST:-}" || -z "${SSH_USER:-}" || -z "${REMOTE_DIR:-}" ]]; then
  echo "Please set SSH_HOST, SSH_USER and REMOTE_DIR in $ENV_FILE"
  exit 1
fi

SSH_TARGET="${SSH_USER}@${SSH_HOST}"
LOCAL_PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SERVICE_NAME="${SERVICE_NAME:-vet-clinic}"

retry() {
  local tries=${1:-5}; shift
  local count=0
  until "$@"; do
    exit_code=$?
    count=$((count+1))
    if [ $count -ge $tries ]; then
      echo "Command failed after $count attempts."
      return $exit_code
    fi
    echo "Command failed — retrying ($count/$tries) in 5s..."
    sleep 5
  done
}

echo "-> Packaging project and uploading to $SSH_TARGET:$REMOTE_DIR"

if [[ -n "${SSH_KEY_PATH:-}" && -f "${SSH_KEY_PATH}" ]]; then
  TAR_CMD="tar -C \"$LOCAL_PROJECT_ROOT\" -cz ."
  SSH_CMD="ssh -i \"$SSH_KEY_PATH\" -o StrictHostKeyChecking=no $SSH_TARGET"
  echo "Using tar+ssh with SSH key"
  retry 3 bash -c "$TAR_CMD | $SSH_CMD 'mkdir -p \"$REMOTE_DIR\" && tar -xz -C \"$REMOTE_DIR\"'"
else
  if command -v sshpass >/dev/null 2>&1 && [[ -n "${SSH_PASS:-}" ]]; then
    echo "Using sshpass + scp fallback (password provided)."
    retry 3 bash -c "sshpass -p \"$SSH_PASS\" scp -o StrictHostKeyChecking=no -r \"$LOCAL_PROJECT_ROOT\"/* \"$SSH_TARGET\":\"$REMOTE_DIR\""
  else
    echo "No SSH_KEY_PATH found and sshpass not available or SSH_PASS empty. Trying plain scp (will prompt for password)."
    retry 3 bash -c "scp -o StrictHostKeyChecking=no -r \"$LOCAL_PROJECT_ROOT\"/* \"$SSH_TARGET\":\"$REMOTE_DIR\""
  fi
fi

echo "-> Upload complete. Running remote setup."

# Copy deploy.env to remote (for systemd EnvironmentFile)
if [[ -n "${SSH_KEY_PATH:-}" && -f "${SSH_KEY_PATH}" ]]; then
  retry 3 ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$SSH_TARGET" "mkdir -p '$REMOTE_DIR' && cat > '$REMOTE_DIR/deploy.env' <<'EOF'
$(sed 's/\/\\/g; s/'"'"'/'"'"'\\'"'"'/g' "$ENV_FILE")
EOF"
else
  if [[ -n "${SSH_PASS:-}" ]]; then
    retry 3 bash -c "sshpass -p \"$SSH_PASS\" ssh -o StrictHostKeyChecking=no $SSH_TARGET 'mkdir -p \"$REMOTE_DIR\" && cat > \"$REMOTE_DIR/deploy.env\"' <<'EOF'
$(sed 's/\\/\\\\/g; s/'"'"'/'"'"'\\'"'"'/g' "$ENV_FILE")
EOF"
  else
    echo "No method to copy deploy.env non-interactively; attempting interactive ssh."
    ssh "$SSH_TARGET" "mkdir -p '$REMOTE_DIR'"
    scp -r "$ENV_FILE" "$SSH_TARGET":"$REMOTE_DIR"/deploy.env
  fi
fi

# Remote commands: install node (if needed), npm install, build, create systemd unit, enable/start
REMOTE_CMDS=$(cat <<'REMOTE'
set -e
cd "$REMOTE_DIR"
echo "Installing npm deps..."
if [ -f package-lock.json ]; then
  npm ci --production
else
  npm install --production
fi

if npm run | grep -q " build"; then
  echo "Running build"
  npm run build || true
fi

SERVICE_PATH="/etc/systemd/system/${SERVICE_NAME}.service"
cat > /tmp/${SERVICE_NAME}.service <<'SERVICE_EOF'
[Unit]
Description=Vet Clinic App - ${SERVICE_NAME}
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=${REMOTE_DIR}
EnvironmentFile=${REMOTE_DIR}/deploy.env
ExecStart=/bin/bash -lc "cd ${REMOTE_DIR} && npm run ${NPM_COMMAND}"
Restart=on-failure
RestartSec=5
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
SERVICE_EOF

sudo mv /tmp/${SERVICE_NAME}.service "${SERVICE_PATH}"
sudo systemctl daemon-reload
sudo systemctl enable "${SERVICE_NAME}.service"
sudo systemctl restart "${SERVICE_NAME}.service"
sudo journalctl -u "${SERVICE_NAME}.service" --no-pager -n 200 || true
REMOTE
)

REMOTE_CMDS="${REMOTE_CMDS//\$\{REMOTE_DIR\}/$REMOTE_DIR}"
REMOTE_CMDS="${REMOTE_CMDS//\$\{SERVICE_NAME\}/$SERVICE_NAME}"
REMOTE_CMDS="${REMOTE_CMDS//\$\{NPM_COMMAND\}/$NPM_COMMAND}"

if [[ -n "${SSH_KEY_PATH:-}" && -f "${SSH_KEY_PATH}" ]]; then
  retry 3 ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$SSH_TARGET" "$REMOTE_CMDS"
else
  if [[ -n "${SSH_PASS:-}" ]]; then
    retry 3 bash -c "sshpass -p \"$SSH_PASS\" ssh -o StrictHostKeyChecking=no $SSH_TARGET \"$REMOTE_CMDS\""
  else
    ssh "$SSH_TARGET" "$REMOTE_CMDS"
  fi
fi

echo "-> Deployment finished. Check service status: ssh $SSH_TARGET 'sudo systemctl status ${SERVICE_NAME}.service --no-pager'"
