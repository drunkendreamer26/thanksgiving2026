"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import GameCanvas from "@/components/GameCanvas";
import ResultModal from "@/components/ResultModal";
import { usePlayerName } from "@/components/usePlayerName";

export default function GamePage() {
  const router = useRouter();
  const { name, remember } = usePlayerName();

  const [result, setResult] = useState(null); // { score, level }
  // key 를 바꿔 GameCanvas 를 통째로 리셋 → "다시 하기"
  const [round, setRound] = useState(0);

  const handleGameOver = useCallback((score, level) => setResult({ score, level }), []);

  const handleRetry = useCallback(() => {
    setResult(null);
    setRound((r) => r + 1);
  }, []);

  const handleDone = useCallback(() => {
    router.push("/");
    router.refresh();
  }, [router]);

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <GameCanvas key={round} onGameOver={handleGameOver} />

      {result && (
        <ResultModal
          score={result.score}
          level={result.level}
          savedName={name}
          onRegistered={remember}
          onRetry={handleRetry}
          onDone={handleDone}
        />
      )}
    </main>
  );
}
