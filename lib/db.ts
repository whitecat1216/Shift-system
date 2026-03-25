import "server-only";

import { Pool } from "pg";

declare global {
  var __hotelShiftPool: Pool | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }

  return new Pool({
    connectionString,
  });
}

export function getPool() {
  globalThis.__hotelShiftPool ??= createPool();
  return globalThis.__hotelShiftPool;
}
