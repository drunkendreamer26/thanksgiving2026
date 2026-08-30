"use client";

import { useMemo } from "react";

/**
 * 첫 화면 상단의 달맞이 배너.
 * 페이지 배경의 달은 기록이 늘어나면 화면 밖으로 밀려서, 항상 보이도록
 * 고정 높이 배너 안에 별도의 밤 풍경을 그립니다.
 */
export default function MoonScene() {
  const stars = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: (i * 43.7) % 100,
        top: ((i * 29.3) % 100) * 0.55,
        size: (i % 2) + 1,
        delay: ((i * 17) % 30) / 10,
      })),
    []
  );

  return (
    <div className="relative h-36 w-full overflow-hidden rounded-2xl border border-white/10 shadow-lg shadow-night-900/40">
      {/* 하늘 */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#080818_0%,#1b1740_45%,#4a2f5c_78%,#6b4468_100%)]" />

      {/* 별 */}
      {stars.map((s) => (
        <span
          key={s.id}
          aria-hidden
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

      {/* 보름달 */}
      <div aria-hidden className="absolute left-1/2 top-5 h-16 w-16 -translate-x-1/2">
        <div className="animate-shine absolute -inset-6 rounded-full bg-moon-500/25 blur-2xl" />
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_32%_30%,#fffdf3,#ffe9a8_45%,#f5c542_100%)]" />
        <div className="absolute left-[24%] top-[30%] h-2 w-2 rounded-full bg-[#e8b93f]/35" />
        <div className="absolute left-[56%] top-[22%] h-1.5 w-1.5 rounded-full bg-[#e8b93f]/30" />
        <div className="absolute left-[46%] top-[58%] h-2.5 w-2.5 rounded-full bg-[#e8b93f]/25" />
      </div>

      {/* 달 앞을 지나는 옅은 구름 */}
      <div aria-hidden className="absolute left-[18%] top-[52%] h-2.5 w-24 rounded-full bg-white/10 blur-md" />
      <div aria-hidden className="absolute left-[52%] top-[42%] h-2 w-20 rounded-full bg-white/[0.07] blur-md" />

      {/* 떠다니는 송편 재료 (게임 미리보기) */}
      <span
        aria-hidden
        className="absolute left-[14%] top-[24%] text-lg"
        style={{ animation: "bob 3.4s ease-in-out infinite" }}
      >
        🥟
      </span>
      <span
        aria-hidden
        className="absolute right-[16%] top-[34%] text-base"
        style={{ animation: "bob 4.2s ease-in-out 0.8s infinite" }}
      >
        🌰
      </span>
      <span
        aria-hidden
        className="absolute right-[30%] top-[14%] text-sm"
        style={{ animation: "bob 3.8s ease-in-out 1.6s infinite" }}
      >
        🌿
      </span>

      {/* 언덕 */}
      <svg
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-14 w-full"
        viewBox="0 0 400 60"
        preserveAspectRatio="none"
      >
        <path
          d="M0,28 C54,10 96,38 150,24 C208,9 250,36 306,20 C348,8 378,26 400,18 L400,60 L0,60 Z"
          fill="#2e1f45"
        />
        <path
          d="M0,44 C48,30 92,52 142,40 C200,27 244,50 300,38 C344,29 378,44 400,38 L400,60 L0,60 Z"
          fill="#180f28"
        />
      </svg>

      {/* 언덕 위의 달토끼 */}
      <span aria-hidden className="absolute bottom-1.5 left-[24%] text-xl">
        🐰
      </span>
    </div>
  );
}
