export const EVENT_TITLE = "화재IT그룹 추석맞이 이벤트";
export const GAME_TITLE = "달토끼 타임어택";

/** 게임 제한 시간(초) */
export const GAME_DURATION = 30;

/** 랭킹보드에 노출할 상위 인원 */
export const TOP_N = 10;

/** 이름 규칙: 한글/영문/숫자/밑줄/공백 1~12자 */
export const NAME_PATTERN = /^[가-힣a-zA-Z0-9_ ]{1,12}$/;
export const NAME_MAX = 12;

export function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return yy + "." + mm + "." + dd;
}

export function formatScore(n) {
  return Number(n || 0).toLocaleString("ko-KR");
}
