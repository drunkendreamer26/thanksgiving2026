import "server-only";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isAdminConfigured = Boolean(url && serviceKey);

/**
 * 서버 전용(service_role) 클라이언트 — 쓰기 담당.
 * 반드시 Server Action / Route Handler 안에서만 사용하세요.
 */
export const supabaseAdmin = isAdminConfigured
  ? createClient(url, serviceKey, { auth: { persistSession: false } })
  : null;
