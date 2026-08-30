"use client";

import { useMemo } from "react";

/**
 * 추석 밤 풍경 배경.
 * 하늘 그라데이션 → 별 → 구름 → 보름달 → 언덕/억새 실루엣 순으로 쌓습니다.
 * 달을 화면 끝에 걸치지 않고 언덕 위에 온전히 띄워 "달맞이" 구도를 만듭니다.
 */
export default function NightSky({ withMoon = true }) {
  // 매 렌더마다 별 위치가 흔들리지 않도록 한 번만 계산
  const stars = useMemo(
    () =>
      Array.from({ length: 46 }, (_, i) => ({
        id: i,
        left: (i * 37.7) % 100,
        // 별은 하늘(위쪽 70%)에만 뿌립니다
        top: ((i * 61.3) % 100) * 0.68,
        size: (i % 3) + 1,
        delay: ((i * 13) % 30) / 10,
      })),
    []
  );

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* 밤하늘 그라데이션 (위: 짙은 남색 → 아래: 노을빛 보라) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#070716_0%,#12102e_28%,#241c47_55%,#432b58_78%,#6b4468_100%)]" />

      {/* 별 */}
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

      {withMoon && (
        <>
          {/* 보름달 — 언덕 위에 온전한 원으로 떠 있습니다 */}
          <div className="absolute bottom-[26%] left-[60%] h-20 w-20">
            {/* 달무리 */}
            <div className="animate-shine absolute -inset-8 rounded-full bg-moon-500/20 blur-2xl" />
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_32%_30%,#fffdf3,#ffe9a8_45%,#f5c542_100%)]" />
            {/* 크레이터 */}
            <div className="absolute left-[24%] top-[30%] h-2.5 w-2.5 rounded-full bg-[#e8b93f]/35" />
            <div className="absolute left-[55%] top-[22%] h-1.5 w-1.5 rounded-full bg-[#e8b93f]/30" />
            <div className="absolute left-[46%] top-[58%] h-3 w-3 rounded-full bg-[#e8b93f]/25" />
          </div>

          {/* 달 앞을 지나는 옅은 구름 */}
          <div className="absolute bottom-[30%] left-[46%] h-3 w-32 rounded-full bg-white/10 blur-md" />
          <div className="absolute bottom-[23%] left-[54%] h-2.5 w-24 rounded-full bg-white/[0.07] blur-md" />
        </>
      )}

      {/* 언덕 + 억새 실루엣 */}
      <svg
        className="absolute inset-x-0 bottom-0 h-[24%] w-full"
        viewBox="0 0 400 120"
        preserveAspectRatio="none"
      >
        {/* 뒤쪽 능선 */}
        <path
          d="M0,64 C48,34 92,72 148,52 C206,31 246,70 302,48 C344,32 378,54 400,44 L400,120 L0,120 Z"
          fill="#2e1f45"
        />
        {/* 앞쪽 능선 */}
        <path
          d="M0,92 C46,72 88,100 140,86 C198,70 240,100 298,84 C342,72 378,90 400,82 L400,120 L0,120 Z"
          fill="#180f28"
        />
      </svg>

      {/* 억새 (앞쪽 능선 위에 몇 포기) */}
      <svg
        className="absolute inset-x-0 bottom-0 h-[16%] w-full"
        viewBox="0 0 400 80"
        preserveAspectRatio="none"
      >
        <g stroke="#180f28" strokeWidth="1.6" fill="none" strokeLinecap="round">
          <path d="M28,80 C26,62 22,54 16,48" />
          <path d="M32,80 C32,60 34,50 40,42" />
          <path d="M36,80 C38,64 42,56 48,52" />
          <path d="M354,80 C352,60 348,52 342,46" />
          <path d="M360,80 C360,58 362,48 368,40" />
          <path d="M366,80 C368,62 372,54 378,50" />
        </g>
      </svg>
    </div>
  );
}
