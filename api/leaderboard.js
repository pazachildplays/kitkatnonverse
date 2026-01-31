const admin = require('firebase-admin');

const DEFAULT_CONFIG = {
  leaderboards: {}
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
      return data || DEFAULT_CONFIG;
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
    const game = event.queryStringParameters.game;
    
    if (!game) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing game parameter' }) };
    }
    
    const config = await getConfig();
    const leaderboard = config.leaderboards?.[game] || [];
    
    return { statusCode: 200, headers, body: JSON.stringify(leaderboard) };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
