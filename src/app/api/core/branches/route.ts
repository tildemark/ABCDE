import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

let mockBranches = [
  { 
    id: 'b1-uuid', 
    name: 'ACME Holdings Group', 
    parentId: null,
    region: 'Metro Manila', 
    isHeadquarters: true, 
    address: 'ACME Tower, 12th Floor,\nSen. Gil Puyat Ave, Bel-Air,\nMakati City, 1209 Metro Manila',
    registeredTin: '123-456-789-000',
    sssId: '03-9123456-7',
    philhealthId: '01-023456789-1',
    pagibigId: '1210-9876-5432',
    birBranchCode: '00000',
    rdoCode: '047',
    entityType: 'HOLDING',
    createdAt: new Date().toISOString() 
  },
  { 
    id: 'b2-uuid', 
    name: 'ACME Cebu Subsidiary', 
    parentId: 'b1-uuid',
    region: 'Visayas', 
    isHeadquarters: false, 
    address: 'HM Tower, 7th Floor,\nGeonzon St, Cebu IT Park,\nLahug, Cebu City, 6000 Cebu',
    registeredTin: '123-456-789-001',
    sssId: '03-9123456-8',
    philhealthId: '01-023456789-2',
    pagibigId: '1210-9876-5433',
    birBranchCode: '00001',
    rdoCode: '083',
    entityType: 'SUBSIDIARY',
    createdAt: new Date().toISOString() 
  },
  { 
    id: 'b3-uuid', 
    name: 'ACME Cebu Subsidiary - Cebu Branch', 
    parentId: 'b2-uuid',
    region: 'Visayas', 
    isHeadquarters: false, 
    address: 'HM Tower, 7th Floor,\nGeonzon St, Cebu IT Park,\nLahug, Cebu City, 6000 Cebu',
    registeredTin: '123-456-789-001',
    sssId: '03-9123456-8',
    philhealthId: '01-023456789-2',
    pagibigId: '1210-9876-5433',
    birBranchCode: '00001',
    rdoCode: '083',
    entityType: 'BRANCH',
    createdAt: new Date().toISOString() 
  },
  { 
    id: 'b4-uuid', 
    name: 'ACME Affiliate Ltd', 
    parentId: null,
    region: 'Mindanao', 
    isHeadquarters: false, 
    address: 'Damosa Gateway, Tower B,\nLanang, Davao City, 8000 Davao del Sur',
    registeredTin: '123-456-789-002',
    sssId: '03-9123456-9',
    philhealthId: '01-023456789-3',
    pagibigId: '1210-9876-5434',
    birBranchCode: '00002',
    rdoCode: '113',
    entityType: 'AFFILIATE',
    createdAt: new Date().toISOString() 
  },
  { 
    id: 'b5-uuid', 
    name: 'ACME Sister Corp', 
    parentId: 'b1-uuid',
    region: 'Luzon', 
    isHeadquarters: false, 
    address: 'Clark Freeport Zone, Pampanga',
    registeredTin: '123-456-789-005',
    sssId: '03-9123456-5',
    philhealthId: '01-023456789-5',
    pagibigId: '1210-9876-5435',
    birBranchCode: '00005',
    rdoCode: '021',
    entityType: 'SUBSIDIARY',
    createdAt: new Date().toISOString() 
  },
];

