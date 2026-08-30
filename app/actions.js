"use server";

import { revalidatePath } from "next/cache";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabaseAdmin";
import { NAME_PATTERN, TOP_N, normalizeName } from "@/lib/constants";

const SELECT_PUBLIC = "player_name, score, created_at";

function fail(message) {
  return { ok: false, error: message };
}

/** 이름 정규화(공백 제거) + 검증 */
function parseName(raw) {
  const name = normalizeName(raw);
  if (!name) return { error: "이름을 입력해 주세요." };
  if (!NAME_PATTERN.test(name)) {
    return { error: "이름은 공백 없이 한글·영문·숫자 1~12자로 입력해 주세요." };
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

  const key = normalizeName(rawName).toLowerCase();
  if (!key) return fail("이름이 없습니다.");

  const { data: me, error } = await supabase
    .from("scores")
    .select(SELECT_PUBLIC)
    .eq("player_key", key)
    .maybeSingle();

  if (error) return fail(error.message);
  if (!me || me.score <= 0) return { ok: true, ranked: false, score: me?.score ?? 0 };

  // 두 카운트는 서로 독립이므로 병렬로 실행합니다
  const [higher, tiedEarlier] = await Promise.all([
    supabase.from("scores").select("*", { count: "exact", head: true }).gt("score", me.score),
    supabase
      .from("scores")
      .select("*", { count: "exact", head: true })
      .eq("score", me.score)
      .lt("created_at", me.created_at),
  ]);

  if (higher.error) return fail(higher.error.message);
  if (tiedEarlier.error) return fail(tiedEarlier.error.message);

  return {
    ok: true,
    ranked: true,
    rank: (higher.count ?? 0) + (tiedEarlier.count ?? 0) + 1,
    player_name: me.player_name,
    score: me.score,
    created_at: me.created_at,
  };
}

/**
 * 첫 화면에 필요한 데이터를 한 번에 가져옵니다.
 * 랭킹과 내 등수를 각각 호출하면 서버 액션 왕복이 2회가 되므로 하나로 합쳤습니다.
 */
export async function getBoard(rawName) {
  const name = String(rawName ?? "").trim();
  const [top, mine] = await Promise.all([
    getTopScores(),
    name ? getMyRank(name) : Promise.resolve(null),
  ]);

  return {
    ok: top.ok,
    error: top.ok ? null : top.error,
    rows: top.ok ? top.rows : [],
    mine: mine?.ok ? mine : null,
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
  const norm = parseName(rawName);
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
    .eq("player_key", key)
    .maybeSingle();

  if (readError) return fail(readError.message);

  // 처음 등록하는 이름
  if (!existing) {
    const { error } = await supabaseAdmin
      .from("scores")
      .insert({ player_name: name, score, created_at: new Date().toISOString() });

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
      .update({ player_name: name, score, created_at: new Date().toISOString() })
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

/* ------------------------------------------------------------------ */
/* 관리자 기능                                                          */
/* ------------------------------------------------------------------ */

/**
 * 관리자 비밀번호 확인.
 * PASSWORD 는 서버 전용 환경변수라 브라우저로 값이 내려가지 않습니다.
 * 모든 관리자 액션은 호출할 때마다 이 검사를 다시 거칩니다.
 */
function checkAdmin(password) {
  const expected = process.env.PASSWORD;
  if (!expected) return "서버에 PASSWORD 환경변수가 설정되지 않았습니다.";
  if (String(password ?? "") !== expected) return "비밀번호가 일치하지 않습니다.";
  if (!isAdminConfigured) return "서버 환경변수(SUPABASE_SERVICE_ROLE_KEY)가 설정되지 않았습니다.";
  return null;
}

export async function verifyAdmin(password) {
  const expected = process.env.PASSWORD;
  if (!expected) return fail("서버에 PASSWORD 환경변수가 설정되지 않았습니다.");
  if (String(password ?? "") !== expected) return fail("비밀번호가 일치하지 않습니다.");
  return { ok: true };
}

/** 전체 기록 삭제 */
export async function adminResetAll(password) {
  const error = checkAdmin(password);
  if (error) return fail(error);

  const before = await supabaseAdmin
    .from("scores")
    .select("*", { count: "exact", head: true });
  if (before.error) return fail(before.error.message);

  // 조건 없는 delete 는 막혀 있어 항상 참인 조건을 붙입니다
  const { error: delError } = await supabaseAdmin.from("scores").delete().gte("score", 0);
  if (delError) return fail(delError.message);

  revalidatePath("/");
  return { ok: true, deleted: before.count ?? 0 };
}

/** 이름 하나의 기록 삭제 */
export async function adminDeleteByName(password, rawName) {
  const error = checkAdmin(password);
  if (error) return fail(error);

  const key = normalizeName(rawName).toLowerCase();
  if (!key) return fail("삭제할 이름을 입력해 주세요.");

  const { data, error: delError } = await supabaseAdmin
    .from("scores")
    .delete()
    .eq("player_key", key)
    .select("player_name, score");

  if (delError) return fail(delError.message);
  if (!data || data.length === 0) return fail(`'${rawName}' 기록을 찾지 못했습니다.`);

  revalidatePath("/");
  return { ok: true, removed: data[0] };
}

/** 전체 순위 내려받기용 데이터 (등수·이름·점수·등록일시) */
export async function adminExport(password) {
  const error = checkAdmin(password);
  if (error) return fail(error);

  const { data, error: readError } = await supabaseAdmin
    .from("scores")
    .select("player_name, score, created_at")
    .order("score", { ascending: false })
    .order("created_at", { ascending: true });

  if (readError) return fail(readError.message);

  return {
    ok: true,
    rows: (data ?? []).map((row, i) => ({ rank: i + 1, ...row })),
  };
}
