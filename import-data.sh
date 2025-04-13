#!/bin/bash
set -e
echo "Running database migrations..."
docker-compose exec -T app npx prisma migrate deploy

echo "Seeding the database..."
# This now runs "node prisma/seed.js" via npm
docker-compose exec -T app npm run prisma:seed

echo "Data import process finished."