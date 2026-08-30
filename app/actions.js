"use server";

import { revalidatePath } from "next/cache";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabaseAdmin";
import { NAME_PATTERN, TOP_N } from "@/lib/constants";

const SELECT_PUBLIC = "user_id, score, created_at";

function fail(message) {
  return { ok: false, error: message };
}

/** 이름 정규화 + 검증 */
function normalizeName(raw) {
  const name = String(raw ?? "").trim().replace(/\s+/g, " ");
  if (!name) return { error: "이름을 입력해 주세요." };
  if (!NAME_PATTERN.test(name)) {
    return { error: "이름은 한글·영문·숫자 1~12자로 입력해 주세요." };
  }
  return { name, key: name.toLowerCase() };
}

/* ------------------------------------------------------------------ */
/* 랭킹 조회                                                            */
/* ------------------------------------------------------------------ */

/** Top N 랭킹 (이름별 최고 점수 기준) */
export async function getTopScores(limit = TOP_N) {
  if (!isSupabaseConfigured) return fail("Supabase 환경변수가 설정되지 않았습니다.");

  const { data, error } = await supabase
    .from("scores")
    .select(SELECT_PUBLIC)
    .gt("score", 0)
    .order("score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) return fail(error.message);

  return {
    ok: true,
    rows: (data ?? []).map((row, i) => ({ ...row, rank: i + 1 })),
  };
}

/**
 * 특정 이름의 최고 점수와 등수.
 * 등수 = (나보다 점수가 높은 사람 수) + (동점이면서 먼저 달성한 사람 수) + 1
 * → 랭킹보드 정렬(score desc, created_at asc)과 정확히 일치합니다.
 */
export async function getMyRank(rawName) {
  if (!isSupabaseConfigured) return fail("Supabase 환경변수가 설정되지 않았습니다.");

  const key = String(rawName ?? "").trim().replace(/\s+/g, " ").toLowerCase();
  if (!key) return fail("이름이 없습니다.");

  const { data: me, error } = await supabase
    .from("scores")
    .select(SELECT_PUBLIC)
    .eq("user_key", key)
    .maybeSingle();

  if (error) return fail(error.message);
  if (!me || me.score <= 0) return { ok: true, ranked: false, score: me?.score ?? 0 };

  const higher = await supabase
    .from("scores")
    .select("*", { count: "exact", head: true })
    .gt("score", me.score);

  const tiedEarlier = await supabase
    .from("scores")
    .select("*", { count: "exact", head: true })
    .eq("score", me.score)
    .lt("created_at", me.created_at);

  if (higher.error) return fail(higher.error.message);
  if (tiedEarlier.error) return fail(tiedEarlier.error.message);

  return {
    ok: true,
    ranked: true,
    rank: (higher.count ?? 0) + (tiedEarlier.count ?? 0) + 1,
    user_id: me.user_id,
    score: me.score,
    created_at: me.created_at,
  };
}

/* ------------------------------------------------------------------ */
/* 점수 등록                                                            */
/* ------------------------------------------------------------------ */

/**
 * 게임 종료 후 이름과 점수를 등록합니다.
 * 같은 이름의 기존 최고점보다 높을 때만 score / created_at 을 갱신합니다.
 * (이름 기준으로 최고 점수가 누적됩니다.)
 */
export async function submitScore(rawName, rawScore) {
  const norm = normalizeName(rawName);
  if (norm.error) return fail(norm.error);
  if (!isAdminConfigured) {
    return fail("서버 환경변수(SUPABASE_SERVICE_ROLE_KEY)가 설정되지 않았습니다.");
  }

  const score = Math.max(0, Math.floor(Number(rawScore) || 0));
  if (!Number.isFinite(score) || score > 1_000_000) return fail("점수가 올바르지 않습니다.");

  const { name, key } = norm;

  const { data: existing, error: readError } = await supabaseAdmin
    .from("scores")
    .select("id, score")
    .eq("user_key", key)
    .maybeSingle();

  if (readError) return fail(readError.message);

  // 처음 등록하는 이름
  if (!existing) {
    const { error } = await supabaseAdmin
      .from("scores")
      .insert({ user_id: name, score, created_at: new Date().toISOString() });

    // 동시 등록 경합(unique 위반)이면 갱신 경로로 재시도
    if (error) {
      if (error.code === "23505") return submitScore(rawName, rawScore);
      return fail(error.message);
    }

    revalidatePath("/");
    const mine = await getMyRank(name);
    return {
      ok: true,
      name,
      updated: true,
      best: score,
      rank: mine.ok && mine.ranked ? mine.rank : null,
    };
  }

  const updated = score > existing.score;

  if (updated) {
    const { error } = await supabaseAdmin
      .from("scores")
      .update({ user_id: name, score, created_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) return fail(error.message);
  }

  revalidatePath("/");
  const mine = await getMyRank(name);

  return {
    ok: true,
    name,
    updated,
    best: updated ? score : existing.score,
    rank: mine.ok && mine.ranked ? mine.rank : null,
  };
}
