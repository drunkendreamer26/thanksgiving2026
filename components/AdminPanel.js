"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  verifyAdmin,
  adminResetAll,
  adminDeleteByName,
  adminExport,
} from "@/app/actions";
import { formatScore, NAME_MAX } from "@/lib/constants";

const DENY_MESSAGE = "아는 사람끼리 이러지 맙시다 ^_^";

function csvCell(value) {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function stamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

function formatDateTime(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/**
 * 관리자 패널.
 * 비밀번호는 서버(PASSWORD 환경변수)에서만 확인하며,
 * 각 기능을 실행할 때마다 비밀번호를 함께 보내 서버에서 다시 검증합니다.
 */
export default function AdminPanel({ open, onClose, onChanged }) {
  const router = useRouter();
  const [step, setStep] = useState("auth"); // auth | denied | panel
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null); // { tone: "ok" | "bad", text }
  const [confirmReset, setConfirmReset] = useState(false);
  const [targetName, setTargetName] = useState("");
  const [pending, startTransition] = useTransition();
  const inputRef = useRef(null);

  // 열릴 때마다 초기화
  useEffect(() => {
    if (!open) return;
    setStep("auth");
    setPassword("");
    setError("");
    setNotice(null);
    setConfirmReset(false);
    setTargetName("");
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [open]);

  if (!open) return null;

  function handleAuth(e) {
    e.preventDefault();
    if (!password || pending) return;
    setError("");
    startTransition(async () => {
      const res = await verifyAdmin(password);
      if (res.ok) {
        setStep("panel");
        return;
      }
      // 불일치 → 메시지를 잠깐 보여준 뒤 게임 화면으로
      setStep("denied");
      setTimeout(() => router.push("/game"), 1600);
    });
  }

  function run(fn, onOk) {
    setNotice(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        setNotice({ tone: "bad", text: res.error });
        return;
      }
      onOk(res);
      onChanged?.();
    });
  }

  function handleReset() {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    setConfirmReset(false);
    run(
      () => adminResetAll(password),
      (res) => setNotice({ tone: "ok", text: `전체 기록 ${res.deleted}건을 삭제했습니다.` })
    );
  }

  function handleDeleteOne() {
    if (!targetName.trim()) return;
    run(
      () => adminDeleteByName(password, targetName),
      (res) => {
        setNotice({
          tone: "ok",
          text: `'${res.removed.player_name}' (${formatScore(res.removed.score)}점) 기록을 삭제했습니다.`,
        });
        setTargetName("");
      }
    );
  }

  function handleDownload() {
    run(
      () => adminExport(password),
      (res) => {
        if (res.rows.length === 0) {
          setNotice({ tone: "bad", text: "내려받을 기록이 없습니다." });
          return;
        }
        const header = ["등수", "이름", "점수", "등록일시"];
        const lines = [
          header.join(","),
          ...res.rows.map((r) =>
            [r.rank, csvCell(r.player_name), r.score, csvCell(formatDateTime(r.created_at))].join(",")
          ),
        ];
        // Excel 에서 한글이 깨지지 않도록 BOM 을 붙입니다
        const blob = new Blob(["﻿" + lines.join("\r\n")], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `달토끼타임어택_순위_${stamp()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setNotice({ tone: "ok", text: `${res.rows.length}건을 CSV 로 내려받았습니다.` });
      }
    );
  }

  /* ---------------- 비밀번호 불일치 ---------------- */
  if (step === "denied") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-night-900/90 px-8 backdrop-blur-sm">
        <div className="animate-pop-in text-center">
          <p className="text-5xl">🙈</p>
          <p className="mt-4 text-base font-bold text-moon-100">{DENY_MESSAGE}</p>
          <p className="mt-2 text-xs text-white/45">게임 화면으로 이동합니다...</p>
        </div>
      </div>
    );
  }

  /* ---------------- 비밀번호 입력 ---------------- */
  if (step === "auth") {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-night-900/85 px-6 backdrop-blur-sm"
        onClick={onClose}
      >
        <form
          onClick={(e) => e.stopPropagation()}
          onSubmit={handleAuth}
          className="w-full max-w-[340px] animate-pop-in rounded-3xl border border-white/12 bg-gradient-to-b from-[#221c46] to-[#171334] p-6 text-center shadow-2xl"
        >
          <p className="text-4xl">🔒</p>
          <p className="mt-3 text-sm font-bold text-moon-100">관리자 확인</p>
          <p className="mt-1 text-[11px] text-white/45">비밀번호를 입력해 주세요.</p>

          <input
            ref={inputRef}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="off"
            placeholder="비밀번호"
            className="mt-4 w-full rounded-xl border border-white/15 bg-night-900/70 px-4 py-3 text-center text-base tracking-widest text-moon-100 placeholder:tracking-normal placeholder:text-white/35 outline-none focus:border-moon-500/70 focus:ring-2 focus:ring-moon-500/25"
          />

          {error && (
            <p className="mt-2.5 rounded-lg bg-hanbok/15 px-3 py-2 text-xs text-hanbok">{error}</p>
          )}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-white/15 py-3 text-sm font-bold text-white/60 transition active:scale-[0.98]"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!password || pending}
              className="flex-1 rounded-2xl bg-gradient-to-r from-moon-500 to-moon-700 py-3 text-sm font-black text-night-900 transition active:scale-[0.98] disabled:opacity-45"
            >
              {pending ? "확인 중..." : "확인"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  /* ---------------- 관리자 바텀시트 ---------------- */
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-night-900/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[86dvh] w-full max-w-[480px] animate-pop-in flex-col rounded-t-3xl border-t border-white/12 bg-gradient-to-b from-[#221c46] to-[#171334] shadow-2xl"
      >
        <div className="shrink-0 px-4 pb-2 pt-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
          <div className="flex items-center justify-between">
            <p className="text-base font-black text-moon-100">🛠️ 관리자</p>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 text-white/60 transition active:scale-95"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-6">
          {notice && (
            <p
              className={[
                "rounded-xl px-3 py-2.5 text-xs leading-relaxed",
                notice.tone === "ok"
                  ? "bg-mugwort/15 text-mugwort"
                  : "bg-hanbok/15 text-hanbok",
              ].join(" ")}
            >
              {notice.text}
            </p>
          )}

          {/* 1. 전체 초기화 */}
          <section className="rounded-2xl bg-white/[0.05] p-4">
            <p className="text-sm font-bold text-moon-100">1. 전체 기록 초기화</p>
            <p className="mt-1 text-[11px] leading-relaxed text-white/45">
              모든 참가자의 기록을 지웁니다. 되돌릴 수 없습니다.
            </p>
            <button
              type="button"
              onClick={handleReset}
              disabled={pending}
              className={[
                "mt-3 w-full rounded-xl py-3 text-sm font-black transition active:scale-[0.98] disabled:opacity-45",
                confirmReset
                  ? "bg-hanbok text-white"
                  : "border border-hanbok/50 bg-hanbok/10 text-hanbok",
              ].join(" ")}
            >
              {confirmReset ? "정말 지웁니다 — 한 번 더 누르세요" : "전체 초기화"}
            </button>
            {confirmReset && (
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="mt-1.5 w-full py-1.5 text-[11px] text-white/45"
              >
                취소
              </button>
            )}
          </section>

          {/* 2. 이름으로 삭제 */}
          <section className="rounded-2xl bg-white/[0.05] p-4">
            <p className="text-sm font-bold text-moon-100">2. 이름으로 기록 삭제</p>
            <p className="mt-1 text-[11px] leading-relaxed text-white/45">
              대소문자는 구분하지 않습니다.
            </p>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                maxLength={NAME_MAX}
                placeholder="삭제할 이름"
                autoComplete="off"
                className="min-w-0 flex-1 rounded-xl border border-white/15 bg-night-900/70 px-3 py-2.5 text-sm text-moon-100 placeholder:text-white/35 outline-none focus:border-moon-500/70"
              />
              <button
                type="button"
                onClick={handleDeleteOne}
                disabled={pending || !targetName.trim()}
                className="shrink-0 rounded-xl border border-hanbok/50 bg-hanbok/10 px-4 text-sm font-bold text-hanbok transition active:scale-95 disabled:opacity-40"
              >
                삭제
              </button>
            </div>
          </section>

          {/* 3. 전체 순위 다운로드 */}
          <section className="rounded-2xl bg-white/[0.05] p-4">
            <p className="text-sm font-bold text-moon-100">3. 전체 순위 다운로드</p>
            <p className="mt-1 text-[11px] leading-relaxed text-white/45">
              등수 · 이름 · 점수 · 등록일시 를 CSV 로 내려받습니다.
            </p>
            <button
              type="button"
              onClick={handleDownload}
              disabled={pending}
              className="mt-3 w-full rounded-xl bg-gradient-to-r from-moon-500 to-moon-700 py-3 text-sm font-black text-night-900 transition active:scale-[0.98] disabled:opacity-45"
            >
              ⬇️ CSV 내려받기
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
