#!/bin/bash

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Front-End (React / Vite)
gnome-terminal --title="React Frontend" -- bash -c "cd '$ROOT_DIR/frontend' && npm run dev; exec bash"

# Back-End (Express.js / Node.js)
gnome-terminal --title="Express.js Backend" -- bash -c "cd '$ROOT_DIR/backend' && npx nodemon index.js; exec bash"

# Useful Commands:
# npx prisma db push
# npx prisma studio