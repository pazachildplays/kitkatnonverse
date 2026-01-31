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
    const { password } = body;

    if (password === process.env.ADMIN_PASSWORD) {
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Login successful' }) };
    } else {
      return { statusCode: 401, headers, body: JSON.stringify({ success: false, message: 'Invalid password' }) };
    }
  } catch (error) {
    console.error('Login API Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error', details: error.message }) };
  }
};