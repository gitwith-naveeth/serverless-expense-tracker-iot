import { supabaseAdminClient, inMemoryStore } from '../_shared/supabaseAdmin';

export async function handleHardwareStatus(deviceId?: string) {
  if (supabaseAdminClient) {
    let query = supabaseAdminClient.from('hardware_devices').select('*');
    if (deviceId) {
      query = query.eq('device_id', deviceId);
    }
    const { data, error } = await query;
    if (error) {
      return { status: 500, body: { error: error.message } };
    }
    return { status: 200, body: { devices: data } };
  }

  const devices = deviceId 
    ? inMemoryStore.devices.filter(d => d.device_id === deviceId)
    : inMemoryStore.devices;

  return {
    status: 200,
    body: {
      devices,
      totalMockTransactions: inMemoryStore.transactions.length
    }
  };
}
