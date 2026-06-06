import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

let mockUsers: any[] = [
  { id: 'u1-uuid', personId: 'p1-uuid', name: 'Adam Roy', email: 'adam.roy@atomic-hr.com', isActive: true, roleId: 'r1-uuid', roleName: 'Super Admin', employeeCode: 'EMP-001', overrides: {} },
  { id: 'u2-uuid', personId: 'p2-uuid', name: 'Maria Santos', email: 'maria.santos@atomic-hr.com', isActive: true, roleId: 'r2-uuid', roleName: 'HR Specialist', employeeCode: 'EMP-002', overrides: { hris_employees: { delete: true } } },
  { id: 'u3-uuid', personId: 'p3-uuid', name: 'Sarah Jenkins', email: 'sarah.j@atomic-hr.com', isActive: false, roleId: 'r3-uuid', roleName: 'Department Manager', employeeCode: 'EMP-004', overrides: {} },
  { id: 'u4-uuid', personId: 'p4-uuid', name: 'Jane Consultant', email: 'jane.consultant@external.com', isActive: true, roleId: 'r4-uuid', roleName: 'External Auditor', employeeCode: 'N/A (Contractor)', overrides: { hris_employees: { print: false } } }
];

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        person: {
          select: {
            firstName: true,
            lastName: true,
            employee: { select: { employeeCode: true } }
          }
        },
        role: { select: { name: true } },
        userOverrides: {
          include: { systemModule: true }
        }
      },
      orderBy: { loginEmail: 'asc' }
    });

    if (users.length > 0) {
      return NextResponse.json(users.map((u: any) => {
        const overridesMap: any = {};
        u.userOverrides.forEach((ov: any) => {
          if (!overridesMap[ov.systemModule.code]) {
            overridesMap[ov.systemModule.code] = {};
          }
          overridesMap[ov.systemModule.code][ov.action] = ov.isAllowed;
        });
        return {
          id: u.id,
          personId: u.personId,
          name: `${u.person.firstName} ${u.person.lastName}`,
          email: u.loginEmail,
          isActive: u.isActive,
          roleId: u.roleId,
          roleName: u.role?.name || 'No Role Assigned',
          employeeCode: u.person.employee?.employeeCode || 'N/A',
          overrides: overridesMap
        };
      }));
    }
    return NextResponse.json(mockUsers);
  } catch (error) {
    console.warn('Prisma database connection failed. Falling back to mock users with overrides.');
    return NextResponse.json(mockUsers);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, roleId, employeeCode } = body;

    if (!firstName || !lastName || !email) {
      return NextResponse.json({ error: 'First name, last name, and email are required' }, { status: 400 });
    }

    try {
      const person = await prisma.person.create({
        data: {
          tenantId: 't1-uuid',
          firstName,
          lastName,
        }
      });

      const user = await prisma.user.create({
        data: {
          personId: person.id,
          tenantId: 't1-uuid',
          loginEmail: email,
          passwordHash: 'dummy-hashed-pass',
          roleId: roleId || null,
          isActive: true
        },
        include: {
          person: true,
          role: true
        }
      });

      return NextResponse.json({
        id: user.id,
        personId: user.personId,
        name: `${user.person.firstName} ${user.person.lastName}`,
        email: user.loginEmail,
        isActive: user.isActive,
        roleId: user.roleId,
        roleName: user.role?.name || 'No Role Assigned',
        employeeCode: employeeCode || 'N/A',
        overrides: {}
      });
    } catch (dbError) {
      console.warn('Prisma insert failed. Inserting into mock users.');
      const newMock = {
        id: `mock-user-${Date.now()}`,
        personId: `mock-person-${Date.now()}`,
        name: `${firstName} ${lastName}`,
        email,
        isActive: true,
        roleId: roleId || 'r3-uuid',
        roleName: roleId === 'r1-uuid' ? 'Super Admin' : roleId === 'r2-uuid' ? 'HR Specialist' : 'Department Manager',
        employeeCode: employeeCode || 'N/A',
        overrides: {}
      };
      mockUsers.push(newMock);
      return NextResponse.json(newMock);
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, isActive, roleId, overrides } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    try {
      const updated = await prisma.user.update({
        where: { id },
        data: {
          isActive: isActive !== undefined ? isActive : undefined,
          roleId: roleId !== undefined ? roleId : undefined
        },
        include: {
          person: true,
          role: true
        }
      });

      if (overrides) {
        for (const moduleCode of Object.keys(overrides)) {
          const mod = await prisma.systemModule.findUnique({ where: { code: moduleCode } });
          if (mod) {
            for (const action of Object.keys(overrides[moduleCode])) {
              const rule = overrides[moduleCode][action];
              if (rule === null || rule === undefined) {
                // Delete override to inherit from role
                await prisma.userPermissionOverride.deleteMany({
                  where: { userId: id, systemModuleId: mod.id, action }
                });
              } else {
                await prisma.userPermissionOverride.upsert({
                  where: {
                    userId_systemModuleId_action: { userId: id, systemModuleId: mod.id, action }
                  },
                  create: {
                    userId: id,
                    systemModuleId: mod.id,
                    action,
                    isAllowed: !!rule
                  },
                  update: {
                    isAllowed: !!rule
                  }
                });
              }
            }
          }
        }
      }

      return NextResponse.json({
        id: updated.id,
        personId: updated.personId,
        name: `${updated.person.firstName} ${updated.person.lastName}`,
        email: updated.loginEmail,
        isActive: updated.isActive,
        roleId: updated.roleId,
        roleName: updated.role?.name || 'No Role Assigned',
        employeeCode: 'N/A',
        overrides: overrides || {}
      });
    } catch (dbError) {
      console.warn('Prisma update failed. Updating mock user overrides.');
      mockUsers = mockUsers.map(u => {
        if (u.id === id) {
          let roleName = u.roleName;
          if (roleId === 'r1-uuid') roleName = 'Super Admin';
          else if (roleId === 'r2-uuid') roleName = 'HR Specialist';
          else if (roleId === 'r3-uuid') roleName = 'Department Manager';
          else if (roleId === 'r4-uuid') roleName = 'External Auditor';

          const mergedOverrides: any = { ...u.overrides };
          if (overrides) {
            for (const mCode of Object.keys(overrides)) {
              mergedOverrides[mCode] = { ...(mergedOverrides[mCode] || {}) };
              for (const act of Object.keys(overrides[mCode])) {
                const rule = overrides[mCode][act];
                if (rule === null || rule === undefined) {
                  delete mergedOverrides[mCode][act];
                } else {
                  mergedOverrides[mCode][act] = rule;
                }
              }
              if (Object.keys(mergedOverrides[mCode]).length === 0) {
                delete mergedOverrides[mCode];
              }
            }
          }

          return {
            ...u,
            isActive: isActive !== undefined ? isActive : u.isActive,
            roleId: roleId !== undefined ? roleId : u.roleId,
            roleName,
            overrides: mergedOverrides
          };
        }
        return u;
      });
      const updatedMock = mockUsers.find(u => u.id === id);
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
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    try {
      await prisma.user.delete({
        where: { id }
      });
      return NextResponse.json({ success: true });
    } catch (dbError) {
      console.warn('Prisma delete failed. Deleting from mock users.');
      mockUsers = mockUsers.filter(u => u.id !== id);
      return NextResponse.json({ success: true });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
