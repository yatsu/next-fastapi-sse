#!/bin/bash -aeu

# bash option `-a`: allexport

[ -f .env.development ] && source .env.development
[ -f .env.local ] && source .env.local
[ -f .env ] && source .env

(
    cd backend && source ./.venv/bin/activate && \
    python -m backend.worker
)
