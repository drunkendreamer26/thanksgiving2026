export const EVENT_TITLE = "화재IT그룹 추석맞이 이벤트";
export const GAME_TITLE = "달토끼 타임어택";

/** 레벨 1개의 지속 시간(초). 시간 제한은 없고 레벨만 계속 올라갑니다. */
export const LEVEL_DURATION = 10;

/** 감점 없는 재료를 이만큼 놓치면 게임 종료 */
export const MAX_MISS = 10;

/** 랭킹보드에 노출할 상위 인원 */
export const TOP_N = 10;

/** 이름 규칙: 한글/영문/숫자/밑줄 1~12자 (공백 불가) */
export const NAME_PATTERN = /^[가-힣a-zA-Z0-9_]{1,12}$/;

/** 입력값에서 공백을 모두 제거해 저장 형태로 정규화 */
export function normalizeName(raw) {
  return String(raw ?? "").replace(/\s+/g, "");
}
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
