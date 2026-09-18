import { supabaseAdminClient, inMemoryStore } from '../_shared/supabaseAdmin';

export interface HeartbeatPayload {
  deviceId: string;
  deviceSecret?: string;
  rssi?: number;
  uptimeSeconds?: number;
}

export async function handleHardwareHeartbeat(payload: HeartbeatPayload) {
  const { deviceId, rssi, uptimeSeconds } = payload;

  if (!deviceId) {
    return {
      status: 400,
      body: { error: 'Missing deviceId parameter' }
    };
  }

  if (supabaseAdminClient) {
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
