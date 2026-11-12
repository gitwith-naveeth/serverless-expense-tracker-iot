import { supabaseAdminClient } from '../_shared/supabaseAdmin';
import { authenticateSupabaseUser } from '../_shared/supabaseAuth';

const SAFE_DEVICE_COLUMNS = 'id, user_id, device_id, device_name, status, default_essential_amount, default_non_essential_amount, last_seen, created_at, updated_at';

interface VercelRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, string | string[] | undefined>;
}

interface VercelResponse {
  status(code: number): VercelResponse;
  json(body: unknown): void;
}

export async function handleHardwareStatus(deviceId?: string, authorization?: string) {
  if (supabaseAdminClient) {
    const auth = await authenticateSupabaseUser(authorization);
    if (!auth.user) {
      return {
        status: auth.status,
        body: {
          error: auth.status === 503
            ? 'Hardware status is not configured.'
            : 'A valid Supabase access token is required.'
        }
      };
    }

    let query = supabaseAdminClient
      .from('hardware_devices')
      .select(SAFE_DEVICE_COLUMNS)
      .eq('user_id', auth.user.id);
    if (deviceId) {
      query = query.eq('device_id', deviceId);
    }
    const { data, error } = await query;
    if (error) {
      return { status: 500, body: { error: error.message } };
    }
    return { status: 200, body: { devices: data } };
  }

  return {
    status: 503,
    body: { error: 'Hardware status is not configured.' }
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed.' });
      return;
    }

    const deviceId = Array.isArray(req.query.deviceId)
      ? req.query.deviceId[0]
      : req.query.deviceId;
    const authorization = Array.isArray(req.headers.authorization)
      ? req.headers.authorization[0]
      : req.headers.authorization;
    const result = await handleHardwareStatus(deviceId, authorization);
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('[Hardware Status API Error]', error);
    res.status(500).json({ error: 'Hardware status failed unexpectedly.' });
  }
}
