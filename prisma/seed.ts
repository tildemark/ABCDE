/**
 * Minimal Seed
 * ─────────────────────────────────────────────────────────────
 * Seeds ONLY the system-level records the app needs to function.
 * Everything else (branches, departments, roles, users, employees)
 * is left empty and should be added through the UI.
 *
 * What gets seeded:
 *   1. SystemModule   — the 4 module codes the RBAC engine references
 *   2. Tenant         — one company record (edit via Core Setup → Company)
 *   3. TenantLicense  — enables all modules (edit via Core Setup → Licensing)
 *   4. TenantModule   — activates all 4 modules for the tenant
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
    || 'postgresql://admin:changeme@localhost:5435/trace_compliance_master',
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// ── Fixed IDs so re-running the seed is idempotent ───────────────────────────
const TENANT_ID = 'de305d54-75b4-431b-adb2-eb6b9e546014';

const SYSTEM_MODULES = [
  { id: 'a1111111-1111-1111-1111-111111111111', code: 'CORE',            name: 'Core Suite',               category: 'system', description: 'Tenant settings, users and roles'            },
  { id: 'a2222222-2222-2222-2222-222222222222', code: 'HUMAN_RESOURCES', name: 'Human Resources',           category: 'hris',   description: 'Employee lifecycle and department tracking'  },
  { id: 'a3333333-3333-3333-3333-333333333333', code: 'TIMEKEEPING',     name: 'Timekeeping & Attendance',  category: 'hris',   description: 'Biometric integration and leave management'  },
  { id: 'a4444444-4444-4444-4444-444444444444', code: 'PAYROLL',         name: 'Payroll Processing',        category: 'hris',   description: 'Salary runs and payroll registers'           },
];

async function main() {
  // ── 1. System Modules ─────────────────────────────────────────────────────
  console.log('⚙️  Seeding System Modules...');
  for (const sm of SYSTEM_MODULES) {
    await prisma.systemModule.upsert({
      where: { id: sm.id },
      create: sm,
      update: { name: sm.name, description: sm.description },
    });
    console.log(`   ✓ ${sm.code}`);
  }

  // ── 2. Tenant ─────────────────────────────────────────────────────────────
  console.log('🏢 Seeding Tenant...');
  await prisma.tenant.upsert({
    where: { id: TENANT_ID },
    create: {
      id:            TENANT_ID,
      corporateName: 'My Company',   // ← edit in Core Setup → Company
      companyType:   'OPERATING',
    },
    update: {},   // don't overwrite if already edited via the UI
  });
  console.log('   ✓ Tenant');

  // ── 3. Tenant License ─────────────────────────────────────────────────────
  console.log('📄 Seeding Tenant License...');
  const existingLicense = await prisma.tenantLicense.findFirst({
    where: { tenantId: TENANT_ID },
  });
  if (!existingLicense) {
    await prisma.tenantLicense.create({
      data: {
        tenantId:      TENANT_ID,
        hasHris:       true,
        hasTimekeeping:true,
        hasPayroll:    true,
        maxEmployees:  500,
      },
    });
    console.log('   ✓ TenantLicense (all modules enabled)');
  } else {
    console.log('   – TenantLicense already exists, skipped');
  }

  // ── 4. Tenant Modules ─────────────────────────────────────────────────────
  console.log('🔌 Activating Tenant Modules...');
  for (const sm of SYSTEM_MODULES) {
    const exists = await prisma.tenantModule.findFirst({
      where: { tenantId: TENANT_ID, moduleCode: sm.code },
    });
    if (!exists) {
      await prisma.tenantModule.create({
        data: { tenantId: TENANT_ID, moduleCode: sm.code, isActive: true },
      });
      console.log(`   ✓ ${sm.code}`);
    } else {
      console.log(`   – ${sm.code} already active`);
    }
  }

  // ── 5. Default Root Branch ────────────────────────────────────────────────
  console.log('🏢 Seeding Default Root Branch...');
  const ROOT_BRANCH_ID = 'b1111111-1111-1111-1111-111111111111';
  await prisma.branch.upsert({
    where: { id: ROOT_BRANCH_ID },
    create: {
      id:             ROOT_BRANCH_ID,
      tenantId:       TENANT_ID,
      name:           'My Company (HQ)',
      region:         'Metro Manila',
      isHeadquarters: true,
      entityType:     'HOLDING',
    },
    update: {}, // don't overwrite if already edited
  });
  console.log('   ✓ Default Root Branch (HQ)');

  console.log('');
  console.log('✅ Minimal seed complete.');
  console.log('');
  console.log('Next steps — add via the UI:');
  console.log('  1. Core Setup → Company Setup    → fill in company details');
  console.log('  2. Core Setup → Company Setup    → add Branches');
  console.log('  3. Core Setup → Company Setup    → add Departments');
  console.log('  4. Core Setup → Roles & Perms    → create Roles');
  console.log('  5. Core Setup → Users            → create Users');
}

main()
  .catch((e) => { console.error('Seed error:', e); process.exit(1); })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
