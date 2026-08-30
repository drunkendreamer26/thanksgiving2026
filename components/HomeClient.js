"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NightSky from "@/components/NightSky";
import MoonScene from "@/components/MoonScene";
import RankingBoard from "@/components/RankingBoard";
import InfoModal from "@/components/InfoModal";
import { usePlayerName } from "@/components/usePlayerName";
import { getMyRank, getTopScores } from "@/app/actions";
import { EVENT_TITLE, GAME_TITLE, formatScore } from "@/lib/constants";

export default function HomeClient({ initialRows, initialError }) {
  const router = useRouter();
  const { name, ready, forget } = usePlayerName();

  const [rows, setRows] = useState(initialRows);
  const [error, setError] = useState(initialError);
  const [myRank, setMyRank] = useState(null);
  const [infoOpen, setInfoOpen] = useState(false);

  const refresh = useCallback(async (playerName) => {
    const [top, mine] = await Promise.all([
      getTopScores(),
      playerName ? getMyRank(playerName) : Promise.resolve(null),
    ]);
    if (top.ok) {
      setRows(top.rows);
      setError(null);
    } else {
      setError(top.error);
    }
    setMyRank(mine?.ok ? mine : null);
  }, []);

  // 게임 후 복귀 시에도 랭킹과 내 등수를 최신으로 유지
  useEffect(() => {
    if (!ready) return;
    refresh(name);
  }, [ready, name, refresh]);

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden">
      <NightSky withMoon={false} />

      <div className="relative flex flex-1 flex-col gap-3.5 px-4 pb-8 pt-10">
        {/* 타이틀 */}
        <header className="text-center">
          <p className="text-[11px] font-semibold tracking-[0.25em] text-moon-500/80">
            2026 CHUSEOK EVENT
          </p>
          <h1
            className="mt-1.5 text-[22px] font-black leading-tight text-moon-100"
            style={{
              textShadow: "0 2px 10px rgba(10,10,31,0.9), 0 0 3px rgba(10,10,31,0.95)",
            }}
          >
            {EVENT_TITLE}
          </h1>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-moon-500/40 bg-moon-500/10 px-3.5 py-1.5 text-sm font-bold text-moon-300 backdrop-blur-sm">
            🌕 {GAME_TITLE}
          </p>
        </header>

        {/* 달맞이 배너 — 기록 개수와 무관하게 항상 보이는 배경 */}
        <MoonScene />

        {/* 등록된 이름이 있을 때만 내 기록 카드 노출 */}
        {ready && name && (
          <div className="flex animate-pop-in items-center justify-between rounded-2xl border border-white/10 bg-night-800/90 px-4 py-3.5 shadow-lg shadow-night-900/40 backdrop-blur-md">
            <div className="min-w-0">
              <p className="text-[11px] text-white/45">참가자</p>
              <p className="truncate text-base font-bold text-moon-100">{name}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[11px] text-white/45">내 최고점</p>
                <p className="text-base font-bold tabular-nums text-moon-300">
                  {myRank?.ranked ? `${formatScore(myRank.score)}점` : "기록 없음"}
                </p>
              </div>
              <button
                type="button"
                onClick={forget}
                title="다른 이름으로 참가하기"
                className="rounded-lg border border-white/15 px-2.5 py-1.5 text-[11px] text-white/55 transition active:scale-95"
              >
                이름 변경
              </button>
            </div>
          </div>
        )}

        {/* 게임 방법 → 게임 시작 순서 (명예의 전당 위) */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setInfoOpen(true)}
            className="flex w-full items-center justify-between gap-2 rounded-2xl border border-white/15 bg-night-800/90 px-4 py-3 text-sm font-bold text-moon-100 shadow-lg shadow-night-900/40 backdrop-blur-md transition active:scale-[0.98]"
          >
            <span>📖 게임 방법 · 아이템 소개</span>
            <span className="animate-shine shrink-0 rounded-full bg-moon-500/20 px-2.5 py-1 text-[10px] font-black tracking-[0.15em] text-moon-300 ring-1 ring-moon-500/40">
              CLICK
            </span>
          </button>

          <button
            type="button"
            onClick={() => router.push("/game")}
            className="w-full rounded-2xl bg-gradient-to-r from-moon-500 to-moon-700 py-4 text-lg font-black text-night-900 shadow-lg shadow-moon-700/25 transition active:scale-[0.98]"
          >
            게임 시작하기
          </button>
        </div>

        {/* 랭킹보드 */}
        <RankingBoard rows={rows} myRank={myRank} myName={name} error={error} />
      </div>

      <InfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
    </main>
  );
}
