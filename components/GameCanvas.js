"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ITEM_TYPES,
  HIT_SLOP,
  STUN_MS,
  pickItem,
  multiplierFor,
  spawnIntervalAt,
  fallSpeedAt,
} from "@/components/gameConfig";
import { GAME_DURATION } from "@/lib/constants";

const EMOJI_FONT =
  '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif';

const RING = {
  [ITEM_TYPES.GOOD]: "rgba(255, 213, 79, 0.55)",
  [ITEM_TYPES.BONUS]: "rgba(255, 248, 225, 0.95)",
  [ITEM_TYPES.BAD]: "rgba(224, 92, 110, 0.85)",
};

const FLOAT_COLOR = {
  [ITEM_TYPES.GOOD]: "#ffe9a8",
  [ITEM_TYPES.BONUS]: "#fff8e1",
  [ITEM_TYPES.BAD]: "#ff8b9c",
};

let seq = 0;
const nextId = () => ++seq;

/**
 * 캔버스 기반 클리커 게임.
 * - 아이템 낙하/충돌/이펙트는 모두 canvas 에서 처리(모바일 성능 확보)
 * - HUD(시간·점수)는 DOM 으로 렌더해 텍스트 선명도를 유지
 */
export default function GameCanvas({ onGameOver }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);

  // 렌더 트리거용 상태 (프레임마다 바뀌지 않도록 최소화)
  const [hud, setHud] = useState({
    score: 0,
    timeLeft: GAME_DURATION,
    combo: 0,
    stunned: false,
  });
  const [countdown, setCountdown] = useState(3);
  const [phase, setPhase] = useState("ready"); // ready | playing | done

  // 가변 게임 상태는 전부 ref 로 관리 (프레임마다 setState 하지 않음)
  const g = useRef({
    w: 0,
    h: 0,
    items: [],
    floats: [],
    bursts: [],
    score: 0,
    combo: 0,
    elapsed: 0,
    spawnTimer: 0,
    stunUntil: 0,
    shake: 0,
    running: false,
    last: 0,
    raf: 0,
  });

  /* ---------------------------------------------------------------- */
  /* 캔버스 크기 (DPR 대응)                                            */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      g.current.w = rect.width;
      g.current.h = rect.height;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      canvas.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  /* ---------------------------------------------------------------- */
  /* 시작 카운트다운 (3 → 2 → 1 → 시작!)                                */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (phase !== "ready") return;
    if (countdown <= 0) {
      setPhase("playing");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 800);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  /* ---------------------------------------------------------------- */
  /* 메인 루프                                                          */
  /* ---------------------------------------------------------------- */
  const endGame = useCallback(() => {
    const state = g.current;
    if (!state.running) return;
    state.running = false;
    cancelAnimationFrame(state.raf);
    setPhase("done");
    onGameOver(state.score);
  }, [onGameOver]);

  useEffect(() => {
    if (phase !== "playing") return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const state = g.current;

    // 재시작 / StrictMode 재마운트 대비 초기화
    Object.assign(state, {
      items: [],
      floats: [],
      bursts: [],
      score: 0,
      combo: 0,
      elapsed: 0,
      spawnTimer: 0,
      stunUntil: 0,
      shake: 0,
      running: true,
      last: performance.now(),
    });
    setHud({ score: 0, timeLeft: GAME_DURATION, combo: 0, stunned: false });

    let hudAccum = 0;

    const spawn = (progress) => {
      const def = pickItem();
      const margin = def.radius + 10;
      const x = margin + Math.random() * Math.max(1, state.w - margin * 2);
      const baseSpeed = state.h / 3.1;
      state.items.push({
        id: nextId(),
        def,
        x,
        y: -def.radius - 8,
        vx: (Math.random() - 0.5) * 26,
        vy: baseSpeed * fallSpeedAt(progress) * (0.85 + Math.random() * 0.35),
        rot: (Math.random() - 0.5) * 0.6,
        vr: (Math.random() - 0.5) * 1.6,
      });
    };

    const step = (now) => {
      if (!state.running) return;

      // 탭 전환 등으로 프레임이 크게 튀는 것을 방지
      const dt = Math.min((now - state.last) / 1000, 0.1);
      state.last = now;
      state.elapsed += dt;

      const timeLeft = Math.max(0, GAME_DURATION - state.elapsed);
      const progress = Math.min(state.elapsed / GAME_DURATION, 1);

      /* --- 생성 -------------------------------------------------- */
      if (timeLeft > 0.4) {
        state.spawnTimer -= dt * 1000;
        if (state.spawnTimer <= 0) {
          spawn(progress);
          state.spawnTimer =
            spawnIntervalAt(progress) * (0.8 + Math.random() * 0.4);
        }
      }

      /* --- 이동 -------------------------------------------------- */
      for (const it of state.items) {
        it.y += it.vy * dt;
        it.x += it.vx * dt;
        it.rot += it.vr * dt;
        // 좌우 벽에서 부드럽게 반사
        if (it.x < it.def.radius) {
          it.x = it.def.radius;
          it.vx *= -1;
        }
        if (it.x > state.w - it.def.radius) {
          it.x = state.w - it.def.radius;
          it.vx *= -1;
        }
      }
      // 바닥에 닿으면 자동 소멸
      state.items = state.items.filter((it) => it.y - it.def.radius < state.h);

      /* --- 이펙트 수명 ------------------------------------------- */
      for (const f of state.floats) {
        f.life -= dt;
        f.y -= 46 * dt;
      }
      state.floats = state.floats.filter((f) => f.life > 0);

      for (const b of state.bursts) {
        b.life -= dt;
        for (const p of b.parts) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += 320 * dt;
        }
      }
      state.bursts = state.bursts.filter((b) => b.life > 0);

      if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 34);

      /* --- 그리기 ------------------------------------------------ */
      draw(ctx, state, now);

      /* --- HUD 는 0.1초마다만 갱신 -------------------------------- */
      hudAccum += dt;
      if (hudAccum >= 0.1) {
        hudAccum = 0;
        setHud({
          score: state.score,
          timeLeft,
          combo: state.combo,
          stunned: now < state.stunUntil,
        });
      }

      if (timeLeft <= 0) {
        setHud({ score: state.score, timeLeft: 0, combo: state.combo, stunned: false });
        endGame();
        return;
      }

      state.raf = requestAnimationFrame(step);
    };

    state.raf = requestAnimationFrame(step);

    return () => {
      state.running = false;
      cancelAnimationFrame(state.raf);
    };
  }, [phase, endGame]);

  /* ---------------------------------------------------------------- */
  /* 탭(터치) 처리                                                      */
  /* ---------------------------------------------------------------- */
  const handlePointerDown = useCallback((e) => {
    const state = g.current;
    if (!state.running) return;

    const now = performance.now();
    if (now < state.stunUntil) return; // 경직 중에는 입력 무시

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 나중에 그려진(위에 보이는) 아이템부터 판정
    let hitIndex = -1;
    for (let i = state.items.length - 1; i >= 0; i--) {
      const it = state.items[i];
      const r = it.def.radius * HIT_SLOP;
      if ((x - it.x) ** 2 + (y - it.y) ** 2 <= r * r) {
        hitIndex = i;
        break;
      }
    }
    if (hitIndex === -1) return;

    const [hit] = state.items.splice(hitIndex, 1);
    const def = hit.def;

    if (def.type === ITEM_TYPES.BAD) {
      state.combo = 0;
      state.score = Math.max(0, state.score + def.points);
      state.stunUntil = now + STUN_MS;
      state.shake = 14;
      pushFloat(state, hit.x, hit.y, String(def.points), def.type);
      pushBurst(state, hit.x, hit.y, "#e05c6e");
      if (navigator.vibrate) navigator.vibrate(60);
    } else {
      state.combo += 1;
      const gain = def.points * multiplierFor(state.combo);
      state.score += gain;
      pushFloat(state, hit.x, hit.y, "+" + gain, def.type);
      pushBurst(state, hit.x, hit.y, def.type === ITEM_TYPES.BONUS ? "#fff8e1" : "#ffd54f");
    }

    setHud({
      score: state.score,
      timeLeft: Math.max(0, GAME_DURATION - state.elapsed),
      combo: state.combo,
      stunned: now < state.stunUntil,
    });
  }, []);

  /* ---------------------------------------------------------------- */
  const timePct = Math.max(0, Math.min(1, hud.timeLeft / GAME_DURATION));
  const urgent = hud.timeLeft <= 5;
  const multiplier = multiplierFor(hud.combo);

  return (
    <div className="no-touch-callout relative flex h-dvh w-full flex-col overflow-hidden bg-gradient-to-b from-[#0a0a1f] via-[#241d4f] to-[#4a2f5c]">
      {/* ---------------- HUD ---------------- */}
      <div className="relative z-20 px-4 pb-2 pt-[max(12px,env(safe-area-inset-top))]">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] text-white/45">SCORE</p>
            <p className="text-3xl font-black leading-none tabular-nums text-moon-100">
              {hud.score.toLocaleString("ko-KR")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold tracking-[0.2em] text-white/45">TIME</p>
            <p
              className={[
                "text-3xl font-black leading-none tabular-nums transition-colors",
                urgent ? "text-hanbok" : "text-moon-300",
              ].join(" ")}
            >
              {hud.timeLeft.toFixed(1)}
            </p>
          </div>
        </div>

        {/* 남은 시간 게이지 */}
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={[
              "h-full rounded-full transition-[width] duration-100 ease-linear",
              urgent ? "bg-hanbok" : "bg-gradient-to-r from-moon-300 to-moon-700",
            ].join(" ")}
            style={{ width: timePct * 100 + "%" }}
          />
        </div>

        {/* 콤보 */}
        <div className="mt-2 flex h-6 items-center justify-center">
          {multiplier > 1 && (
            <span
              key={multiplier}
              className="animate-pop-in rounded-full bg-moon-500/20 px-3 py-1 text-xs font-black text-moon-300 ring-1 ring-moon-500/40"
            >
              🔥 {hud.combo} COMBO · ×{multiplier}
            </span>
          )}
        </div>
      </div>

      {/* ---------------- 플레이 영역 ---------------- */}
      <div ref={wrapRef} className="relative z-10 flex-1">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          className="absolute inset-0 block h-full w-full"
          style={{ touchAction: "none" }}
        />

        {/* 경직 상태 */}
        {hud.stunned && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-hanbok/15">
            <span className="animate-pop-in rounded-xl bg-hanbok/90 px-4 py-2 text-sm font-black text-white">
              앗! 잠깐 멈칫 😵
            </span>
          </div>
        )}

        {/* 시작 카운트다운 */}
        {phase === "ready" && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-night-900/75 backdrop-blur-[2px]">
            <p className="mb-3 text-sm text-white/70">떨어지는 재료를 터치하세요!</p>
            <p key={countdown} className="animate-pop-in text-7xl font-black text-moon-300">
              {countdown > 0 ? countdown : "시작!"}
            </p>
          </div>
        )}
      </div>

      {/* 바닥의 달토끼 */}
      <div className="relative z-10 flex items-center justify-center pb-[max(10px,env(safe-area-inset-bottom))] pt-1 text-3xl">
        <span aria-hidden>🐰</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 이펙트 헬퍼                                                          */
