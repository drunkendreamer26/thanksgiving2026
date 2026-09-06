/** 한글 초성 검색 도우미. */

/** 초성 19자. 유니코드 완성형의 초성 순서와 같습니다. */
const CHOSEONG = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];
const CHOSEONG_SET = new Set(CHOSEONG);

const HANGUL_FIRST = 0xac00; // '가'
const HANGUL_LAST = 0xd7a3; // '힣'
const CHOSEONG_STRIDE = 588; // 중성 21 × 종성 28

/** 완성형 한글 한 글자의 초성. 한글이 아니면 null. */
export function choseongOf(ch) {
  const code = String(ch ?? "").charCodeAt(0);
  if (!(code >= HANGUL_FIRST && code <= HANGUL_LAST)) return null;
  return CHOSEONG[Math.floor((code - HANGUL_FIRST) / CHOSEONG_STRIDE)];
}

/** 검색어에 초성이 섞여 있는지 (안내 문구용) */
export function hasChoseong(query) {
  return Array.from(String(query ?? "")).some((ch) => CHOSEONG_SET.has(ch));
}

/**
 * 이름 한 글자가 검색어 한 글자와 맞는지 확인합니다.
 * 검색어가 초성이면 이름 글자의 초성과, 아니면 글자 자체와 비교합니다.
 */
function charMatches(nameCh, queryCh) {
  if (CHOSEONG_SET.has(queryCh)) return choseongOf(nameCh) === queryCh;
  return nameCh.toLowerCase() === queryCh.toLowerCase();
}

function matchesAt(name, query, start) {
  for (let i = 0; i < query.length; i++) {
    if (!charMatches(name[start + i], query[i])) return false;
  }
  return true;
}

/**
 * 이름이 검색어와 맞는지 확인합니다. 대소문자는 구분하지 않습니다.
 *
 * 초성은 "연이어 있는" 글자에만 맞습니다.
 *   "김삼점" → "ㄱㅅ" ⭕ (김-삼) / "ㄱㅈ" ❌ (김-점, 사이가 떨어짐)
 * 글자와 초성을 섞어 쓸 수도 있습니다. ("김ㅅ" ⭕)
 */
export function matchesSearch(name, query) {
  const target = String(name ?? "");
  const q = String(query ?? "").replace(/\s+/g, "");
  if (!q || q.length > target.length) return false;

  for (let start = 0; start <= target.length - q.length; start++) {
    if (matchesAt(target, q, start)) return true;
  }
  return false;
}
