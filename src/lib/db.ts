import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: any };

let prismaInstance: any = null;

try {
  prismaInstance = globalForPrisma.prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
  
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaInstance;
  }
} catch (error) {
  console.warn('WARNING: Failed to instantiate PrismaClient. Database actions will fall back to mock data.');
}

export const prisma = prismaInstance;

/**
 * Executes database operations inside a transaction that injects session-level
 * metadata variables for Row-Level Security (RLS) and triggers actor logging.
 *
 * @param userId - The active user's UUID
 * @param role - The active user's RBAC role (e.g. 'HR_Exec', 'Timekeeper')
 * @param fn - Callback function containing Prisma mutations / reads
 */
export async function runInUserContext<T>(
  userId: string,
  role: string,
  fn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx: any) => {
    // Inject actor details into Postgres session context for auditing and RLS
    // UUIDs and standard roles are verified/sanitized before passing here
    await tx.$executeRawUnsafe(`SET LOCAL app.current_user_id = '${userId}'`);
    await tx.$executeRawUnsafe(`SET LOCAL app.current_role = '${role}'`);
    
    // Execute business logic with the transaction client
    return fn(tx as any);
  });
}
