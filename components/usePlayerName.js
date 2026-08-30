"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "chuseok2026.playerName";

/**
 * 참가자 이름을 브라우저에 기억해 둡니다.
 * 한 번 등록하면 같은 기기에서는 계속 그 이름으로 기록이 쌓입니다.
 */
export function usePlayerName() {
  const [name, setName] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const read = () => {
      try {
        setName(window.localStorage.getItem(STORAGE_KEY) || "");
      } catch {
        setName("");
      }
    };
    read();
    setReady(true);

    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) read();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const remember = useCallback((next) => {
    const value = String(next ?? "").trim().replace(/\s+/g, " ");
    try {
      if (value) window.localStorage.setItem(STORAGE_KEY, value);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* 시크릿 모드 등 저장 실패는 무시하고 메모리 상태로만 사용 */
    }
    setName(value);
  }, []);

  const forget = useCallback(() => remember(""), [remember]);

  return { name, ready, remember, forget };
}
