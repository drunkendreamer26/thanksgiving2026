"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GameCanvas from "@/components/GameCanvas";
import ResultModal from "@/components/ResultModal";
import { usePlayerName } from "@/components/usePlayerName";
import { getEventWindow } from "@/app/actions";
import { eventGateMessage, eventWindowState } from "@/lib/eventWindow";

export default function GamePage() {
  const router = useRouter();
  const { name, previousName, remember } = usePlayerName();

  // 참여 시간 확인 전에는 게임을 띄우지 않습니다: "checking" | "open" | "closed"
  const [phase, setPhase] = useState("checking");
  const [closedMessage, setClosedMessage] = useState("");

  const [result, setResult] = useState(null); // { score, level }
  // key 를 바꿔 GameCanvas 를 통째로 리셋 → "다시 하기"
  const [round, setRound] = useState(0);

  const goHome = useCallback(() => {
    router.push("/");
    router.refresh();
  }, [router]);

  // 주소로 바로 들어온 경우까지 막기 위해 여기서도 참여 시간을 확인합니다
  useEffect(() => {
    let alive = true;
    getEventWindow().then((res) => {
      if (!alive) return;
      const message = eventGateMessage(eventWindowState(res.startAt, res.endAt));
      if (!message) {
        setPhase("open");
        return;
      }
      setClosedMessage(message);
      setPhase("closed");
    });
    return () => {
      alive = false;
    };
  }, []);

  // 참여 시간이 아니면 안내를 잠깐 보여준 뒤 첫 화면으로 돌려보냅니다
  useEffect(() => {
    if (phase !== "closed") return;
    const t = setTimeout(goHome, 1800);
    return () => clearTimeout(t);
  }, [phase, goHome]);

  const handleGameOver = useCallback((score, level) => setResult({ score, level }), []);

  const handleRetry = useCallback(() => {
    setResult(null);
    setRound((r) => r + 1);
  }, []);

  if (phase !== "open") {
    return (
      <main className="relative flex h-dvh w-full items-center justify-center bg-night-900 px-8">
        {phase === "closed" ? (
          <div className="animate-pop-in text-center">
            <p className="text-5xl">⏰</p>
            <p className="mt-4 text-base font-bold text-moon-100">{closedMessage}</p>
            <p className="mt-2 text-xs text-white/45">첫 화면으로 이동합니다...</p>
          </div>
        ) : (
          <p className="text-sm text-white/45">잠시만 기다려 주세요...</p>
        )}
      </main>
    );
  }

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <GameCanvas key={round} onGameOver={handleGameOver} />

      {result && (
        <ResultModal
          score={result.score}
          level={result.level}
          savedName={name}
          previousName={previousName}
          onRegistered={remember}
          onRetry={handleRetry}
          onDone={goHome}
        />
      )}
    </main>
  );
}
