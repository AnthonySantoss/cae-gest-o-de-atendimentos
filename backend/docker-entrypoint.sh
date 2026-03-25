#!/bin/sh
set -e

echo "[ENTRYPOINT] Iniciando setup do banco..."
npx tsx src/db/setup.ts

echo "[ENTRYPOINT] Iniciando servidor..."
exec npx tsx src/server.ts
