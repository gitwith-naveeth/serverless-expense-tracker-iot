import { supabaseAdminClient } from '../_shared/supabaseAdmin';

const DEFAULT_RANGE_DAYS = 30;
const MAX_RANGE_DAYS = 366;

export interface AnalyticsRequest {
  authorization?: string;
  startDate?: string;
  endDate?: string;
}

interface VercelRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, string | string[] | undefined>;
}

interface VercelResponse {
  status(code: number): VercelResponse;
  json(body: unknown): void;
}

function parseDate(value: string | undefined, fallback: Date): Date {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }
  return parsed;
}

export async function handleAnalyticsOverview(request: AnalyticsRequest) {
  if (!supabaseAdminClient) {
    return {
      status: 503,
      body: { error: 'Cloud analytics is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.' }
    };
  }

  const token = request.authorization?.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return { status: 401, body: { error: 'A Supabase access token is required.' } };
  }

  const { data: userData, error: userError } = await supabaseAdminClient.auth.getUser(token);
  if (userError || !userData.user) {
    return { status: 401, body: { error: 'Invalid or expired Supabase access token.' } };
  }

  const endDate = parseDate(request.endDate, new Date());
  const defaultStart = new Date(endDate);
  defaultStart.setUTCDate(defaultStart.getUTCDate() - DEFAULT_RANGE_DAYS);
  const startDate = parseDate(request.startDate, defaultStart);
  const rangeDays = (endDate.getTime() - startDate.getTime()) / 86400000;

  if (startDate >= endDate) {
    return { status: 400, body: { error: 'startDate must be before endDate.' } };
  }
  if (rangeDays > MAX_RANGE_DAYS) {
    return { status: 400, body: { error: `Date ranges cannot exceed ${MAX_RANGE_DAYS} days.` } };
  }

  const { data, error } = await supabaseAdminClient.rpc('get_expense_analytics', {
    p_user_id: userData.user.id,
    p_start_date: startDate.toISOString(),
    p_end_date: endDate.toISOString()
  });

  if (error) {
    return { status: 500, body: { error: 'Cloud analytics query failed.', details: error.message } };
  }

  return { status: 200, body: data };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed.' });
      return;
    }

    const header = req.headers.authorization;
    const authorization = Array.isArray(header) ? header[0] : header;

    const startDate = Array.isArray(req.query.startDate)
      ? req.query.startDate[0]
      : req.query.startDate;

    const endDate = Array.isArray(req.query.endDate)
      ? req.query.endDate[0]
      : req.query.endDate;

    const result = await handleAnalyticsOverview({
      authorization,
      startDate,
      endDate
    });

    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('[Analytics API Error]', error);

    res.status(500).json({
      error: 'Analytics API failed unexpectedly.',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
