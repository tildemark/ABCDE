import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAccess } from '@/lib/accessControl';
import { buildScopedWhere } from '@/lib/scopedQuery';
import { redactCompensation } from '@/lib/redact';

const mockEmployees = [
  { id: 'EMP-001', name: 'Adam Roy', departmentId: 'd1-uuid', compensation: { basicPay: 5500.0, allowances: { meal: 200 }, deductions: { tax: 500 }, sensitivityLevel: 3 } },
  { id: 'EMP-002', name: 'Maria Santos', departmentId: 'd2-uuid', compensation: null },
  { id: 'EMP-003', name: 'Devon Lane', departmentId: 'd1-uuid', compensation: { basicPay: 7200.0, allowances: { transport: 150 }, deductions: { tax: 700 }, sensitivityLevel: 7 } },
  { id: 'EMP-004', name: 'Sarah Jenkins', departmentId: 'd1-uuid', compensation: null },
  { id: 'EMP-005', name: 'Ronald Richards', departmentId: 'd2-uuid', compensation: null },
  { id: 'EMP-006', name: 'Bessie Cooper', departmentId: 'd2-uuid', compensation: null },
];

export async function GET(request: NextRequest) {
  // Extract user identifiers from session headers/cookies (Fat Identity)
  // Since next-auth is configured in standard Next.js, we check for custom session headers or a default mock user for dev
  const tenantId = request.headers.get('x-tenant-id') || 't1-uuid';
  const userId = request.headers.get('x-user-id') || 'u1-uuid'; // Default to admin for dev Fallback

  // Evaluate the security check
  const access = await requireAccess({
    userId,
    tenantId,
    moduleCode: 'HUMAN_RESOURCES',
    action: 'canRead',
    requiredClearance: 1
  });

  if (!access.authorized) {
    return access.response;
  }

  const ctx = access.ctx;

  try {
    const dbWhere = buildScopedWhere(ctx);
    const employees = await prisma.employee.findMany({
      where: dbWhere,
      select: {
        id: true,
        departmentId: true,
        employeeCode: true,
        person: {
          select: {
            firstName: true,
            lastName: true,
          }
        },
      },
      orderBy: { person: { firstName: 'asc' } },
    });
    
    if (employees.length > 0) {
      return NextResponse.json(employees.map((e: any) => {
        return {
          id: e.id,
          name: `${e.person.firstName} ${e.person.lastName}`,
          departmentId: e.departmentId,
          compensation: null  // compensation table not in schema yet
        };
      }));
    }
    
    // Scoped filtering on Mock Data
    let filteredMock = mockEmployees;
    if (ctx.dataScope === 'OWN') {
      filteredMock = mockEmployees.filter(e => e.id === 'EMP-001'); // Treat EMP-001 as OWN for demo
    } else if (ctx.dataScope === 'DEPARTMENT') {
      const allowedDepts = [ctx.departmentId, ...ctx.scopeIds].filter(Boolean);
      if (allowedDepts.length > 0) {
        filteredMock = mockEmployees.filter(e => allowedDepts.includes(e.departmentId));
      }
    }

    // Apply compensation redaction on mock data
    const redactedMock = filteredMock.map(e => {
      const comp = e.compensation ? redactCompensation(e.compensation, ctx) : null;
      return {
        ...e,
        compensation: comp
      };
    });

    return NextResponse.json(redactedMock);
  } catch (error) {
    console.warn('Prisma database connection failed. Falling back to scoped mock employees list.', error);
    
    // Fallback scoping
    let filteredMock = mockEmployees;
    if (ctx.dataScope === 'OWN') {
      filteredMock = mockEmployees.filter(e => e.id === 'EMP-001');
    } else if (ctx.dataScope === 'DEPARTMENT') {
      const allowedDepts = [ctx.departmentId, ...ctx.scopeIds].filter(Boolean);
      if (allowedDepts.length > 0) {
        filteredMock = mockEmployees.filter(e => allowedDepts.includes(e.departmentId));
      }
    }

    const redactedMock = filteredMock.map(e => {
      const comp = e.compensation ? redactCompensation(e.compensation, ctx) : null;
      return {
        ...e,
        compensation: comp
      };
    });

    return NextResponse.json(redactedMock);
  }
}

