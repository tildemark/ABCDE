import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const mockConsentLogs = [
  {
    id: 'c1-uuid',
    employeeId: 'EMP-001',
    employeeName: 'Adam Roy',
    policyVersion: 'v2.1 (DOLE/DPA-2012)',
    consentPi: true,
    consentSpi: true,
    granularPermissions: { hmoSharing: true, bankPayrollSharing: true, biometricCloudSync: false },
    ipAddress: '192.168.1.102',
    consentedAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(), // 5 days ago
  },
  {
    id: 'c2-uuid',
    employeeId: 'EMP-002',
    employeeName: 'Maria Santos',
    policyVersion: 'v2.1 (DOLE/DPA-2012)',
    consentPi: true,
    consentSpi: true,
    granularPermissions: { hmoSharing: true, bankPayrollSharing: true, biometricCloudSync: true },
    ipAddress: '192.168.1.105',
    consentedAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString(), // 10 days ago
  },
  {
    id: 'c3-uuid',
    employeeId: 'EMP-004',
    employeeName: 'Sarah Jenkins',
    policyVersion: 'v2.0',
    consentPi: true,
    consentSpi: false,
    granularPermissions: { hmoSharing: false, bankPayrollSharing: true, biometricCloudSync: false },
    ipAddress: '172.16.50.21',
    consentedAt: new Date(Date.now() - 3600000 * 24 * 30).toISOString(), // 30 days ago
  },
];

export async function GET() {
  try {
    const logs = await prisma.consentLog.findMany({
      include: {
        employee: { 
          select: { 
            person: { 
              select: { firstName: true, lastName: true } 
            } 
          } 
        },
      },
      orderBy: { consentedAt: 'desc' },
    });
    
    if (logs.length > 0) {
      return NextResponse.json(logs.map((log: any) => ({
        id: log.id,
        employeeId: log.employeeId,
        employeeName: log.employee?.person ? `${log.employee.person.firstName} ${log.employee.person.lastName}` : 'Unassigned',
        policyVersion: log.policyVersion,
        consentPi: log.consentPi,
        consentSpi: log.consentSpi,
        granularPermissions: log.granularPermissions,
        ipAddress: log.ipAddress,
        consentedAt: log.consentedAt,
      })));
    }
    return NextResponse.json(mockConsentLogs);
  } catch (error) {
    console.warn('Prisma database connection failed. Falling back to mock consent logs.');
    return NextResponse.json(mockConsentLogs);
  }
}
