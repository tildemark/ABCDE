import crypto from 'crypto';

interface LicensePayload {
  tenant_id: string;
  modules: string[];
  max_seats?: number;
  seats_per_module?: Record<string, number>;
  expires: string;
}

export function verifyLicense(licenseString: string, publicKey: string): string[] {
  try {
    const [payloadBase64, signature] = licenseString.split('.');
    if (!payloadBase64 || !signature) {
      throw new Error("Invalid license token format.");
    }

    const isVerified = crypto.createVerify('RSA-SHA256')
      .update(payloadBase64)
      .verify(publicKey, signature, 'base64');

    if (!isVerified) {
      throw new Error("License signature is invalid or forged.");
    }

    const licenseData: LicensePayload = JSON.parse(
      Buffer.from(payloadBase64, 'base64').toString('utf8')
    );

    if (licenseData.expires !== '9999-12-31') {
      const expiryDate = new Date(licenseData.expires);
      if (expiryDate < new Date()) {
        throw new Error("License has expired.");
      }
    }

    return licenseData.modules;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("CRITICAL: License Verification Failed ->", message);
    throw error;
  }
}