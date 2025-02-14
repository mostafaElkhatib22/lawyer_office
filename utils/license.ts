const { v4: uuidv4 } = require('uuid');
const cryptoModule = require('crypto');
const { machineIdSync } = require('node-machine-id');

// استخراج معرف الجهاز
const machineId: string = machineIdSync();
console.log('Machine ID:', machineId);

// إنشاء مفتاح الترخيص
const generateLicenseKey = (machineId: string): string => {
    const secret = process.env.SECRET;  // المفتاح السري الخاص بيك
    console.log('Using Secret:', secret);

    const hash = cryptoModule.createHmac('sha256', secret)
                       .update(machineId)
                       .digest('hex');
    console.log('Generated Hash:', hash);

    return `${uuidv4()}-${hash}`;
}

// تحقق المفتاح
const verifyLicenseKey = (licenseKey: string, machineId: string): boolean => {
    const secret = process.env.SECRET;  // المفتاح السري الخاص بيك
    console.log('Using Secret for Verification:', secret);

    const uuidAndHash = licenseKey.split('-');
    const uuid = uuidAndHash.slice(0, 5).join('-');
    const hash = uuidAndHash.slice(5).join('-');
    console.log('Extracted UUID:', uuid);
    console.log('Extracted Hash:', hash);

    const validHash = cryptoModule.createHmac('sha256', secret)
                            .update(machineId)
                            .digest('hex');
    console.log('Valid Hash:', validHash);

    return hash === validHash;
}

// استخدام الكود:
const licenseKey: string = generateLicenseKey(machineId);
console.log('Generated License Key:', licenseKey);

const isValid: boolean = verifyLicenseKey(licenseKey, machineId);
console.log('Is License Key Valid?', isValid);
