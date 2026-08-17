#!/bin/sh
set -e

echo "Running database migrations..."
node_modules/.bin/prisma migrate deploy

echo "Starting AI Security Lab..."
exec node server.js
