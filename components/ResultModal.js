"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { submitScore } from "@/app/actions";
import { formatScore, NAME_MAX, NAME_PATTERN, normalizeName } from "@/lib/constants";

/**
 * 게임이 끝난 직후에는 아직 손가락이 화면을 연타하고 있습니다.
 * 그 터치가 버튼을 눌러 버리지 않도록 잠깐 모든 입력을 막아 둡니다.
 */
const ARM_MS = 1300;
/** 등록을 마친 뒤 다음 선택지가 열리기까지의 짧은 잠금 */
const ARM_AFTER_SUBMIT_MS = 500;

function grade(score) {
  if (score >= 4000) return { emoji: "🏆", text: "달토끼 명장!" };
  if (score >= 2500) return { emoji: "🌕", text: "송편 장인" };
  if (score >= 1200) return { emoji: "🥟", text: "제법인데요?" };
  return { emoji: "🌱", text: "다시 도전!" };
}

/** step 이 바뀔 때마다 ms 동안 입력을 잠급니다. */
function useInputLock(step, ms) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    setArmed(false);
    const t = setTimeout(() => setArmed(true), ms);
    return () => clearTimeout(t);
  }, [step, ms]);
  return armed;
}

/**
 * 게임 종료 오버레이.
 * - 뜨자마자 잠깐(ARM_MS) 터치를 먹어 버려서, 연타로 화면이 넘어가는 것을 막습니다
 * - 이름을 넣고 "점수 등록하기"를 눌러야 다음 게임 / 나가기 선택지가 열립니다
 * - 등록 없이 나가려면 한 번 더 확인을 받습니다 (실수로 기록을 날리지 않도록)
 * - 이름을 바꿔 등록하면 변경 전 이름으로 저장된 기록도 새 이름으로 함께 옮깁니다
 */
