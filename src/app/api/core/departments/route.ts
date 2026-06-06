import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

let mockDepartments = [
  { id: 'd1-uuid', name: 'Engineering', branchId: 'b1-uuid', branchName: 'Manila Head Office', managerId: 'EMP-001', managerName: 'Adam Roy', staffCount: 2 },
  { id: 'd2-uuid', name: 'Human Resources', branchId: 'b1-uuid', branchName: 'Manila Head Office', managerId: 'EMP-002', managerName: 'Maria Santos', staffCount: 1 },
  { id: 'd3-uuid', name: 'Marketing', branchId: 'b2-uuid', branchName: 'Cebu Branch', managerId: 'EMP-004', managerName: 'Sarah Jenkins', staffCount: 1 },
  { id: 'd4-uuid', name: 'Finance', branchId: 'b1-uuid', branchName: 'Manila Head Office', managerId: 'EMP-005', managerName: 'Ronald Richards', staffCount: 1 },
];

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      include: {
        branch: { select: { name: true } },
        manager: { select: { person: { select: { firstName: true, lastName: true } } } },
        employees: { select: { id: true } },
      },
      orderBy: { name: 'asc' },
    });
    
    if (departments.length > 0) {
      return NextResponse.json(departments.map((d: any) => ({
        id: d.id,
        name: d.name,
        branchId: d.branchId,
        branchName: d.branch?.name || 'Unassigned',
        managerId: d.managerId,
        managerName: d.manager?.person ? `${d.manager.person.firstName} ${d.manager.person.lastName}` : 'Unassigned',
        staffCount: d.employees.length,
      })));
    }
    return NextResponse.json(mockDepartments);
  } catch (error) {
    console.warn('Prisma database connection failed. Falling back to mock departments.');
    return NextResponse.json(mockDepartments);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, branchId, managerId } = body;

    if (!name) {
      return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
    }

    try {
      const newDept = await prisma.department.create({
        data: {
          name,
          branchId: branchId || null,
          managerId: managerId || null,
        },
        include: {
          branch: { select: { name: true } },
          manager: { select: { person: { select: { firstName: true, lastName: true } } } },
        }
      });
      return NextResponse.json({
        id: newDept.id,
        name: newDept.name,
        branchId: newDept.branchId,
        branchName: newDept.branch?.name || 'Unassigned',
        managerId: newDept.managerId,
        managerName: newDept.manager?.person ? `${newDept.manager.person.firstName} ${newDept.manager.person.lastName}` : 'Unassigned',
        staffCount: 0,
      });
    } catch (dbError) {
      console.warn('Prisma insert failed. Inserting into mock departments.');
      const newMock = {
        id: `mock-dept-${Date.now()}`,
        name,
        branchId: branchId || 'b1-uuid',
        branchName: branchId === 'b2-uuid' ? 'Cebu Branch' : 'Manila Head Office',
        managerId: managerId || 'EMP-001',
        managerName: managerId === 'EMP-002' ? 'Maria Santos' : 'Adam Roy',
        staffCount: 0,
      };
      mockDepartments.push(newMock);
      return NextResponse.json(newMock);
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, branchId, managerId } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'Department ID and name are required' }, { status: 400 });
    }

    try {
      const updated = await prisma.department.update({
        where: { id },
        data: { name, branchId: branchId || null, managerId: managerId || null },
        include: {
          branch: { select: { name: true } },
          manager: { select: { person: { select: { firstName: true, lastName: true } } } },
          employees: { select: { id: true } }
        }
      });
      return NextResponse.json({
        id: updated.id,
        name: updated.name,
        branchId: updated.branchId,
        branchName: updated.branch?.name || 'Unassigned',
        managerId: updated.managerId,
        managerName: updated.manager?.person ? `${updated.manager.person.firstName} ${updated.manager.person.lastName}` : 'Unassigned',
        staffCount: updated.employees.length,
      });
    } catch (dbError) {
      console.warn('Prisma update failed. Updating mock department.');
      mockDepartments = mockDepartments.map(d => {
        if (d.id === id) {
          let managerName = 'Unassigned';
          if (managerId === 'EMP-001') managerName = 'Adam Roy';
          else if (managerId === 'EMP-002') managerName = 'Maria Santos';
          else if (managerId === 'EMP-004') managerName = 'Sarah Jenkins';
          else if (managerId === 'EMP-005') managerName = 'Ronald Richards';

          let branchName = 'Unassigned';
          if (branchId === 'b1-uuid') branchName = 'Manila Head Office';
          else if (branchId === 'b2-uuid') branchName = 'Cebu Branch';
          else if (branchId === 'b3-uuid') branchName = 'Davao Office';

          return { ...d, name, branchId, branchName, managerId, managerName };
        }
        return d;
      });
      const updatedMock = mockDepartments.find(d => d.id === id);
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
      return NextResponse.json({ error: 'Department ID is required' }, { status: 400 });
    }

    try {
      await prisma.department.delete({
        where: { id },
      });
      return NextResponse.json({ success: true });
    } catch (dbError) {
      console.warn('Prisma delete failed. Deleting from mock departments.');
      mockDepartments = mockDepartments.filter(d => d.id !== id);
      return NextResponse.json({ success: true });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
