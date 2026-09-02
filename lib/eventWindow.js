/**
 * 이벤트 참여 가능 시간 계산 · 표시 헬퍼 (서버/클라이언트 공용).
 * 시작/종료 일시는 관리자 패널에서 설정하며, 비어 있으면 그 방향으로는 제한하지 않습니다.
 */

export const EVENT_NOT_STARTED_MESSAGE = "아직 이벤트 참여시간이 아닙니다.";
export const EVENT_CLOSED_MESSAGE = "이벤트 참여시간이 종료되었습니다.";

function toTime(value) {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
}

/** "before" | "open" | "after" */
export function eventWindowState(startAt, endAt, now = Date.now()) {
  const start = toTime(startAt);
  const end = toTime(endAt);
  if (start !== null && now < start) return "before";
  if (end !== null && now > end) return "after";
  return "open";
}

/** 참여할 수 없는 상태면 안내 문구, 참여 가능하면 null */
export function eventGateMessage(state) {
  if (state === "before") return EVENT_NOT_STARTED_MESSAGE;
  if (state === "after") return EVENT_CLOSED_MESSAGE;
  return null;
}

/** ISO 문자열 → datetime-local 입력값("YYYY-MM-DDTHH:mm", 로컬 시간대) */
export function toLocalInput(value) {
  const t = toTime(value);
  if (t === null) return "";
  const d = new Date(t);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** datetime-local 입력값 → ISO 문자열. 비어 있으면 null (= 제한 없음) */
export function fromLocalInput(value) {
  if (!value) return null;
  const d = new Date(value); // datetime-local 은 브라우저 로컬 시간으로 해석됩니다
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** "9/14(월) 09:00" — 이벤트가 짧아 연도는 표기하지 않습니다 */
export function formatEventDateTime(value) {
  const t = toTime(value);
  if (t === null) return "-";
  const d = new Date(t);
  const p = (n) => String(n).padStart(2, "0");
  const day = WEEKDAYS[d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()}(${day}) ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** 참여 기간 안내 문구. 시작·종료가 모두 비어 있으면 null */
export function formatEventWindow(startAt, endAt) {
  const start = toTime(startAt);
  const end = toTime(endAt);
  if (start === null && end === null) return null;
  if (start !== null && end !== null) {
    return `${formatEventDateTime(startAt)} ~ ${formatEventDateTime(endAt)}`;
  }
  if (start !== null) return `${formatEventDateTime(startAt)} 부터`;
  return `${formatEventDateTime(endAt)} 까지`;
}
