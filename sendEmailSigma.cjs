/**
 * Módulo para enviar emails via Sigma API
 * Variables de entorno requeridas: API_WS, API_USER, API_PASSWORD, evairoment
 */

const { logError } = require('./logger.cjs');

let tokenCache = { token: null, expiresAt: null };

const getConfig = () => ({
  API_WS: process.env.API_WS,
  API_USER: process.env.API_USER,
  API_PASSWORD: process.env.API_PASSWORD,
  ENVIRONMENT: process.env.evairoment || 'QA'
});

async function getAuthToken() {
  if (tokenCache.token && tokenCache.expiresAt && new Date() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const config = getConfig();

  if (!config.API_WS || !config.API_USER || !config.API_PASSWORD) {
    throw new Error('Missing required environment variables: API_WS, API_USER, API_PASSWORD');
  }

  const credentials = Buffer.from(`${config.API_USER}:${config.API_PASSWORD}`).toString('base64');
  const body = new URLSearchParams({ grant_type: 'client_credentials' });

  const response = await fetch(
    `${config.API_WS}/sd/services/oauthapi.get_authentication_token`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(`Authentication failed: ${response.status} - ${errorText}`);
    logError('Sigma Auth', error);
    throw error;
  }

  const data = await response.json();

  if (!data.access_token) {
    throw new Error('Authentication response missing access_token');
  }

  tokenCache.token = data.access_token;
  tokenCache.expiresAt = new Date(Date.now() + 10 * 60000);

  return data.access_token;
}

function invalidateTokenCache() {
  tokenCache.token = null;
  tokenCache.expiresAt = null;
}

async function sendEmail(emailConfig) {
  if (!emailConfig?.subject || !emailConfig?.message) {
    throw new Error('Email subject and message are required');
  }

  const config = getConfig();
  const accessToken = await getAuthToken();

  const defaultEmail = config.ENVIRONMENT === 'PROD'
    ? 'alertas.co@sdsigma.com'
    : 'kalejita.29@gmail.com';

  const requestBody = { xemail: defaultEmail, ...emailConfig };

  const response = await fetch(
    `${config.API_WS}/incli/sendEmailv2`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    }
  );

  const responseData = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 400) {
      logError('Sigma Email', `Bad Request: ${JSON.stringify(responseData)}`);
      return { success: false, status: response.status, data: responseData };
    }
    const error = new Error(`Email send failed: ${response.status}`);
    logError('Sigma Email', error);
    throw error;
  }

  return { success: true, status: response.status, data: responseData };
}

async function sendEmailWithRetry(emailConfig, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await sendEmail(emailConfig);
    } catch (error) {
      if (attempt === maxRetries) {
        throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
      }

      if (error.message.includes('401') || error.message.includes('Auth')) {
        invalidateTokenCache();
      }

      const delayMs = 2000 * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

module.exports = { sendEmailWithRetry };
