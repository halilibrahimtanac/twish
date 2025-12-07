import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "./schema"
import postgres from 'postgres';

const postgresDb = postgres(process.env.NEXT_PUBLIC_DATABASE_URL!)
const db = drizzle({ client: postgresDb, schema });

export default db;