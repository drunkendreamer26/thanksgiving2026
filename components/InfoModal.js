"use client";

import { useState } from "react";
import { ITEMS, ITEM_TYPES, chanceOf, MAX_MULTIPLIER, COMBO_STEP } from "@/components/gameConfig";
import { LEVEL_DURATION, MAX_MISS } from "@/lib/constants";

const TABS = [
  { key: "how", label: "게임 방법" },
  { key: "items", label: "아이템 소개" },
];

/** 아이템 종류별 색상 (게임 화면의 링 색과 동일) */
const ACCENT = {
  [ITEM_TYPES.GOOD]: "#f5a623",
  [ITEM_TYPES.BONUS]: "#fff8e1",
  [ITEM_TYPES.SPECIAL]: "#7ef0d0",
  [ITEM_TYPES.BAD]: "#e05c6e",
};

const TYPE_LABEL = {
  [ITEM_TYPES.GOOD]: "기본 재료",
  [ITEM_TYPES.BONUS]: "보너스",
  [ITEM_TYPES.SPECIAL]: "스페셜",
  [ITEM_TYPES.BAD]: "방해",
};

function ItemRow({ item }) {
  const accent = ACCENT[item.type];
  const positive = item.points > 0;

  return (
    <li className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2.5">
      {/* 게임 안에서 보이는 모습 그대로 */}
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full text-[22px]"
        style={{
          background:
            item.type === ITEM_TYPES.BAD
              ? "rgba(255,216,221,0.95)"
              : "rgba(255,248,231,0.95)",
          border: `2px solid ${accent}`,
          boxShadow: `0 0 12px ${accent}66`,
        }}
      >
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt="" className="h-full w-full object-cover" />
        ) : (
          item.emoji
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-moon-100">{item.label}</p>
        <p className="text-[11px]" style={{ color: accent }}>
          {TYPE_LABEL[item.type]}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p
          className={[
            "text-sm font-black tabular-nums",
            positive ? "text-moon-300" : "text-hanbok",
          ].join(" ")}
        >
          {positive ? "+" : ""}
          {item.points.toLocaleString("ko-KR")}점
        </p>
        <p className="text-[11px] tabular-nums text-white/45">
          확률 {chanceOf(item).toFixed(chanceOf(item) < 10 ? 1 : 0)}%
        </p>
      </div>
    </li>
  );
}

function HowTab() {
  return (
    <div className="space-y-3 text-[13px] leading-relaxed text-white/70">
      <Section title="🎯 기본 규칙">
        <li>위에서 떨어지는 재료를 <b className="text-moon-300">터치</b>해 점수를 모읍니다.</li>
        <li><b className="text-moon-300">시간 제한이 없습니다.</b> 놓치지만 않으면 계속 진행됩니다.</li>
        <li>재료는 바닥에 닿으면 사라집니다.</li>
      </Section>

      <Section title="📈 레벨">
        <li>
          <b className="text-moon-300">{LEVEL_DURATION}초마다 레벨이 1씩</b> 올라갑니다 (레벨 1부터 시작).
        </li>
        <li>레벨이 오를수록 <b className="text-moon-300">더 빨리 떨어지고 더 자주</b> 나옵니다.</li>
        <li>높은 레벨에서는 한 번에 여러 개가 쏟아지기도 합니다.</li>
      </Section>

      <Section title="💀 게임 종료">
        <li>
          감점 없는 재료를 <b className="text-hanbok">{MAX_MISS}개 놓치면 즉시 종료</b>됩니다.
        </li>
        <li>방해 아이템(탄 송편·상한 재료)은 <b className="text-white/85">놓쳐도 괜찮습니다.</b></li>
        <li>화면 상단의 점 {MAX_MISS}개가 남은 기회입니다.</li>
      </Section>

      <Section title="🔥 콤보">
        <li>
          감점 없는 재료를 연속으로 모으면 <b className="text-moon-300">{COMBO_STEP}개마다 배수 +1</b>{" "}
          (최대 <b className="text-moon-300">×{MAX_MULTIPLIER}</b>).
        </li>
        <li>방해 아이템을 터치하거나 재료를 놓치면 <b className="text-hanbok">콤보가 초기화</b>됩니다.</li>
      </Section>

      <Section title="😵 방해 아이템">
        <li>터치하면 <b className="text-hanbok">-150점</b>, 그리고 <b className="text-hanbok">약 0.6초 경직</b>됩니다.</li>
        <li>경직 중에는 터치가 먹지 않으니 조심하세요.</li>
        <li>점수는 <b className="text-white/85">0점 아래로 내려가지 않습니다.</b></li>
      </Section>

      <Section title="🏆 기록 등록">
        <li>게임이 끝나면 이름을 입력해 점수를 등록합니다.</li>
        <li>이름은 <b className="text-moon-300">공백 없이 한글·영문·숫자 1~12자</b>.</li>
        <li>같은 이름의 <b className="text-moon-300">최고 점수 하나만</b> 랭킹에 반영됩니다.</li>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-xl bg-white/[0.04] p-3.5">
      <p className="mb-1.5 text-sm font-bold text-moon-100">{title}</p>
      <ul className="ml-4 list-disc space-y-1 marker:text-white/25">{children}</ul>
    </section>
  );
}

function ItemsTab() {
  // 점수 높은 순 → 감점 아이템은 뒤로
  const sorted = [...ITEMS].sort((a, b) => b.points - a.points);

  return (
    <div className="space-y-3">
      <ul className="space-y-1.5">
        {sorted.map((item) => (
          <ItemRow key={item.key} item={item} />
        ))}
      </ul>

      <p className="rounded-xl bg-moon-500/10 px-3 py-2.5 text-[11px] leading-relaxed text-moon-300 ring-1 ring-moon-500/25">
        ✨ <b>스페셜 재료</b>는 등장할 때 <b>탄 송편·상한 재료를 양옆에 달고</b> 내려옵니다.
        <br />
        콤보 배수(최대 ×{MAX_MULTIPLIER})가 곱해지므로 스페셜 재료는 최대{" "}
        <b>
          {(
            ITEMS.find((i) => i.type === ITEM_TYPES.SPECIAL).points * MAX_MULTIPLIER
          ).toLocaleString("ko-KR")}
          점
        </b>
        까지 오릅니다.
      </p>
    </div>
  );
}

export default function InfoModal({ open, onClose }) {
  const [tab, setTab] = useState("how");

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-night-900/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[86dvh] w-full max-w-[480px] animate-pop-in flex-col rounded-t-3xl border-t border-white/12 bg-gradient-to-b from-[#221c46] to-[#171334] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 + 탭 */}
        <div className="shrink-0 px-4 pb-3 pt-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />

          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-1 gap-1 rounded-xl bg-white/[0.06] p-1">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={[
                    "flex-1 rounded-lg py-2 text-sm font-bold transition",
                    tab === t.key
                      ? "bg-moon-500 text-night-900"
                      : "text-white/55 active:scale-95",
                  ].join(" ")}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 text-white/60 transition active:scale-95"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 내용 */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5">
          {tab === "how" ? <HowTab /> : <ItemsTab />}
        </div>
      </div>
    </div>
  );
}
