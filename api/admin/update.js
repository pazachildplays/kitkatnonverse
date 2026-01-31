const admin = require('firebase-admin');

const DEFAULT_CONFIG = {
  title: 'Welcome to KitKat Universe',
  bgGradient: 'linear-gradient(135deg, #7c3aed 0%, #d946ef 100%)',
  primaryColor: '#7c3aed',
  secondaryColor: '#d946ef',
  footerColor: '#1a1a1a',
  textColor: '#ffffff',
  commissionsStatus: 'Open',
  links: [
    { id: 1, name: 'Twitter', url: 'https://x.com/KitkatUvU', icon: '𝕏' },
    { id: 2, name: 'Twitch', url: 'https://www.twitch.tv/kitkaturvu', icon: '📺' },
    { id: 3, name: 'Tiktok', url: 'https://www.tiktok.com/@kitkat.uvu', icon: '🎵' },
    { id: 4, name: 'Youtube', url: 'https://www.youtube.com/@KitKatUvU', icon: '▶️' },
    { id: 5, name: 'VGen', url: 'https://vgen.co/kitkaturvu', icon: '🎨' }
  ],
  contacts: [
    { id: 1, type: 'email', label: 'Email', value: 'contact@kitkat.com', icon: '📧' },
    { id: 2, type: 'phone', label: 'Phone', value: '+1 (555) 123-4567', icon: '📱' }
  ]
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
    if (!configRef) throw new Error('Database not initialized');
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
    const { password, updates } = body;

    if (password !== process.env.ADMIN_PASSWORD) {
      return { statusCode: 401, headers, body: JSON.stringify({ success: false, message: 'Invalid password' }) };
    }

    const config = await getConfig();
    const updatedConfig = { ...config, ...updates };

    const result = await saveConfig(updatedConfig);
    if (result.success) {
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, config: updatedConfig }) };
    } else {
      return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: result.error || 'Error saving config' }) };
    }
  } catch (error) {
    console.error('Update API Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error', details: error.message }) };
  }
};
