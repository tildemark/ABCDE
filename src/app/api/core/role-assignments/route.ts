import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSeatConsumption } from '@/lib/permissions';

// Mock role assignments for fallback
let mockAssignments: any[] = [
  {
    id: 'ra1-uuid',
    userId: 'u1-uuid',
    roleId: 'r1-uuid',
    roleName: 'Super Admin',
    roleLevel: 0,
    scopeType: 'GLOBAL',
    scopeId: null,
    scopeLabel: null,
    validFrom: '2024-01-01T00:00:00Z',
    validUntil: null,
  },
  {
    id: 'ra2-uuid',
    userId: 'u2-uuid',
    roleId: 'r2-uuid',
    roleName: 'HR Specialist',
    roleLevel: 4,
    scopeType: 'GLOBAL',
    scopeId: null,
    scopeLabel: null,
    validFrom: '2024-01-01T00:00:00Z',
    validUntil: null,
  },
  {
    id: 'ra3-uuid',
    userId: 'u3-uuid',
    roleId: 'r3-uuid',
    roleName: 'Department Manager',
    roleLevel: 3,
    scopeType: 'DEPARTMENT',
    scopeId: 'd1-uuid',
    scopeLabel: 'Engineering',
    validFrom: '2024-01-01T00:00:00Z',
    validUntil: null,
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  try {
    const query: any = {};
    if (userId) query.userId = userId;

    const rows = await prisma.userRoleAssignment.findMany({
      where: query,
      include: {
        role: { select: { name: true, level: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (rows.length > 0 || userId) {
      return NextResponse.json(rows.map((r: any) => ({
        id: r.id,
        userId: r.userId,
        roleId: r.roleId,
        roleName: r.role?.name,
        roleLevel: r.role?.level ?? 4,
        scopeType: r.scopeType,
        scopeId: r.scopeId,
        scopeLabel: null, // would resolve branch/dept name in production
        validFrom: r.validFrom,
        validUntil: r.validUntil,
      })));
    }

    const filtered = userId ? mockAssignments.filter(a => a.userId === userId) : mockAssignments;
    return NextResponse.json(filtered);
  } catch {
    const filtered = userId ? mockAssignments.filter(a => a.userId === userId) : mockAssignments;
    return NextResponse.json(filtered);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, roleId, scopeType = 'GLOBAL', scopeId = null, validUntil = null } = body;

    if (!userId || !roleId) {
      return NextResponse.json({ error: 'userId and roleId are required' }, { status: 400 });
    }

    try {
      const userObj = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          roleAssignments: {
            include: {
              role: {
                include: {
                  rolePermissions: { include: { systemModule: true } }
                }
              }
            }
          },
          role: {
            include: {
              rolePermissions: { include: { systemModule: true } }
            }
          }
        }
      });

      if (userObj && userObj.isActive) {
        const roleObj = await prisma.role.findUnique({
          where: { id: roleId },
          include: {
            rolePermissions: { include: { systemModule: true } }
          }
        });

        if (roleObj) {
          const { seatsPerModuleLimit, currentSeatsPerModule } = await getSeatConsumption(userObj.tenantId);
          if (seatsPerModuleLimit) {
            // Find which modules this new role grants access to
            const newModules = new Set<string>();
            for (const rp of roleObj.rolePermissions) {
              if (rp.canRead || rp.canCreate || rp.canWrite) {
                newModules.add(rp.systemModule.code);
              }
            }

            // Find which modules the user already has access to
            const existingModules = new Set<string>(['CORE']);
            if (userObj.role) {
              for (const rp of userObj.role.rolePermissions) {
                if (rp.canRead || rp.canCreate || rp.canWrite) {
                  existingModules.add(rp.systemModule.code);
                }
              }
            }
            for (const ra of userObj.roleAssignments) {
              if (ra.role) {
                for (const rp of ra.role.rolePermissions) {
                  if (rp.canRead || rp.canCreate || rp.canWrite) {
                    existingModules.add(rp.systemModule.code);
                  }
                }
              }
            }

            // Verify limits for any module the user does not currently have access to
            for (const mod of newModules) {
              if (!existingModules.has(mod)) {
                const limit = seatsPerModuleLimit[mod];
                const current = currentSeatsPerModule[mod] || 0;
                if (limit !== undefined && limit !== null && current >= limit) {
                  return NextResponse.json({ error: `Module seat limit reached for ${mod}. The current license allows a maximum of ${limit} active seats.` }, { status: 400 });
                }
              }
            }
          }
        }
      }

      const created = await prisma.userRoleAssignment.create({
        data: {
          userId,
          roleId,
          scopeType,
          scopeId,
          validUntil: validUntil ? new Date(validUntil) : null,
        },
        include: {
          role: { select: { name: true, level: true } },
        },
      });

      return NextResponse.json({
        id: created.id,
        userId: created.userId,
        roleId: created.roleId,
        roleName: (created as any).role?.name,
        roleLevel: (created as any).role?.level ?? 4,
        scopeType: created.scopeType,
        scopeId: created.scopeId,
        scopeLabel: null,
        validFrom: created.validFrom,
        validUntil: created.validUntil,
      });
    } catch {
      const newMock = {
        id: `mock-ra-${Date.now()}`,
        userId,
        roleId,
        roleName: 'Custom Role',
        roleLevel: 4,
        scopeType,
        scopeId,
        scopeLabel: null,
        validFrom: new Date().toISOString(),
        validUntil,
      };
      mockAssignments.push(newMock);
      return NextResponse.json(newMock);
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
  }

  try {
    await prisma.userRoleAssignment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    mockAssignments = mockAssignments.filter(a => a.id !== id);
    return NextResponse.json({ success: true });
  }
}
