import { hashDeviceSecret, verifySecretHash } from '../_shared/cryptoUtils';
import { supabaseAdminClient, inMemoryStore } from '../_shared/supabaseAdmin';

export interface HardwareExpensePayload {
  deviceId: string;
  deviceSecret?: string;
  expenseType: 'essential' | 'non-essential';
  amount?: number;
  timestamp?: string;
  requestId?: string; // Idempotency Key
}

// Memory cache for request ID deduplication within 10 seconds
const processedRequestIds = new Set<string>();

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

  // Idempotency check to prevent duplicate hardware button bounces
  if (requestId) {
    if (processedRequestIds.has(requestId)) {
      return {
        status: 200,
        body: { message: 'Duplicate request ignored (idempotent)', requestId }
      };
    }
    processedRequestIds.add(requestId);
    setTimeout(() => processedRequestIds.delete(requestId), 10000);
  }

  // 1. Live Supabase Backend Mode
  if (supabaseAdminClient) {
    // Lookup device by device_id
    const { data: device, error: deviceErr } = await supabaseAdminClient
      .from('hardware_devices')
      .select('*')
      .eq('device_id', deviceId)
      .single();

    if (deviceErr || !device) {
      return {
        status: 404,
        body: { error: `Device '${deviceId}' not found or not registered.` }
      };
    }

    // Authenticate device secret
    if (token) {
      const isValid = verifySecretHash(token, device.device_secret_hash);
      if (!isValid) {
        return {
          status: 401,
          body: { error: 'Device authentication failed. Invalid device secret token.' }
        };
      }
    }

    // Determine amount
    const finalAmount = amount || (expenseType === 'essential' 
      ? Number(device.default_essential_amount || 100) 
      : Number(device.default_non_essential_amount || 200));

    const categoryName = expenseType === 'essential' ? 'Essential Hardware' : 'Non-Essential Hardware';

    // Insert Transaction
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
        description: `Triggered via ${device.device_name} (${deviceId}) [${expenseType.toUpperCase()}]`,
        timestamp: timestamp || new Date().toISOString()
      })
      .select()
      .single();

    if (txErr) {
      return {
        status: 500,
        body: { error: 'Failed to record transaction in database', details: txErr.message }
      };
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
          id: tx.id,
          deviceId,
          expenseType,
          amount: finalAmount,
          category: categoryName,
          source: 'hardware',
          timestamp: tx.timestamp
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
