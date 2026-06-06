import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const mockModules = [
  { id: 'm1-uuid', code: 'core_settings', name: 'Core Settings', category: 'Core Admin', description: 'Global system preferences and tenant data' },
  { id: 'm2-uuid', code: 'hris_employees', name: 'Employee Profiles', category: 'HRIS', description: 'Employee biographical files and job details' },
  { id: 'm3-uuid', code: 'hris_departments', name: 'Departments Config', category: 'HRIS', description: 'Organizational structures and department mapping' },
  { id: 'm4-uuid', code: 'time_records', name: 'Timesheets & Biometrics', category: 'Timekeeping', description: 'Punch logs and biometric syncing logs' },
  { id: 'm5-uuid', code: 'payroll_registers', name: 'Payroll & Allowances', category: 'Payroll', description: 'Salary items, adjustments, and payroll outputs' },
  { id: 'm6-uuid', code: 'documents_portal', name: 'Documents & Files', category: 'Core Admin', description: 'Upload contracts, benefits files, and DPA agreements' }
];

export async function GET() {
  try {
    const modules = await prisma.systemModule.findMany({
      orderBy: { name: 'asc' }
    });
    if (modules.length > 0) {
      return NextResponse.json(modules);
    }
    return NextResponse.json(mockModules);
  } catch (error) {
    console.warn('Prisma database connection failed. Falling back to mock modules.');
    return NextResponse.json(mockModules);
  }
}
