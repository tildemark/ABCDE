import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Mock Tenant storage expanded with address, telephone, email, website, logo, and hierarchy
let mockTenant = {
  id: 'acme-corp',
  corporateName: 'ACME Corporation Inc.',
  registeredTin: '123-456-789-000',
  industry: 'Technology & Services',
  logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&h=150&q=80',
  address: 'ACME Tower, 12th Floor,\nSen. Gil Puyat Ave, Bel-Air,\nMakati City, 1209 Metro Manila,\nPhilippines',
  telephone: '+63 (2) 8888-1234',
  email: 'ops@acme-corp.com',
  website: 'https://www.acme-corp.com',
  secRegistration: 'SEC-CS201509876',
  sssId: '03-9123456-7',
  philhealthId: '01-023456789-1',
  pagibigId: '1210-9876-5432',
  birBranchCode: '00000',
  rdoCode: '047',
  companyType: 'OPERATING',
  parentTenantId: '',
};

let mockTenants = [
  mockTenant,
  {
    id: 'holding-corp',
    corporateName: 'ACME Corporate Holdings Corp.',
    registeredTin: '987-654-321-000',
    industry: 'Conglomerate & Finance',
    logoUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=150&h=150&q=80',
    address: 'Holdings Tower, 30th Floor, Ayala Ave, Makati City',
    telephone: '+63 (2) 7777-9999',
    email: 'relations@acme-holdings.com',
    website: 'https://www.acme-holdings.com',
    secRegistration: 'SEC-CS201012345',
    sssId: '03-1111222-3',
    philhealthId: '01-222233334-5',
    pagibigId: '1210-1111-2222',
    birBranchCode: '00000',
    rdoCode: '047',
    companyType: 'HOLDING',
    parentTenantId: '',
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listAll = searchParams.get('list') === 'true';

    if (listAll) {
      try {
        const dbTenants = await prisma.tenant.findMany({
          orderBy: { corporateName: 'asc' }
        });
        if (dbTenants.length > 0) {
          return NextResponse.json(dbTenants);
        }
        return NextResponse.json(mockTenants);
      } catch {
        return NextResponse.json(mockTenants);
      }
    }

    const tenant = await prisma.tenant.findFirst();
    if (tenant) {
      return NextResponse.json({
        ...mockTenant,
        ...tenant,
      });
    }
    return NextResponse.json(mockTenant);
  } catch (error) {
    console.warn('Prisma database connection failed. Falling back to mock Tenant data.');
    return NextResponse.json(mockTenant);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      corporateName, 
      registeredTin, 
      industry, 
      logoUrl, 
      address, 
      telephone, 
      email, 
      website, 
      secRegistration,
      sssId,
      philhealthId,
      pagibigId,
      birBranchCode,
      rdoCode,
      companyType,
      parentTenantId
    } = body;

    try {
      const existing = await prisma.tenant.findFirst();
      if (existing) {
        const updated = await prisma.tenant.update({
          where: { id: existing.id },
          data: { 
            corporateName, 
            registeredTin, 
            industry,
            sssId,
            philhealthId,
            pagibigId,
            birBranchCode,
            rdoCode,
            companyType,
            parentTenantId: parentTenantId || null,
          },
        });
        
        return NextResponse.json({
          ...body,
          ...updated,
        });
      } else {
        const created = await prisma.tenant.create({
          data: {
            corporateName: corporateName || 'ACME Corporation Inc.',
            registeredTin,
            industry,
            sssId,
            philhealthId,
            pagibigId,
            birBranchCode,
            rdoCode,
            companyType,
            parentTenantId: parentTenantId || null,
          },
        });
        return NextResponse.json({
          ...body,
          ...created,
        });
      }
    } catch (dbError) {
      console.warn('Prisma db update failed. Updating mock Tenant state.');
      mockTenant = {
        ...mockTenant,
        corporateName: corporateName ?? mockTenant.corporateName,
        registeredTin: registeredTin ?? mockTenant.registeredTin,
        industry: industry ?? mockTenant.industry,
        logoUrl: logoUrl ?? mockTenant.logoUrl,
        address: address ?? mockTenant.address,
        telephone: telephone ?? mockTenant.telephone,
        email: email ?? mockTenant.email,
        website: website ?? mockTenant.website,
        secRegistration: secRegistration ?? mockTenant.secRegistration,
        sssId: sssId ?? mockTenant.sssId,
        philhealthId: philhealthId ?? mockTenant.philhealthId,
        pagibigId: pagibigId ?? mockTenant.pagibigId,
        birBranchCode: birBranchCode ?? mockTenant.birBranchCode,
        rdoCode: rdoCode ?? mockTenant.rdoCode,
        companyType: companyType ?? mockTenant.companyType,
        parentTenantId: parentTenantId ?? mockTenant.parentTenantId,
      };
      // Keep mockTenants list updated as well
      mockTenants = mockTenants.map(t => t.id === mockTenant.id ? mockTenant : t);
      return NextResponse.json(mockTenant);
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
