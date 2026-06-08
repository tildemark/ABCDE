import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL || "postgresql://admin:changeme@localhost:5435/trace_compliance_master";
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Clearing existing database records...');
  // Delete in order of dependencies
  await prisma.auditLog.deleteMany({});
  await prisma.consentLog.deleteMany({});
  await prisma.employeeDocument.deleteMany({});
  await prisma.leaveBalance.deleteMany({});
  await prisma.userPermissionOverride.deleteMany({});
  await prisma.roleModulePermission.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.userRoleAssignment.deleteMany({});
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

  console.log('Seeding Tenant...');
  const tenant = await prisma.tenant.create({
    data: {
      id: 'de305d54-75b4-431b-adb2-eb6b9e546014',
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

  console.log('Seeding Tenant License...');
  await prisma.tenantLicense.create({
    data: {
      tenantId: tenant.id,
      hasHris: true,
      hasTimekeeping: true,
      hasPayroll: true,
      maxEmployees: 100
    }
  });

  console.log('Seeding Tenant Modules...');
  const modules = ['CORE', 'HUMAN_RESOURCES', 'TIMEKEEPING', 'PAYROLL'];
  for (const code of modules) {
    await prisma.tenantModule.create({
      data: {
        tenantId: tenant.id,
        moduleCode: code,
        isActive: true
      }
    });
  }

  console.log('Seeding System Modules...');
  const systemModulesList = [
    { id: 'a1111111-1111-1111-1111-111111111111', code: 'CORE', name: 'Core Suite', category: 'system', description: 'Core directory and tenant settings' },
    { id: 'a2222222-2222-2222-2222-222222222222', code: 'HUMAN_RESOURCES', name: 'Human Resources', category: 'hris', description: 'Employee lifecycle and department tracking' },
    { id: 'a3333333-3333-3333-3333-333333333333', code: 'TIMEKEEPING', name: 'Timekeeping & Attendance', category: 'hris', description: 'Biometric integration and leaves' },
    { id: 'a4444444-4444-4444-4444-444444444444', code: 'PAYROLL', name: 'Payroll Processing', category: 'hris', description: 'Salaries and register runs' }
  ];
  for (const sm of systemModulesList) {
    await prisma.systemModule.create({ data: sm });
  }

  console.log('Seeding Branches...');
  const b1 = await prisma.branch.create({
    data: {
      id: 'b1111111-1111-1111-1111-111111111111',
      tenantId: tenant.id,
      name: 'ACME Holdings Group',
      region: 'Metro Manila',
      isHeadquarters: true,
      registeredTin: '123-456-789-000',
      sssId: '03-9123456-7',
      philhealthId: '01-023456789-1',
      pagibigId: '1210-9876-5432',
      birBranchCode: '00000',
      rdoCode: '047',
      entityType: 'HOLDING'
    }
  });
  const b2 = await prisma.branch.create({
    data: {
      id: 'b2222222-2222-2222-2222-222222222222',
      tenantId: tenant.id,
      name: 'ACME Cebu Subsidiary',
      region: 'Visayas',
      isHeadquarters: false,
      registeredTin: '123-456-789-001',
      sssId: '03-9123456-8',
      philhealthId: '01-023456789-2',
      pagibigId: '1210-9876-5433',
      birBranchCode: '00001',
      rdoCode: '083',
      entityType: 'SUBSIDIARY'
    }
  });
  await prisma.branch.create({
    data: {
      id: 'b3333333-3333-3333-3333-333333333333',
      tenantId: tenant.id,
      name: 'ACME Cebu Subsidiary - Cebu Branch',
      region: 'Visayas',
      isHeadquarters: false,
      registeredTin: '123-456-789-001',
      sssId: '03-9123456-8',
      philhealthId: '01-023456789-2',
      pagibigId: '1210-9876-5433',
      birBranchCode: '00001',
      rdoCode: '083',
      entityType: 'BRANCH'
    }
  });
  await prisma.branch.create({
    data: {
      id: 'b4444444-4444-4444-4444-444444444444',
      tenantId: tenant.id,
      name: 'ACME Affiliate Ltd',
      region: 'Mindanao',
      isHeadquarters: false,
      registeredTin: '123-456-789-002',
      sssId: '03-9123456-9',
      philhealthId: '01-023456789-3',
      pagibigId: '1210-9876-5434',
      birBranchCode: '00002',
      rdoCode: '113',
      entityType: 'AFFILIATE'
    }
  });
  await prisma.branch.create({
    data: {
      id: 'b5555555-5555-5555-5555-555555555555',
      tenantId: tenant.id,
      name: 'ACME Sister Corp',
      region: 'Luzon',
      isHeadquarters: false,
      registeredTin: '123-456-789-005',
      sssId: '03-9123456-5',
      philhealthId: '01-023456789-5',
      pagibigId: '1210-9876-5435',
      birBranchCode: '00005',
      rdoCode: '021',
      entityType: 'SUBSIDIARY'
    }
  });

  console.log('Seeding Departments...');
  const div1 = await prisma.department.create({
    data: { id: 'd1111111-1111-1111-1111-111111111111', tenantId: tenant.id, branchId: b1.id, name: 'Technology Division', parentId: null, type: 'DIVISION' }
  });
  const d1 = await prisma.department.create({
    data: { id: 'd2222222-2222-2222-2222-222222222222', tenantId: tenant.id, branchId: b1.id, name: 'Engineering', parentId: div1.id, type: 'DEPARTMENT' }
  });
  const sec1 = await prisma.department.create({
    data: { id: 'd3333333-3333-3333-3333-333333333333', tenantId: tenant.id, branchId: b1.id, name: 'Frontend Section', parentId: d1.id, type: 'SECTION' }
  });
  await prisma.department.create({
    data: { id: 'd4444444-4444-4444-4444-444444444444', tenantId: tenant.id, branchId: b1.id, name: 'Mobile App Team', parentId: sec1.id, type: 'SUBSECTION' }
  });
  const d2 = await prisma.department.create({
    data: { id: 'd5555555-5555-5555-5555-555555555555', tenantId: tenant.id, branchId: b1.id, name: 'Human Resources', parentId: null, type: 'DEPARTMENT' }
  });
  const d3 = await prisma.department.create({
    data: { id: 'd6666666-6666-6666-6666-666666666666', tenantId: tenant.id, branchId: b2.id, name: 'Marketing', parentId: null, type: 'DEPARTMENT' }
  });
  const d4 = await prisma.department.create({
    data: { id: 'd7777777-7777-7777-7777-777777777777', tenantId: tenant.id, branchId: b1.id, name: 'Finance', parentId: null, type: 'DEPARTMENT' }
  });

  console.log('Seeding Roles...');
  const roleSuperAdmin = await prisma.role.create({
    data: { id: 'c1111111-1111-1111-1111-111111111111', tenantId: tenant.id, name: 'Super Admin', description: 'System-wide full operational controls' }
  });
  const roleHrMgr = await prisma.role.create({
    data: { id: 'c2222222-2222-2222-2222-222222222222', tenantId: tenant.id, name: 'HR Manager', description: 'Operations lead for human resources' }
  });
  const roleHrSpec = await prisma.role.create({
    data: { id: 'c3333333-3333-3333-3333-333333333333', tenantId: tenant.id, name: 'HR Specialist', description: 'Standard HR directory administration' }
  });
  const roleAuditor = await prisma.role.create({
    data: { id: 'c4444444-4444-4444-4444-444444444444', tenantId: tenant.id, name: 'External Compliance Auditor', description: 'Read-only log reviewer with compliance bypass capabilities' }
  });

  console.log('Seeding Role Module Permissions...');
  // IT Admin / Super Admin gets all permissions
  for (const sm of systemModulesList) {
    await prisma.roleModulePermission.create({
      data: {
        roleId: roleSuperAdmin.id,
        systemModuleId: sm.id,
        canRead: true, canCreate: true, canWrite: true, canDelete: true,
        canPrint: true, canReport: true, canImport: true, canExport: true,
        canShare: true, canEmail: true
      }
    });
  }

  // HR Manager Module Permissions
  await prisma.roleModulePermission.create({
    data: {
      roleId: roleHrMgr.id,
      systemModuleId: 'a1111111-1111-1111-1111-111111111111', // CORE
      canRead: true, canCreate: true, canWrite: true, canDelete: true,
      canPrint: true, canReport: true, canImport: true, canExport: true,
      canShare: true, canEmail: true
    }
  });
  await prisma.roleModulePermission.create({
    data: {
      roleId: roleHrMgr.id,
      systemModuleId: 'a2222222-2222-2222-2222-222222222222', // HR
      canRead: true, canCreate: true, canWrite: true, canDelete: true,
      canPrint: true, canReport: true, canImport: true, canExport: true,
      canShare: true, canEmail: true
    }
  });
  await prisma.roleModulePermission.create({
    data: {
      roleId: roleHrMgr.id,
      systemModuleId: 'a3333333-3333-3333-3333-333333333333', // TIMEKEEPING
      canRead: true, canCreate: true, canWrite: true, canDelete: true,
      canPrint: true, canReport: true, canImport: true, canExport: true,
      canShare: true, canEmail: true
    }
  });
  await prisma.roleModulePermission.create({
    data: {
      roleId: roleHrMgr.id,
      systemModuleId: 'a4444444-4444-4444-4444-444444444444', // PAYROLL
      canRead: true, canCreate: true, canWrite: true, canDelete: false,
      canPrint: true, canReport: true, canImport: true, canExport: true,
      canShare: false, canEmail: true
    }
  });

  // HR Specialist Module Permissions
  await prisma.roleModulePermission.create({
    data: {
      roleId: roleHrSpec.id,
      systemModuleId: 'a2222222-2222-2222-2222-222222222222', // HR
      canRead: true, canCreate: true, canWrite: true, canDelete: false,
      canPrint: true, canReport: false, canImport: false, canExport: false,
      canShare: false, canEmail: false
    }
  });

  // Auditor Module Permissions
  for (const smId of ['a1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'a4444444-4444-4444-4444-444444444444']) {
    await prisma.roleModulePermission.create({
      data: {
        roleId: roleAuditor.id,
        systemModuleId: smId,
        canRead: true, canCreate: false, canWrite: false, canDelete: false,
        canPrint: true, canReport: true, canImport: false, canExport: true,
        canShare: false, canEmail: false
      }
    });
  }

  console.log('Seeding People, Users, and Employees...');
  const usersToSeed = [
    {
      id: '01111111-1111-1111-1111-111111111111',
      firstName: 'CEO',
      lastName: 'Boss',
      email: 'ceo@acme.com',
      clearance: 10,
      roleId: null,
      employeeCode: 'EMP-000',
      branchId: b1.id,
      departmentId: div1.id
    },
    {
      id: '02222222-2222-2222-2222-222222222222',
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@acme.com',
      clearance: 8,
      roleId: roleSuperAdmin.id,
      employeeCode: 'EMP-001',
      branchId: b1.id,
      departmentId: d1.id
    },
    {
      id: '03333333-3333-3333-3333-333333333333',
      firstName: 'HR',
      lastName: 'Manager',
      email: 'hr.mgr@acme.com',
      clearance: 6,
      roleId: roleHrMgr.id,
      employeeCode: 'EMP-002',
      branchId: b1.id,
      departmentId: d2.id
    },
    {
      id: '04444444-4444-4444-4444-444444444444',
      firstName: 'HR',
      lastName: 'Specialist',
      email: 'hr.spec@acme.com',
      clearance: 3,
      roleId: roleHrSpec.id,
      employeeCode: 'EMP-003',
      branchId: b1.id,
      departmentId: d2.id
    },
    {
      id: '05555555-5555-5555-5555-555555555555',
      firstName: 'External',
      lastName: 'Auditor',
      email: 'auditor@acme.com',
      clearance: 4,
      roleId: roleAuditor.id,
      employeeCode: 'EMP-004',
      branchId: b1.id,
      departmentId: div1.id
    }
  ];

  for (const u of usersToSeed) {
    const person = await prisma.person.create({
      data: {
        tenantId: tenant.id,
        firstName: u.firstName,
        lastName: u.lastName,
        personalEmail: u.email
      }
    });

    await prisma.user.create({
      data: {
        id: u.id,
        personId: person.id,
        tenantId: tenant.id,
        loginEmail: u.email,
        passwordHash: 'dummy-hashed-pass',
        isActive: true,
        roleId: u.roleId,
        clearanceLevel: u.clearance,
        departmentId: u.departmentId
      }
    });

    await prisma.employee.create({
      data: {
        personId: person.id,
        tenantId: tenant.id,
        branchId: u.branchId,
        departmentId: u.departmentId,
        employeeCode: u.employeeCode,
        employmentStatus: 'Active',
        payGroup: 'Standard'
      }
    });
  }

  // Set manager reference in Departments
  await prisma.department.update({
    where: { id: div1.id },
    data: { managerId: (await prisma.employee.findFirst({ where: { employeeCode: 'EMP-001' } }))?.id }
  });
  await prisma.department.update({
    where: { id: d1.id },
    data: { managerId: (await prisma.employee.findFirst({ where: { employeeCode: 'EMP-001' } }))?.id }
  });
  await prisma.department.update({
    where: { id: sec1.id },
    data: { managerId: (await prisma.employee.findFirst({ where: { employeeCode: 'EMP-001' } }))?.id }
  });
  await prisma.department.update({
    where: { id: 'd4444444-4444-4444-4444-444444444444' },
    data: { managerId: (await prisma.employee.findFirst({ where: { employeeCode: 'EMP-002' } }))?.id }
  });
  await prisma.department.update({
    where: { id: d2.id },
    data: { managerId: (await prisma.employee.findFirst({ where: { employeeCode: 'EMP-002' } }))?.id }
  });
  await prisma.department.update({
    where: { id: d3.id },
    data: { managerId: (await prisma.employee.findFirst({ where: { employeeCode: 'EMP-004' } }))?.id }
  });
  await prisma.department.update({
    where: { id: d4.id },
    data: { managerId: (await prisma.employee.findFirst({ where: { employeeCode: 'EMP-002' } }))?.id }
  });

  console.log('Seeding User Role Assignments...');
  await prisma.userRoleAssignment.create({
    data: { id: 'e1111111-1111-1111-1111-111111111111', userId: '02222222-2222-2222-2222-222222222222', roleId: roleSuperAdmin.id, scopeType: 'GLOBAL', scopeId: null }
  });
  await prisma.userRoleAssignment.create({
    data: { id: 'e2222222-2222-2222-2222-222222222222', userId: '03333333-3333-3333-3333-333333333333', roleId: roleHrMgr.id, scopeType: 'GLOBAL', scopeId: null }
  });
  await prisma.userRoleAssignment.create({
    data: { id: 'e3333333-3333-3333-3333-333333333333', userId: '04444444-4444-4444-4444-444444444444', roleId: roleHrSpec.id, scopeType: 'GLOBAL', scopeId: null }
  });
  await prisma.userRoleAssignment.create({
    data: { id: 'e4444444-4444-4444-4444-444444444444', userId: '05555555-5555-5555-5555-555555555555', roleId: roleAuditor.id, scopeType: 'GLOBAL', scopeId: null }
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
