#!/bin/sh
set -eu

env_file=${1:-.env.prod}

if [ ! -f "$env_file" ]; then
  echo "Production env file not found: $env_file" >&2
  exit 1
fi
chmod 600 "$env_file"
temporary_file=""
trap 'if [ -n "$temporary_file" ]; then rm -f "$temporary_file"; fi' EXIT HUP INT TERM

set_if_empty() {
  key=$1
  value=$2

  if grep -Eq "^${key}=.+$" "$env_file"; then
    return
  fi

  temporary_file=$(mktemp "${env_file}.XXXXXX")
  awk -v key="$key" -v value="$value" '
    BEGIN { replaced = 0 }
    $0 ~ ("^" key "=") {
      if (!replaced) {
        print key "=" value
        replaced = 1
      }
      next
    }
    { print }
    END {
      if (!replaced) print key "=" value
    }
  ' "$env_file" > "$temporary_file"
  chmod 600 "$temporary_file"
  mv "$temporary_file" "$env_file"
  temporary_file=""
  echo "Generated $key in $env_file"
}

random_hex() {
  bytes=$1
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex "$bytes"
    return
  fi
  if command -v od >/dev/null 2>&1 && command -v tr >/dev/null 2>&1; then
    od -An -N "$bytes" -tx1 /dev/urandom | tr -d ' \n'
    return
  fi
  echo "openssl or od with /dev/urandom is required to generate MinIO credentials" >&2
  exit 1
}

set_if_empty MINIO_ROOT_USER "minio-root-$(random_hex 16)"
set_if_empty MINIO_ROOT_PASSWORD "$(random_hex 32)"
set_if_empty MINIO_APP_ACCESS_KEY "avitosha-app-$(random_hex 16)"
set_if_empty MINIO_APP_SECRET_KEY "$(random_hex 32)"