export default function ResultModal({
  score,
  level,
  savedName,
  previousName,
  onRegistered,
  onRetry,
  onDone,
}) {
  const [name, setName] = useState(savedName || "");
  const [editing, setEditing] = useState(!savedName);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [migrate, setMigrate] = useState(true);
  const [confirmExit, setConfirmExit] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef(null);

  const cleaned = normalizeName(name);
  const valid = NAME_PATTERN.test(cleaned);
  const g = grade(score);
  const done = Boolean(result);

  // 등록 전/후로 단계가 바뀔 때마다 다시 짧게 잠급니다.
  // (등록 버튼을 두 번 두드린 손가락이 곧바로 "한 번 더 하기"를 누르는 것도 막힙니다)
  const armed = useInputLock(done ? "done" : "input", done ? ARM_AFTER_SUBMIT_MS : ARM_MS);

  useEffect(() => {
    if (editing && armed && !done) inputRef.current?.focus();
  }, [editing, armed, done]);

  // 옮겨올 기록의 주인 = 지금 기기에 등록돼 있던 이름
  // (첫 화면에서 "이름 변경"을 눌렀다면 그때 남겨 둔 previousName)
  const oldName = normalizeName(savedName || previousName || "");
  const renaming = Boolean(oldName) && oldName.toLowerCase() !== cleaned.toLowerCase();

  function handleSubmit(e) {
    e?.preventDefault();
    if (!armed || !valid || pending || done) return;
    setError("");
    startTransition(async () => {
      const res = await submitScore(cleaned, score, renaming && migrate ? oldName : "");
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResult(res);
      onRegistered(res.name); // 이 세션(기기)에 이름 기억
    });
  }

  return (
    <div className="no-touch-callout absolute inset-0 z-40 flex items-center justify-center bg-night-900/85 px-6 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[360px] animate-pop-in rounded-3xl border border-white/12 bg-gradient-to-b from-[#221c46] to-[#171334] p-6 text-center shadow-2xl"
      >
        <p className="text-5xl leading-none">{g.emoji}</p>
        <p className="mt-3 text-sm font-semibold text-moon-500">{g.text}</p>

        <p className="mt-1 text-xs text-white/45">게임 오버! 최종 점수</p>
        <p className="mt-1 text-5xl font-black tabular-nums text-moon-100">
          {formatScore(score)}
          <span className="ml-1 text-lg font-bold text-white/50">점</span>
        </p>

        {level ? (
          <p className="mt-2 inline-block rounded-full bg-moon-500/15 px-3 py-1 text-xs font-bold text-moon-300 ring-1 ring-moon-500/30">
            레벨 {level} 도달
          </p>
        ) : null}

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
                  disabled={!armed}
                  placeholder="이름을 입력하세요 (공백 없이 최대 12자)"
                  autoComplete="off"
                  className="w-full rounded-xl border border-white/15 bg-night-900/70 px-4 py-3 text-center text-base text-moon-100 placeholder:text-white/35 outline-none focus:border-moon-500/70 focus:ring-2 focus:ring-moon-500/25 disabled:opacity-50"
                />
                <p className="mt-1.5 text-[11px] text-white/40">
                  공백 없이 입력해 주세요. 같은 이름의 최고 점수만 랭킹에 반영됩니다.
                </p>

                {renaming && valid && (
                  <div className="mt-2 rounded-xl bg-moon-500/10 px-3 py-2.5 text-left ring-1 ring-moon-500/25">
                    {migrate ? (
                      <>
                        <p className="text-[11px] leading-relaxed text-moon-300">
                          기존 <b>{oldName}</b> 님의 기록도 <b>{cleaned}</b> 으로 함께 옮깁니다.
                        </p>
                        <button
                          type="button"
                          onClick={() => setMigrate(false)}
                          disabled={!armed}
                          className="mt-1.5 text-[11px] text-white/45 underline underline-offset-2"
                        >
                          다른 사람인가요? 새 참가자로 등록하기
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-[11px] leading-relaxed text-white/50">
                          새 참가자로 등록합니다. <b>{oldName}</b> 님의 기록은 그대로 둡니다.
                        </p>
                        <button
                          type="button"
                          onClick={() => setMigrate(true)}
                          disabled={!armed}
                          className="mt-1.5 text-[11px] text-moon-300 underline underline-offset-2"
                        >
                          기존 기록을 새 이름으로 옮기기
                        </button>
                      </>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-between rounded-xl bg-white/[0.06] px-4 py-3">
                <span className="text-xs text-white/50">참가자</span>
                <span className="flex items-center gap-2">
                  <b className="text-base text-moon-300">{name}</b>
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    disabled={!armed}
                    className="rounded-lg border border-white/15 px-2 py-1 text-[11px] text-white/55 transition active:scale-95 disabled:opacity-40"
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
              {result.rank
                ? result.total
                  ? ` · ${result.total}명 중 ${result.rank}위`
                  : ` · 현재 ${result.rank}위`
                : ""}
            </span>
          </p>
        )}

        {error && (
          <p className="mt-3 rounded-xl bg-hanbok/15 px-3 py-2.5 text-xs text-hanbok">{error}</p>
        )}

        {/* ---------------- 버튼 ---------------- */}
        {done ? (
          // 등록을 마친 뒤에야 다음 게임 / 나가기를 고를 수 있습니다
          <div className="mt-5 space-y-2">
            <button
              type="button"
              onClick={onRetry}
              disabled={!armed}
              className="w-full rounded-2xl bg-gradient-to-r from-moon-500 to-moon-700 py-3.5 text-base font-black text-night-900 transition active:scale-[0.98] disabled:opacity-45"
            >
              한 번 더 하기
            </button>
            <button
              type="button"
              onClick={onDone}
              disabled={!armed}
              className="w-full rounded-2xl border border-white/15 py-3 text-sm font-bold text-moon-100 transition active:scale-[0.98] disabled:opacity-40"
            >
              랭킹 보러 가기
            </button>
          </div>
        ) : confirmExit ? (
          // 등록 없이 나가기 — 실수로 기록을 날리지 않도록 한 번 더 확인
          <div className="mt-5">
            <p className="rounded-xl bg-hanbok/10 px-3 py-2.5 text-[11px] leading-relaxed text-hanbok ring-1 ring-hanbok/25">
              등록하지 않고 나가면 이번 <b>{formatScore(score)}점</b>은 사라집니다.
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmExit(false)}
                className="flex-1 rounded-2xl bg-gradient-to-r from-moon-500 to-moon-700 py-3 text-sm font-black text-night-900 transition active:scale-[0.98]"
              >
                계속 등록하기
              </button>
              <button
                type="button"
                onClick={onDone}
                className="flex-1 rounded-2xl border border-white/15 py-3 text-sm font-bold text-white/60 transition active:scale-[0.98]"
              >
                그냥 나가기
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-2">
            <button
              type="submit"
              disabled={!armed || !valid || pending}
              className="w-full rounded-2xl bg-gradient-to-r from-moon-500 to-moon-700 py-3.5 text-base font-black text-night-900 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {pending ? "등록 중..." : "점수 등록하기"}
            </button>
            <p className="text-[11px] text-white/40">
              점수를 등록해야 다음 게임으로 넘어갈 수 있어요.
            </p>
            <button
              type="button"
              onClick={() => setConfirmExit(true)}
              disabled={!armed || pending}
              className="w-full rounded-2xl border border-white/12 py-2.5 text-xs font-bold text-white/45 transition active:scale-[0.98] disabled:opacity-30"
            >
              등록 없이 나가기
            </button>
          </div>
        )}
      </form>

      {/* 연타 방지 장막: 이 위를 아무리 두드려도 아래 버튼에는 닿지 않습니다 */}
      {!armed && (
        <div
          aria-hidden
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          style={{ touchAction: "none" }}
          className="absolute inset-0 z-50 flex items-end justify-center pb-[max(24px,env(safe-area-inset-bottom))]"
        >
          {!done && (
            <div className="animate-pop-in rounded-2xl bg-night-900/85 px-4 py-3 text-center ring-1 ring-white/10">
              <p className="text-xs font-bold text-moon-300">✋ 잠깐 멈춰 주세요</p>
              <p className="mt-1 text-[11px] text-white/45">곧 이름을 입력할 수 있어요</p>
              <div className="mt-2 h-1 w-40 overflow-hidden rounded-full bg-white/12">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-moon-300 to-moon-700"
                  style={{ animation: `lock-bar ${ARM_MS}ms linear forwards` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
