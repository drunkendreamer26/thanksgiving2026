/** 달토끼 타임어택 – 게임 밸런스 상수 */

export const ITEM_TYPES = {
  GOOD: "good",
  BONUS: "bonus",
  BAD: "bad",
};

/** 아이템 정의 (emoji 는 폰트에 따라 달라지므로 색 링으로 좋음/나쁨을 구분합니다) */
export const ITEMS = [
  { key: "songpyeon", label: "송편 반죽", emoji: "🥟", type: ITEM_TYPES.GOOD, points: 100, radius: 30, weight: 22 },
  { key: "rice",      label: "쌀가루",   emoji: "🍚", type: ITEM_TYPES.GOOD, points: 100, radius: 30, weight: 20 },
  { key: "bean",      label: "팥",       emoji: "🌰", type: ITEM_TYPES.GOOD, points: 100, radius: 29, weight: 18 },
  { key: "mugwort",   label: "쑥",       emoji: "🌿", type: ITEM_TYPES.GOOD, points: 100, radius: 29, weight: 16 },
  { key: "moon",      label: "황금 보름달", emoji: "🌕", type: ITEM_TYPES.BONUS, points: 300, radius: 34, weight: 6 },
  { key: "burnt",     label: "탄 송편",  emoji: "🔥", type: ITEM_TYPES.BAD,  points: -150, radius: 30, weight: 10 },
  { key: "rotten",    label: "상한 재료", emoji: "🥀", type: ITEM_TYPES.BAD,  points: -150, radius: 30, weight: 8 },
];

const TOTAL_WEIGHT = ITEMS.reduce((sum, it) => sum + it.weight, 0);

export function pickItem(rand = Math.random) {
  let roll = rand() * TOTAL_WEIGHT;
  for (const item of ITEMS) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return ITEMS[0];
}

/** 탭 판정 여유 (손가락 대응) */
export const HIT_SLOP = 1.45;

/** 방해 아이템 터치 시 경직 시간(ms) */
export const STUN_MS = 600;

/** 콤보 5개마다 배수 +1, 최대 5배 */
export const COMBO_STEP = 5;
export const MAX_MULTIPLIER = 5;

export function multiplierFor(combo) {
  return Math.min(1 + Math.floor(combo / COMBO_STEP), MAX_MULTIPLIER);
}

/** 진행도(0~1)에 따른 생성 간격(ms) — 뒤로 갈수록 촘촘해집니다 */
export function spawnIntervalAt(progress) {
  return 620 - 300 * progress;
}

/** 진행도(0~1)에 따른 낙하 속도 배수 */
export function fallSpeedAt(progress) {
  return 1 + 0.75 * progress;
}
