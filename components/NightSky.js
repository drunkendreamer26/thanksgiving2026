"use client";

import { useMemo } from "react";

/** 달과 별이 있는 밤하늘 배경 (게임/홈 공통) */
export default function NightSky({ withMoon = true }) {
  // 매 렌더마다 별 위치가 흔들리지 않도록 한 번만 계산
  const stars = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => ({
        id: i,
        left: (i * 37.7) % 100,
        top: (i * 61.3) % 78,
        size: (i % 3) + 1,
        delay: ((i * 13) % 30) / 10,
      })),
    []
  );

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a1f] via-[#1b1740] to-[#3c2a52]" />

      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full bg-moon-100"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animation: `twinkle 3s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}

      {/* 제목과 겹치지 않도록 타이틀 블록 아래·오른쪽 끝에 배치 */}
      {withMoon && (
        <div className="absolute -right-8 bottom-28">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-moon-100 to-moon-500 opacity-80 blur-[0.5px]" />
          <div className="absolute inset-0 -z-10 h-24 w-24 rounded-full bg-moon-500 opacity-35 blur-2xl animate-shine" />
        </div>
      )}

      {/* 지평선의 구름 */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#4a2f5c] to-transparent" />
    </div>
  );
}
