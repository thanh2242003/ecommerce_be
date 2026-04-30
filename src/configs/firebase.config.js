const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const loadServiceAccount = () => {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    }

    const envPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    if (envPath && fs.existsSync(envPath)) {
        return JSON.parse(fs.readFileSync(envPath, 'utf8'));
    }

    const defaultPath = path.join(__dirname, '../firebase-key.json');
    if (fs.existsSync(defaultPath)) {
        return JSON.parse(fs.readFileSync(defaultPath, 'utf8'));
    }

    throw new Error(
        'Firebase service account not found. Set FIREBASE_SERVICE_ACCOUNT_PATH, FIREBASE_SERVICE_ACCOUNT_JSON, or provide src/firebase-key.json'
    );
};

if (!admin.apps.length) {
    const serviceAccount = loadServiceAccount();
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

module.exports = admin;
