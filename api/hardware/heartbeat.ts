import { isProductionEnvironment, supabaseAdminClient, inMemoryStore } from '../_shared/supabaseAdmin';
import { verifySecretHash } from '../_shared/cryptoUtils';

export interface HeartbeatPayload {
  deviceId: string;
  deviceSecret?: string;
  rssi?: number;
  uptimeSeconds?: number;
}

interface VercelRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: HeartbeatPayload;
}

interface VercelResponse {
  status(code: number): VercelResponse;
  json(body: unknown): void;
}

export async function handleHardwareHeartbeat(payload: HeartbeatPayload) {
  const { deviceId, deviceSecret, rssi, uptimeSeconds } = payload;

  if (!deviceId) {
    return {
      status: 400,
      body: { error: 'Missing deviceId parameter' }
    };
  }

  if (!deviceSecret) {
    return { status: 401, body: { error: 'Device authentication is required.' } };
  }

  if (!supabaseAdminClient && isProductionEnvironment) {
    return { status: 503, body: { error: 'Hardware heartbeat is not configured.' } };
  }

  if (supabaseAdminClient) {
    const { data: knownDevice } = await supabaseAdminClient
      .from('hardware_devices')
      .select('device_secret_hash')
      .eq('device_id', deviceId)
      .single();

    if (!knownDevice || !verifySecretHash(deviceSecret, knownDevice.device_secret_hash)) {
      return { status: 401, body: { error: 'Device authentication failed.' } };
    }

    const { data: device, error } = await supabaseAdminClient
      .from('hardware_devices')
      .update({
        status: 'online',
        last_seen: new Date().toISOString()
      })
      .eq('device_id', deviceId)
      .select()
      .single();

    if (error || !device) {
      return { status: 404, body: { error: `Device ${deviceId} not found` } };
    }

    return {
      status: 200,
      body: {
        success: true,
        deviceId,
        status: 'online',
        serverTimestamp: new Date().toISOString()
      }
    };
  }

  const mockDev = inMemoryStore.devices.find(d => d.device_id === deviceId);
  if (!mockDev || !verifySecretHash(deviceSecret, mockDev.device_secret_hash)) {
    return { status: 401, body: { error: 'Device authentication failed.' } };
  }
  if (mockDev) {
    mockDev.status = 'online';
    mockDev.last_seen = new Date().toISOString();
  }

  return {
    status: 200,
    body: {
      success: true,
      deviceId,
      status: 'online',
      rssi: rssi || -60,
      uptimeSeconds: uptimeSeconds || 120,
      serverTimestamp: new Date().toISOString()
    }
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed.' });
      return;
    }

    const result = await handleHardwareHeartbeat(req.body || {} as HeartbeatPayload);
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('[Hardware Heartbeat API Error]', error);
    res.status(500).json({ error: 'Hardware heartbeat failed unexpectedly.' });
  }
}
