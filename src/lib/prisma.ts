import { PrismaClient as GeneratedPrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

type PrismaClient = GeneratedPrismaClient

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

// Create connection pool with timeout settings
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20, // maximum pool size
})

export const prisma =
  globalForPrisma.prisma ||
  new GeneratedPrismaClient({
    adapter: new PrismaPg(pool),
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
