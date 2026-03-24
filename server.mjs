import express from 'express';
import cors from 'cors';
import { createRequire } from 'module';
import client, { enums } from '@nuralogix.ai/dfx-api-client';

const require = createRequire(import.meta.url);
const { sendEmailWithRetry } = require('./sendEmailSigma.cjs');
const { logError } = require('./logger.cjs');

const { API_URL, LICENSE_KEY, STUDY_ID, PORT = 7000 } = process.env;

const app = express();
app.use(cors({ credentials: true, origin: '*' }));
app.use(express.json());

// Cliente API de Nuralogix
const apiClient = client({
  url: {
    http: new URL(`https://${API_URL}`),
    wss: new URL(`wss://${API_URL}`),
  },
});

// Endpoint: devuelve Study ID
app.get('/api/studyId', (req, res) => {
  res.json({ status: '200', studyId: STUDY_ID });
});

// Endpoint: registra licencia y devuelve tokens
app.get('/api/token', async (req, res) => {
  try {
    const response = await apiClient.http.organizations.registerLicense({
      Key: LICENSE_KEY,
      DeviceTypeID: enums.DeviceTypeID.WIN32,
      Name: 'Ejemplo WMEA',
      Identifier: 'EJEMPLO_WMEA',
      Version: '1.0.0',
    });
    res.json({
      status: '200',
      token: response.body.Token,
      refreshToken: response.body.RefreshToken,
    });
  } catch (error) {
    logError('API Token', error);
    res.status(500).json({ status: '500', error: error.message });
  }
});

// Endpoint: enviar resultados por email
app.post('/api/send-results', async (req, res) => {
  try {
    const { results, snr } = req.body;

    if (!results || Object.keys(results).length === 0) {
      return res.status(400).json({ status: '400', error: 'No hay resultados para enviar' });
    }

    // Construir el mensaje HTML del email
    let messageHtml = `
      <h2>Resultados de Medicion Biometrica</h2>
      <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-CO')}</p>
      ${snr ? `<p><strong>Calidad de medicion (SNR):</strong> ${snr}</p>` : ''}
      <hr>
      <table style="border-collapse: collapse; width: 100%;">
        <tr style="background: #2196F3; color: white;">
          <th style="padding: 10px; text-align: left;">Metrica</th>
          <th style="padding: 10px; text-align: right;">Valor</th>
          <th style="padding: 10px; text-align: left;">Unidad</th>
        </tr>
    `;

    for (const [key, item] of Object.entries(results)) {
      messageHtml += `
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 8px;">${item.name}</td>
          <td style="padding: 8px; text-align: right; font-weight: bold; color: #2196F3;">${item.value}</td>
          <td style="padding: 8px;">${item.unit || ''}</td>
        </tr>
      `;
    }

    messageHtml += '</table>';

    // Enviar email
    const emailResult = await sendEmailWithRetry({
      subject: `Resultados Medicion Biometrica - ${new Date().toLocaleDateString('es-CO')}`,
      message: messageHtml
    });

    res.json({ status: '200', message: 'Email enviado correctamente', data: emailResult });

  } catch (error) {
    logError('Send Email', error);
    res.status(500).json({ status: '500', error: error.message });
  }
});

// Endpoint: registrar errores del cliente (NuraLogix WMEA)
app.post('/api/log-error', (req, res) => {
  const { code, message, details } = req.body;
  const errorMsg = `${code || 'UNKNOWN'}: ${message || 'Sin mensaje'}${details ? ` - ${details}` : ''}`;
  logError('NuraLogix WMEA', errorMsg);
  res.json({ status: '200' });
});

// Servir archivos estáticos
app.use('/', express.static('./client'));

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
