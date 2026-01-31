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
  contacts: [],
  leaderboards: {}
};

// --- Firebase Admin SDK setup ---
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
  } catch (e) {
    console.error('Firebase admin initialization error', e.stack);
  }
}
const db = admin.firestore();
const configRef = db.collection('settings').doc('main');
// --- End of Firebase setup ---

async function getConfig() {
  try {
    const doc = await configRef.get();
    if (doc.exists) {
      const data = doc.data();
      // Merge with defaults to ensure all keys are present
      return { ...DEFAULT_CONFIG, ...data };
    }
    // If no config exists in Firebase, return the default
    return DEFAULT_CONFIG;
  } catch (error) {
    console.error('Error reading config from Firebase:', error);
    return DEFAULT_CONFIG;
  }
}

async function saveConfig(config) {
  try {
    // Set with merge to avoid accidentally removing fields
    await configRef.set(config, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('Error saving config to Firebase:', error);
    return { success: false, error: error.message };
  }
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { game, playerName, score } = body;
    const numScore = Number(score);
    
    if (!game || !playerName || isNaN(numScore)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing parameters or invalid score' }) };
    }
    
    const config = await getConfig();
    config.leaderboards = config.leaderboards || {};
    config.leaderboards[game] = config.leaderboards[game] || [];
    
    // Check if player already exists
    const existingIndex = config.leaderboards[game].findIndex(e => e.playerName === playerName);
    
    if (existingIndex >= 0) {
      // Update if new score is higher
      if (numScore > config.leaderboards[game][existingIndex].score) {
        config.leaderboards[game][existingIndex].score = numScore;
      }
    } else {
      // Add new entry
      config.leaderboards[game].push({ playerName, score: numScore });
    }
    
    // Sort by score descending
    config.leaderboards[game].sort((a, b) => b.score - a.score);
    
    const result = await saveConfig(config);
    if (result.success) {
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    } else {
      return { statusCode: 500, headers, body: JSON.stringify({ error: result.error || 'Failed to save leaderboard' }) };
    }
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};