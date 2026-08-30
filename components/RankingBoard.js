"use client";

import { formatDate, formatScore, TOP_N } from "@/lib/constants";

const MEDALS = ["🥇", "🥈", "🥉"];

function RankBadge({ rank }) {
  if (rank <= 3) {
    return <span className="w-7 text-center text-lg leading-none">{MEDALS[rank - 1]}</span>;
  }
  return (
    <span className="w-7 text-center text-sm font-bold tabular-nums text-white/55">
      {rank}
    </span>
  );
}

function Row({ rank, playerName, score, createdAt, highlight }) {
  return (
    <li
      className={[
        "flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 transition",
        highlight
          ? "bg-moon-500/15 ring-1 ring-moon-500/50"
          : rank <= 3
            ? "bg-white/[0.07]"
            : "bg-white/[0.03]",
      ].join(" ")}
    >
      <RankBadge rank={rank} />
      <div className="min-w-0 flex-1">
        <p
          className={[
            "truncate text-sm font-semibold",
            highlight ? "text-moon-300" : "text-moon-100",
          ].join(" ")}
        >
          {playerName}
          {highlight && (
            <span className="ml-1.5 rounded-md bg-moon-500 px-1.5 py-0.5 text-[10px] font-bold text-night-900 align-middle">
              나
            </span>
          )}
        </p>
        <p className="text-[11px] text-white/35">{formatDate(createdAt)}</p>
      </div>
      <p className="shrink-0 text-right text-sm font-bold tabular-nums text-moon-300">
        {formatScore(score)}
        <span className="ml-0.5 text-[10px] font-medium text-white/40">점</span>
      </p>
    </li>
  );
}

export default function RankingBoard({ rows = [], myRank = null, myName = null, error = null }) {
  const myKey = myName ? myName.trim().toLowerCase() : null;
  const inTopN = Boolean(myKey) && rows.some((r) => r.player_name.trim().toLowerCase() === myKey);

  return (
    <section className="rounded-2xl border border-white/10 bg-night-800/90 p-3.5 shadow-lg shadow-night-900/40 backdrop-blur-md">
      <header className="mb-3 flex items-baseline justify-between px-1">
        <h2 className="text-base font-bold text-moon-100">🏆 명예의 전당</h2>
        <span className="text-[11px] text-white/40">TOP {TOP_N}</span>
      </header>

      {error ? (
        <p className="rounded-xl bg-hanbok/15 px-3 py-6 text-center text-xs leading-relaxed text-hanbok">
          랭킹을 불러오지 못했습니다.
          <br />
          <span className="text-white/50">{error}</span>
        </p>
      ) : rows.length === 0 ? (
        <p className="px-3 py-8 text-center text-xs leading-relaxed text-white/40">
          아직 등록된 기록이 없습니다.
          <br />
          첫 번째 주인공이 되어 보세요! 🌕
        </p>
      ) : (
        <ol className="space-y-1.5">
          {rows.map((r) => (
            <Row
              key={r.player_name}
              rank={r.rank}
              playerName={r.player_name}
              score={r.score}
              createdAt={r.created_at}
              highlight={Boolean(myKey) && r.player_name.trim().toLowerCase() === myKey}
            />
          ))}
        </ol>
      )}

      {/* Top 10 밖이면 ... 과 함께 내 등수를 따로 노출 */}
      {myRank?.ranked && !inTopN && (
        <>
          <p className="py-1.5 text-center text-base leading-none tracking-[0.3em] text-white/25">
            ···
          </p>
          <ol>
            <Row
              rank={myRank.rank}
              playerName={myRank.player_name}
              score={myRank.score}
              createdAt={myRank.created_at}
              highlight
            />
          </ol>
        </>
      )}

      {myRank && !myRank.ranked && (
        <p className="mt-2.5 rounded-xl bg-white/[0.04] px-3 py-2.5 text-center text-[11px] text-white/45">
          아직 등록된 기록이 없어요. 게임을 플레이하고 점수를 등록해 보세요!
        </p>
      )}
    </section>
  );
}
