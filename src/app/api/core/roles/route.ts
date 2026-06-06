import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Multi-verb defaults per role
let mockRoles = [
  {
    id: 'r1-uuid',
    name: 'Super Admin',
    description: 'Complete system access to all configurations and data',
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
    id: 'r2-uuid',
    name: 'HR Specialist',
    description: 'Management of employee directories, departments, and consent logs',
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
    id: 'r3-uuid',
    name: 'Department Manager',
    description: 'View assigned employees, approve timesheet logs and leaves',
    permissions: {
      core_settings: { read: false, create: false, write: false, delete: false, print: false, report: false, import: false, export: false, share: false, email: false },
      hris_employees: { read: true, create: false, write: false, delete: false, print: false, report: true, import: false, export: false, share: false, email: false },
      hris_departments: { read: true, create: false, write: false, delete: false, print: false, report: false, import: false, export: false, share: false, email: false },
      time_records: { read: true, create: true, write: true, delete: false, print: true, report: true, import: false, export: false, share: false, email: false },
      payroll_registers: { read: false, create: false, write: false, delete: false, print: false, report: false, import: false, export: false, share: false, email: false },
      documents_portal: { read: true, create: false, write: false, delete: false, print: false, report: false, import: false, export: false, share: false, email: false }
    }
  },
  {
    id: 'r4-uuid',
    name: 'External Auditor',
    description: 'Read-only audit trail and data privacy registers',
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

    if (roles.length > 0) {
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
            email: p.canEmail
          };
        });
        return {
          id: r.id,
          name: r.name,
          description: r.description,
          permissions: permMap
        };
      }));
    }
    return NextResponse.json(mockRoles);
  } catch (error) {
    console.warn('Prisma database connection failed. Falling back to mock roles matrix.');
    return NextResponse.json(mockRoles);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, permissions } = body;

    if (!name) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
    }

    try {
      const role = await prisma.role.create({
        data: {
          name,
          description,
          tenantId: 't1-uuid'
        }
      });

      // Connect permissions if passed
      if (permissions) {
        for (const moduleCode of Object.keys(permissions)) {
          const mod = await prisma.systemModule.findUnique({ where: { code: moduleCode } });
          if (mod) {
            const val = permissions[moduleCode];
            await prisma.roleModulePermission.create({
              data: {
                roleId: role.id,
                systemModuleId: mod.id,
                canRead: !!val.read,
                canCreate: !!val.create,
                canWrite: !!val.write,
                canDelete: !!val.delete,
                canPrint: !!val.print,
                canReport: !!val.report,
                canImport: !!val.import,
                canExport: !!val.export,
                canShare: !!val.share,
                canEmail: !!val.email
              }
            });
          }
        }
      }

      // Re-query to return complete structured data
      return NextResponse.json({
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: permissions || {}
      });
    } catch (dbError) {
      console.warn('Prisma role insert failed. Inserting into mock roles matrix.');
      const newMock = {
        id: `mock-role-${Date.now()}`,
        name,
        description,
        permissions: permissions || {
          core_settings: { read: true, create: false, write: false, delete: false, print: false, report: false, import: false, export: false, share: false, email: false },
          hris_employees: { read: true, create: false, write: false, delete: false, print: false, report: false, import: false, export: false, share: false, email: false }
        }
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
    const { id, name, description, permissions } = body;

    if (!id) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
    }

    try {
      const updatedRole = await prisma.role.update({
        where: { id },
        data: {
          name: name || undefined,
          description: description !== undefined ? description : undefined
        }
      });

      if (permissions) {
        for (const moduleCode of Object.keys(permissions)) {
          const mod = await prisma.systemModule.findUnique({ where: { code: moduleCode } });
          if (mod) {
            const val = permissions[moduleCode];
            await prisma.roleModulePermission.upsert({
              where: {
                roleId_systemModuleId: { roleId: id, systemModuleId: mod.id }
              },
              create: {
                roleId: id,
                systemModuleId: mod.id,
                canRead: !!val.read,
                canCreate: !!val.create,
                canWrite: !!val.write,
                canDelete: !!val.delete,
                canPrint: !!val.print,
                canReport: !!val.report,
                canImport: !!val.import,
                canExport: !!val.export,
                canShare: !!val.share,
                canEmail: !!val.email
              },
              update: {
                canRead: val.read !== undefined ? !!val.read : undefined,
                canCreate: val.create !== undefined ? !!val.create : undefined,
                canWrite: val.write !== undefined ? !!val.write : undefined,
                canDelete: val.delete !== undefined ? !!val.delete : undefined,
                canPrint: val.print !== undefined ? !!val.print : undefined,
                canReport: val.report !== undefined ? !!val.report : undefined,
                canImport: val.import !== undefined ? !!val.import : undefined,
                canExport: val.export !== undefined ? !!val.export : undefined,
                canShare: val.share !== undefined ? !!val.share : undefined,
                canEmail: val.email !== undefined ? !!val.email : undefined
              }
            });
          }
        }
      }

      return NextResponse.json({
        id: updatedRole.id,
        name: updatedRole.name,
        description: updatedRole.description,
        permissions: permissions || {}
      });
    } catch (dbError) {
      console.warn('Prisma role update failed. Updating mock role matrix.');
      mockRoles = mockRoles.map(r => {
        if (r.id === id) {
          // Merge permissions
          const mergedPerms: any = { ...r.permissions };
          if (permissions) {
            for (const key of Object.keys(permissions)) {
              mergedPerms[key] = { ...(mergedPerms[key] || {}), ...(permissions as any)[key] };
            }
          }
          return {
            ...r,
            name: name || r.name,
            description: description !== undefined ? description : r.description,
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
