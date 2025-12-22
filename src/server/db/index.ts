import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// For migrations
console.log(process.env.DATABASE_URL);
export const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1 });
// For queries
const queryClient = postgres(process.env.DATABASE_URL!);
export const db = drizzle(queryClient, { schema });

console.log('Database connection established');