import { verifySecretHash } from '../_shared/cryptoUtils';
import { isProductionEnvironment, supabaseAdminClient, inMemoryStore } from '../_shared/supabaseAdmin';

export interface HardwareExpensePayload {
  deviceId: string;
  deviceSecret?: string;
  expenseType: 'essential' | 'non-essential';
  amount?: number;
  timestamp?: string;
  requestId?: string; // Idempotency Key
}

interface VercelRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: HardwareExpensePayload;
}

interface VercelResponse {
  status(code: number): VercelResponse;
  json(body: unknown): void;
}

// Local-only fallback for development; live requests use the database-backed RPC.
const localProcessedRequestIds = new Set<string>();

export async function handleHardwareExpense(payload: HardwareExpensePayload, authHeader?: string) {
  const { deviceId, expenseType, amount, timestamp, requestId } = payload;
  const token = payload.deviceSecret || (authHeader ? authHeader.replace(/^Bearer\s+/i, '') : '');

  if (!deviceId || !expenseType) {
    return {
      status: 400,
      body: { error: 'Missing required parameters: deviceId and expenseType are required.' }
    };
  }

  if (expenseType !== 'essential' && expenseType !== 'non-essential') {
    return {
      status: 400,
      body: { error: 'Invalid expenseType. Must be "essential" or "non-essential".' }
    };
  }

  if (!token) {
    return {
      status: 401,
      body: { error: 'Device authentication is required.' }
    };
  }

  // 1. Live Supabase Backend Mode
  if (!supabaseAdminClient && isProductionEnvironment) {
    return { status: 503, body: { error: 'Hardware expense is not configured.' } };
  }

  if (supabaseAdminClient) {
    // Lookup device by device_id
    const { data: device, error: deviceErr } = await supabaseAdminClient
      .from('hardware_devices')
      .select('id, user_id, device_id, device_name, device_secret_hash, default_essential_amount, default_non_essential_amount')
      .eq('device_id', deviceId)
      .single();

    if (deviceErr || !device) {
      return {
        status: 404,
        body: { error: `Device '${deviceId}' not found or not registered.` }
      };
    }

    // Authenticate device secret
    const isValid = verifySecretHash(token, device.device_secret_hash);
    if (!isValid) {
      return {
        status: 401,
        body: { error: 'Device authentication failed. Invalid device secret token.' }
      };
    }

    // Determine amount
    const finalAmount = amount || (expenseType === 'essential' 
      ? Number(device.default_essential_amount || 100) 
      : Number(device.default_non_essential_amount || 200));

    const categoryName = expenseType === 'essential' ? 'Essential Hardware' : 'Non-Essential Hardware';

    const transactionTimestamp = timestamp || new Date().toISOString();
    const description = `Triggered via ${device.device_name} (${deviceId}) [${expenseType.toUpperCase()}]`;
    let transactionId: string;
    let recordedTimestamp: string;

    if (requestId) {
      const { data: result, error: idempotencyError } = await supabaseAdminClient.rpc('record_hardware_expense', {
        p_device_id: device.id,
        p_user_id: device.user_id,
        p_request_id: requestId,
        p_amount: finalAmount,
        p_expense_type: expenseType,
        p_category: categoryName,
        p_description: description,
        p_timestamp: transactionTimestamp
      });

      if (idempotencyError || !result) {
        console.error('[Hardware Expense Idempotency Error]', idempotencyError);
        return { status: 500, body: { error: 'Failed to record transaction in database.' } };
      }

      if (result.duplicate) {
        return {
          status: 200,
          body: { message: 'Duplicate request ignored (idempotent)', requestId }
        };
      }

      transactionId = result.transactionId;
      recordedTimestamp = result.timestamp;
    } else {
      const { data: tx, error: txErr } = await supabaseAdminClient
        .from('transactions')
        .insert({
          user_id: device.user_id,
          device_id: device.id,
          amount: finalAmount,
          transaction_type: 'expense',
          expense_classification: expenseType,
          category: categoryName,
          source: 'hardware',
          description,
          timestamp: transactionTimestamp
        })
        .select('id, timestamp')
        .single();

      if (txErr || !tx) {
        console.error('[Hardware Expense Transaction Error]', txErr);
        return { status: 500, body: { error: 'Failed to record transaction in database.' } };
      }

      transactionId = tx.id;
      recordedTimestamp = tx.timestamp;
    }

    // Update Device status & last_seen
    await supabaseAdminClient
      .from('hardware_devices')
      .update({
        status: 'online',
        last_seen: new Date().toISOString()
      })
      .eq('id', device.id);

    return {
      status: 201,
      body: {
        success: true,
        message: `${expenseType.toUpperCase()} expense recorded successfully`,
        transaction: {
          id: transactionId,
          deviceId,
          expenseType,
          amount: finalAmount,
          category: categoryName,
          source: 'hardware',
          timestamp: recordedTimestamp
        }
      }
    };
  }

  // 2. Fallback / Mock In-Memory Store Mode for Development & Live Simulator
  const mockDev = inMemoryStore.devices.find(d => d.device_id === deviceId);
  if (!mockDev) {
    return {
      status: 404,
      body: { error: `Device '${deviceId}' not found. Please register the device first.` }
    };
  }

  if (!verifySecretHash(token, mockDev.device_secret_hash)) {
    return {
      status: 401,
      body: { error: 'Device authentication failed. Invalid device secret token.' }
    };
  }

  if (requestId) {
    const localRequestKey = `${mockDev.id}:${requestId}`;
    if (localProcessedRequestIds.has(localRequestKey)) {
      return {
        status: 200,
        body: { message: 'Duplicate request ignored (idempotent)', requestId }
      };
    }
    localProcessedRequestIds.add(localRequestKey);
    setTimeout(() => localProcessedRequestIds.delete(localRequestKey), 10000);
  }

  const finalAmount = amount || (expenseType === 'essential' 
    ? mockDev.default_essential_amount 
    : mockDev.default_non_essential_amount);

  const categoryName = expenseType === 'essential' ? 'Essential Hardware' : 'Non-Essential Hardware';

  const newTx = {
    id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    user_id: mockDev.user_id,
    device_id: mockDev.id,
    amount: finalAmount,
    transaction_type: 'expense' as const,
    expense_classification: expenseType,
    category: categoryName,
    source: 'hardware' as const,
    description: `Triggered via ${mockDev.device_name} (${deviceId}) [${expenseType.toUpperCase()}]`,
    timestamp: timestamp || new Date().toISOString(),
    created_at: new Date().toISOString()
  };

  inMemoryStore.transactions.unshift(newTx);
  mockDev.status = 'online';
  mockDev.last_seen = new Date().toISOString();

  return {
    status: 201,
    body: {
      success: true,
      message: `${expenseType.toUpperCase()} expense recorded successfully (Dev Mode)`,
      transaction: {
        id: newTx.id,
        deviceId,
        expenseType,
        amount: finalAmount,
        category: categoryName,
        source: 'hardware',
        timestamp: newTx.timestamp
      }
    }
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed.' });
      return;
    }

    const authorization = Array.isArray(req.headers.authorization)
      ? req.headers.authorization[0]
      : req.headers.authorization;
    const result = await handleHardwareExpense(req.body || {} as HardwareExpensePayload, authorization);
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('[Hardware Expense API Error]', error);
    res.status(500).json({ error: 'Hardware expense failed unexpectedly.' });
  }
}
