/** 달토끼 타임어택 – 게임 밸런스 상수 */

export const ITEM_TYPES = {
  GOOD: "good",
  BONUS: "bonus",
  SPECIAL: "special",
  BAD: "bad",
};

/**
 * 아이템 정의
 * - emoji 는 기기 폰트에 따라 모양이 달라지므로, 좋음/나쁨은 링 색으로도 구분합니다.
 * - image 가 있으면 이모지 대신 원형으로 잘라 그립니다.
 * - weight 합계는 100 이므로 weight 값이 곧 등장 확률(%) 입니다.
 */
export const ITEMS = [
  { key: "songpyeon", label: "송편 반죽",   emoji: "🥟", type: ITEM_TYPES.GOOD,    points: 100, radius: 36, weight: 21 },
  { key: "rice",      label: "쌀가루",     emoji: "🍚", type: ITEM_TYPES.GOOD,    points: 100, radius: 36, weight: 20 },
  { key: "bean",      label: "팥",         emoji: "🌰", type: ITEM_TYPES.GOOD,    points: 100, radius: 35, weight: 18 },
  { key: "mugwort",   label: "쑥",         emoji: "🌿", type: ITEM_TYPES.GOOD,    points: 100, radius: 35, weight: 16 },
  { key: "moon",      label: "황금 보름달", emoji: "🌕", type: ITEM_TYPES.BONUS,   points: 300, radius: 42, weight: 6 },
  { key: "vip",       label: "그룹장 K", image: "/special.png", fallbackEmoji: "🌟",
                                                        type: ITEM_TYPES.SPECIAL, points: 1000, radius: 44, weight: 1 },
  { key: "burnt",     label: "탄 송편",     emoji: "🔥", type: ITEM_TYPES.BAD,     points: -150, radius: 36, weight: 10 },
  { key: "rotten",    label: "상한 재료",   emoji: "🥀", type: ITEM_TYPES.BAD,     points: -150, radius: 36, weight: 8 },
];

export const BAD_ITEMS = ITEMS.filter((it) => it.type === ITEM_TYPES.BAD);

/** 이미지를 쓰는 아이템 (미리 로드용) */
export const IMAGE_SOURCES = ITEMS.filter((it) => it.image).map((it) => it.image);

const TOTAL_WEIGHT = ITEMS.reduce((sum, it) => sum + it.weight, 0);

/** 아이템 등장 확률(%) — weight 합계가 바뀌어도 항상 맞게 계산됩니다 */
export function chanceOf(item) {
  return (item.weight / TOTAL_WEIGHT) * 100;
}

export function pickItem(rand = Math.random) {
  let roll = rand() * TOTAL_WEIGHT;
  for (const item of ITEMS) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return ITEMS[0];
}

/** 스페셜 재료가 나올 때 양옆에 함께 떨어지는 방해 아이템 수 */
export const ESCORT_COUNT = 2;

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

/**
 * 화면 높이를 이 값으로 나눈 값이 배속 1.0 일 때의 초당 낙하 거리입니다.
 * 즉 배속 1.0 에서 화면을 가로지르는 데 걸리는 시간(초).
 */
export const BASE_FALL_SECONDS = 2.4;

/**
 * 레벨에 따른 생성 간격(ms). 레벨이 오를수록 촘촘해지고 하한에서 멈춥니다.
 * L1 560ms → L3 464 → L5 368 → L8 224 → L10+ 140
 */
export function spawnIntervalAt(level) {
  return Math.max(140, 560 - 48 * (level - 1));
}

/**
 * 레벨에 따른 낙하 속도 배수. 상한 3.8배.
 * L1 1.0(2.4초) → L5 1.8(1.33초) → L8 2.4(1.0초) → L15+ 3.8(0.63초)
 */
export function fallSpeedAt(level) {
  return Math.min(3.8, 1 + 0.2 * (level - 1));
}

/** 한 번에 여러 개가 쏟아지는 확률 (레벨 3부터, 최대 55%) */
export function burstChanceAt(level) {
  return Math.min(0.55, Math.max(0, (level - 2) * 0.07));
}
