import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Mock tenant modules derived from the license key (when DB is offline)
const MOCK_TENANT_MODULES = [
  { id: 'tm-core', moduleCode: 'CORE', name: 'Core Setup & Settings', category: 'Core', isActive: true, activatedAt: '2024-01-01', expiresAt: null, maxSeats: null, isAlwaysOn: true },
  { id: 'tm-hr', moduleCode: 'HUMAN_RESOURCES', name: 'HRIS Directory', category: 'HR', isActive: true, activatedAt: '2024-01-01', expiresAt: null, maxSeats: null, isAlwaysOn: false },
  { id: 'tm-time', moduleCode: 'TIMEKEEPING', name: 'Timekeeping & Biometrics', category: 'Operations', isActive: true, activatedAt: '2024-01-01', expiresAt: null, maxSeats: null, isAlwaysOn: false },
  { id: 'tm-pay', moduleCode: 'PAYROLL', name: 'Payroll & Ledger', category: 'Finance', isActive: false, activatedAt: null, expiresAt: null, maxSeats: null, isAlwaysOn: false },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId') || 't1-uuid';

  try {
    const rows = await prisma.tenantModule.findMany({
      where: { tenantId },
      orderBy: { moduleCode: 'asc' },
    });

    if (rows.length > 0) {
      return NextResponse.json(rows.map((r: any) => ({
        id: r.id,
        moduleCode: r.moduleCode,
        isActive: r.isActive,
        activatedAt: r.activatedAt,
        expiresAt: r.expiresAt,
        maxSeats: r.maxSeats,
        isAlwaysOn: r.moduleCode === 'CORE',
      })));
    }

    return NextResponse.json(MOCK_TENANT_MODULES);
  } catch {
    return NextResponse.json(MOCK_TENANT_MODULES);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId = 't1-uuid', moduleCode, maxSeats, expiresAt } = body;

    if (!moduleCode) {
      return NextResponse.json({ error: 'moduleCode is required' }, { status: 400 });
    }

    try {
      const result = await prisma.tenantModule.upsert({
        where: { tenantId_moduleCode: { tenantId, moduleCode } },
        create: {
          tenantId,
          moduleCode,
          isActive: true,
          maxSeats: maxSeats || null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
        update: {
          isActive: true,
          maxSeats: maxSeats !== undefined ? maxSeats : undefined,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        },
      });
      return NextResponse.json({ success: true, module: result });
    } catch {
      // Mock fallback: toggle isActive in mock
      const idx = MOCK_TENANT_MODULES.findIndex(m => m.moduleCode === moduleCode);
      if (idx >= 0) {
        MOCK_TENANT_MODULES[idx].isActive = true;
        MOCK_TENANT_MODULES[idx].activatedAt = new Date().toISOString().split('T')[0];
      }
      return NextResponse.json({ success: true, module: MOCK_TENANT_MODULES[idx] });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId') || 't1-uuid';
  const moduleCode = searchParams.get('moduleCode');

  if (!moduleCode) {
    return NextResponse.json({ error: 'moduleCode is required' }, { status: 400 });
  }
  if (moduleCode === 'CORE') {
    return NextResponse.json({ error: 'CORE module cannot be deactivated' }, { status: 400 });
  }

  try {
    await prisma.tenantModule.update({
      where: { tenantId_moduleCode: { tenantId, moduleCode } },
      data: { isActive: false },
    });
    return NextResponse.json({ success: true });
  } catch {
    const idx = MOCK_TENANT_MODULES.findIndex(m => m.moduleCode === moduleCode);
    if (idx >= 0) MOCK_TENANT_MODULES[idx].isActive = false;
    return NextResponse.json({ success: true });
  }
}