/* ------------------------------------------------------------------ */

function pushFloat(state, x, y, text, type) {
  state.floats.push({ id: nextId(), x, y, text, type, life: 0.75, max: 0.75 });
}

function pushBurst(state, x, y, color) {
  const parts = Array.from({ length: 9 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 9 + Math.random() * 0.4;
    const sp = 110 + Math.random() * 110;
    return { x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, r: 2 + Math.random() * 2.5 };
  });
  state.bursts.push({ id: nextId(), parts, color, life: 0.45, max: 0.45 });
}

/* ------------------------------------------------------------------ */
/* 렌더링                                                              */
/* ------------------------------------------------------------------ */

function draw(ctx, state, now) {
  const w = state.w;
  const h = state.h;
  ctx.clearRect(0, 0, w, h);

  ctx.save();
  if (state.shake > 0) {
    ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
  }

  // 아이템
  for (const it of state.items) {
    const def = it.def;
    ctx.save();
    ctx.translate(it.x, it.y);
    ctx.rotate(it.rot);

    // 이모지 폰트가 달라도 좋음/나쁨을 구분할 수 있도록 링으로 표시
    const pulse = def.type === ITEM_TYPES.BONUS ? 1 + Math.sin(now / 160) * 0.08 : 1;
    ctx.beginPath();
    ctx.arc(0, 0, def.radius * pulse, 0, Math.PI * 2);
    ctx.fillStyle =
      def.type === ITEM_TYPES.BAD ? "rgba(224,92,110,0.16)" : "rgba(255,213,79,0.14)";
    ctx.fill();
    ctx.lineWidth = def.type === ITEM_TYPES.BONUS ? 3 : 2;
    ctx.strokeStyle = RING[def.type];
    ctx.stroke();

    if (def.type === ITEM_TYPES.BONUS) {
      ctx.shadowColor = "rgba(255,229,150,0.9)";
      ctx.shadowBlur = 18;
    }

    ctx.font = Math.round(def.radius * 1.25) + "px " + EMOJI_FONT;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(def.emoji, 0, 1);
    ctx.restore();
  }

  // 파티클
  for (const b of state.bursts) {
    const alpha = Math.max(0, b.life / b.max);
    ctx.fillStyle = b.color;
    ctx.globalAlpha = alpha;
    for (const p of b.parts) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // 획득 점수 텍스트
  for (const f of state.floats) {
    const alpha = Math.max(0, f.life / f.max);
    ctx.globalAlpha = alpha;
    ctx.font = "700 20px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(10,10,31,0.7)";
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = FLOAT_COLOR[f.type];
    ctx.fillText(f.text, f.x, f.y);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}
