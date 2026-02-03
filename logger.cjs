const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'errors.log');

function formatDate() {
  return new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });
}

function logError(context, error) {
  const message = `[${formatDate()}] [${context}] ${error.message || error}\n`;
  fs.appendFileSync(LOG_FILE, message);
  console.error(message.trim());
}

function logInfo(context, message) {
  const line = `[${formatDate()}] [${context}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, line);
}

module.exports = { logError, logInfo };
