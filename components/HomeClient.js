"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NightSky from "@/components/NightSky";
import RankingBoard from "@/components/RankingBoard";
import { usePlayerName } from "@/components/usePlayerName";
import { getMyRank, getTopScores } from "@/app/actions";
import { EVENT_TITLE, GAME_TITLE, GAME_DURATION, formatScore } from "@/lib/constants";

export default function HomeClient({ initialRows, initialError }) {
  const router = useRouter();
  const { name, ready, forget } = usePlayerName();

  const [rows, setRows] = useState(initialRows);
  const [error, setError] = useState(initialError);
  const [myRank, setMyRank] = useState(null);

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
      <NightSky />

      <div className="relative flex flex-1 flex-col gap-4 px-4 pb-8 pt-10">
        {/* 타이틀 */}
        <header className="text-center">
          <p className="text-[11px] font-semibold tracking-[0.25em] text-moon-500/80">
            2026 CHUSEOK EVENT
          </p>
          <h1 className="mt-1.5 text-[22px] font-black leading-tight text-moon-100">
            {EVENT_TITLE}
          </h1>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-moon-500/40 bg-moon-500/10 px-3.5 py-1.5 text-sm font-bold text-moon-300">
            🌕 {GAME_TITLE}
          </p>
        </header>

        {/* 등록된 이름이 있을 때만 내 기록 카드 노출 */}
        {ready && name && (
          <div className="flex animate-pop-in items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 backdrop-blur-sm">
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

        {/* 랭킹보드 */}
        <RankingBoard rows={rows} myRank={myRank} myName={name} error={error} />

        {/* 게임 방법 */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4 text-[12px] leading-relaxed text-white/60 backdrop-blur-sm">
          <p className="mb-2 text-sm font-bold text-moon-100">🎮 게임 방법</p>
          <ul className="space-y-1">
            <li>
              · {GAME_DURATION}초 동안 떨어지는 송편 재료를{" "}
              <b className="text-moon-300">터치</b>하세요.
            </li>
            <li>
              · 쌀가루·팥·쑥 <b className="text-mugwort">+100점</b> / 황금 보름달{" "}
              <b className="text-moon-500">+300점</b>
            </li>
            <li>
              · 아주 드물게 나오는 <b className="text-[#7ef0d0]">스페셜 재료 +500점</b> — 단,
              방해 아이템을 양옆에 달고 내려옵니다.
            </li>
            <li>
              · 탄 송편·상한 재료를 만지면 <b className="text-hanbok">-150점</b> 이고 잠시
              경직됩니다.
            </li>
            <li>
              · 연속으로 모으면 <b className="text-moon-300">콤보 배수</b>가 올라갑니다.
            </li>
            <li>· 게임이 끝나면 이름을 입력해 점수를 등록합니다.</li>
          </ul>
        </section>

        <div className="flex-1" />

        {/* 게임 시작 */}
        <div className="sticky bottom-4">
          <button
            type="button"
            onClick={() => router.push("/game")}
            className="w-full rounded-2xl bg-gradient-to-r from-moon-500 to-moon-700 py-4 text-lg font-black text-night-900 shadow-lg shadow-moon-700/25 transition active:scale-[0.98]"
          >
            게임 시작하기
          </button>
        </div>
      </div>
    </main>
  );
}
