import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** 환경변수가 채워져 있는지 여부 (미설정 시 앱이 죽지 않고 안내 문구를 띄웁니다) */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * 공개(anon) 클라이언트 — 읽기 전용.
 * RLS 정책상 select 만 허용되므로 브라우저에 노출되어도 안전합니다.
 */
export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, { auth: { persistSession: false } })
  : null;
