"use client";

import { useCallback, useEffect, useState } from "react";
import { normalizeName } from "@/lib/constants";

const STORAGE_KEY = "chuseok2026.playerName";
// 이름을 바꾸는 중일 때 "변경 전 이름"을 잠시 보관합니다.
// 새 이름으로 점수를 등록할 때 서버가 옛 이름의 기록을 새 이름으로 옮깁니다.
const PREV_KEY = "chuseok2026.previousName";

function write(key, value) {
  try {
    if (value) window.localStorage.setItem(key, value);
    else window.localStorage.removeItem(key);
  } catch {
    /* 시크릿 모드 등 저장 실패는 무시하고 메모리 상태로만 사용 */
  }
}

/**
 * 참가자 이름을 브라우저에 기억해 둡니다.
 * 한 번 등록하면 같은 기기에서는 계속 그 이름으로 기록이 쌓입니다.
 */
export function usePlayerName() {
  const [name, setName] = useState("");
  const [previousName, setPreviousName] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const read = () => {
      try {
        setName(window.localStorage.getItem(STORAGE_KEY) || "");
        setPreviousName(window.localStorage.getItem(PREV_KEY) || "");
      } catch {
        setName("");
        setPreviousName("");
      }
    };
    read();
    setReady(true);

    const onStorage = (e) => {
      if (e.key === STORAGE_KEY || e.key === PREV_KEY) read();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /** 등록에 성공한 이름을 확정합니다. 이관이 끝났으므로 변경 전 이름은 지웁니다. */
  const remember = useCallback((next) => {
    const value = normalizeName(next);
    write(STORAGE_KEY, value);
    write(PREV_KEY, "");
    setName(value);
    setPreviousName("");
  }, []);

  /** 이름 변경 시작 — 변경 전 이름을 남겨 두고 입력을 다시 받습니다. */
  const forget = useCallback(() => {
    if (name) {
      write(PREV_KEY, name);
      setPreviousName(name);
    }
    write(STORAGE_KEY, "");
    setName("");
  }, [name]);

  /** 기존 기록을 옮기지 않고 새 참가자로 등록할 때 사용합니다. */
  const dropPrevious = useCallback(() => {
    write(PREV_KEY, "");
    setPreviousName("");
  }, []);

  return { name, previousName, ready, remember, forget, dropPrevious };
}
