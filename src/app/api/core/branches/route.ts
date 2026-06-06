import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

let mockBranches = [
  { 
    id: 'b1-uuid', 
    name: 'Manila Head Office', 
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
    entityType: 'BRANCH',
    createdAt: new Date().toISOString() 
  },
  { 
    id: 'b2-uuid', 
    name: 'Cebu Branch', 
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
    name: 'Davao Office', 
    parentId: 'b1-uuid',
    region: 'Mindanao', 
    isHeadquarters: false, 
    address: 'Damosa Gateway, Tower B,\nLanang, Davao City, 8000 Davao del Sur',
    registeredTin: '123-456-789-002',
    sssId: '03-9123456-9',
    philhealthId: '01-023456789-3',
    pagibigId: '1210-9876-5434',
    birBranchCode: '00002',
    rdoCode: '113',
    entityType: 'SISTER_COMPANY',
    createdAt: new Date().toISOString() 
  },
];

export async function GET() {
  try {
    const branches = await prisma.branch.findMany({
      orderBy: { name: 'asc' },
    });
    
    if (branches.length > 0) {
      // Map database results and attach mock properties if database fields are missing
      return NextResponse.json(branches.map((b: any) => {
        const found = mockBranches.find(mb => mb.id === b.id);
        return {
          id: b.id,
          name: b.name,
          parentId: b.parentId || found?.parentId || null,
          region: b.region,
          isHeadquarters: b.isHeadquarters,
          address: b.address || found?.address || 'Philippine Office Location Address',
          registeredTin: b.registeredTin || found?.registeredTin || '',
          sssId: b.sssId || found?.sssId || '',
          philhealthId: b.philhealthId || found?.philhealthId || '',
          pagibigId: b.pagibigId || found?.pagibigId || '',
          birBranchCode: b.birBranchCode || found?.birBranchCode || '',
          rdoCode: b.rdoCode || found?.rdoCode || '',
          entityType: b.entityType || found?.entityType || 'BRANCH',
          createdAt: b.createdAt,
        };
      }));
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

    if (!name) {
      return NextResponse.json({ error: 'Branch name is required' }, { status: 400 });
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
        } as any,
      });
      return NextResponse.json({
        id: newBranch.id,
        name: newBranch.name,
        parentId: (newBranch as any).parentId || parentId || null,
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
        } as any,
      });
      return NextResponse.json({
        id: updated.id,
        name: updated.name,
        parentId: (updated as any).parentId || parentId || null,
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
          parentId: parentId !== undefined ? parentId : b.parentId,
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
