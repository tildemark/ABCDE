import { NextRequest, NextResponse } from 'next/server';
import { verifyLicense } from '@/utils/verifyLicense';
import fs from 'fs';
import path from 'path';

const LICENSE_FILE_PATH = path.join(process.cwd(), 'license.txt');
let memoryLicenseKey: string | null = null;

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
    };
  } catch (e) {
    return null;
  }
}

export async function GET() {
  try {
    const rawPublicKey = process.env.NEXT_PUBLIC_LICENSE_PUBLIC_KEY;
    const licenseKey = getLicenseKey();

    if (!rawPublicKey) {
      return NextResponse.json({ activeModules: [], error: 'Public verification key missing' }, { status: 500 });
    }

    const publicKey = rawPublicKey.replace(/\\n/g, '\n');
    const parsed = parseLicensePayload(licenseKey);

    try {
      const activeModules = verifyLicense(licenseKey, publicKey);
      return NextResponse.json({
        activeModules,
        expires: parsed?.expires || 'Unknown',
        tenantId: parsed?.tenantId || 'Unknown',
        licenseKey,
        status: 'Valid',
      });
    } catch (err: any) {
      return NextResponse.json({
        activeModules: [],
        expires: parsed?.expires || 'Unknown',
        tenantId: parsed?.tenantId || 'Unknown',
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

    const rawPublicKey = process.env.NEXT_PUBLIC_LICENSE_PUBLIC_KEY;
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

    return NextResponse.json({
      success: true,
      activeModules,
      expires: parsed?.expires || 'Unknown',
      tenantId: parsed?.tenantId || 'Unknown',
      status: 'Valid',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
