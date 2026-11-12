import { supabaseAdminClient } from './supabaseAdmin';

export async function authenticateSupabaseUser(authorization?: string) {
  if (!supabaseAdminClient) {
    return {
      status: 503,
      user: null,
    } as const;
  }

  const token = authorization?.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return {
      status: 401,
      user: null,
    } as const;
  }

  const { data, error } = await supabaseAdminClient.auth.getUser(token);
  if (error || !data.user) {
    return {
      status: 401,
      user: null,
    } as const;
  }

  return {
    status: 200,
    user: data.user,
  } as const;
}
