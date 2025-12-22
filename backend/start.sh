#!/usr/bin/env bash

export CORS_ALLOW_ORIGIN="http://localhost:5173"

PORT="${PORT:-8000}"
uvicorn app.main:app --env-file .env --port $PORT --host 0.0.0.0 --forwarded-allow-ips '*' --reload
