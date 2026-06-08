import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

let mockRoles: any[] = [
  { 
    id: 'role-super-admin', 
    name: 'Super Admin', 
    complianceBypass: false,
    permissions: { 
      core_settings: { read: true, create: true, write: true, delete: true, print: true, report: true, import: true, export: true, share: true, email: true }, 
      hris_employees: { read: true, create: true, write: true, delete: true, print: true, report: true, import: true, export: true, share: true, email: true }, 
      hris_departments: { read: true, create: true, write: true, delete: true, print: true, report: true, import: true, export: true, share: true, email: true }, 
      time_records: { read: true, create: true, write: true, delete: true, print: true, report: true, import: true, export: true, share: true, email: true }, 
      payroll_registers: { read: true, create: true, write: true, delete: true, print: true, report: true, import: true, export: true, share: true, email: true }, 
      documents_portal: { read: true, create: true, write: true, delete: true, print: true, report: true, import: true, export: true, share: true, email: true } 
    }
  },
  { 
    id: 'role-hr-mgr', 
    name: 'HR Manager', 
    complianceBypass: false,
    permissions: { 
      core_settings: { read: true, create: true, write: true, delete: true, print: true, report: true, import: true, export: true, share: true, email: true }, 
      hris_employees: { read: true, create: true, write: true, delete: true, print: true, report: true, import: true, export: true, share: true, email: true }, 
      hris_departments: { read: true, create: true, write: true, delete: true, print: true, report: true, import: true, export: true, share: true, email: true }, 
      time_records: { read: true, create: true, write: true, delete: false, print: true, report: true, import: true, export: true, share: true, email: true }, 
      payroll_registers: { read: true, create: true, write: true, delete: false, print: true, report: true, import: false, export: true, share: false, email: true }, 
      documents_portal: { read: true, create: true, write: true, delete: true, print: true, report: true, import: true, export: true, share: true, email: true } 
    }
  },
  { 
    id: 'role-hr-spec', 
    name: 'HR Specialist', 
    complianceBypass: false,
    permissions: { 
      core_settings: { read: true, create: false, write: false, delete: false, print: false, report: false, import: false, export: false, share: false, email: false }, 
      hris_employees: { read: true, create: true, write: true, delete: false, print: true, report: true, import: true, export: true, share: true, email: true }, 
      hris_departments: { read: true, create: true, write: true, delete: false, print: true, report: true, import: false, export: false, share: false, email: false }, 
      time_records: { read: true, create: false, write: false, delete: false, print: true, report: true, import: false, export: false, share: false, email: false }, 
      payroll_registers: { read: false, create: false, write: false, delete: false, print: false, report: false, import: false, export: false, share: false, email: false }, 
      documents_portal: { read: true, create: true, write: true, delete: false, print: true, report: false, import: true, export: true, share: true, email: true } 
    }
  },
  { 
    id: 'role-auditor', 
    name: 'External Compliance Auditor', 
    complianceBypass: true,
    permissions: { 
      core_settings: { read: true, create: false, write: false, delete: false, print: true, report: true, import: false, export: false, share: false, email: false }, 
      hris_employees: { read: true, create: false, write: false, delete: false, print: true, report: true, import: false, export: false, share: false, email: false }, 
      hris_departments: { read: true, create: false, write: false, delete: false, print: true, report: true, import: false, export: false, share: false, email: false }, 
      time_records: { read: true, create: false, write: false, delete: false, print: true, report: true, import: false, export: false, share: false, email: false }, 
      payroll_registers: { read: true, create: false, write: false, delete: false, print: true, report: true, import: false, export: false, share: false, email: false }, 
      documents_portal: { read: true, create: false, write: false, delete: false, print: true, report: true, import: false, export: false, share: false, email: false } 
    }
  }
];

