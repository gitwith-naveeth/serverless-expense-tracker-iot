import express from 'express';
import cors from 'cors';
import { handleHardwareExpense } from './hardware/expense';
import { handleHardwareHeartbeat } from './hardware/heartbeat';
import { handleHardwareStatus } from './hardware/status';
import { inMemoryStore } from './_shared/supabaseAdmin';
import { handleAnalyticsOverview } from './analytics/overview';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/analytics/overview', async (req, res) => {
  try {
    const result = await handleAnalyticsOverview({
      authorization: req.headers.authorization,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined
    });
    res.status(result.status).json(result.body);
  } catch (err: any) {
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

// Hardware Expense Endpoint
app.post('/api/hardware/expense', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const result = await handleHardwareExpense(req.body, authHeader);
    res.status(result.status).json(result.body);
  } catch (err: any) {
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

// Hardware Heartbeat Endpoint
app.post('/api/hardware/heartbeat', async (req, res) => {
  try {
    const result = await handleHardwareHeartbeat(req.body);
    res.status(result.status).json(result.body);
  } catch (err: any) {
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

// Hardware Status Endpoint
app.get('/api/hardware/status', async (req, res) => {
  try {
    const deviceId = req.query.deviceId as string | undefined;
    const result = await handleHardwareStatus(deviceId);
    res.status(result.status).json(result.body);
  } catch (err: any) {
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

// Endpoint to list transactions for mock dev mode
app.get('/api/mock/transactions', (req, res) => {
  res.json({
    transactions: inMemoryStore.transactions,
    devices: inMemoryStore.devices
  });
});

app.listen(PORT, () => {
  console.log(`⚡ Serverless Hardware API running locally on http://localhost:${PORT}`);
  console.log(`   POST /api/hardware/expense`);
  console.log(`   POST /api/hardware/heartbeat`);
  console.log(`   GET  /api/hardware/status`);
});
