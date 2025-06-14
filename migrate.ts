// migrate.ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import * as schema from './src/db/schema';

const sqlite = new Database('sqlite.db');
const db = drizzle(sqlite, { schema });

// 📌 Sadece ilk çalıştırmada migration yapar
migrate(db, {
  migrationsFolder: './drizzle/migrations',
});
