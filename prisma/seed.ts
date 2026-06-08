import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://admin:changeme@localhost:5435/trace_compliance_master';
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── Stable IDs (all real UUIDs, aligned with accessControlClient.ts mock data) ───────────────

// Tenant
const TENANT_ID      = 'de305d54-75b4-431b-adb2-eb6b9e546014';

// Branches
const BRANCH_HQ      = 'b1111111-1111-1111-1111-111111111111'; // HQ / Holding
const BRANCH_CEBU    = 'b2222222-2222-2222-2222-222222222222'; // Cebu Subsidiary
const BRANCH_CEBU_BR = 'b3333333-3333-3333-3333-333333333333'; // Cebu Branch
const BRANCH_MND     = 'b4444444-4444-4444-4444-444444444444'; // Mindanao Affiliate
const BRANCH_SIS     = 'b5555555-5555-5555-5555-555555555555'; // Sister Corp

// System Modules
const SM_CORE = 'a1111111-1111-1111-1111-111111111111';
const SM_HRIS = 'a2222222-2222-2222-2222-222222222222';
const SM_TIME = 'a3333333-3333-3333-3333-333333333333';
const SM_PAY  = 'a4444444-4444-4444-4444-444444444444';

// Departments (Divisions > Departments > Sections hierarchy)
const DIV_TECH  = 'd1111111-1111-1111-1111-111111111111'; // Technology Division
const DEPT_ENG  = 'd2222222-2222-2222-2222-222222222222'; // Engineering Dept
const SEC_FE    = 'd3333333-3333-3333-3333-333333333333'; // Frontend Section
const DEPT_HR   = 'd4444444-4444-4444-4444-444444444444'; // Human Resources Dept
const DEPT_FIN  = 'd5555555-5555-5555-5555-555555555555'; // Finance Dept
const DEPT_MKT  = 'd6666666-6666-6666-6666-666666666666'; // Marketing Dept (Cebu)
const DIV_OPS   = 'd7777777-7777-7777-7777-777777777777'; // Operations Division

// Roles
const ROLE_SUPER_ADMIN = 'c1111111-1111-1111-1111-111111111111';
const ROLE_HR_MGR      = 'c2222222-2222-2222-2222-222222222222';
const ROLE_HR_SPEC     = 'c3333333-3333-3333-3333-333333333333';
const ROLE_AUDITOR     = 'c4444444-4444-4444-4444-444444444444';

// Users  — IDs must match mockUsers in accessControlClient.ts
// The sidebar uses ?userId=<id> to switch "tester hats".
// These UUIDs are what get stored in the DB AND used in the sidebar URL param.
const USER_CEO        = 'f1000000-0000-0000-0000-000000000001'; // CEO Boss        (clearance 10, no role)
const USER_ADMIN      = 'f2000000-0000-0000-0000-000000000002'; // System Admin     (clearance 8,  Super Admin role)
const USER_HR_MGR     = 'f3000000-0000-0000-0000-000000000003'; // HR Manager       (clearance 6,  HR Manager role)
const USER_HR_SPEC    = 'f4000000-0000-0000-0000-000000000004'; // HR Specialist    (clearance 3,  HR Specialist role)
const USER_AUDITOR    = 'f5000000-0000-0000-0000-000000000005'; // External Auditor (clearance 4,  Auditor role)

