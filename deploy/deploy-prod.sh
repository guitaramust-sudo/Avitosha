#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
project_root=$(dirname "$script_dir")
env_file=${ENV_FILE:-"$project_root/.env.prod"}
compose_file="$project_root/compose.prod.yaml"

if [ ! -f "$env_file" ]; then
  cp "$project_root/.env.prod.example" "$env_file"
  chmod 600 "$env_file"
  echo "Created $env_file from .env.prod.example"
fi

"$script_dir/ensure-minio-env.sh" "$env_file"

missing=""
for key in POSTGRES_PASSWORD JWT_SIGNING_KEY CADDY_ACME_EMAIL; do
  environment_value=$(printenv "$key" 2>/dev/null || true)
  if [ -z "$environment_value" ] && ! grep -Eq "^${key}=.+$" "$env_file"; then
    missing="$missing $key"
  fi
done
if [ -n "$missing" ]; then
  echo "Fill required production values in $env_file:$missing" >&2
  exit 1
fi

compose() {
  docker compose --env-file "$env_file" -f "$compose_file" "$@"
}

compose config --quiet
if [ "${DRY_RUN:-0}" = "1" ]; then
  echo "Production configuration is valid; DRY_RUN enabled"
  exit 0
fi

compose up -d --build --remove-orphans
compose ps
