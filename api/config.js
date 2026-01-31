const admin = require('firebase-admin');

const DEFAULT_CONFIG = {
  title: 'Welcome to KitKat Universe',
  bgGradient: 'linear-gradient(135deg, #7c3aed 0%, #d946ef 100%)',
  primaryColor: '#7c3aed',
  secondaryColor: '#d946ef',
  footerColor: '#1a1a1a',
  textColor: '#ffffff',
  commissionsStatus: 'Open',
  links: [],
  contacts: []
};

// --- Firebase Admin SDK setup ---
let db, configRef;
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
      });
    }
  } catch (e) {
    console.error('Firebase admin initialization error', e.stack);
  }
}
if (admin.apps.length) {
  db = admin.firestore();
  configRef = db.collection('settings').doc('main');
}
// --- End of Firebase setup ---

async function getConfig() {
  try {
    if (!configRef) return DEFAULT_CONFIG;
    const doc = await configRef.get();
    if (doc.exists) {
      const data = doc.data();
      return { ...DEFAULT_CONFIG, ...data };
    }
    return DEFAULT_CONFIG;
  } catch (error) {
    console.error('Error reading config from Firebase:', error);
    return DEFAULT_CONFIG;
  }
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const config = await getConfig();
    return { statusCode: 200, headers, body: JSON.stringify(config) };
  } catch (error) {
    console.error('API Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error', details: error.message }) };
  }
};
