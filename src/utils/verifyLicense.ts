import crypto from 'crypto';

interface LicensePayload {
  tenant_id: string;
  modules: string[];
  expires: string; // ISO format (YYYY-MM-DD)
}

/**
 * Verifies a base64-encoded license string against a public key.
 * Throws an error if the license signature is invalid or has expired.
 */
export function verifyLicense(licenseString: string, publicKey: string): string[] {
  try {
    // 1. Split the license into the Data Payload and the Signature
    const [payloadBase64, signature] = licenseString.split('.');
    
    if (!payloadBase64 || !signature) {
      throw new Error("License token format is invalid (missing payload or signature).");
    }

    // 2. Verify the mathematical signature using the Public Key
    const isVerified = crypto.createVerify('RSA-SHA256')
      .update(payloadBase64)
      .verify(publicKey, signature, 'base64');

    if (!isVerified) {
      throw new Error("License signature is invalid or forged.");
    }

    // 3. Decode the JSON data and check expiration
    const licenseData: LicensePayload = JSON.parse(
      Buffer.from(payloadBase64, 'base64').toString('utf8')
    );
    
    // Check if license is expired (Ignore check if perpetual date '9999-12-31' is set)
    if (licenseData.expires !== '9999-12-31') {
      const expiryDate = new Date(licenseData.expires);
      if (expiryDate < new Date()) {
        throw new Error(`License expired on ${licenseData.expires}.`);
      }
    }

    // 4. Return the list of authorized modules
    return licenseData.modules;

  } catch (error: any) {
    console.error("CRITICAL: License Verification Failed ->", error.message);
    throw error;
  }
}
