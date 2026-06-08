import { NextRequest, NextResponse } from 'next/server';
import { verifyLicense } from '@/utils/verifyLicense';
import { getSeatConsumption } from '@/lib/permissions';
import { prisma } from '@/lib/db';
import fs from 'fs';
import path from 'path';

const LICENSE_FILE_PATH = path.join(process.cwd(), 'license.txt');
const PUBLIC_KEY_FILE_PATH = path.join(process.cwd(), 'license_public_key.pub');
let memoryLicenseKey: string | null = null;

function getPublicKey(): string {
  if (fs.existsSync(PUBLIC_KEY_FILE_PATH)) {
    try {
      return fs.readFileSync(PUBLIC_KEY_FILE_PATH, 'utf8').trim();
    } catch (e) {
      console.error('Failed to read license_public_key.pub:', e);
    }
  }
  return '';
}

function getLicenseKey(): string {
  if (memoryLicenseKey) return memoryLicenseKey;
  if (fs.existsSync(LICENSE_FILE_PATH)) {
    try {
      const savedKey = fs.readFileSync(LICENSE_FILE_PATH, 'utf8').trim();
      if (savedKey) {
        return savedKey;
      }
    } catch (e) {
      console.error('Failed to read license.txt:', e);
    }
  }
  return process.env.LICENSE_KEY || '';
}

function parseLicensePayload(licenseKey: string) {
  try {
    const [payloadBase64] = licenseKey.split('.');
    if (!payloadBase64) return null;
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
    return {
      expires: payload.expires,
      tenantId: payload.tenant_id,
      maxSeats: payload.max_seats || null,
      seatsPerModule: payload.seats_per_module || null,
    };
  } catch (e) {
    return null;
  }
}

export async function GET() {
  try {
    const rawPublicKey = getPublicKey();
    const licenseKey = getLicenseKey();

    if (!rawPublicKey) {
      return NextResponse.json({ activeModules: [], error: 'Public verification key missing' }, { status: 500 });
    }

    const publicKey = rawPublicKey.replace(/\\n/g, '\n');
    const parsed = parseLicensePayload(licenseKey);

    let tenantId = 't1-uuid';
    try {
      if (prisma) {
        const tenant = await prisma.tenant.findFirst();
        if (tenant) {
          tenantId = tenant.id;
        }
      }
    } catch (e: any) {
      console.warn('Prisma tenant query failed, using default tenant ID:', e.message);
    }
    const seatInfo = await getSeatConsumption(tenantId);

    try {
      const activeModules = verifyLicense(licenseKey, publicKey);
      return NextResponse.json({
        activeModules,
        expires: parsed?.expires || 'Unknown',
        tenantId: parsed?.tenantId || 'Unknown',
        maxSeats: parsed?.maxSeats || null,
        seatsPerModule: parsed?.seatsPerModule || null,
        currentActiveUsers: seatInfo.currentActiveUsers,
        currentSeatsPerModule: seatInfo.currentSeatsPerModule,
        licenseKey,
        status: 'Valid',
      });
    } catch (err: any) {
      return NextResponse.json({
        activeModules: [],
        expires: parsed?.expires || 'Unknown',
        tenantId: parsed?.tenantId || 'Unknown',
        maxSeats: null,
        seatsPerModule: null,
        currentActiveUsers: seatInfo.currentActiveUsers,
        currentSeatsPerModule: seatInfo.currentSeatsPerModule,
        licenseKey,
        status: 'Invalid / Expired',
        error: err.message,
      });
    }
  } catch (error: any) {
    return NextResponse.json({ activeModules: [], error: error.message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { licenseKey } = body;

    if (!licenseKey) {
      return NextResponse.json({ error: 'License key is required' }, { status: 400 });
    }

    const rawPublicKey = getPublicKey();
    if (!rawPublicKey) {
      return NextResponse.json({ error: 'Public verification key missing' }, { status: 500 });
    }

    const publicKey = rawPublicKey.replace(/\\n/g, '\n');
    
    // Validate first before saving
    let activeModules: string[] = [];
    try {
      activeModules = verifyLicense(licenseKey, publicKey);
    } catch (err: any) {
      return NextResponse.json({ error: `Invalid license key: ${err.message}` }, { status: 400 });
    }

    const parsed = parseLicensePayload(licenseKey);

    // Save to disk
    fs.writeFileSync(LICENSE_FILE_PATH, licenseKey, 'utf8');
    memoryLicenseKey = licenseKey;

    let tenantId = 't1-uuid';
    try {
      if (prisma) {
        const tenant = await prisma.tenant.findFirst();
        if (tenant) {
          tenantId = tenant.id;
        }
      }
    } catch (e: any) {
      console.warn('Prisma tenant query failed in POST, using default tenant ID:', e.message);
    }
    const seatInfo = await getSeatConsumption(tenantId);

    return NextResponse.json({
      success: true,
      activeModules,
      expires: parsed?.expires || 'Unknown',
      tenantId: parsed?.tenantId || 'Unknown',
      maxSeats: parsed?.maxSeats || null,
      seatsPerModule: parsed?.seatsPerModule || null,
      currentActiveUsers: seatInfo.currentActiveUsers,
      currentSeatsPerModule: seatInfo.currentSeatsPerModule,
      status: 'Valid',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
