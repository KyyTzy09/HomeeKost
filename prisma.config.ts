import { defineConfig } from 'prisma/config'
import 'dotenv/config'

const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.DIRECT_URL ||
  'postgresql://postgres:secret@localhost:5432/homeekost?schema=public'

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    path: './prisma/migrations',
    seed: 'bun prisma/seed.ts',
  },
  datasource: {
    url: databaseUrl,
  },
})
