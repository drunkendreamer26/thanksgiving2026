"use client";

import { useMemo } from "react";

/** 그룹장 K 주위를 도는 4방향 반짝이 */
function Sparkle({ style, size = 13, delay = "0s" }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className="absolute drop-shadow-[0_0_5px_rgba(255,229,150,0.95)]"
      style={{ ...style, animation: `twinkle 1.8s ease-in-out ${delay} infinite` }}
    >
      <path
        d="M12 0 C13 9 15 11 24 12 C15 13 13 15 12 24 C11 15 9 13 0 12 C9 11 11 9 12 0 Z"
        fill="#fff8e1"
      />
    </svg>
  );
}

/**
 * 첫 화면 상단의 달맞이 배너.
 * 페이지 배경의 달은 기록이 늘어나면 화면 밖으로 밀려서, 항상 보이도록
 * 고정 높이 배너 안에 별도의 밤 풍경을 그립니다.
 * 달 자리에는 스페셜 아이템(그룹장 K)을 게임 안에서 보이는 모습 그대로 띄웁니다.
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

      {/* 달 자리에 뜬 그룹장 K — 보름달처럼 보이도록 금빛으로 처리 */}
      <div className="absolute left-1/2 top-4 h-[72px] w-[72px] -translate-x-1/2">
        {/* 달무리 */}
        <div
          aria-hidden
          className="animate-shine absolute -inset-7 rounded-full bg-moon-500/30 blur-2xl"
        />
        {/* 달 원판 — 테두리 대신 은은한 발광으로 달 느낌을 냅니다 */}
        <div className="absolute inset-0 overflow-hidden rounded-full bg-[#ffe9a8] shadow-[0_0_26px_rgba(255,213,79,0.75),inset_0_0_14px_rgba(245,197,66,0.5)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/special.png"
            alt="보름달로 떠오른 그룹장 K"
            className="h-full w-full object-cover"
            style={{ filter: "sepia(0.6) saturate(1.35) brightness(1.1) contrast(0.95)" }}
          />
          {/* 달빛 음영 */}
          <div
            aria-hidden
            className="absolute inset-0 mix-blend-soft-light"
            style={{
              background:
                "radial-gradient(circle at 32% 28%, rgba(255,253,243,0.85), rgba(255,213,79,0.35) 55%, rgba(180,130,30,0.55) 100%)",
            }}
          />
        </div>
        {/* 반짝이 */}
        <Sparkle style={{ left: -10, top: 6 }} size={14} delay="0s" />
        <Sparkle style={{ right: -8, top: 0 }} size={11} delay="0.5s" />
        <Sparkle style={{ right: -12, bottom: 10 }} size={13} delay="1s" />
        <Sparkle style={{ left: 2, bottom: -8 }} size={10} delay="1.4s" />
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
