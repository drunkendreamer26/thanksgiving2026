-- =============================================================
-- 화재IT그룹 추석맞이 이벤트: 달토끼 타임어택
-- Supabase 대시보드 > SQL Editor 에 그대로 붙여넣고 실행하세요.
-- =============================================================

-- 1) scores 테이블 --------------------------------------------
-- 이름(player_name) 당 1행만 유지하며 "이름 기준 최고 점수"를 담습니다.
-- 최고 점수를 갱신할 때 created_at(달성일자)도 함께 갱신됩니다.
-- => 별도 집계 없이 ORDER BY score DESC 만으로 이름별 최고점 랭킹이 나옵니다.
create table if not exists public.scores (
  id          uuid        primary key default gen_random_uuid(),
  player_name text        not null,
  -- 대소문자/공백 무시 중복 방지를 위한 정규화 키 (조회에도 이 컬럼 사용)
  player_key  text        generated always as (lower(btrim(player_name))) stored,
  score       integer     not null default 0 check (score >= 0),
  created_at  timestamptz not null default now()
);

create unique index if not exists scores_player_key_unique
  on public.scores (player_key);

-- 랭킹 정렬용 인덱스 (동점자는 먼저 달성한 사람이 상위)
create index if not exists scores_rank_idx
  on public.scores (score desc, created_at asc);

-- 2) RLS ------------------------------------------------------
-- 읽기는 누구나(랭킹보드 공개), 쓰기는 service_role(서버 액션)만 가능.
alter table public.scores enable row level security;

drop policy if exists "scores are public readable" on public.scores;
create policy "scores are public readable"
  on public.scores for select
  to anon, authenticated
  using (true);

-- anon 키에는 insert/update/delete 정책이 없으므로 쓰기가 자동 차단됩니다.
-- (service_role 키는 RLS 를 우회하므로 서버 액션에서만 사용하세요.)

-- 3) 랭킹 뷰 (선택) -------------------------------------------
create or replace view public.rankings as
select
  row_number() over (order by score desc, created_at asc) as rank,
  player_name,
  score,
  created_at
from public.scores
where score > 0;

-- =============================================================
-- 참고) 모든 플레이 기록을 남기는 구조로 바꾸고 싶다면
-- scores_player_key_unique 인덱스를 제거하고 아래 쿼리로 이름별 최고점을 뽑습니다.
--
--   select distinct on (player_key) player_name, score, created_at
--     from public.scores
--    order by player_key, score desc, created_at asc;
-- =============================================================
