require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory token cache
let tokenCache = {
  token: null,
  expiresAt: 0
};

// FusionSolar API Config
const BASE_URL = process.env.FUSIONSOLAR_BASEURL || 'https://eu5.fusionsolar.huawei.com';
const API_USER = process.env.FUSIONSOLAR_USERNAME;
const SYSTEM_CODE = process.env.FUSIONSOLAR_SYSTEMCODE;

// Helper: Get Valid Token
async function getAuthToken() {
  const now = Date.now();
  if (tokenCache.token && now < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  console.log('Authenticating with FusionSolar...');
  try {
    const response = await axios.post(`${BASE_URL}/thirdData/login`, {
      userName: API_USER,
      systemCode: SYSTEM_CODE
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.data.success) {
      tokenCache = {
        token: response.headers['xsrf-token'],
        expiresAt: now + (25 * 60 * 1000) // Cache for 25 mins (validity is 30)
      };
      return tokenCache.token;
    } else {
      throw new Error(`Login failed: ${response.data.failCode}`);
    }
  } catch (error) {
    console.error('Auth Error:', error.message);
    throw error;
  }
}

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'FusionSolar Proxy' });
});

// Generic Proxy Endpoint
app.post('/api/proxy', async (req, res) => {
  const { endpoint, body } = req.body;

  try {
    const token = await getAuthToken();
    
    const response = await axios.post(`${BASE_URL}${endpoint}`, body || {}, {
      headers: {
        'Content-Type': 'application/json',
        'XSRF-TOKEN': token
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error(`Proxy Error [${endpoint}]:`, error.message);
    
    // Handle Token Expiry (305 = User not exist or password error, 401 = Unauthorized)
    if (error.response && (error.response.status === 401 || error.response.data?.failCode === 305)) {
      tokenCache.token = null; // Clear cache to force re-login next time
    }

    res.status(error.response?.status || 500).json({
      success: false,
      message: error.message,
      data: error.response?.data
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});