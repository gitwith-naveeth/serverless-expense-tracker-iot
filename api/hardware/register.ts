import crypto from 'crypto';
import { hashDeviceSecret } from '../_shared/cryptoUtils';
import { authenticateSupabaseUser } from '../_shared/supabaseAuth';
import { supabaseAdminClient } from '../_shared/supabaseAdmin';

const MAX_DEVICE_NAME_LENGTH = 100;
const DEVICE_ID_ATTEMPTS = 3;

export interface HardwareRegistrationPayload {
  deviceName?: string;
}

interface VercelRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: HardwareRegistrationPayload;
}

interface VercelResponse {
  status(code: number): VercelResponse;
  json(body: unknown): void;
}

function generateDeviceId(): string {
  return `ESP32-${crypto.randomBytes(12).toString('hex').toUpperCase()}`;
}

function generateDeviceSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function handleHardwareRegistration(
  payload: HardwareRegistrationPayload,
  authorization?: string
) {
  const auth = await authenticateSupabaseUser(authorization);
  if (!auth.user) {
    return {
      status: auth.status,
      body: {
        error: auth.status === 503
          ? 'Device registration is not configured.'
          : 'A valid Supabase access token is required.'
      }
    };
  }

  if (!supabaseAdminClient) {
    return {
      status: 503,
      body: { error: 'Device registration is not configured.' }
    };
  }

  const requestedName = payload.deviceName?.trim();
  if (requestedName && requestedName.length > MAX_DEVICE_NAME_LENGTH) {
    return {
      status: 400,
      body: { error: `deviceName cannot exceed ${MAX_DEVICE_NAME_LENGTH} characters.` }
    };
  }

  const deviceName = requestedName || 'ESP32 Push Button Box';
  const deviceSecret = generateDeviceSecret();
  const deviceSecretHash = hashDeviceSecret(deviceSecret);

  for (let attempt = 0; attempt < DEVICE_ID_ATTEMPTS; attempt += 1) {
    const deviceId = generateDeviceId();
    const { data, error } = await supabaseAdminClient
      .from('hardware_devices')
      .insert({
        user_id: auth.user.id,
        device_id: deviceId,
        device_name: deviceName,
        device_secret_hash: deviceSecretHash,
      })
      .select('id, user_id, device_id, device_name, status, default_essential_amount, default_non_essential_amount, last_seen, created_at, updated_at')
      .single();

    if (!error && data) {
      return {
        status: 201,
        body: {
          success: true,
          device: data,
          deviceSecret,
          warning: 'Save this device secret now. It will not be shown again.'
        }
      };
    }

    if (error?.code !== '23505' || attempt === DEVICE_ID_ATTEMPTS - 1) {
      console.error('[Hardware Registration Error]', error);
      return {
        status: 500,
        body: { error: 'Failed to register hardware device.' }
      };
    }
  }

  return {
    status: 500,
    body: { error: 'Failed to register hardware device.' }
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
    const result = await handleHardwareRegistration(req.body || {}, authorization);
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('[Hardware Registration API Error]', error);
    res.status(500).json({ error: 'Device registration failed unexpectedly.' });
  }
}
