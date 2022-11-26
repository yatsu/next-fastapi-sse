#!/bin/bash -aeu

# bash option `-a`: allexport

# Next.js loads `.env.local` and `.env` automatically without this script.
# The following lines are required to use `PORT` variable to launch the app.
[ -f .env.development ] && source .env.development
[ -f .env.local ] && source .env.local
[ -f .env ] && source .env

export NODE_ENV=development

if [ -n "${NODE_INSPECT:-}" ]; then
    # Currently Turbopack is still alpha and seems to be unstable.
    # concurrently -r -k "NODE_OPTIONS=\"--inspect=${NODE_INSPECT}\" next dev --turbo" "pnpm run tailwind -- --watch"
    concurrently -r -k "NODE_OPTIONS=\"--inspect=${NODE_INSPECT}\" next dev" \
        "npm run tailwind -- --watch"
else
    concurrently -r -k "next dev" "npm run tailwind -- --watch"
fi

# If you are connecting to the inspect port, SIGTERM does not kill the Node.js process.
# You have to kill it yourself.
