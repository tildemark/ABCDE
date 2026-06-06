export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const rawPublicKey = process.env.NEXT_PUBLIC_LICENSE_PUBLIC_KEY;
    const { default: fs } = await import('fs');
    const { default: path } = await import('path');
    const licenseFilePath = path.join(process.cwd(), 'license.txt');
    let licenseKey = '';

    if (fs.existsSync(licenseFilePath)) {
      try {
        licenseKey = fs.readFileSync(licenseFilePath, 'utf8').trim();
      } catch (e) {
        console.error("Failed to read license.txt on startup:", e);
      }
    }

    if (!licenseKey) {
      licenseKey = process.env.LICENSE_KEY || '';
    }

    if (!rawPublicKey) {
      console.error("FATAL: NEXT_PUBLIC_LICENSE_PUBLIC_KEY environment variable is not defined.");
      process.exit(1);
    }

    if (!licenseKey) {
      console.error("FATAL: LICENSE_KEY is not defined (neither in license.txt nor environment).");
      process.exit(1);
    }

    const { verifyLicense } = await import('./utils/verifyLicense');
    const publicKey = rawPublicKey.replace(/\\n/g, '\n');

    try {
      const activeModules = verifyLicense(licenseKey, publicKey);
      console.log("=========================================");
      console.log("License verified successfully on startup!");
      console.log("Active Modules:", activeModules);
      console.log("=========================================");
    } catch (error: any) {
      console.error("FATAL: License verification failed during boot sequence:", error.message);
      process.exit(1);
    }
  }
}
