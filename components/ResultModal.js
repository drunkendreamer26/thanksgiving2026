"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { submitScore } from "@/app/actions";
import { formatScore, NAME_MAX, NAME_PATTERN, normalizeName } from "@/lib/constants";

function grade(score) {
  if (score >= 4000) return { emoji: "🏆", text: "달토끼 명장!" };
  if (score >= 2500) return { emoji: "🌕", text: "송편 장인" };
  if (score >= 1200) return { emoji: "🥟", text: "제법인데요?" };
  return { emoji: "🌱", text: "다시 도전!" };
}

/**
 * 게임 종료 오버레이.
 * - 이름이 아직 없으면 입력받아 등록 (등록과 동시에 이 기기에 기억)
 * - 이미 등록된 이름이 있으면 그 이름으로 바로 등록
 */
export default function ResultModal({ score, savedName, onRegistered, onRetry, onDone }) {
  const [name, setName] = useState(savedName || "");
  const [editing, setEditing] = useState(!savedName);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const cleaned = normalizeName(name);
  const valid = NAME_PATTERN.test(cleaned);
  const g = grade(score);
  const done = Boolean(result);

  function handleSubmit(e) {
    e?.preventDefault();
    if (!valid || pending || done) return;
    setError("");
    startTransition(async () => {
      const res = await submitScore(cleaned, score);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResult(res);
      onRegistered(res.name); // 이 세션(기기)에 이름 기억
      setTimeout(onDone, 1300); // 안내를 잠깐 보여준 뒤 랭킹보드로 이동
    });
  }

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-night-900/85 px-6 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[360px] animate-pop-in rounded-3xl border border-white/12 bg-gradient-to-b from-[#221c46] to-[#171334] p-6 text-center shadow-2xl"
      >
        <p className="text-5xl leading-none">{g.emoji}</p>
        <p className="mt-3 text-sm font-semibold text-moon-500">{g.text}</p>

        <p className="mt-1 text-xs text-white/45">타임 오버! 최종 점수</p>
        <p className="mt-1 text-5xl font-black tabular-nums text-moon-100">
          {formatScore(score)}
          <span className="ml-1 text-lg font-bold text-white/50">점</span>
        </p>

        {/* 이름 입력 / 확인 */}
        {!done && (
          <div className="mt-5">
            {editing ? (
              <>
                <label className="mb-1.5 block text-left text-[11px] font-semibold text-moon-300">
                  등록할 이름
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(normalizeName(e.target.value).slice(0, NAME_MAX))}
                  maxLength={NAME_MAX}
                  placeholder="이름을 입력하세요 (공백 없이 최대 12자)"
                  autoComplete="off"
                  className="w-full rounded-xl border border-white/15 bg-night-900/70 px-4 py-3 text-center text-base text-moon-100 placeholder:text-white/35 outline-none focus:border-moon-500/70 focus:ring-2 focus:ring-moon-500/25"
                />
                <p className="mt-1.5 text-[11px] text-white/40">
                  공백 없이 입력해 주세요. 같은 이름의 최고 점수만 랭킹에 반영됩니다.
                </p>
              </>
            ) : (
              <div className="flex items-center justify-between rounded-xl bg-white/[0.06] px-4 py-3">
                <span className="text-xs text-white/50">참가자</span>
                <span className="flex items-center gap-2">
                  <b className="text-base text-moon-300">{name}</b>
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="rounded-lg border border-white/15 px-2 py-1 text-[11px] text-white/55 transition active:scale-95"
                  >
                    변경
                  </button>
                </span>
              </div>
            )}
          </div>
        )}

        {result && (
          <p className="mt-4 rounded-xl bg-mugwort/15 px-3 py-3 text-xs leading-relaxed text-mugwort">
            {result.updated
              ? "🎉 최고 기록을 갱신했습니다!"
              : "기존 최고 기록이 더 높아 그대로 유지됩니다."}
            <br />
            <span className="text-white/65">
              {result.name} 님의 최고점 {formatScore(result.best)}점
              {result.rank ? ` · 현재 ${result.rank}위` : ""}
            </span>
          </p>
        )}

        {error && (
          <p className="mt-3 rounded-xl bg-hanbok/15 px-3 py-2.5 text-xs text-hanbok">{error}</p>
        )}

        <div className="mt-5 space-y-2">
          <button
            type="submit"
            disabled={!valid || pending || done}
            className="w-full rounded-2xl bg-gradient-to-r from-moon-500 to-moon-700 py-3.5 text-base font-black text-night-900 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {done ? "등록 완료! 이동 중..." : pending ? "등록 중..." : "점수 등록하기"}
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onRetry}
              disabled={pending || done}
              className="flex-1 rounded-2xl border border-white/15 py-3 text-sm font-bold text-moon-100 transition active:scale-[0.98] disabled:opacity-40"
            >
              다시 하기
            </button>
            <button
              type="button"
              onClick={onDone}
              disabled={pending || done}
              className="flex-1 rounded-2xl border border-white/15 py-3 text-sm font-bold text-white/60 transition active:scale-[0.98] disabled:opacity-40"
            >
              등록 없이 나가기
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
