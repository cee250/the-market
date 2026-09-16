#!/usr/bin/env bash
set -euo pipefail
commit='7421600'
for attempt in $(seq 1 36); do
  json=$(curl -fsS 'https://api.netlify.com/api/v1/sites/market-rw.netlify.app/deploys')
  state=$(printf '%s' "$json" | jq -r --arg c "$commit" 'map(select((.commit_ref // "") | startswith($c))) | .[0].state // "missing"')
  echo "attempt=$attempt commit=$commit state=$state"
  case "$state" in
    ready)
      for path in api/health/live api/categories api/auth/me; do
        echo "--- /$path"
        curl -sS -i --max-time 15 "https://market-rw.netlify.app/$path" | sed -n '1,14p'
      done
      exit 0
      ;;
    error|failed)
      exit 1
      ;;
  esac
  sleep 5
done
exit 2