export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      include: {
        rolePermissions: {
          include: { systemModule: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(roles.map((r: any) => {
      const permMap: any = {};
      r.rolePermissions.forEach((p: any) => {
        permMap[p.systemModule.code] = {
          read: p.canRead,
          create: p.canCreate,
          write: p.canWrite,
          delete: p.canDelete,
          print: p.canPrint,
          report: p.canReport,
          import: p.canImport,
          export: p.canExport,
          share: p.canShare,
          email: p.canEmail,
        };
      });
      return {
        id: r.id,
        name: r.name,
        complianceBypass: false,  // field not in schema — default to false
        permissions: permMap
      };
    }));
  } catch (error) {
    console.warn('Prisma database connection failed. Falling back to mock roles matrix.');
    return NextResponse.json(mockRoles);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, complianceBypass, permissions } = body;

    if (!name) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
    }

    try {
      // Get a tenantId from DB for the new role
      const firstTenant = await prisma.tenant.findFirst({ select: { id: true } });
      if (!firstTenant) throw new Error('No tenant found');

      const role = await prisma.role.create({
        data: {
          tenantId: firstTenant.id,
          name,
          // complianceBypass not in schema — skipped
        }
      });

      // Seed rolePermissions from permissions map
      if (permissions) {
        for (const moduleCode of Object.keys(permissions)) {
          const mod = await prisma.systemModule.findUnique({ where: { code: moduleCode } });
          if (mod) {
            const val = permissions[moduleCode];
            await prisma.roleModulePermission.upsert({
              where: { roleId_systemModuleId: { roleId: role.id, systemModuleId: mod.id } },
              create: {
                roleId: role.id,
                systemModuleId: mod.id,
                canRead: !!val.read, canCreate: !!val.create, canWrite: !!val.write,
                canDelete: !!val.delete, canPrint: !!val.print, canReport: !!val.report,
                canImport: !!val.import, canExport: !!val.export, canShare: !!val.share, canEmail: !!val.email,
              },
              update: {
                canRead: !!val.read, canCreate: !!val.create, canWrite: !!val.write,
                canDelete: !!val.delete, canPrint: !!val.print, canReport: !!val.report,
                canImport: !!val.import, canExport: !!val.export, canShare: !!val.share, canEmail: !!val.email,
              }
            });
          }
        }
      }

      return NextResponse.json({
        id: role.id,
        name: role.name,
        complianceBypass: false,
        permissions: permissions || {}
      });
    } catch (dbError) {
      console.warn('Prisma role insert failed. Inserting into mock roles matrix.', dbError);
      const newMock = {
        id: `mock-role-${Date.now()}`,
        name,
        complianceBypass: !!complianceBypass,
        permissions: permissions || {}
      };
      mockRoles.push(newMock);
      return NextResponse.json(newMock);
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, complianceBypass, permissions } = body;

    if (!id) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
    }

    try {
      const roleExists = await prisma.role.findUnique({ where: { id } });
      if (!roleExists) {
        throw new Error('Role not found in database');
      }

      const updatedRole = await prisma.role.update({
        where: { id },
        data: {
          name: name || undefined,
          // complianceBypass not in schema — skipped
        }
      });

      // Update rolePermissions using correct schema model
      if (permissions) {
        for (const moduleCode of Object.keys(permissions)) {
          const mod = await prisma.systemModule.findUnique({ where: { code: moduleCode } });
          if (mod) {
            const val = permissions[moduleCode];
            await prisma.roleModulePermission.upsert({
              where: { roleId_systemModuleId: { roleId: id, systemModuleId: mod.id } },
              create: {
                roleId: id,
                systemModuleId: mod.id,
                canRead: !!val.read, canCreate: !!val.create, canWrite: !!val.write,
                canDelete: !!val.delete, canPrint: !!val.print, canReport: !!val.report,
                canImport: !!val.import, canExport: !!val.export, canShare: !!val.share, canEmail: !!val.email,
              },
              update: {
                canRead: !!val.read, canCreate: !!val.create, canWrite: !!val.write,
                canDelete: !!val.delete, canPrint: !!val.print, canReport: !!val.report,
                canImport: !!val.import, canExport: !!val.export, canShare: !!val.share, canEmail: !!val.email,
              }
            });
          }
        }
      }

      return NextResponse.json({
        id: updatedRole.id,
        name: updatedRole.name,
        complianceBypass: false,
        permissions: permissions || {}
      });
    } catch (dbError) {
      console.warn('Prisma role update failed. Updating mock role matrix.', dbError);
      mockRoles = mockRoles.map(r => {
        if (r.id === id) {
          const mergedPerms: any = { ...r.permissions };
          if (permissions) {
            for (const key of Object.keys(permissions)) {
              mergedPerms[key] = { ...(mergedPerms[key] || {}), ...permissions[key] };
            }
          }
          return {
            ...r,
            name: name || r.name,
            complianceBypass: complianceBypass !== undefined ? !!complianceBypass : r.complianceBypass,
            permissions: mergedPerms
          };
        }
        return r;
      });
      const updatedMock = mockRoles.find(r => r.id === id);
      return NextResponse.json(updatedMock);
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
    }

    try {
      await prisma.role.delete({ where: { id } });
      return NextResponse.json({ success: true });
    } catch (dbError) {
      console.warn('Prisma role delete failed. Deleting from mock roles matrix.');
      mockRoles = mockRoles.filter(r => r.id !== id);
      return NextResponse.json({ success: true });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