async function main() {
  console.log('🗑️  Clearing existing records (dependency order)...');
  await prisma.auditLog.deleteMany({});
  await prisma.consentLog.deleteMany({});
  await prisma.employeeDocument.deleteMany({});
  await prisma.leaveBalance.deleteMany({});
  await prisma.userPermissionOverride.deleteMany({});
  await prisma.userRoleAssignment.deleteMany({});
  await prisma.roleModulePermission.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.person.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.branch.deleteMany({});
  await prisma.tenantModule.deleteMany({});
  await prisma.tenantLicense.deleteMany({});
  await prisma.systemModule.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.tenant.deleteMany({});

  // ── Tenant ────────────────────────────────────────────────────────────────
  console.log('🏢 Seeding Tenant...');
  await prisma.tenant.create({
    data: {
      id: TENANT_ID,
      corporateName: 'ACME Corporation',
      registeredTin: '123-456-789-000',
      industry: 'Technology / Software',
      sssId: '03-9123456-7',
      philhealthId: '01-023456789-1',
      pagibigId: '1210-9876-5432',
      birBranchCode: '00000',
      rdoCode: '047',
      companyType: 'OPERATING',
    }
  });

  // ── Tenant License ────────────────────────────────────────────────────────
  console.log('📄 Seeding Tenant License...');
  await prisma.tenantLicense.create({
    data: {
      tenantId: TENANT_ID,
      hasHris: true,
      hasTimekeeping: true,
      hasPayroll: true,
      maxEmployees: 100,
    }
  });

  // ── Tenant Modules ────────────────────────────────────────────────────────
  console.log('🔌 Seeding Tenant Modules...');
  for (const code of ['CORE', 'HUMAN_RESOURCES', 'TIMEKEEPING', 'PAYROLL']) {
    await prisma.tenantModule.create({
      data: { tenantId: TENANT_ID, moduleCode: code, isActive: true }
    });
  }

  // ── System Modules ────────────────────────────────────────────────────────
  console.log('⚙️  Seeding System Modules...');
  const systemModules = [
    { id: SM_CORE, code: 'CORE',            name: 'Core Suite',                category: 'system', description: 'Tenant settings, users, and roles' },
    { id: SM_HRIS, code: 'HUMAN_RESOURCES', name: 'Human Resources',           category: 'hris',   description: 'Employee lifecycle and department tracking' },
    { id: SM_TIME, code: 'TIMEKEEPING',     name: 'Timekeeping & Attendance',  category: 'hris',   description: 'Biometric integration and leave management' },
    { id: SM_PAY,  code: 'PAYROLL',         name: 'Payroll Processing',        category: 'hris',   description: 'Salary runs and payroll registers' },
  ];
  for (const sm of systemModules) {
    await prisma.systemModule.create({ data: sm });
  }

  // ── Branches / Entities ───────────────────────────────────────────────────
  console.log('🏬 Seeding Branches...');
  await prisma.branch.create({ data: {
    id: BRANCH_HQ,
    tenantId: TENANT_ID,
    name: 'ACME Holdings Group',
    region: 'Metro Manila',
    isHeadquarters: true,
    registeredTin: '123-456-789-000',
    sssId: '03-9123456-7',
    philhealthId: '01-023456789-1',
    pagibigId: '1210-9876-5432',
    birBranchCode: '00000',
    rdoCode: '047',
    entityType: 'HOLDING',
  }});
  await prisma.branch.create({ data: {
    id: BRANCH_CEBU,
    tenantId: TENANT_ID,
    name: 'ACME Cebu Subsidiary',
    region: 'Visayas',
    isHeadquarters: false,
    registeredTin: '123-456-789-001',
    sssId: '03-9123456-8',
    philhealthId: '01-023456789-2',
    pagibigId: '1210-9876-5433',
    birBranchCode: '00001',
    rdoCode: '083',
    entityType: 'SUBSIDIARY',
  }});
  await prisma.branch.create({ data: {
    id: BRANCH_CEBU_BR,
    tenantId: TENANT_ID,
    name: 'ACME Cebu - Cebu City Branch',
    region: 'Visayas',
    isHeadquarters: false,
    registeredTin: '123-456-789-001',
    sssId: '03-9123456-8',
    philhealthId: '01-023456789-2',
    pagibigId: '1210-9876-5433',
    birBranchCode: '00001',
    rdoCode: '083',
    entityType: 'BRANCH',
  }});
  await prisma.branch.create({ data: {
    id: BRANCH_MND,
    tenantId: TENANT_ID,
    name: 'ACME Mindanao Affiliate',
    region: 'Mindanao',
    isHeadquarters: false,
    registeredTin: '123-456-789-002',
    sssId: '03-9123456-9',
    philhealthId: '01-023456789-3',
    pagibigId: '1210-9876-5434',
    birBranchCode: '00002',
    rdoCode: '113',
    entityType: 'AFFILIATE',
  }});
  await prisma.branch.create({ data: {
    id: BRANCH_SIS,
    tenantId: TENANT_ID,
    name: 'ACME Sister Corp',
    region: 'Luzon',
    isHeadquarters: false,
    registeredTin: '123-456-789-005',
    sssId: '03-9123456-5',
    philhealthId: '01-023456789-5',
    pagibigId: '1210-9876-5435',
    birBranchCode: '00005',
    rdoCode: '021',
    entityType: 'SUBSIDIARY',
  }});

  // ── Departments (no managerId yet — set after employees are created) ───────
  console.log('🏗️  Seeding Departments...');
  await prisma.department.create({ data: { id: DIV_TECH, tenantId: TENANT_ID, branchId: BRANCH_HQ, name: 'Technology Division', parentId: null,     type: 'DIVISION'    } });
  await prisma.department.create({ data: { id: DEPT_ENG, tenantId: TENANT_ID, branchId: BRANCH_HQ, name: 'Engineering',         parentId: DIV_TECH,  type: 'DEPARTMENT'  } });
  await prisma.department.create({ data: { id: SEC_FE,   tenantId: TENANT_ID, branchId: BRANCH_HQ, name: 'Frontend Section',     parentId: DEPT_ENG,  type: 'SECTION'     } });
  await prisma.department.create({ data: { id: DEPT_HR,  tenantId: TENANT_ID, branchId: BRANCH_HQ, name: 'Human Resources',      parentId: null,      type: 'DEPARTMENT'  } });
  await prisma.department.create({ data: { id: DEPT_FIN, tenantId: TENANT_ID, branchId: BRANCH_HQ, name: 'Finance',              parentId: null,      type: 'DEPARTMENT'  } });
  await prisma.department.create({ data: { id: DEPT_MKT, tenantId: TENANT_ID, branchId: BRANCH_CEBU, name: 'Marketing',          parentId: null,      type: 'DEPARTMENT'  } });
  await prisma.department.create({ data: { id: DIV_OPS,  tenantId: TENANT_ID, branchId: BRANCH_HQ, name: 'Operations Division',  parentId: null,      type: 'DIVISION'    } });

  // ── Roles ─────────────────────────────────────────────────────────────────
  console.log('🎭 Seeding Roles...');
  await prisma.role.create({ data: { id: ROLE_SUPER_ADMIN, tenantId: TENANT_ID, name: 'Super Admin',              description: 'System-wide full operational controls' } });
  await prisma.role.create({ data: { id: ROLE_HR_MGR,      tenantId: TENANT_ID, name: 'HR Manager',               description: 'Operations lead for human resources' } });
  await prisma.role.create({ data: { id: ROLE_HR_SPEC,     tenantId: TENANT_ID, name: 'HR Specialist',            description: 'Standard HR directory administration' } });
  await prisma.role.create({ data: { id: ROLE_AUDITOR,     tenantId: TENANT_ID, name: 'External Compliance Auditor', description: 'Read-only log reviewer with compliance bypass' } });

  // ── Role → Module Permissions ─────────────────────────────────────────────
  console.log('🔐 Seeding Role Module Permissions...');

  // Super Admin: full permissions on all modules
  for (const smId of [SM_CORE, SM_HRIS, SM_TIME, SM_PAY]) {
    await prisma.roleModulePermission.create({ data: {
      roleId: ROLE_SUPER_ADMIN, systemModuleId: smId,
      canRead: true, canCreate: true, canWrite: true, canDelete: true,
      canPrint: true, canReport: true, canImport: true, canExport: true,
      canShare: true, canEmail: true,
    }});
  }

  // HR Manager: full CORE + HRIS + TIME, partial PAYROLL
  for (const smId of [SM_CORE, SM_HRIS, SM_TIME]) {
    await prisma.roleModulePermission.create({ data: {
      roleId: ROLE_HR_MGR, systemModuleId: smId,
      canRead: true, canCreate: true, canWrite: true, canDelete: true,
      canPrint: true, canReport: true, canImport: true, canExport: true,
      canShare: true, canEmail: true,
    }});
  }
  await prisma.roleModulePermission.create({ data: {
    roleId: ROLE_HR_MGR, systemModuleId: SM_PAY,
    canRead: true, canCreate: true, canWrite: true, canDelete: false,
    canPrint: true, canReport: true, canImport: true, canExport: true,
    canShare: false, canEmail: true,
  }});

  // HR Specialist: HRIS only (no CORE admin access)
  await prisma.roleModulePermission.create({ data: {
    roleId: ROLE_HR_SPEC, systemModuleId: SM_HRIS,
    canRead: true, canCreate: true, canWrite: true, canDelete: false,
    canPrint: true, canReport: false, canImport: false, canExport: false,
    canShare: false, canEmail: false,
  }});

  // Auditor: read-only + export on CORE, HRIS, PAYROLL
  for (const smId of [SM_CORE, SM_HRIS, SM_PAY]) {
    await prisma.roleModulePermission.create({ data: {
      roleId: ROLE_AUDITOR, systemModuleId: smId,
      canRead: true, canCreate: false, canWrite: false, canDelete: false,
      canPrint: true, canReport: true, canImport: false, canExport: true,
      canShare: false, canEmail: false,
    }});
  }

  // ── People, Users & Employees ─────────────────────────────────────────────
  console.log('👥 Seeding People, Users & Employees...');

  const usersToSeed = [
    {
      userId:       USER_CEO,
      firstName:    'CEO',
      lastName:     'Boss',
      email:        'ceo@acme.com',
      clearance:    10,
      roleId:       null as string | null,
      employeeCode: 'EMP-0001',
      branchId:     BRANCH_HQ,
      departmentId: DIV_OPS,
    },
    {
      userId:       USER_ADMIN,
      firstName:    'System',
      lastName:     'Admin',
      email:        'admin@acme.com',
      clearance:    8,
      roleId:       ROLE_SUPER_ADMIN,
      employeeCode: 'EMP-0002',
      branchId:     BRANCH_HQ,
      departmentId: DIV_TECH,
    },
    {
      userId:       USER_HR_MGR,
      firstName:    'HR',
      lastName:     'Manager',
      email:        'hr.mgr@acme.com',
      clearance:    6,
      roleId:       ROLE_HR_MGR,
      employeeCode: 'EMP-0003',
      branchId:     BRANCH_HQ,
      departmentId: DEPT_HR,
    },
    {
      userId:       USER_HR_SPEC,
      firstName:    'HR',
      lastName:     'Specialist',
      email:        'hr.spec@acme.com',
      clearance:    3,
      roleId:       ROLE_HR_SPEC,
      employeeCode: 'EMP-0004',
      branchId:     BRANCH_HQ,
      departmentId: DEPT_HR,
    },
    {
      userId:       USER_AUDITOR,
      firstName:    'External',
      lastName:     'Auditor',
      email:        'auditor@acme.com',
      clearance:    4,
      roleId:       ROLE_AUDITOR,
      employeeCode: 'EMP-0005',
      branchId:     BRANCH_HQ,
      departmentId: DIV_OPS,
    },
  ];

  const employeeIdByCode: Record<string, string> = {};

  for (const u of usersToSeed) {
    // Person
    const person = await prisma.person.create({
      data: {
        tenantId:      TENANT_ID,
        firstName:     u.firstName,
        lastName:      u.lastName,
        personalEmail: u.email,
      }
    });

    // User (with the stable UUID from the constants above)
    await prisma.user.create({
      data: {
        id:             u.userId,
        personId:       person.id,
        tenantId:       TENANT_ID,
        loginEmail:     u.email,
        passwordHash:   'dummy-hashed-pass',
        isActive:       true,
        roleId:         u.roleId,
        clearanceLevel: u.clearance,
        departmentId:   u.departmentId,
      }
    });

    // Employee
    const emp = await prisma.employee.create({
      data: {
        personId:         person.id,
        tenantId:         TENANT_ID,
        branchId:         u.branchId,
        departmentId:     u.departmentId,
        employeeCode:     u.employeeCode,
        employmentStatus: 'Active',
        payGroup:         'Standard',
      }
    });

    employeeIdByCode[u.employeeCode] = emp.id;
  }

  // ── Set Department Managers (now that employees exist) ────────────────────
  console.log('👔 Setting Department Managers...');
  await prisma.department.update({ where: { id: DIV_TECH  }, data: { managerId: employeeIdByCode['EMP-0002'] } });
  await prisma.department.update({ where: { id: DEPT_ENG  }, data: { managerId: employeeIdByCode['EMP-0002'] } });
  await prisma.department.update({ where: { id: SEC_FE    }, data: { managerId: employeeIdByCode['EMP-0002'] } });
  await prisma.department.update({ where: { id: DEPT_HR   }, data: { managerId: employeeIdByCode['EMP-0003'] } });
  await prisma.department.update({ where: { id: DEPT_FIN  }, data: { managerId: employeeIdByCode['EMP-0002'] } });
  await prisma.department.update({ where: { id: DIV_OPS   }, data: { managerId: employeeIdByCode['EMP-0001'] } });

  // ── User Role Assignments (scoped assignments table) ──────────────────────
  console.log('📋 Seeding User Role Assignments...');
  await prisma.userRoleAssignment.create({ data: {
    id: 'e1111111-1111-1111-1111-111111111111',
    userId: USER_ADMIN,   roleId: ROLE_SUPER_ADMIN, scopeType: 'GLOBAL', scopeId: null,
  }});
  await prisma.userRoleAssignment.create({ data: {
    id: 'e2222222-2222-2222-2222-222222222222',
    userId: USER_HR_MGR,  roleId: ROLE_HR_MGR,      scopeType: 'GLOBAL', scopeId: null,
  }});
  await prisma.userRoleAssignment.create({ data: {
    id: 'e3333333-3333-3333-3333-333333333333',
    userId: USER_HR_SPEC, roleId: ROLE_HR_SPEC,     scopeType: 'GLOBAL', scopeId: null,
  }});
  await prisma.userRoleAssignment.create({ data: {
    id: 'e4444444-4444-4444-4444-444444444444',
    userId: USER_AUDITOR, roleId: ROLE_AUDITOR,     scopeType: 'GLOBAL', scopeId: null,
  }});

  // ── Sample Consent Logs ───────────────────────────────────────────────────
  console.log('📝 Seeding sample Consent Logs...');
  await prisma.consentLog.create({ data: {
    tenantId:           TENANT_ID,
    employeeId:         employeeIdByCode['EMP-0001'],
    policyVersion:      'v2.1.0',
    consentPi:          true,
    consentSpi:         false,
    granularPermissions: { salary: false, health: false },
    ipAddress:          '192.168.1.1',
  }});
  await prisma.consentLog.create({ data: {
    tenantId:           TENANT_ID,
    employeeId:         employeeIdByCode['EMP-0003'],
    policyVersion:      'v2.1.0',
    consentPi:          true,
    consentSpi:         true,
    granularPermissions: { salary: true, health: true },
    ipAddress:          '192.168.1.5',
  }});

  // ── Sample Audit Logs ─────────────────────────────────────────────────────
  console.log('📋 Seeding sample Audit Logs...');
  const auditRows = [
    { tableName: 'users',       recordId: USER_ADMIN,    actionType: 'INSERT', actorId: USER_ADMIN,    newData: { event: 'User created' } },
    { tableName: 'roles',       recordId: ROLE_HR_MGR,   actionType: 'UPDATE', actorId: USER_ADMIN,    newData: { event: 'Role permissions updated' } },
    { tableName: 'departments', recordId: DEPT_HR,       actionType: 'UPDATE', actorId: USER_HR_MGR,   newData: { event: 'Manager assigned' } },
    { tableName: 'employees',   recordId: employeeIdByCode['EMP-0004'], actionType: 'INSERT', actorId: USER_HR_MGR, newData: { event: 'Employee onboarded' } },
    { tableName: 'employees',   recordId: employeeIdByCode['EMP-0003'], actionType: 'UPDATE', actorId: USER_HR_MGR, newData: { event: 'Clearance level adjusted' } },
  ];
  for (const row of auditRows) {
    await prisma.auditLog.create({ data: { tenantId: TENANT_ID, ...row } });
  }

  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('─── Tester Hat User IDs (use in ?userId= query param) ───');
  console.log(`  CEO Boss         → ${USER_CEO}`);
  console.log(`  System Admin     → ${USER_ADMIN}`);
  console.log(`  HR Manager       → ${USER_HR_MGR}`);
  console.log(`  HR Specialist    → ${USER_HR_SPEC}`);
  console.log(`  External Auditor → ${USER_AUDITOR}`);
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