// Helper validation function
function validateBranchRelation(body: any, allBranches: any[]) {
  const { id, name, parentId, entityType } = body;
  const isRoot = !parentId;

  if (!name) return 'Branch name is required';

  if ((entityType === 'HOLDING' || entityType === 'AFFILIATE') && !isRoot) {
    return `${entityType === 'HOLDING' ? 'Holding Company' : 'Affiliate'} cannot have a parent company.`;
  }

  if (entityType === 'HOLDING') {
    const hasExistingHolding = allBranches.some(b => b.entityType === 'HOLDING' && b.id !== id);
    if (hasExistingHolding) {
      return 'Only one Holding Company is allowed at the root level.';
    }
  }

  if ((entityType === 'BRANCH' || entityType === 'SUBSIDIARY') && isRoot) {
    return `${entityType === 'BRANCH' ? 'Branch' : 'Subsidiary'} must have a parent entity.`;
  }

  if (parentId) {
    const parent = allBranches.find(b => b.id === parentId);
    if (!parent) return 'Selected parent entity not found.';

    if (parent.entityType !== 'HOLDING' && parent.entityType !== 'SUBSIDIARY') {
      return `A parent entity must be a Holding Company or a Subsidiary. "${parent.name}" is a ${parent.entityType}.`;
    }

    if (parent.entityType === 'HOLDING' && entityType !== 'BRANCH' && entityType !== 'SUBSIDIARY') {
      return 'A Holding Company can only have Branches or Subsidiaries as children.';
    }

    if (parent.entityType === 'SUBSIDIARY' && entityType !== 'BRANCH' && entityType !== 'SUBSIDIARY') {
      return 'A Subsidiary can only have Branches or Subsidiaries as children.';
    }

    if (entityType === 'BRANCH' && !name.startsWith(`${parent.name} -`)) {
      return `A branch name must start with its parent company's name followed by a hyphen (e.g., "${parent.name} - Moon Branch").`;
    }
  }

  return null;
}

