import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const mockWorkflows = {
  active: [
    {
      id: 'w1-uuid',
      workflowType: 'DATA_RETENTION_SCRUB',
      status: 'PENDING_SLEEP',
      currentStep: 'WAIT_5_YEARS',
      payload: { employeeId: 'EMP-006', resignedDate: '2025-06-01', purgeScheduled: '2030-06-01' },
      createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), // 3 days ago
    },
    {
      id: 'w2-uuid',
      workflowType: 'LEAVE_APPROVAL_ESCALATION',
      status: 'RUNNING',
      currentStep: 'ALERT_LINE_MANAGER',
      payload: { leaveRequestId: 'leave-102', applicantId: 'EMP-003', managerId: 'EMP-002', timeoutSeconds: 86400 },
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
    },
  ],
  history: [
    {
      id: 'w3-uuid',
      workflowType: 'BIOMETRIC_PUNCH_SYNC',
      status: 'COMPLETED',
      currentStep: 'SYNCED_SUCCESSFULLY',
      payload: { terminalId: 'ZKT-K14-HQ', recordsProcessed: 184, syncTime: '2026-06-05T12:00:00Z' },
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString(), // 8 hours ago
    },
    {
      id: 'w4-uuid',
      workflowType: 'DATA_RETENTION_SCRUB',
      status: 'COMPLETED',
      currentStep: 'ANONYMIZED_PI_SPI',
      payload: { employeeId: 'EMP-999', s3FilesDeleted: ['contract_999.pdf', 'tin_card_999.jpg'] },
      createdAt: new Date(Date.now() - 3600000 * 240).toISOString(), // 10 days ago
    },
  ],
};

export async function GET() {
  try {
    // In our schema.prisma there is no Workflow table.
    // If it existed, we would do a prisma query here.
    // But since it is not defined yet, this will throw, hitting our catch block and falling back to mock workflows.
    const dbWorkflows = await (prisma as any).workflow.findMany();
    return NextResponse.json(dbWorkflows);
  } catch (error) {
    console.warn('Prisma workflow query failed or model undefined. Falling back to mock workflows.');
    return NextResponse.json(mockWorkflows);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflowType, payload } = body;

    // Simulate scheduling a new workflow
    const newWorkflow = {
      id: `mock-wf-${Date.now()}`,
      workflowType: workflowType || 'TEST_WORKFLOW',
      status: 'RUNNING',
      currentStep: 'INITIALIZING',
      payload: payload || {},
      createdAt: new Date().toISOString(),
    };
    
    mockWorkflows.active.unshift(newWorkflow);
    return NextResponse.json(newWorkflow);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
