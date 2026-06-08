import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://admin:changeme@localhost:5435/trace_compliance_master' });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function clear() {
  console.log('Clearing all tables in dependency order...');
  await prisma.auditLog.deleteMany({});
  console.log('  ✓ auditLog');
  await prisma.consentLog.deleteMany({});
  console.log('  ✓ consentLog');
  await prisma.employeeDocument.deleteMany({});
  console.log('  ✓ employeeDocument');
  await prisma.leaveBalance.deleteMany({});
  console.log('  ✓ leaveBalance');
  await prisma.userPermissionOverride.deleteMany({});
  console.log('  ✓ userPermissionOverride');
  await prisma.userRoleAssignment.deleteMany({});
  console.log('  ✓ userRoleAssignment');
  await prisma.roleModulePermission.deleteMany({});
  console.log('  ✓ roleModulePermission');
  await prisma.permission.deleteMany({});
  console.log('  ✓ permission');
  await prisma.user.deleteMany({});
  console.log('  ✓ user');
  await prisma.employee.deleteMany({});
  console.log('  ✓ employee');
  await prisma.person.deleteMany({});
  console.log('  ✓ person');
  await prisma.department.deleteMany({});
  console.log('  ✓ department');
  await prisma.branch.deleteMany({});
  console.log('  ✓ branch');
  await prisma.tenantModule.deleteMany({});
  console.log('  ✓ tenantModule');
  await prisma.tenantLicense.deleteMany({});
  console.log('  ✓ tenantLicense');
  await prisma.systemModule.deleteMany({});
  console.log('  ✓ systemModule');
  await prisma.role.deleteMany({});
  console.log('  ✓ role');
  await prisma.tenant.deleteMany({});
  console.log('  ✓ tenant');
  console.log('\n✅ Database is now empty. Schema intact.');
}

clear()
  .catch((e) => { console.error('Error:', e); process.exit(1); })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
