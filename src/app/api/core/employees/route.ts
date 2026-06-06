import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const mockEmployees = [
  { id: 'EMP-001', name: 'Adam Roy' },
  { id: 'EMP-002', name: 'Maria Santos' },
  { id: 'EMP-003', name: 'Devon Lane' },
  { id: 'EMP-004', name: 'Sarah Jenkins' },
  { id: 'EMP-005', name: 'Ronald Richards' },
  { id: 'EMP-006', name: 'Bessie Cooper' },
];

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        person: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: { person: { firstName: 'asc' } },
    });
    
    if (employees.length > 0) {
      return NextResponse.json(employees.map((e: any) => ({
        id: e.id,
        name: `${e.person.firstName} ${e.person.lastName}`,
      })));
    }
    return NextResponse.json(mockEmployees);
  } catch (error) {
    console.warn('Prisma database connection failed. Falling back to mock employees list.');
    return NextResponse.json(mockEmployees);
  }
}