export async function GET() {
  try {
    const branches = await prisma.branch.findMany({
      orderBy: { name: 'asc' },
    });
    
    if (branches.length > 0) {
      return NextResponse.json(branches.map((b: any) => ({
        id: b.id,
        name: b.name,
        parentId: b.parentId || null,
        region: b.region,
        isHeadquarters: b.isHeadquarters,
        address: b.address || 'Philippine Office Location Address',
        registeredTin: b.registeredTin || '',
        sssId: b.sssId || '',
        philhealthId: b.philhealthId || '',
        pagibigId: b.pagibigId || '',
        birBranchCode: b.birBranchCode || '',
        rdoCode: b.rdoCode || '',
        entityType: b.entityType || 'BRANCH',
        createdAt: b.createdAt,
      })));
    }
    return NextResponse.json(mockBranches);
  } catch (error) {
    console.warn('Prisma database connection failed. Falling back to mock branches.');
    return NextResponse.json(mockBranches);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, parentId, region, isHeadquarters, address, registeredTin, sssId, philhealthId, pagibigId, birBranchCode, rdoCode, entityType } = body;

    // Get current list for validation
    let currentBranches: any[] = [];
    try {
      currentBranches = await prisma.branch.findMany();
    } catch {
      currentBranches = mockBranches;
    }

    const valErr = validateBranchRelation(body, currentBranches);
    if (valErr) {
      return NextResponse.json({ error: valErr }, { status: 400 });
    }

    try {
      if (isHeadquarters) {
        await prisma.branch.updateMany({
          data: { isHeadquarters: false },
        });
      }
      
      const newBranch = await prisma.branch.create({
        data: {
          name,
          parentId: parentId || null,
          region,
          isHeadquarters: !!isHeadquarters,
          registeredTin,
          sssId,
          philhealthId,
          pagibigId,
          birBranchCode,
          rdoCode,
          entityType: entityType || 'BRANCH',
        },
      });
      return NextResponse.json({
        id: newBranch.id,
        name: newBranch.name,
        parentId: newBranch.parentId || null,
        region: newBranch.region,
        isHeadquarters: newBranch.isHeadquarters,
        address: address || 'No address specified',
        registeredTin: newBranch.registeredTin,
        sssId: newBranch.sssId,
        philhealthId: newBranch.philhealthId,
        pagibigId: newBranch.pagibigId,
        birBranchCode: newBranch.birBranchCode,
        rdoCode: newBranch.rdoCode,
        entityType: newBranch.entityType,
        createdAt: newBranch.createdAt,
      });
    } catch (dbError) {
      console.warn('Prisma insert failed. Inserting into mock branches.');
      if (isHeadquarters) {
        mockBranches = mockBranches.map(b => ({ ...b, isHeadquarters: false }));
      }
      const newMock = {
        id: `mock-branch-${Date.now()}`,
        name,
        parentId: parentId || null,
        region: region || '',
        isHeadquarters: !!isHeadquarters,
        address: address || '',
        registeredTin: registeredTin || '',
        sssId: sssId || '',
        philhealthId: philhealthId || '',
        pagibigId: pagibigId || '',
        birBranchCode: birBranchCode || '',
        rdoCode: rdoCode || '',
        entityType: entityType || 'BRANCH',
        createdAt: new Date().toISOString(),
      };
      mockBranches.push(newMock);
      return NextResponse.json(newMock);
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, parentId, region, isHeadquarters, address, registeredTin, sssId, philhealthId, pagibigId, birBranchCode, rdoCode, entityType } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'Branch ID and name are required' }, { status: 400 });
    }

    let currentBranches: any[] = [];
    try {
      currentBranches = await prisma.branch.findMany();
    } catch {
      currentBranches = mockBranches;
    }

    const valErr = validateBranchRelation(body, currentBranches);
    if (valErr) {
      return NextResponse.json({ error: valErr }, { status: 400 });
    }

    try {
      if (isHeadquarters) {
        await prisma.branch.updateMany({
          data: { isHeadquarters: false },
        });
      }
      
      const updated = await prisma.branch.update({
        where: { id },
        data: { 
          name, 
          parentId: parentId || null,
          region, 
          isHeadquarters: !!isHeadquarters,
          registeredTin,
          sssId,
          philhealthId,
          pagibigId,
          birBranchCode,
          rdoCode,
          entityType: entityType || 'BRANCH',
        },
      });
      return NextResponse.json({
        id: updated.id,
        name: updated.name,
        parentId: updated.parentId || null,
        region: updated.region,
        isHeadquarters: updated.isHeadquarters,
        address: address || 'No address specified',
        registeredTin: updated.registeredTin,
        sssId: updated.sssId,
        philhealthId: updated.philhealthId,
        pagibigId: updated.pagibigId,
        birBranchCode: updated.birBranchCode,
        rdoCode: updated.rdoCode,
        entityType: updated.entityType,
      });
    } catch (dbError) {
      console.warn('Prisma update failed. Updating mock branch.');
      if (isHeadquarters) {
        mockBranches = mockBranches.map(b => ({ ...b, isHeadquarters: false }));
      }
      mockBranches = mockBranches.map(b => 
        b.id === id ? { 
          ...b, 
          name, 
          parentId: parentId !== undefined ? (parentId || null) : b.parentId,
          region, 
          isHeadquarters: !!isHeadquarters, 
          address: address || b.address,
          registeredTin: registeredTin ?? b.registeredTin,
          sssId: sssId ?? b.sssId,
          philhealthId: philhealthId ?? b.philhealthId,
          pagibigId: pagibigId ?? b.pagibigId,
          birBranchCode: birBranchCode ?? b.birBranchCode,
          rdoCode: rdoCode ?? b.rdoCode,
          entityType: entityType ?? b.entityType,
        } : b
      );
      const updatedMock = mockBranches.find(b => b.id === id);
      return NextResponse.json(updatedMock || { id, name, parentId: parentId || null, region, isHeadquarters, address, registeredTin, sssId, philhealthId, pagibigId, birBranchCode, rdoCode, entityType });
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
      return NextResponse.json({ error: 'Branch ID is required' }, { status: 400 });
    }

    try {
      await prisma.branch.delete({
        where: { id },
      });
      return NextResponse.json({ success: true });
    } catch (dbError) {
      console.warn('Prisma delete failed. Deleting from mock branches.');
      mockBranches = mockBranches.filter(b => b.id !== id);
      return NextResponse.json({ success: true });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
