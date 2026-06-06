import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const mockAuditLogs = [
  // Category 1: DB Transactions / Audit Trail
  {
    logId: 'a1-uuid',
    tableName: 'employees',
    recordId: 'EMP-001',
    actionType: 'UPDATE',
    actorId: 'EMP-002',
    actorName: 'Maria Santos',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    oldData: { name: 'Adam Roy', position: 'Senior Engineer', dailyRate: 2300 },
    newData: { name: 'Adam Roy', position: 'Principal Engineer', dailyRate: 2500 }
  },
  {
    logId: 'a2-uuid',
    tableName: 'departments',
    recordId: 'd3-uuid',
    actionType: 'INSERT',
    actorId: 'EMP-002',
    actorName: 'Maria Santos',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
    oldData: null,
    newData: { name: 'Marketing', branchId: 'b2-uuid', managerId: 'EMP-004' }
  },
  {
    logId: 'a3-uuid',
    tableName: 'branches',
    recordId: 'b2-uuid',
    actionType: 'UPDATE',
    actorId: 'EMP-002',
    actorName: 'Maria Santos',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    oldData: { name: 'Cebu Branch', region: 'Central Visayas', isHeadquarters: false },
    newData: { name: 'Cebu Branch', region: 'Visayas', isHeadquarters: false }
  },

  // Category 2: Access & Session Logs
  {
    logId: 'ac1-uuid',
    tableName: 'system_access',
    recordId: '192.168.1.15',
    actionType: 'LOGIN',
    actorId: 'EMP-002',
    actorName: 'Maria Santos',
    createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    oldData: null,
    newData: { status: 'SUCCESS', method: '2FA_OTP', userAgent: 'Chrome/Win10' }
  },
  {
    logId: 'ac2-uuid',
    tableName: 'system_access',
    recordId: '192.168.1.22',
    actionType: 'LOGOUT',
    actorId: 'EMP-001',
    actorName: 'Adam Roy',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    oldData: null,
    newData: { status: 'SUCCESS', durationSeconds: 14400 }
  },
  {
    logId: 'ac3-uuid',
    tableName: 'system_access',
    recordId: '203.111.42.5',
    actionType: 'LOGIN_FAILED',
    actorId: null,
    actorName: 'Unknown (External)',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    oldData: null,
    newData: { status: 'FAILED', usernameAttempted: 'root', error: 'Invalid credentials. IP temporarily throttled.' }
  },

  // Category 3: Activity Logs (Views, Prints, Generates, Imports/Exports)
  {
    logId: 'act1-uuid',
    tableName: 'documents_portal',
    recordId: 'DOC-EMP-003-CONTRACT',
    actionType: 'VIEW',
    actorId: 'EMP-002',
    actorName: 'Maria Santos',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    oldData: null,
    newData: { docType: 'PDF', employeeOwner: 'Devon Lane', confidentiality: 'RESTRICTED' }
  },
  {
    logId: 'act2-uuid',
    tableName: 'documents_portal',
    recordId: 'DOC-EMP-001-SALARY',
    actionType: 'PRINT',
    actorId: 'EMP-001',
    actorName: 'Adam Roy',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    oldData: null,
    newData: { documentTitle: 'Salary Revision Slip 2026', printer: 'HP-LaserJet-Finance', copies: 1 }
  },
  {
    logId: 'act3-uuid',
    tableName: 'reports_engine',
    actionType: 'GENERATE',
    recordId: 'REP-PAYROLL-MAY-2026',
    actorId: 'EMP-002',
    actorName: 'Maria Santos',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    oldData: null,
    newData: { reportType: 'Payroll Bank Register', format: 'CSV', recordsCount: 15 }
  },
  {
    logId: 'act4-uuid',
    tableName: 'payroll_registers',
    actionType: 'EXPORT',
    recordId: 'PAY-REG-MAY',
    actorId: 'EMP-005',
    actorName: 'Ronald Richards',
    createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    oldData: null,
    newData: { downloadPath: 'payroll_may.xlsx', destinationIp: '192.168.1.109' }
  },

  // Category 4: Compliance Violations / Suspicious Activities
  {
    logId: 'v1-uuid',
    tableName: 'data_compliance',
    recordId: 'BLOCKED_DOWNLOAD',
    actionType: 'VIOLATION',
    actorId: 'EMP-004',
    actorName: 'Sarah Jenkins',
    createdAt: new Date(Date.now() - 3600000 * 25).toISOString(),
    oldData: null,
    newData: { 
      attemptedAction: 'EXPORT', 
      module: 'payroll_registers', 
      reason: 'Access denied due to explicit block override on User Account.' 
    }
  },
  {
    logId: 'v2-uuid',
    tableName: 'data_compliance',
    recordId: 'UNAUTHORIZED_PRINT',
    actionType: 'VIOLATION',
    actorId: 'EMP-006',
    actorName: 'Bessie Cooper',
    createdAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    oldData: null,
    newData: { 
      attemptedAction: 'PRINT', 
      module: 'documents_portal', 
      documentId: 'DOC-CONFIDENTIAL-STRATEGY',
      reason: 'Role (Department Manager) lacks Print permissions.' 
    }
  }
];

export async function GET() {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    
    if (logs.length > 0) {
      // Map database results and merge database values with local structured action records
      return NextResponse.json(logs.map((log: any) => {
        const matchingMock = mockAuditLogs.find(ml => ml.logId === log.logId);
        return {
          logId: log.logId,
          tableName: log.tableName,
          recordId: log.recordId,
          actionType: log.actionType,
          actorId: log.actorId,
          actorName: matchingMock?.actorName || 'System Actor',
          createdAt: log.createdAt,
          oldData: log.oldData,
          newData: log.newData || matchingMock?.newData,
        };
      }));
    }
    return NextResponse.json(mockAuditLogs);
  } catch (error) {
    console.warn('Prisma database connection failed. Falling back to mock audit logs.');
    return NextResponse.json(mockAuditLogs);
  }
}
